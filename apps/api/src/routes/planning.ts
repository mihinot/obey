import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { genererPlanning, PlanStar, PlanEvent } from '../planning/engine';
import { sendMail } from '../services/mailer';

const router = Router();
const prisma = new PrismaClient();

// POST /events/:id/generate
router.post('/:id/generate', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { needs: true },
    });

    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (!['BROUILLON', 'EN_GENERATION'].includes(event.statut)) {
      res.status(409).json({ error: 'Event must be BROUILLON or EN_GENERATION to generate' });
      return;
    }

    // Mark event as generating
    await prisma.event.update({ where: { id }, data: { statut: 'EN_GENERATION' } });

    // Load eligible stars: Actif, Occasionnel, Nouveau only
    const stars = await prisma.star.findMany({
      where: { statut: { in: ['Actif', 'Occasionnel', 'Nouveau'] } },
      include: {
        departments: { select: { deptCode: true } },
        availabilities: { select: { dateFrom: true, dateTo: true } },
      },
    });

    const planStars: PlanStar[] = stars.map((s) => ({
      id: s.id,
      prenom: s.prenom,
      nom: s.nom,
      statut: s.statut as PlanStar['statut'],
      charge: s.charge,
      fiab: s.fiab,
      desist: s.desist,
      depts: s.departments.map((d) => d.deptCode),
      indispos: s.availabilities,
    }));

    const planEvent: PlanEvent = {
      id: event.id,
      date: event.date,
      needs: event.needs.map((n) => ({ deptCode: n.deptCode, requis: n.requis })),
    };

    const result = genererPlanning(planEvent, planStars);

    // Persist assignments (delete existing proposed ones first)
    await prisma.assignment.deleteMany({
      where: { eventId: id, statut: { in: ['Proposee', 'Validee'] } },
    });

    const persistedStarIds = new Set<number>();
    for (const dept of result.depts) {
      for (const sel of dept.selectionnes) {
        if (persistedStarIds.has(sel.star.id)) continue; // skip cross-dept duplicate
        persistedStarIds.add(sel.star.id);
        await prisma.assignment.create({
          data: {
            starId: sel.star.id,
            eventId: id,
            deptCode: dept.deptCode,
            statut: 'Proposee',
            conflit: sel.conflit ?? undefined,
          },
        });
      }
    }

    // Move to A_VALIDER
    await prisma.event.update({ where: { id }, data: { statut: 'A_VALIDER' } });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /events/:id/publish
router.post('/:id/publish', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  try {
    const event = await prisma.event.findUnique({ where: { id }, select: { statut: true } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
    if (event.statut !== 'A_VALIDER') {
      res.status(409).json({ error: 'Event must be A_VALIDER to publish' });
      return;
    }

    const eventFull = await prisma.event.update({
      where: { id },
      data: { statut: 'PUBLIE' },
    });

    // Promote assignments to Publiee and load star contact info
    await prisma.assignment.updateMany({
      where: { eventId: id, statut: 'Proposee' },
      data: { statut: 'Publiee' },
    });

    const assignments = await prisma.assignment.findMany({
      where: { eventId: id, statut: 'Publiee' },
      include: { star: { include: { user: { select: { email: true } } } } },
    });

    // Send notification emails (fire & forget — don't block response)
    const eventDate = eventFull.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    Promise.all(
      assignments.map((a) =>
        sendMail({
          to: a.star.user.email,
          subject: `[OBEY] Vous êtes affecté(e) — ${eventFull.nom}`,
          text: `Bonjour ${a.star.prenom},\n\nVous êtes affecté(e) au service ${eventFull.nom} (${eventDate}) au département ${a.deptCode}.\n\nConnectez-vous sur OBEY pour confirmer votre présence.\n\nMerci !`,
          html: `<p>Bonjour <strong>${a.star.prenom}</strong>,</p><p>Vous êtes affecté(e) au service <strong>${eventFull.nom}</strong> (${eventDate}) au département <strong>${a.deptCode}</strong>.</p><p>Connectez-vous sur OBEY pour confirmer votre présence.</p><p>Merci !</p>`,
        }).catch((err: Error) => console.error(`[MAIL] Failed for ${a.star.user.email}:`, err.message))
      )
    );

    // Create internal notifications
    await Promise.all(
      assignments.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.star.userId,
            titre: `Affectation — ${eventFull.nom}`,
            msg: `Vous êtes affecté(e) au département ${a.deptCode} le ${eventDate}.`,
            canal: 'INTERNE',
            tone: 'primary',
          },
        })
      )
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'PUBLISH_PLANNING',
        entite: 'Event',
        entityId: String(id),
        tone: 'ok',
      },
    });

    res.json({ message: 'Planning published', eventId: id, notified: assignments.length });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
