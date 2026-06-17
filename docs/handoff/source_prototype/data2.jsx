// OBEY — Données étendues : comptes, rôles globaux, modèles, paramètres, journaux, stats, départements complets
(function () {
  const O = window.OBEY;

  /* ---- Rôles globaux & personas démo ---- */
  const ROLES_GLOBAUX = {
    ADMINISTRATEUR: { label: 'Administrateur', tone: 'danger' },
    COORDINATION_GENERALE: { label: 'Coordination Générale', tone: 'primary' },
    CORPS_PASTORAL: { label: 'Corps Pastoral', tone: 'accent' },
    VIE_DES_STARS: { label: 'Vie des STARs', tone: 'ok' },
  };
  const PERSONAS = {
    admin: { nom: 'Joseph Kalonji', role: 'Administrateur', initiales: 'JK' },
    coordination: { nom: 'Myriam Tshimanga', role: 'Coordination Générale', initiales: 'MT' },
    pastoral: { nom: 'Pasteur Daniel Mboyo', role: 'Corps Pastoral', initiales: 'DM' },
    vie: { nom: 'Sephora Lwanzo', role: 'Vie des STARs', initiales: 'SL' },
  };

  /* ---- Tous les départements (cahier des charges §4) ---- */
  const px = (nom, code, opt = {}) => ({ nom, code, actif: opt.actif !== false, pilotage: !!opt.pilotage, confidentiel: !!opt.confidentiel, membres: opt.membres != null ? opt.membres : 6 + (nom.length % 14), couleur: opt.couleur || '#9a8fb0' });
  const DEPARTMENTS_ALL = [
    px('Accueil', 'ACC', { membres: 14, couleur: '#7c5cd6' }),
    px('Sécurité', 'SEC', { membres: 9, couleur: '#6f8fd0' }),
    px('Protocole', 'PRO', { membres: 7, couleur: '#c08a5a' }),
    px('Louange & Adoration', 'LOU', { membres: 12, couleur: '#c97fb0' }),
    px('Prière', 'PRI', { membres: 10, couleur: '#5fae9a' }),
    px('Communication / Multimédia', 'COM', { membres: 8, couleur: '#5b7fb0' }),
    px('Soins Pastoraux', 'SOI', { membres: 5 }),
    px('Ressources Humaines', 'RH', { membres: 4 }),
    px('Nettoyage', 'NET', { membres: 11 }),
    px('Intégration', 'ITG', { membres: 6 }),
    px('Impact Junior', 'IJU', { membres: 7 }),
    px('Formation', 'FOR', { membres: 5 }),
    px('Femmes Khayil', 'FKH', { membres: 9 }),
    px("Familles d'Impact", 'FAM', { membres: 8 }),
    px('EJP / MJPT', 'EJP', { membres: 6 }),
    px('Coordination de la Croissance', 'CRO', { membres: 4, pilotage: true }),
    px('Social', 'SOC', { membres: 7 }),
    px('Informatique', 'INF', { membres: 3 }),
    px('Évangélisation', 'EVA', { membres: 10 }),
    px('Coordination Événementielle', 'CEV', { membres: 5, pilotage: true }),
    px('Modération', 'MOD', { membres: 4 }),
    px('MLA', 'MLA', { membres: 6, pilotage: true }),
    px('Coordination Générale', 'CG', { membres: 3, pilotage: true }),
    px('Corps Pastoral', 'CP', { membres: 5, pilotage: true }),
    px('Vie des STARs', 'VS', { membres: 4, pilotage: true }),
    px('Intercession', 'INT', { membres: 7, pilotage: true, confidentiel: true, couleur: '#8a6fb0' }),
  ];

  /* ---- Comptes en attente de validation ---- */
  const COMPTES = [
    { id: 'c1', nom: 'Esaïe Mukeba', email: 'esaie.mukeba@gmail.com', tel: '06 45 78 12 33', dept: 'Accueil', date: 'Il y a 2 h', statut: 'En attente' },
    { id: 'c2', nom: 'Naomi Beya', email: 'naomi.beya@outlook.fr', tel: '07 88 21 09 54', dept: 'Louange & Adoration', date: 'Il y a 5 h', statut: 'En attente' },
    { id: 'c3', nom: 'Gédéon Lwamba', email: 'gedeon.l@gmail.com', tel: '06 12 90 44 21', dept: 'Sécurité', date: 'Hier', statut: 'En attente' },
    { id: 'c4', nom: 'Priscille Ndaya', email: 'priscille.ndaya@gmail.com', tel: '07 65 43 11 02', dept: 'Protocole', date: 'Hier', statut: 'En attente' },
  ];
  const STATUT_COMPTE = { 'En attente': 'warn', 'Validé': 'ok', 'Suspendu': 'muted', 'Refusé': 'danger' };

  /* ---- Modèles d'événements (architecture §3.5) ---- */
  const MODELES = [
    { id: 'm1', nom: 'Culte dominical', actif: true, besoins: [['ACC', 6], ['PRO', 3], ['LOU', 6], ['SEC', 4]] },
    { id: 'm2', nom: 'Réunion de prière', actif: true, besoins: [['ACC', 3], ['PRI', 4]] },
    { id: 'm3', nom: 'Jeûne et prière', actif: true, besoins: [['PRI', 5], ['ACC', 2]] },
    { id: 'm4', nom: 'Formation', actif: true, besoins: [['ACC', 2], ['COM', 1]] },
    { id: 'm5', nom: 'Séminaire', actif: true, besoins: [['ACC', 4], ['PRO', 2], ['SEC', 3]] },
    { id: 'm6', nom: 'Évangélisation', actif: true, besoins: [['EVA', 8], ['SEC', 2]] },
    { id: 'm7', nom: 'Répétition', actif: true, besoins: [['LOU', 6]] },
    { id: 'm8', nom: 'Réunion de département', actif: true, besoins: [] },
    { id: 'm9', nom: 'Activité jeunesse', actif: true, besoins: [['ACC', 4], ['PRO', 2], ['SEC', 2]] },
    { id: 'm10', nom: 'Activité enfants', actif: false, besoins: [['ACC', 3], ['IJU', 4]] },
    { id: 'm11', nom: 'Événement personnalisé', actif: true, besoins: [] },
  ];

  /* ---- Paramètres application (architecture §5) ---- */
  const PARAMS = [
    { cle: 'whatsapp_active', label: 'Notifications WhatsApp', desc: 'Active l\'envoi de notifications via WhatsApp', type: 'toggle', val: false, groupe: 'Notifications' },
    { cle: 'rappel_evenement_heures', label: 'Rappel avant événement', desc: 'Délai d\'envoi du rappel automatique', type: 'number', val: 48, unite: 'heures', groupe: 'Notifications' },
    { cle: 'delai_desistement_jours', label: 'Délai de désistement', desc: 'Un STAR peut se désister seul jusqu\'à J-X', type: 'number', val: 7, unite: 'jours', groupe: 'Planning' },
    { cle: 'seuil_charge_normale', label: 'Charge normale', desc: 'Nombre de services considéré comme normal', type: 'range', val: '2 – 3', groupe: 'Charge' },
    { cle: 'seuil_charge_elevee', label: 'Charge élevée', desc: 'Seuil de charge élevée (alerte attention)', type: 'range', val: '4 – 6', groupe: 'Charge' },
    { cle: 'seuil_charge_critique', label: 'Charge critique', desc: 'Au-delà : alerte critique de surcharge', type: 'number', val: 6, unite: 'services', groupe: 'Charge' },
  ];

  /* ---- Journaux d'actions ---- */
  const JOURNAUX = [
    { id: 'j1', user: 'Esther Mbala', action: 'Publication', entite: 'Planning · Culte dominical 22/06', date: "Aujourd'hui 14:32", tone: 'ok' },
    { id: 'j2', user: 'Joseph Kalonji', action: 'Validation compte', entite: 'Utilisateur · Déborah Ilunga', date: "Aujourd'hui 11:08", tone: 'primary' },
    { id: 'j3', user: 'Esther Mbala', action: 'Génération', entite: 'Planning · Culte dominical 22/06', date: "Aujourd'hui 10:55", tone: 'primary' },
    { id: 'j4', user: 'Myriam Tshimanga', action: 'Modification', entite: 'Événement · Jeûne & prière 20/06', date: 'Hier 18:20', tone: 'warn' },
    { id: 'j5', user: 'David Kimba', action: 'Désistement', entite: 'Affectation · Culte dominical 22/06', date: 'Hier 16:45', tone: 'danger' },
    { id: 'j6', user: 'Joseph Kalonji', action: 'Création', entite: 'Département · EJP / MJPT', date: 'Hier 09:12', tone: 'primary' },
    { id: 'j7', user: 'Sephora Lwanzo', action: 'Consultation', entite: 'Statistiques · Charges de service', date: 'Hier 08:30', tone: 'muted' },
  ];

  /* ---- Stats helpers ---- */
  function chargeDistribution() {
    const buckets = { Disponible: 0, Normale: 0, Élevée: 0, Critique: 0 };
    O.STARS.forEach(s => {
      const k = O.niveauCharge(s.charge).key;
      if (k === 'faible') buckets.Disponible++; else if (k === 'normale') buckets.Normale++; else if (k === 'elevee') buckets['Élevée']++; else buckets.Critique++;
    });
    return buckets;
  }
  const ENGAGEMENT = [
    { dept: 'Accueil', taux: 86, services: 42 },
    { dept: 'Louange & Adoration', taux: 92, services: 38 },
    { dept: 'Prière', taux: 74, services: 26 },
    { dept: 'Sécurité', taux: 68, services: 31 },
    { dept: 'Protocole', taux: 80, services: 18 },
  ];

  Object.assign(O, { ROLES_GLOBAUX, PERSONAS, DEPARTMENTS_ALL, COMPTES, STATUT_COMPTE, MODELES, PARAMS, JOURNAUX, chargeDistribution, ENGAGEMENT });
})();
