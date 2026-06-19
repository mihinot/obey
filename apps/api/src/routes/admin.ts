import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { sendMail } from '../services/mailer';

const router = Router();
const prisma = new PrismaClient();

// GET /admin/users — liste des comptes (Référent+ peut voir EnAttente)
router.get('/users', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'ADMINISTRATEUR'), async (req, res) => {
  try {
    const { statut } = req.query as { statut?: string };

    const users = await prisma.user.findMany({
      where: statut ? { statut: statut as never } : undefined,
      select: {
        id: true,
        email: true,
        statut: true,
        createdAt: true,
        star: { select: { id: true, prenom: true, nom: true, statut: true, departments: { select: { deptCode: true } } } },
        roles: { select: { type: true, deptCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/users/:id/approve — valider un compte EnAttente
router.post('/users/:id/approve', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const { depts, starStatut } = req.body as { depts?: string[]; starStatut?: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { star: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.statut !== 'EnAttente') {
      res.status(409).json({ error: 'User is not EnAttente' }); return;
    }

    // Activer le compte
    await prisma.user.update({ where: { id }, data: { statut: 'Actif' } });

    // Mettre à jour le statut STAR
    if (user.star) {
      await prisma.star.update({
        where: { id: user.star.id },
        data: { statut: (starStatut as never) ?? 'Nouveau' },
      });

      // Affecter aux départements si fournis
      if (depts && depts.length > 0) {
        await prisma.starDept.deleteMany({ where: { starId: user.star.id } });
        await prisma.starDept.createMany({
          data: depts.map((code) => ({ starId: user.star!.id, deptCode: code })),
        });
      }
    }

    // Notification interne + email
    await prisma.notification.create({
      data: {
        userId: id,
        titre: 'Compte activé',
        msg: 'Votre compte OBEY a été validé. Vous pouvez maintenant vous connecter.',
        canal: 'INTERNE',
        tone: 'ok',
      },
    });

    await sendMail({
      to: user.email,
      subject: 'Votre compte OBEY est activé',
      text: `Bonjour ${user.star?.prenom ?? ''},\n\nVotre compte OBEY a été validé par un référent.\nVous pouvez maintenant vous connecter sur la plateforme.\n\nÀ bientôt !`,
      html: `<p>Bonjour <strong>${user.star?.prenom ?? ''}</strong>,</p><p>Votre compte OBEY a été <strong>validé</strong> par un référent.<br>Vous pouvez maintenant vous connecter sur la plateforme.</p><p>À bientôt !</p>`,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_USER',
        entite: 'User',
        entityId: String(id),
        tone: 'ok',
      },
    });

    res.json({ message: 'User approved', userId: id });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/users/:id/reject — refuser un compte
router.post('/users/:id/reject', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { star: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.statut !== 'EnAttente') { res.status(409).json({ error: 'User is not EnAttente' }); return; }

    await prisma.user.update({ where: { id }, data: { statut: 'Refuse' } });

    await sendMail({
      to: user.email,
      subject: 'Demande d\'inscription OBEY',
      text: `Bonjour ${user.star?.prenom ?? ''},\n\nAprès examen de votre demande, votre inscription n'a pas pu être validée.\nPour plus d'informations, contactez votre référent.\n\nCordialement`,
      html: `<p>Bonjour <strong>${user.star?.prenom ?? ''}</strong>,</p><p>Après examen de votre demande, votre inscription n'a pas pu être validée.<br>Pour plus d'informations, contactez votre référent.</p>`,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REJECT_USER',
        entite: 'User',
        entityId: String(id),
        tone: 'warn',
      },
    });

    res.json({ message: 'User rejected', userId: id });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
