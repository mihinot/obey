import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export type RoleType =
  | 'STAR'
  | 'REFERENT'
  | 'COORDINATION_GENERALE'
  | 'CORPS_PASTORAL'
  | 'VIE_DES_STARS'
  | 'ADMINISTRATEUR';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      roles?: { type: RoleType; deptCode: string | null }[];
    }
  }
}

async function loadRoles(userId: number) {
  return prisma.role.findMany({
    where: { userId },
    select: { type: true, deptCode: true },
  });
}

export function requireRole(...roles: RoleType[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const userRoles = req.roles ?? (await loadRoles(req.user.id));
      req.roles = userRoles;

      const hasRole = userRoles.some((r) => roles.includes(r.type as RoleType));
      if (!hasRole) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function requireDeptAccess(deptCode: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const userRoles = req.roles ?? (await loadRoles(req.user.id));
      req.roles = userRoles;

      const rtype = (r: { type: string }) => r.type as RoleType;
      const hasAccess = userRoles.some(
        (r) =>
          rtype(r) === 'ADMINISTRATEUR' ||
          rtype(r) === 'COORDINATION_GENERALE' ||
          (rtype(r) === 'REFERENT' && r.deptCode === deptCode)
      );

      if (!hasAccess) {
        res.status(403).json({ error: 'Forbidden: no access to this department' });
        return;
      }
      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
