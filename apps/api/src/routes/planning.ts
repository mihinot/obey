import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { genererPlanning, PlanStar, PlanEvent, PlanConfig, DEFAULT_CONFIG } from '../planning/engine';
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

    // Charger les paramètres depuis la DB
    const params = await prisma.parameter.findMany({
      where: { cle: { in: ['charge_elevee_min', 'charge_critique_min', 'desist_seuil_malus', 'delai_desist_jours'] } },
    });
    const p = (cle: string, def: number) => {
      const found = params.find(x => x.cle === cle);
      return found ? (parseInt(found.val) || def) : def;
    };
    const cfg: PlanConfig = {
      chargeEleveeMin: p('charge_elevee_min', DEFAULT_CONFIG.chargeEleveeMin),
      chargeCritiqueMin: p('charge_critique_min', DEFAULT_CONFIG.chargeCritiqueMin),
      desistSeuilMalus: p('desist_seuil_malus', DEFAULT_CONFIG.desistSeuilMalus),
      delaiDesistJours: p('delai_desist_jours', DEFAULT_CONFIG.delaiDesistJours),
    };

    const result = genererPlanning(planEvent, planStars, cfg);

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

// GET /assignments/desistees — désistements sur événements à venir (référent)
router.get('/assignments/desistees', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (_req, res) => {
  const now = new Date();
  try {
    const assignments = await prisma.assignment.findMany({
      where: { statut: 'Desistee', event: { date: { gte: now }, statut: { in: ['PUBLIE', 'A_VALIDER'] } } },
      include: {
        star: { select: { id: true, prenom: true, nom: true, statut: true, fiab: true, charge: true, departments: { select: { deptCode: true } } } },
        event: { select: { id: true, nom: true, date: true, debut: true, fin: true } },
      },
      orderBy: { event: { date: 'asc' } },
    });
    res.json(assignments);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /assignments/candidates/:eventId/:deptCode — STARs disponibles pour remplacement
router.get('/assignments/candidates/:eventId/:deptCode', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const eventId = parseInt(req.params['eventId'] as string);
  const deptCode = req.params['deptCode'] as string;
  if (isNaN(eventId)) { res.status(400).json({ error: 'Invalid eventId' }); return; }
  try {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { date: true } });
    if (!event) { res.status(404).json({ error: 'Event not found' }); return; }

    // STARs déjà affectés à cet événement
    const alreadyAssigned = await prisma.assignment.findMany({
      where: { eventId, statut: { not: 'Desistee' } },
      select: { starId: true },
    });
    const excludedIds = alreadyAssigned.map(a => a.starId);

    // Indisponibilités ce jour-là
    const indispos = await prisma.availability.findMany({
      where: { dateFrom: { lte: event.date }, dateTo: { gte: event.date } },
      select: { starId: true },
    });
    const indispoIds = indispos.map(a => a.starId);

    const candidates = await prisma.star.findMany({
      where: {
        statut: { in: ['Actif', 'Occasionnel'] },
        departments: { some: { deptCode } },
        id: { notIn: [...excludedIds, ...indispoIds] },
      },
      select: { id: true, prenom: true, nom: true, statut: true, fiab: true, charge: true, departments: { select: { deptCode: true } } },
      orderBy: [{ fiab: 'desc' }, { charge: 'asc' }],
    });
    res.json(candidates);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /assignments/:id/replace — affecter un remplaçant
router.post('/assignments/:id/replace', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  const id = parseInt(req.params['id'] as string);
  const { newStarId } = req.body as { newStarId: number };
  if (isNaN(id) || !newStarId) { res.status(400).json({ error: 'Invalid params' }); return; }
  try {
    const original = await prisma.assignment.findUnique({
      where: { id }, include: { event: { select: { id: true, nom: true, date: true } } },
    });
    if (!original) { res.status(404).json({ error: 'Assignment not found' }); return; }

    const newAssignment = await prisma.assignment.create({
      data: { starId: newStarId, eventId: original.eventId, deptCode: original.deptCode, statut: 'Publiee' },
    });

    const newStar = await prisma.star.findUnique({ where: { id: newStarId }, include: { user: { select: { email: true } } } });
    if (newStar) {
      const dateStr = original.event.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      await prisma.notification.create({
        data: { userId: newStar.userId, titre: `Remplacement — ${original.event.nom}`, msg: `Vous remplacez un STAR au département ${original.deptCode} le ${dateStr}.`, canal: 'INTERNE', tone: 'warn' },
      });
      await sendMail({
        to: newStar.user.email,
        subject: `[OBEY] Remplacement — ${original.event.nom}`,
        text: `Bonjour ${newStar.prenom},\n\nVous êtes sollicité(e) pour remplacer un STAR au département ${original.deptCode} lors de l'événement ${original.event.nom} (${dateStr}).\n\nConnectez-vous sur OBEY pour confirmer.\n\nMerci !`,
        html: `<p>Bonjour <strong>${newStar.prenom}</strong>,</p><p>Vous êtes sollicité(e) pour remplacer un STAR au département <strong>${original.deptCode}</strong> lors de <strong>${original.event.nom}</strong> (${dateStr}).</p><p>Connectez-vous sur OBEY pour confirmer.</p>`,
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'REPLACE_STAR', entite: 'Assignment', entityId: String(id), meta: { newStarId }, tone: 'primary' },
    });

    res.status(201).json(newAssignment);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

