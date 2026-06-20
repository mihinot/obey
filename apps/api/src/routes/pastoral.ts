import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// GET /pastoral/stars — liste avec données spirituelles (Corps Pastoral uniquement)
router.get('/stars', auth, requireRole('CORPS_PASTORAL', 'ADMINISTRATEUR'), async (_req, res) => {
  try {
    const stars = await prisma.star.findMany({
      select: {
        id: true, prenom: true, nom: true, statut: true,
        baptise: true, f001: true, f101: true, f201: true,
        famille: true, disciple: true,
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    res.json(stars);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
