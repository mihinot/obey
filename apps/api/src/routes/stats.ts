import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// GET /stats/summary — statistiques globales
router.get('/summary', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'VIE_DES_STARS', 'ADMINISTRATEUR'), async (_req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalStars,
      starsActifs,
      totalEvents,
      eventsPublies,
      totalAssignments,
      confirmes,
      desistements,
      desistementsLast30,
      starsSurcharge,
    ] = await Promise.all([
      prisma.star.count(),
      prisma.star.count({ where: { statut: 'Actif' } }),
      prisma.event.count(),
      prisma.event.count({ where: { statut: 'PUBLIE' } }),
      prisma.assignment.count({ where: { statut: { in: ['Publiee', 'Confirmee'] } } }),
      prisma.assignment.count({ where: { statut: 'Confirmee' } }),
      prisma.assignment.count({ where: { statut: 'Desistee' } }),
      prisma.assignment.count({ where: { statut: 'Desistee', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.star.count({ where: { charge: { gte: 4 } } }),
    ]);

    // Événements par mois (6 derniers mois)
    const eventsByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      eventsByMonth[key] = 0;
    }
    const recentEvents = await prisma.event.findMany({
      where: { date: { gte: sixMonthsAgo }, statut: 'PUBLIE' },
      select: { date: true },
    });
    recentEvents.forEach(ev => {
      const key = ev.date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (key in eventsByMonth) eventsByMonth[key]++;
    });

    // Taux de confirmation par département
    const byDept = await prisma.assignment.groupBy({
      by: ['deptCode'],
      where: { statut: { in: ['Publiee', 'Confirmee', 'Desistee'] } },
      _count: { _all: true },
    });
    const confirmedByDept = await prisma.assignment.groupBy({
      by: ['deptCode'],
      where: { statut: 'Confirmee' },
      _count: { _all: true },
    });
    const confirmedMap = new Map(confirmedByDept.map(r => [r.deptCode, r._count._all]));
    const deptStats = byDept.map(r => ({
      deptCode: r.deptCode,
      total: r._count._all,
      confirmes: confirmedMap.get(r.deptCode) ?? 0,
      taux: r._count._all > 0 ? Math.round(((confirmedMap.get(r.deptCode) ?? 0) / r._count._all) * 100) : 0,
    }));

    res.json({
      kpis: {
        totalStars, starsActifs, totalEvents, eventsPublies,
        totalAssignments, confirmes, desistements, desistementsLast30, starsSurcharge,
        tauxConfirmation: totalAssignments > 0 ? Math.round((confirmes / totalAssignments) * 100) : 0,
      },
      eventsByMonth,
      deptStats,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
