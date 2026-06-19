import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();
const prisma = new PrismaClient();

// GET /departments — liste publique (authentifié)
router.get('/', auth, async (_req, res) => {
  try {
    const depts = await prisma.department.findMany({
      where: { actif: true },
      select: { code: true, nom: true, couleur: true, confidentiel: true, pilotage: true },
      orderBy: { code: 'asc' },
    });
    res.json(depts);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /departments/:code — détail
router.get('/:code', auth, requireRole('REFERENT', 'COORDINATION_GENERALE', 'ADMINISTRATEUR'), async (req, res) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { code: req.params['code'] as string },
      include: {
        starDepts: {
          include: { star: { select: { id: true, prenom: true, nom: true, statut: true, charge: true } } },
        },
      },
    });
    if (!dept) { res.status(404).json({ error: 'Department not found' }); return; }
    res.json(dept);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
