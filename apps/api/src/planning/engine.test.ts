import { evaluerCandidat, genererDept, genererPlanning, PlanStar, PlanEvent } from './engine';

const D = new Date('2025-01-05T10:00:00Z');

function makeStar(overrides: Partial<PlanStar> = {}): PlanStar {
  return {
    id: 1,
    prenom: 'Sophie',
    nom: 'Martin',
    statut: 'Actif',
    charge: 0,
    fiab: 0.9,
    desist: 0,
    depts: ['ACC'],
    indispos: [],
    ...overrides,
  };
}

function makeEvent(overrides: Partial<PlanEvent> = {}): PlanEvent {
  return {
    id: 1,
    date: D,
    needs: [{ deptCode: 'ACC', requis: 2 }],
    ...overrides,
  };
}

describe('evaluerCandidat', () => {
  it('scores a perfect candidate correctly', () => {
    const star = makeStar({ charge: 0, fiab: 0.9, depts: ['ACC'] });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });

    expect(result.dispo).toBe(true);
    expect(result.exclu).toBe(false);
    expect(result.conflit).toBeNull();
    expect(result.score).toBe(40 + 25 + 20 + 10 + 5); // 100
  });

  it('marks star as non-dispo when event date is in indispo range', () => {
    const star = makeStar({
      indispos: [{ dateFrom: new Date('2025-01-04'), dateTo: new Date('2025-01-06') }],
    });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.dispo).toBe(false);
  });

  it('excludes EnPause stars', () => {
    const star = makeStar({ statut: 'EnPause' });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.exclu).toBe(true);
  });

  it('excludes Ancien stars', () => {
    const star = makeStar({ statut: 'Ancien' });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.exclu).toBe(true);
  });

  it('applies INCOMPATIBLE conflict when already assigned to another dept', () => {
    const star = makeStar();
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: true });
    expect(result.conflit).toBe('INCOMPATIBLE');
    expect(result.score).toBe(40 + 25 + 20 + 10 - 20); // no +5 no-conflict, −20 for conflict
  });

  it('applies AVERTISSEMENT for charge élevée (charge=2)', () => {
    const star = makeStar({ charge: 2 });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.conflit).toBe('AVERTISSEMENT');
    expect(result.charge).toBe('elevee');
    // no +20 (charge>1), no +5 (conflict), -20 (conflict), -15 (elevee)
    expect(result.score).toBe(40 + 25 + 10 - 20 - 15); // 40
  });

  it('applies AVERTISSEMENT for charge critique (charge=4), cumulates malus', () => {
    const star = makeStar({ charge: 4 });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.conflit).toBe('AVERTISSEMENT');
    expect(result.charge).toBe('critique');
    // +40 dispo +25 dept +10 fiab -20 conflit -30 critique
    expect(result.score).toBe(40 + 25 + 10 - 20 - 30); // 25
  });

  it('applies desist malus when desist >= 2', () => {
    const star = makeStar({ desist: 2 });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    const withoutDesist = evaluerCandidat(makeStar({ desist: 1 }), { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.score).toBe(withoutDesist.score - 10);
  });

  it('applies Occasionnel malus', () => {
    const star = makeStar({ statut: 'Occasionnel' });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.score).toBe(40 + 25 + 20 + 10 + 5 - 10); // 90
  });

  it('applies Nouveau malus', () => {
    const star = makeStar({ statut: 'Nouveau' });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.score).toBe(40 + 25 + 20 + 10 + 5 - 15); // 85
  });

  it('does not give dept bonus when star is not in dept', () => {
    const star = makeStar({ depts: ['SEC'] });
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    expect(result.score).toBe(40 + 20 + 10 + 5); // no +25 dept bonus = 75
  });

  it('includes breakdown for each applied rule', () => {
    const star = makeStar();
    const result = evaluerCandidat(star, { deptCode: 'ACC', eventDate: D, dejaAffecteAutreDept: false });
    const labels = result.breakdown.map((b) => b.label);
    expect(labels).toContain('Disponible');
    expect(labels).toContain('Membre du département');
    expect(labels).toContain('Peu sollicité récemment');
    expect(labels).toContain('Présence fiable');
    expect(labels).toContain('Aucun conflit');
  });
});

describe('genererDept', () => {
  it('selects top N candidates by score up to requis', () => {
    const stars: PlanStar[] = [
      makeStar({ id: 1, nom: 'A', charge: 0, fiab: 0.9 }),
      makeStar({ id: 2, nom: 'B', charge: 2, fiab: 0.9 }),
      makeStar({ id: 3, nom: 'C', charge: 0, fiab: 0.7 }),
    ];
    const event = makeEvent({ needs: [{ deptCode: 'ACC', requis: 2 }] });
    const result = genererDept(event, 'ACC', stars);

    expect(result.selectionnes).toHaveLength(2);
    expect(result.reserves).toHaveLength(1);
    expect(result.couverts).toBe(2);
    expect(result.manque).toBe(0);
    // Star A should rank highest (no charge penalty)
    expect(result.selectionnes[0].star.id).toBe(1);
  });

  it('excludes exclu (EnPause/Ancien) stars', () => {
    const stars: PlanStar[] = [
      makeStar({ id: 1, statut: 'EnPause' }),
      makeStar({ id: 2, statut: 'Actif', nom: 'B' }),
    ];
    const event = makeEvent({ needs: [{ deptCode: 'ACC', requis: 2 }] });
    const result = genererDept(event, 'ACC', stars);

    expect(result.selectionnes).toHaveLength(1);
    expect(result.manque).toBe(1);
  });

  it('excludes unavailable stars from candidats', () => {
    const stars: PlanStar[] = [
      makeStar({ id: 1, indispos: [{ dateFrom: new Date('2025-01-04'), dateTo: new Date('2025-01-06') }] }),
      makeStar({ id: 2, nom: 'B' }),
    ];
    const event = makeEvent({ needs: [{ deptCode: 'ACC', requis: 2 }] });
    const result = genererDept(event, 'ACC', stars);

    expect(result.selectionnes).toHaveLength(1);
    expect(result.indispos).toBe(1);
    expect(result.manque).toBe(1);
  });

  it('marks conflit when already assigned star is selected', () => {
    const star = makeStar({ id: 1 });
    const assigned = new Set<number>([1]);
    const event = makeEvent({ needs: [{ deptCode: 'ACC', requis: 1 }] });
    const result = genererDept(event, 'ACC', [star], assigned);

    expect(result.conflits).toHaveLength(1);
    expect(result.conflits[0].conflit).toBe('INCOMPATIBLE');
  });

  it('returns manque > 0 when not enough candidates', () => {
    const stars: PlanStar[] = [makeStar({ id: 1 })];
    const event = makeEvent({ needs: [{ deptCode: 'ACC', requis: 3 }] });
    const result = genererDept(event, 'ACC', stars);

    expect(result.couverts).toBe(1);
    expect(result.manque).toBe(2);
  });
});

describe('genererPlanning', () => {
  it('processes all departments', () => {
    const stars: PlanStar[] = [
      makeStar({ id: 1, depts: ['ACC'] }),
      makeStar({ id: 2, nom: 'B', depts: ['SEC'] }),
    ];
    const event: PlanEvent = {
      id: 1,
      date: D,
      needs: [
        { deptCode: 'ACC', requis: 1 },
        { deptCode: 'SEC', requis: 1 },
      ],
    };
    const result = genererPlanning(event, stars);

    expect(result.depts).toHaveLength(2);
    expect(result.totalRequis).toBe(2);
    expect(result.totalCouverts).toBe(2);
    expect(result.totalManque).toBe(0);
  });

  it('prevents same star from being assigned to two departments (INCOMPATIBLE)', () => {
    // Star 1 is in both ACC and SEC
    const star: PlanStar = makeStar({ id: 1, depts: ['ACC', 'SEC'] });
    const event: PlanEvent = {
      id: 1,
      date: D,
      needs: [
        { deptCode: 'ACC', requis: 1 },
        { deptCode: 'SEC', requis: 1 },
      ],
    };
    const result = genererPlanning(event, [star]);

    // Star selected in ACC first, then INCOMPATIBLE in SEC
    const accResult = result.depts.find((d) => d.deptCode === 'ACC')!;
    const secResult = result.depts.find((d) => d.deptCode === 'SEC')!;

    expect(accResult.selectionnes).toHaveLength(1);
    // In SEC, star is selected but flagged INCOMPATIBLE
    if (secResult.selectionnes.length > 0) {
      expect(secResult.conflits[0].conflit).toBe('INCOMPATIBLE');
    }
  });

  it('computes totals correctly', () => {
    const stars: PlanStar[] = [
      makeStar({ id: 1, depts: ['ACC'] }),
      makeStar({ id: 2, nom: 'B', depts: ['ACC'], charge: 0 }),
    ];
    const event: PlanEvent = {
      id: 1,
      date: D,
      needs: [{ deptCode: 'ACC', requis: 3 }],
    };
    const result = genererPlanning(event, stars);

    expect(result.totalRequis).toBe(3);
    expect(result.totalCouverts).toBe(2);
    expect(result.totalManque).toBe(1);
    expect(result.totalConflits).toBe(0);
  });
});
