import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// GET /stars — list (Référent+)
router.get('/', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'ADMINISTRATEUR'), async (req, res) => {
  try {
    const { statut, dept } = req.query as { statut?: string; dept?: string };

    const stars = await prisma.star.findMany({
      where: {
        ...(statut ? { statut: statut as never } : {}),
        ...(dept ? { departments: { some: { deptCode: dept } } } : {}),
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        tel: true,
        statut: true,
        charge: true,
        fiab: true,
        desist: true,
        user: { select: { email: true, statut: true } },
        departments: { select: { deptCode: true } },
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });

    res.json(stars);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stars/:id
router.get('/:id', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'CORPS_PASTORAL', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const userRoles = req.roles ?? [];
    const isPastoral = userRoles.some((r) => r.type === 'CORPS_PASTORAL' || r.type === 'ADMINISTRATEUR');

    const star = await prisma.star.findUnique({
      where: { id },
      select: {
        id: true,
        prenom: true,
        nom: true,
        tel: true,
        statut: true,
        charge: true,
        fiab: true,
        desist: true,
        ...(isPastoral ? {
          baptise: true,
          f001: true,
          f101: true,
          f201: true,
          famille: true,
          disciple: true,
        } : {}),
        user: { select: { id: true, email: true, statut: true, createdAt: true } },
        departments: { select: { deptCode: true } },
      },
    });

    if (!star) { res.status(404).json({ error: 'Star not found' }); return; }
    res.json(star);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stars/:id/assignments
router.get('/:id/assignments', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  try {
    const assignments = await prisma.assignment.findMany({
      where: { starId: id },
      orderBy: { event: { date: 'desc' } },
      select: {
        id: true, deptCode: true, statut: true, conflit: true, confirme: true, createdAt: true,
        event: { select: { id: true, nom: true, date: true, debut: true, fin: true, statut: true } },
      },
    });
    res.json(assignments);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const UpdateStarSchema = z.object({
  prenom: z.string().min(1).optional(),
  nom: z.string().min(1).optional(),
  tel: z.string().optional(),
  statut: z.enum(['Nouveau', 'Actif', 'Occasionnel', 'EnPause', 'Ancien']).optional(),
  charge: z.number().int().min(0).optional(),
  fiab: z.number().min(0).max(1).optional(),
  baptise: z.boolean().optional(),
  f001: z.boolean().optional(),
  f101: z.boolean().optional(),
  f201: z.boolean().optional(),
  famille: z.string().nullable().optional(),
  disciple: z.boolean().optional(),
  depts: z.array(z.string()).optional(),
});

// PATCH /stars/:id
router.patch('/:id', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const parsed = UpdateStarSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }

  const { depts, baptise, f001, f101, f201, famille, disciple, ...rest } = parsed.data;

  // Only pastoral/admin can update pastoral data
  const userRoles = req.roles ?? [];
  const isPastoral = userRoles.some((r) => r.type === 'CORPS_PASTORAL' || r.type === 'ADMINISTRATEUR');
  const pastoralData = isPastoral ? { baptise, f001, f101, f201, famille, disciple } : {};

  try {
    const star = await prisma.star.update({
      where: { id },
      data: {
        ...rest,
        ...Object.fromEntries(Object.entries(pastoralData).filter(([, v]) => v !== undefined)),
        ...(depts !== undefined ? {
          departments: {
            deleteMany: {},
            createMany: { data: depts.map((code) => ({ deptCode: code })) },
          },
        } : {}),
      },
    });

    res.json(star);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
