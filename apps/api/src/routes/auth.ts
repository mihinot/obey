import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const prisma = new PrismaClient();

function signAccess(payload: { id: number; email: string; statut: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions);
}

function signRefresh(userId: number) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  tel: z.string().optional(),
});

// POST /auth/register
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { email, password, prenom, nom, tel } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        statut: 'EnAttente',
        star: {
          create: { prenom, nom, tel: tel ?? '' },
        },
        roles: {
          create: { type: 'STAR' },
        },
      },
    });

    res.status(201).json({ message: 'Account created, pending approval', userId: user.id });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.statut === 'Refuse' || user.statut === 'Suspendu') {
      res.status(403).json({ error: 'Account suspended or refused', statut: user.statut });
      return;
    }

    const accessToken = signAccess({ id: user.id, email: user.email, statut: user.statut });
    const refreshToken = signRefresh(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    res.json({ accessToken, refreshToken, statut: user.statut });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Missing refreshToken' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: number };

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newAccess = signAccess({ id: user.id, email: user.email, statut: user.statut });
    res.json({ accessToken: newAccess });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ message: 'Logged out' });
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        statut: true,
        createdAt: true,
        star: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            tel: true,
            statut: true,
            charge: true,
            fiab: true,
          },
        },
        roles: {
          select: { type: true, deptCode: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { star, roles, ...userFields } = user;
    res.json({ user: userFields, star, roles });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /auth/google
router.post('/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: 'Google login not configured' });
    return;
  }

  const { idToken } = req.body as { idToken?: unknown };
  if (typeof idToken !== 'string' || !idToken) {
    res.status(400).json({ error: 'Missing idToken' });
    return;
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  let googleId: string;
  let email: string;
  let prenom: string;
  let nom: string;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }
    googleId = payload.sub;
    email = payload.email;
    prenom = payload.given_name ?? '';
    nom = payload.family_name ?? '';
  } catch {
    res.status(401).json({ error: 'Invalid Google token' });
    return;
  }

  try {
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          statut: 'EnAttente',
          star: {
            create: { prenom, nom, tel: '' },
          },
          roles: {
            create: { type: 'STAR' },
          },
        },
      });
    }

    if (user.statut === 'Refuse' || user.statut === 'Suspendu') {
      res.status(403).json({ error: 'Account suspended or refused', statut: user.statut });
      return;
    }

    if (user.statut === 'EnAttente') {
      res.status(200).json({ status: 'pending' });
      return;
    }

    const accessToken = signAccess({ id: user.id, email: user.email, statut: user.statut });
    const refreshToken = signRefresh(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: 'email required' }); return; }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // Toujours répondre 200 pour ne pas révéler si l'email existe
    if (!user || user.statut !== 'Actif') {
      res.json({ message: 'Si ce compte existe, un e-mail a été envoyé.' });
      return;
    }

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${token}`;

    const { sendMail } = await import('../services/mailer');
    await sendMail({
      to: email,
      subject: '[OBEY] Réinitialisation de mot de passe',
      text: `Bonjour,\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valable 1h) :\n${resetUrl}\n\nSi vous n'avez pas fait cette demande, ignorez cet e-mail.`,
      html: `<p>Bonjour,</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe (valable 1h) :</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>`,
    }).catch(() => {});

    res.json({ message: 'Si ce compte existe, un e-mail a été envoyé.' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: 'token et mot de passe (8 caractères min) requis' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ error: 'Lien invalide ou expiré' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    });

    res.json({ message: 'Mot de passe mis à jour' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
