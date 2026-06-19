import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /me/assignments — mes affectations (publiées ou confirmées)
router.get('/assignments', auth, async (req, res) => {
  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const assignments = await prisma.assignment.findMany({
      where: {
        starId: star.id,
        statut: { in: ['Publiee', 'Confirmee', 'Proposee'] },
      },
      include: {
        event: { select: { id: true, nom: true, date: true, debut: true, fin: true, lieu: true, statut: true } },
      },
      orderBy: { event: { date: 'asc' } },
    });

    res.json(assignments);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /me/assignments/:id/confirm — confirmer une affectation
router.post('/assignments/:id/confirm', auth, async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment || assignment.starId !== star.id) {
      res.status(404).json({ error: 'Assignment not found' }); return;
    }
    if (!['Publiee', 'Proposee'].includes(assignment.statut)) {
      res.status(409).json({ error: 'Assignment cannot be confirmed in this state' }); return;
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { statut: 'Confirmee', confirme: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /me/assignments/:id/desister — se désister d'une affectation
router.post('/assignments/:id/desister', auth, async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const assignment = await prisma.assignment.findMany({
      where: { id, starId: star.id },
      include: { event: { select: { date: true } } },
    });

    if (!assignment[0]) { res.status(404).json({ error: 'Assignment not found' }); return; }

    const eventDate = assignment[0].event.date;
    const now = new Date();
    const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Deadline check: J-7
    const deadline = 7;
    const late = diffDays < deadline;

    await prisma.assignment.update({
      where: { id },
      data: { statut: 'Desistee' },
    });

    // Incrémenter désistements si tardif
    if (late) {
      await prisma.star.update({
        where: { id: star.id },
        data: { desist: { increment: 1 } },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'DESISTEMENT',
        entite: 'Assignment',
        entityId: String(id),
        tone: late ? 'warn' : 'ok',
      },
    });

    res.json({ message: 'Désistement enregistré', late, daysUntilEvent: Math.round(diffDays) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me/availabilities — mes indisponibilités
router.get('/availabilities', auth, async (req, res) => {
  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const avails = await prisma.availability.findMany({
      where: { starId: star.id },
      orderBy: { dateFrom: 'asc' },
    });

    res.json(avails);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /me/availabilities — déclarer une indisponibilité
router.post('/availabilities', auth, async (req, res) => {
  const { dateFrom, dateTo, motif } = req.body as { dateFrom: string; dateTo: string; motif?: string };
  if (!dateFrom || !dateTo) { res.status(400).json({ error: 'dateFrom and dateTo are required' }); return; }

  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const avail = await prisma.availability.create({
      data: {
        starId: star.id,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        motif: motif ?? '',
      },
    });

    res.status(201).json(avail);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /me/availabilities/:id — supprimer une indisponibilité
router.delete('/availabilities/:id', auth, async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const star = await prisma.star.findUnique({ where: { userId: req.user!.id } });
    if (!star) { res.status(404).json({ error: 'Star profile not found' }); return; }

    const avail = await prisma.availability.findUnique({ where: { id } });
    if (!avail || avail.starId !== star.id) {
      res.status(404).json({ error: 'Availability not found' }); return;
    }

    await prisma.availability.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
