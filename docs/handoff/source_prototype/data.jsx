// OBEY — Données fictives + moteur de planning (scoring, conflits, alertes).
// Tout exporté vers window.

/* ---------------- Référence ---------------- */
const DEPARTMENTS = [
  { code: 'ACC', nom: 'Accueil', couleur: '#7c5cd6' },
  { code: 'SEC', nom: 'Sécurité', couleur: '#6f8fd0' },
  { code: 'PRO', nom: 'Protocole', couleur: '#c08a5a' },
  { code: 'LOU', nom: 'Louange & Adoration', couleur: '#c97fb0' },
  { code: 'PRI', nom: 'Prière', couleur: '#5fae9a' },
  { code: 'COM', nom: 'Communication / Multimédia', couleur: '#5b7fb0' },
  { code: 'INT', nom: 'Intercession', couleur: '#8a6fb0', confidentiel: true },
];
const DEPT = Object.fromEntries(DEPARTMENTS.map(d => [d.code, d]));

const STATUTS = {
  Nouveau: { tone: 'accent', malus: -15 },
  Actif: { tone: 'ok', malus: 0 },
  Occasionnel: { tone: 'warn', malus: -10 },
  'En pause': { tone: 'muted', exclu: true },
  Ancien: { tone: 'muted', exclu: true },
};

// Charge mensuelle → niveau
function niveauCharge(n) {
  if (n > 6) return { key: 'critique', label: 'Critique', tone: 'danger', malus: -30 };
  if (n >= 4) return { key: 'elevee', label: 'Élevée', tone: 'warn', malus: -15 };
  if (n <= 1) return { key: 'faible', label: 'Disponible', tone: 'ok', bonus: 20 };
  return { key: 'normale', label: 'Normale', tone: 'ok', malus: 0 };
}

/* ---------------- STARs ---------------- */
// charge = nb de services ce mois ; fiab = fiabilité 0..1 ; desist = désistements récents
let _id = 0;
const S = (prenom, nom, depts, statut, charge, fiab, desist, indispos = [], extra = {}) =>
  ({ id: ++_id, prenom, nom, nomComplet: prenom + ' ' + nom, depts, statut, charge, fiab, desist, indispos,
     baptise: extra.baptise !== false, f001: extra.f001 !== false, f101: !!extra.f101, f201: !!extra.f201,
     famille: extra.famille || null, disciple: !!extra.disciple, tel: extra.tel || '06 12 34 56 78',
     email: (prenom + '.' + nom).toLowerCase().replace(/[éè]/g, 'e') + '@obey.church' });

const STARS = [
  // Accueil (département du référent démo)
  S('Grâce', 'Mboto', ['ACC', 'PRO'], 'Actif', 2, 0.95, 0, [], { f101: true, famille: 'Bethel', disciple: true }),
  S('David', 'Kimba', ['ACC', 'SEC'], 'Actif', 5, 0.7, 2, ['2026-06-22'], { f101: true }),
  S('Esther', 'Mbala', ['ACC'], 'Actif', 3, 0.98, 0, [], { f101: true, f201: true, famille: 'Sion', disciple: true, tel: '06 88 77 66 55' }),
  S('Joël', 'Tshibangu', ['ACC', 'COM'], 'Actif', 1, 0.9, 0, []),
  S('Ruth', 'Ngumbi', ['ACC'], 'Occasionnel', 0, 0.8, 1, []),
  S('Samuel', 'Lukusa', ['ACC', 'SEC'], 'Actif', 7, 0.85, 0, [], { f201: true }),
  S('Déborah', 'Ilunga', ['ACC'], 'Nouveau', 0, 0.6, 0, [], { f001: true, f101: false, baptise: false }),
  S('Nathan', 'Kabongo', ['ACC', 'PRI'], 'Actif', 4, 0.92, 0, []),
  S('Sephora', 'Mukendi', ['ACC'], 'Actif', 2, 0.88, 0, ['2026-06-25']),
  S('Élie', 'Banza', ['ACC'], 'En pause', 0, 0.9, 0, []),
  S('Marthe', 'Ngoy', ['ACC', 'PRO'], 'Actif', 3, 0.93, 0, []),
  S('Caleb', 'Mutombo', ['ACC'], 'Occasionnel', 1, 0.75, 3, []),
  // autres départements
  S('Sarah', 'Lwamba', ['LOU'], 'Actif', 4, 0.96, 0, []),
  S('Josué', 'Kalala', ['LOU', 'COM'], 'Actif', 3, 0.9, 0, []),
  S('Anna', 'Beya', ['PRI', 'INT'], 'Actif', 2, 0.97, 0, []),
  S('Paul', 'Mwamba', ['SEC'], 'Actif', 5, 0.82, 1, []),
  S('Rebecca', 'Tshala', ['PRO'], 'Actif', 2, 0.91, 0, []),
  S('Daniel', 'Ngalula', ['SEC', 'ACC'], 'Actif', 6, 0.78, 0, []),
  S('Myriam', 'Kasongo', ['PRO', 'ACC'], 'Occasionnel', 0, 0.85, 0, []),
  S('Timothée', 'Bukasa', ['COM'], 'Actif', 3, 0.94, 0, []),
];
const STAR = Object.fromEntries(STARS.map(s => [s.id, s]));

// Personas démo
const ME_STAR = STAR[1];      // Grâce Mboto (vue STAR)
const ME_REF = STAR[3];       // Esther Mbala — Référente Accueil (vue Référent)

/* ---------------- Événements ---------------- */
const EVENTS = [
  { id: 'e1', nom: 'Culte dominical', type: 'Culte dominical', date: '2026-06-22', jour: 'Dim', dateLabel: 'Dimanche 22 juin', debut: '09:00', fin: '12:30', lieu: 'Auditorium principal', statut: 'A_VALIDER',
    besoins: [{ dept: 'ACC', requis: 6 }, { dept: 'PRO', requis: 3 }, { dept: 'LOU', requis: 6 }, { dept: 'SEC', requis: 4 }] },
  { id: 'e2', nom: 'Réunion de prière', type: 'Réunion de prière', date: '2026-06-25', jour: 'Mer', dateLabel: 'Mercredi 25 juin', debut: '19:00', fin: '20:30', lieu: 'Salle B', statut: 'BROUILLON',
    besoins: [{ dept: 'ACC', requis: 3 }, { dept: 'PRI', requis: 4 }] },
  { id: 'e3', nom: 'Culte dominical', type: 'Culte dominical', date: '2026-06-29', jour: 'Dim', dateLabel: 'Dimanche 29 juin', debut: '09:00', fin: '12:30', lieu: 'Auditorium principal', statut: 'BROUILLON',
    besoins: [{ dept: 'ACC', requis: 6 }, { dept: 'PRO', requis: 3 }, { dept: 'LOU', requis: 6 }, { dept: 'SEC', requis: 4 }] },
  { id: 'e4', nom: 'Jeûne & prière', type: 'Jeûne et prière', date: '2026-06-20', jour: 'Ven', dateLabel: 'Vendredi 20 juin', debut: '06:00', fin: '08:00', lieu: 'Chapelle', statut: 'PUBLIE',
    besoins: [{ dept: 'PRI', requis: 5 }, { dept: 'ACC', requis: 2 }] },
  { id: 'e5', nom: 'Répétition Louange', type: 'Répétition', date: '2026-06-27', jour: 'Ven', dateLabel: 'Vendredi 27 juin', debut: '18:30', fin: '21:00', lieu: 'Salle de musique', statut: 'BROUILLON',
    besoins: [{ dept: 'LOU', requis: 6 }] },
  { id: 'e6', nom: 'Activité jeunesse', type: 'Activité jeunesse', date: '2026-06-28', jour: 'Sam', dateLabel: 'Samedi 28 juin', debut: '15:00', fin: '18:00', lieu: 'Salle polyvalente', statut: 'BROUILLON',
    besoins: [{ dept: 'ACC', requis: 4 }, { dept: 'PRO', requis: 2 }, { dept: 'SEC', requis: 2 }] },
];

const STATUT_EVT = {
  BROUILLON: { label: 'Brouillon', tone: 'muted' },
  EN_GENERATION: { label: 'En génération', tone: 'primary' },
  A_VALIDER: { label: 'À valider', tone: 'warn' },
  PUBLIE: { label: 'Publié', tone: 'ok' },
  ANNULE: { label: 'Annulé', tone: 'danger' },
};

/* ---------------- Affectations existantes (pré-générées) ---------------- */
// Pour l'événement e1 / Accueil : un planning déjà proposé pour démo de validation
const AFFECTATIONS_E1_ACC = [
  { starId: 3, statut: 'Validée', confirme: true },
  { starId: 1, statut: 'Validée', confirme: true },
  { starId: 8, statut: 'Proposée', confirme: false },
  { starId: 11, statut: 'Proposée', confirme: false },
  { starId: 2, statut: 'Désistée', confirme: false, conflit: 'INCOMPATIBLE' },
];

/* ---------------- Indisponibilités (vue STAR Grâce) ---------------- */
const INDISPOS_ME = [
  { id: 'i1', debut: '2026-07-04', fin: '2026-07-12', motif: 'Voyage familial' },
  { id: 'i2', debut: '2026-06-18', fin: '2026-06-18', motif: 'Rendez-vous médical' },
];

/* ---------------- Alertes (vue Référent Accueil) ---------------- */
const ALERTES = [
  { id: 'a1', type: 'Poste non couvert', niveau: 'CRITIQUE', titre: 'Accueil sous-effectif', msg: '2 postes non couverts pour le Culte du 22/06', evt: 'e1' },
  { id: 'a2', type: 'Désistement', niveau: 'ATTENTION', titre: 'Désistement de David Kimba', msg: 'Culte du 22/06 · remplaçant suggéré : Joël T.', evt: 'e1' },
  { id: 'a3', type: 'Volontaire surchargé', niveau: 'ATTENTION', titre: 'Samuel Lukusa surchargé', msg: '7 services ce mois — charge critique', evt: null },
  { id: 'a4', type: 'Volontaire peu sollicité', niveau: 'INFO', titre: 'Ruth Ngumbi peu sollicitée', msg: 'Aucun service ce mois — à valoriser', evt: null },
];
const NIVEAU_ALERTE = {
  CRITIQUE: { tone: 'danger', label: 'Critique' },
  ATTENTION: { tone: 'warn', label: 'Attention' },
  INFO: { tone: 'primary', label: 'Info' },
};

/* ---------------- Notifications ---------------- */
const NOTIFS = [
  { id: 'n1', titre: 'Nouvelle affectation', msg: 'Tu es affecté(e) au Culte du 22/06 — Accueil', date: 'Il y a 2 h', lu: false, canal: 'INTERNE' },
  { id: 'n2', titre: 'Rappel d\'événement', msg: 'Réunion de prière demain à 19:00 — Salle B', date: 'Il y a 5 h', lu: false, canal: 'EMAIL' },
  { id: 'n3', titre: 'Planning publié', msg: 'Le planning du Jeûne & prière du 20/06 est publié', date: 'Hier', lu: true, canal: 'INTERNE' },
];

/* ====================================================================
   MOTEUR DE PLANNING — scoring V1
   ==================================================================== */
function evaluerCandidat(star, deque) {
  const { deptCode, eventDate, dejaAffecteAutreDept } = deque;
  const breakdown = [];
  let score = 0;
  const dispo = !star.indispos.includes(eventDate);
  const charge = niveauCharge(star.charge);

  if (dispo) { score += 40; breakdown.push({ label: 'Disponible', pts: 40 }); }
  if (star.depts.includes(deptCode)) { score += 25; breakdown.push({ label: 'Membre du département', pts: 25 }); }
  if (star.charge <= 1) { score += 20; breakdown.push({ label: 'Peu sollicité récemment', pts: 20 }); }
  if (star.fiab >= 0.85) { score += 10; breakdown.push({ label: 'Présence fiable', pts: 10 }); }

  // conflits
  let conflit = null;
  if (dejaAffecteAutreDept) conflit = { level: 'INCOMPATIBLE', message: 'Déjà affecté à un autre département pour cet événement' };
  else if (charge.key === 'critique') conflit = { level: 'AVERTISSEMENT', message: 'Charge critique ce mois' };
  else if (charge.key === 'elevee') conflit = { level: 'AVERTISSEMENT', message: 'Charge élevée ce mois' };

  if (!conflit) { score += 5; breakdown.push({ label: 'Aucun conflit', pts: 5 }); }
  else { score -= 20; breakdown.push({ label: 'Conflit (' + conflit.level.toLowerCase() + ')', pts: -20 }); }

  if (charge.key === 'elevee') { score -= 15; breakdown.push({ label: 'Charge élevée', pts: -15 }); }
  if (charge.key === 'critique') { score -= 30; breakdown.push({ label: 'Charge critique', pts: -30 }); }
  if (star.desist >= 2) { score -= 10; breakdown.push({ label: 'Désistements fréquents', pts: -10 }); }
  if (star.statut === 'Occasionnel') { score -= 10; breakdown.push({ label: 'Statut occasionnel', pts: -10 }); }
  if (star.statut === 'Nouveau') { score -= 15; breakdown.push({ label: 'Statut nouveau', pts: -15 }); }

  return { star, score, breakdown, dispo, conflit, charge, exclu: !!STATUTS[star.statut].exclu };
}

// Génère le classement pour un département d'un événement
function genererDept(event, deptCode) {
  const besoin = event.besoins.find(b => b.dept === deptCode);
  const requis = besoin ? besoin.requis : 0;
  // candidats = STARs du département (+ multi-dept) actifs/occasionnels
  const candidats = STARS
    .filter(s => s.depts.includes(deptCode))
    .map(s => evaluerCandidat(s, { deptCode, eventDate: event.date, dejaAffecteAutreDept: false }))
    .filter(c => !c.exclu && c.dispo)
    .sort((a, b) => b.score - a.score);

  const selectionnes = candidats.slice(0, requis);
  const reserves = candidats.slice(requis);
  const couverts = selectionnes.length;
  const manque = Math.max(0, requis - couverts);
  const conflits = selectionnes.filter(c => c.conflit);
  // exclus (indispos / en pause / ancien) pour info
  const indispos = STARS.filter(s => s.depts.includes(deptCode) && s.indispos.includes(event.date)).length;

  return { deptCode, requis, candidats, selectionnes, reserves, couverts, manque, conflits, indispos };
}

function genererPlanning(event) {
  return event.besoins.map(b => genererDept(event, b.dept));
}

window.OBEY = {
  DEPARTMENTS, DEPT, STATUTS, niveauCharge, STARS, STAR, ME_STAR, ME_REF,
  EVENTS, STATUT_EVT, AFFECTATIONS_E1_ACC, INDISPOS_ME, ALERTES, NIVEAU_ALERTE, NOTIFS,
  evaluerCandidat, genererDept, genererPlanning,
};
