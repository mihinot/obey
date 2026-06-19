import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// GET /events
router.get('/', auth, async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        nom: true,
        type: true,
        date: true,
        debut: true,
        fin: true,
        lieu: true,
        statut: true,
        needs: { select: { deptCode: true, requis: true } },
        _count: { select: { assignments: true } },
      },
    });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /events/:id
router.get('/:id', auth, async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        needs: true,
        assignments: {
          include: {
            star: { select: { id: true, prenom: true, nom: true, statut: true } },
          },
        },
      },
    });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json(event);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const CreateEventSchema = z.object({
  nom: z.string().min(1),
  type: z.string().optional(),
  date: z.string().datetime(),
  debut: z.string().regex(/^\d{2}:\d{2}$/),
  fin: z.string().regex(/^\d{2}:\d{2}$/),
  lieu: z.string().optional(),
  needs: z.array(z.object({
    deptCode: z.string(),
    requis: z.number().int().min(1),
  })).optional(),
});

// POST /events
router.post('/', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const parsed = CreateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { needs, ...data } = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
        needs: needs ? { createMany: { data: needs } } : undefined,
      },
      include: { needs: true },
    });
    res.status(201).json(event);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const UpdateEventSchema = z.object({
  nom: z.string().min(1).optional(),
  type: z.string().optional(),
  date: z.string().datetime().optional(),
  debut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  fin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  lieu: z.string().optional(),
  statut: z.enum(['BROUILLON', 'EN_GENERATION', 'A_VALIDER', 'PUBLIE', 'ANNULE']).optional(),
});

// PATCH /events/:id
router.patch('/:id', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const parsed = UpdateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}),
      },
    });
    res.json(event);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /events/:id (BROUILLON only)
router.delete('/:id', auth, requireRole('ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const event = await prisma.event.findUnique({ where: { id }, select: { statut: true } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.statut !== 'BROUILLON') {
      res.status(409).json({ error: 'Only BROUILLON events can be deleted' });
      return;
    }
    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
