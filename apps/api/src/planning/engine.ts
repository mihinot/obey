export type StarStatut = 'Nouveau' | 'Actif' | 'Occasionnel' | 'EnPause' | 'Ancien';

export interface PlanStar {
  id: number;
  prenom: string;
  nom: string;
  statut: StarStatut;
  charge: number;
  fiab: number;
  desist: number;
  depts: string[];
  indispos: Array<{ dateFrom: Date; dateTo: Date }>;
}

export interface EvalCtx {
  deptCode: string;
  eventDate: Date;
  dejaAffecteAutreDept: boolean;
}

export type ConflitType = 'INCOMPATIBLE' | 'AVERTISSEMENT';

export interface BreakdownItem {
  label: string;
  pts: number;
}

export interface EvalResult {
  star: PlanStar;
  score: number;
  breakdown: BreakdownItem[];
  dispo: boolean;
  conflit: ConflitType | null;
  charge: 'ok' | 'elevee' | 'critique';
  exclu: boolean;
}

const EXCLUS: StarStatut[] = ['EnPause', 'Ancien'];

function isDisponible(star: PlanStar, eventDate: Date): boolean {
  for (const indispo of star.indispos) {
    if (eventDate >= indispo.dateFrom && eventDate <= indispo.dateTo) return false;
  }
  return true;
}

function getChargeLevel(charge: number): 'ok' | 'elevee' | 'critique' {
  if (charge >= 4) return 'critique';
  if (charge >= 2) return 'elevee';
  return 'ok';
}

export function evaluerCandidat(star: PlanStar, ctx: EvalCtx): EvalResult {
  const breakdown: BreakdownItem[] = [];
  let score = 0;

  const dispo = isDisponible(star, ctx.eventDate);
  const exclu = EXCLUS.includes(star.statut);
  const chargeLevel = getChargeLevel(star.charge);

  // Bonuses
  if (dispo) {
    score += 40;
    breakdown.push({ label: 'Disponible', pts: 40 });
  }

  if (star.depts.includes(ctx.deptCode)) {
    score += 25;
    breakdown.push({ label: 'Membre du département', pts: 25 });
  }

  if (star.charge <= 1) {
    score += 20;
    breakdown.push({ label: 'Peu sollicité récemment', pts: 20 });
  }

  if (star.fiab >= 0.85) {
    score += 10;
    breakdown.push({ label: 'Présence fiable', pts: 10 });
  }

  // Conflict detection (single, by priority)
  let conflit: ConflitType | null = null;
  if (ctx.dejaAffecteAutreDept) {
    conflit = 'INCOMPATIBLE';
  } else if (chargeLevel === 'critique') {
    conflit = 'AVERTISSEMENT';
  } else if (chargeLevel === 'elevee') {
    conflit = 'AVERTISSEMENT';
  }

  if (conflit === null) {
    score += 5;
    breakdown.push({ label: 'Aucun conflit', pts: 5 });
  } else {
    score -= 20;
    breakdown.push({ label: conflit === 'INCOMPATIBLE' ? 'Déjà affecté à un autre département pour cet événement' : 'Conflit de charge', pts: -20 });
  }

  // Cumulative malus
  if (chargeLevel === 'elevee') {
    score -= 15;
    breakdown.push({ label: 'Charge élevée', pts: -15 });
  }

  if (chargeLevel === 'critique') {
    score -= 30;
    breakdown.push({ label: 'Charge critique', pts: -30 });
  }

  if (star.desist >= 2) {
    score -= 10;
    breakdown.push({ label: 'Désistements fréquents', pts: -10 });
  }

  if (star.statut === 'Occasionnel') {
    score -= 10;
    breakdown.push({ label: 'Statut occasionnel', pts: -10 });
  }

  if (star.statut === 'Nouveau') {
    score -= 15;
    breakdown.push({ label: 'Statut nouveau', pts: -15 });
  }

  return { star, score, breakdown, dispo, conflit, charge: chargeLevel, exclu };
}

export interface EventNeed {
  deptCode: string;
  requis: number;
}

export interface PlanEvent {
  id: number;
  date: Date;
  needs: EventNeed[];
}

export interface DeptResult {
  deptCode: string;
  requis: number;
  candidats: EvalResult[];
  selectionnes: EvalResult[];
  reserves: EvalResult[];
  couverts: number;
  manque: number;
  conflits: EvalResult[];
  indispos: number;
}

export function genererDept(
  event: PlanEvent,
  deptCode: string,
  stars: PlanStar[],
  assignedStarIds: Set<number> = new Set()
): DeptResult {
  const need = event.needs.find((n) => n.deptCode === deptCode);
  const requis = need?.requis ?? 0;

  const deptStars = stars.filter((s) => s.depts.includes(deptCode));

  const evaluated = deptStars.map((star) =>
    evaluerCandidat(star, {
      deptCode,
      eventDate: event.date,
      dejaAffecteAutreDept: assignedStarIds.has(star.id),
    })
  );

  const indispos = evaluated.filter((e) => !e.dispo).length;

  const candidats = evaluated
    .filter((e) => !e.exclu && e.dispo)
    .sort((a, b) => b.score - a.score);

  const selectionnes = candidats.slice(0, requis);
  const reserves = candidats.slice(requis);
  const couverts = selectionnes.length;
  const manque = Math.max(0, requis - couverts);
  const conflits = selectionnes.filter((e) => e.conflit !== null);

  return { deptCode, requis, candidats, selectionnes, reserves, couverts, manque, conflits, indispos };
}

export interface PlanningResult {
  depts: DeptResult[];
  totalRequis: number;
  totalCouverts: number;
  totalManque: number;
  totalConflits: number;
}

export function genererPlanning(event: PlanEvent, stars: PlanStar[]): PlanningResult {
  const assignedStarIds = new Set<number>();
  const depts: DeptResult[] = [];

  for (const need of event.needs) {
    const result = genererDept(event, need.deptCode, stars, assignedStarIds);
    // Mark selected stars as assigned to prevent cross-dept conflicts
    for (const sel of result.selectionnes) {
      assignedStarIds.add(sel.star.id);
    }
    depts.push(result);
  }

  const totalRequis = depts.reduce((s, d) => s + d.requis, 0);
  const totalCouverts = depts.reduce((s, d) => s + d.couverts, 0);
  const totalManque = depts.reduce((s, d) => s + d.manque, 0);
  const totalConflits = depts.reduce((s, d) => s + d.conflits.length, 0);

  return { depts, totalRequis, totalCouverts, totalManque, totalConflits };
}
