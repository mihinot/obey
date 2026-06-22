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

// GET /admin/parameters
router.get('/parameters', auth, requireRole('ADMINISTRATEUR'), async (_req, res) => {
  try {
    const params = await prisma.parameter.findMany({ orderBy: [{ groupe: 'asc' }, { cle: 'asc' }] });
    res.json(params.map(p => ({ key: p.cle, value: p.val, description: p.desc, label: p.label, type: p.type, unite: p.unite, groupe: p.groupe })));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /admin/parameters/:key
router.put('/parameters/:key', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const key = req.params['key'] as string;
  const { value } = req.body as { value: string };
  if (!value && value !== '0') { res.status(400).json({ error: 'value required' }); return; }
  try {
    const param = await prisma.parameter.update({ where: { cle: key }, data: { val: value } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'UPDATE_PARAMETER', entite: 'Parameter', entityId: key, meta: { value }, tone: 'primary' },
    });
    res.json({ key: param.cle, value: param.val });
  } catch {
    res.status(500).json({ error: 'Parameter not found or internal error' });
  }
});

// GET /admin/audit-logs
router.get('/audit-logs', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const limit = Math.min(parseInt((req.query['limit'] as string) ?? '50'), 200);
  const offset = parseInt((req.query['offset'] as string) ?? '0');
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { user: { select: { email: true, star: { select: { prenom: true, nom: true } } } } },
    });
    const total = await prisma.auditLog.count();
    res.json({ logs, total });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/roles — all users with their roles
router.get('/roles', auth, requireRole('ADMINISTRATEUR'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { statut: 'Actif' },
      select: {
        id: true, email: true, statut: true,
        star: { select: { prenom: true, nom: true } },
        roles: { select: { id: true, type: true, deptCode: true } },
      },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/roles — assign role to user
router.post('/roles', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const { userId, type, deptCode } = req.body as { userId: number; type: string; deptCode?: string };
  if (!userId || !type) { res.status(400).json({ error: 'userId and type required' }); return; }
  try {
    const role = await prisma.role.create({ data: { userId, type: type as never, deptCode: deptCode ?? null } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'ASSIGN_ROLE', entite: 'UserRole', entityId: String(userId as number), meta: { type, deptCode }, tone: 'primary' },
    });
    res.status(201).json(role);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/roles/:id
router.delete('/roles/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  try {
    await prisma.role.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'REVOKE_ROLE', entite: 'UserRole', entityId: String(id), tone: 'warn' },
    });
    res.json({ message: 'Role removed' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/departments
router.get('/departments', auth, requireRole('ADMINISTRATEUR'), async (_req, res) => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { starDepts: true } } },
    });
    res.json(depts.map(d => ({ ...d, memberCount: d._count.starDepts })));
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/departments
router.post('/departments', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const { code, nom, couleur, confidentiel, pilotage } = req.body as {
    code: string; nom: string; couleur?: string; confidentiel?: boolean; pilotage?: boolean;
  };
  if (!code || !nom) { res.status(400).json({ error: 'code et nom sont requis' }); return; }
  try {
    const dept = await prisma.department.create({
      data: {
        code: code.toUpperCase().trim(),
        nom,
        couleur: couleur ?? '#7c5cd6',
        confidentiel: confidentiel ?? false,
        pilotage: pilotage ?? false,
        actif: true,
      },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'CREATE_DEPARTMENT', entite: 'Department', entityId: dept.code, meta: req.body, tone: 'ok' },
    });
    res.status(201).json({ ...dept, memberCount: 0 });
  } catch {
    res.status(409).json({ error: 'Ce code de département existe déjà' });
  }
});

// PATCH /admin/departments/:code
router.patch('/departments/:code', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const code = req.params['code'] as string;
  const { actif, nom, couleur, confidentiel, pilotage } = req.body as { actif?: boolean; nom?: string; couleur?: string; confidentiel?: boolean; pilotage?: boolean };
  try {
    const dept = await prisma.department.update({
      where: { code },
      data: { ...(actif !== undefined && { actif }), ...(nom && { nom }), ...(couleur && { couleur }), ...(confidentiel !== undefined && { confidentiel }), ...(pilotage !== undefined && { pilotage }) },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'UPDATE_DEPARTMENT', entite: 'Department', entityId: code, meta: req.body, tone: 'primary' },
    });
    res.json(dept);
  } catch {
    res.status(500).json({ error: 'Department not found or internal error' });
  }
});

// GET /admin/templates
router.get('/templates', auth, requireRole('ADMINISTRATEUR'), async (_req, res) => {
  try {
    const templates = await prisma.eventTemplate.findMany({
      include: { needs: true },
      orderBy: { id: 'asc' },
    });
    res.json(templates);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /admin/templates/:id
router.patch('/templates/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const { actif, nom } = req.body as { actif?: boolean; nom?: string };
  try {
    const tpl = await prisma.eventTemplate.update({
      where: { id },
      data: { ...(actif !== undefined && { actif }), ...(nom && { nom }) },
      include: { needs: true },
    });
    res.json(tpl);
  } catch {
    res.status(500).json({ error: 'Template not found or internal error' });
  }
});

// POST /admin/templates
router.post('/templates', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const { nom, needs } = req.body as { nom: string; needs?: { deptCode: string; requis: number }[] };
  if (!nom) { res.status(400).json({ error: 'nom required' }); return; }
  try {
    const tpl = await prisma.eventTemplate.create({
      data: { nom, needs: needs ? { create: needs } : undefined },
      include: { needs: true },
    });
    res.status(201).json(tpl);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

