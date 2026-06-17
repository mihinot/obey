// OBEY — Espaces Corps Pastoral & Vie des STARs
const { useState: usePv } = React;
const PASTORAL_ACCENT = T.accent;
const VIE_ACCENT = T.ok;

/* ============================ CORPS PASTORAL ============================ */
function PastoralApp({ onLogout, onSwitchRole }) {
  const [screen, setScreen] = usePv(() => localStorage.getItem('obey.past.screen') || 'dashboard');
  React.useEffect(() => localStorage.setItem('obey.past.screen', screen), [screen]);
  const p = OBEY.PERSONAS.pastoral;
  const nav = [
    { id: 'dashboard', icon: 'home', label: 'Vue globale' },
    { id: 'suivi', icon: 'heart', label: 'Suivi pastoral' },
    { id: 'intercession', icon: 'shield', label: 'Intercession' },
    { id: 'planning', icon: 'calendar', label: 'Planning' },
    { id: 'alertes', icon: 'alert', label: 'Alertes pastorales' },
    { id: 'engagement', icon: 'spark', label: "Statistiques d'engagement" },
  ];
  const events = OBEY.EVENTS;
  return (
    <DeskShell scope={{ sub: 'CORPS PASTORAL', label: 'Suivi & engagement' }} accent={PASTORAL_ACCENT} nav={nav} active={screen} onNav={setScreen}
      user={{ nom: p.nom, role: p.role }} onLogout={onLogout} onSwitchRole={onSwitchRole} notifCount={2}>
      {screen === 'dashboard' && <PastoralDashboard setScreen={setScreen} />}
      {screen === 'suivi' && <SuiviPastoral />}
      {screen === 'intercession' && <IntercessionView />}
      {screen === 'planning' && <div className="ob-fade"><PageHead title="Planning" sub="Vue de tous les événements" /><PlanningViews events={events} onOpen={() => { }} /></div>}
      {screen === 'alertes' && <AlertesPastorales />}
      {screen === 'engagement' && <StatsGlobales />}
    </DeskShell>
  );
}

function PastoralDashboard({ setScreen }) {
  const baptises = OBEY.STARS.filter(s => s.baptise).length;
  const enFormation = OBEY.STARS.filter(s => s.f101 || s.f201).length;
  const nouveaux = OBEY.STARS.filter(s => s.statut === 'Nouveau').length;
  return (
    <div className="ob-fade">
      <PageHead title="Vue globale" sub="Bienvenue Pasteur — suivi spirituel et engagement de la communauté" right={<ConfidentialBadge />} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <StatTile icon="users" label="STARs actifs" value={OBEY.STARS.filter(s => !OBEY.STATUTS[s.statut].exclu).length} sub={'sur ' + OBEY.STARS.length} color={PASTORAL_ACCENT} />
        <StatTile icon="heart" label="Baptisés" value={baptises} sub={Math.round(baptises / OBEY.STARS.length * 100) + '% de la communauté'} color={T.primary} />
        <StatTile icon="doc" label="En formation" value={enFormation} sub="parcours 101 / 201" color={T.ok} />
        <StatTile icon="spark" label="Nouveaux à accompagner" value={nouveaux} sub="ce mois" color={T.warn} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <Card pad={20}>
          <SectionTitle size={16} sub="Parcours de formation de la communauté">Formations</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 4 }}>
            {[['Baptême', OBEY.STARS.filter(s => s.baptise).length], ['Formation 001', OBEY.STARS.filter(s => s.f001).length], ['Formation 101', OBEY.STARS.filter(s => s.f101).length], ['Formation 201', OBEY.STARS.filter(s => s.f201).length]].map(([l, n]) => (
              <div key={l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{l}</span><span style={{ fontWeight: 700, color: PASTORAL_ACCENT }}>{n}/{OBEY.STARS.length}</span></div>
                <ProgressBar value={n} max={OBEY.STARS.length} color={PASTORAL_ACCENT} height={7} />
              </div>
            ))}
          </div>
        </Card>
        <Card pad={20}>
          <SectionTitle size={16} right={<button onClick={() => setScreen('alertes')} style={{ border: 'none', background: 'transparent', color: PASTORAL_ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tout voir</button>}>Attention pastorale</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Déborah Ilunga', 'Nouvelle — à intégrer dans une Famille d\'Impact', T.warn], ['Ruth Ngumbi', 'Peu sollicitée — à valoriser', T.primary], ['Caleb Mutombo', 'Désistements fréquents — prendre des nouvelles', T.danger]].map(([n, m, c], i) => (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '4px 0' }}>
                <Avatar name={n} size={34} tone={c} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{n}</div><div style={{ fontSize: 12, color: T.sub }}>{m}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SuiviPastoral() {
  const [q, setQ] = usePv('');
  const stars = OBEY.STARS.filter(s => s.nomComplet.toLowerCase().includes(q.toLowerCase()));
  const Check = ({ ok }) => ok ? <Icon name="check" size={15} color={T.ok} stroke={3} /> : <span style={{ color: T.border }}>—</span>;
  return (
    <div className="ob-fade">
      <PageHead title="Suivi pastoral" sub="Données spirituelles — accès réservé au Corps Pastoral" right={<ConfidentialBadge />} />
      <div style={{ maxWidth: 300, marginBottom: 16 }}><Field value={q} onChange={setQ} placeholder="Rechercher un STAR…" right={<Icon name="search" size={16} color={T.muted} />} /></div>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="ob-scroll">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
            <thead><tr style={{ background: T.surfaceAlt }}>
              {['STAR', 'Baptême', 'F. 001', 'F. 101', 'F. 201', "Famille d'Impact", 'Disciple'].map(h => <th key={h} style={{ padding: '13px 14px', fontSize: 11.5, fontWeight: 700, color: T.sub, textAlign: h === 'STAR' || h === "Famille d'Impact" ? 'left' : 'center' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {stars.map(s => (
                <tr key={s.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nomComplet} size={30} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.nomComplet}</span></div></td>
                  <td style={{ textAlign: 'center' }}><Check ok={s.baptise} /></td>
                  <td style={{ textAlign: 'center' }}><Check ok={s.f001} /></td>
                  <td style={{ textAlign: 'center' }}><Check ok={s.f101} /></td>
                  <td style={{ textAlign: 'center' }}><Check ok={s.f201} /></td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: s.famille ? T.ink : T.muted }}>{s.famille || '—'}</td>
                  <td style={{ textAlign: 'center' }}><Check ok={s.disciple} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function IntercessionView() {
  const membres = ['Anna Beya', 'Sarah Lwamba', 'Marthe Ngoy', 'Nathan Kabongo', 'Rebecca Tshala', 'Paul Mwamba'];
  return (
    <div className="ob-fade">
      <PageHead title="Département Intercession" sub="Confidentiel — visible uniquement par le Corps Pastoral et les responsables Intercession" right={<ConfidentialBadge />} />
      <div style={{ background: '#8a6fb010', border: '1px solid #8a6fb030', borderRadius: T.radius, padding: 16, display: 'flex', gap: 12, marginBottom: 18, maxWidth: 720 }}>
        <Icon name="shield" size={22} color="#8a6fb0" style={{ flex: '0 0 auto' }} />
        <div style={{ fontSize: 13, color: '#5f4f7a', lineHeight: 1.5 }}>Ce département est marqué <b>confidentiel</b>. Ses membres, plannings et statistiques sont masqués des vues globales, des exports standards et des statistiques publiques.</div>
      </div>
      <SectionTitle size={16} sub={membres.length + ' intercesseurs'}>Membres</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {membres.map((nom, i) => (
          <Card key={i} pad={14} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Avatar name={nom} size={38} tone="#8a6fb0" />
            <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{nom}</div><div style={{ fontSize: 11.5, color: T.sub }}>Intercesseur</div></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AlertesPastorales() {
  const alertes = [
    { id: 'p1', type: 'Volontaire inactif', niveau: 'ATTENTION', titre: 'Élie Banza en pause', msg: 'Aucun service depuis 2 mois — prendre des nouvelles' },
    { id: 'p2', type: 'Nouveau', niveau: 'INFO', titre: 'Déborah Ilunga — nouvelle', msg: 'À intégrer dans une Famille d\'Impact et un parcours de formation' },
    { id: 'p3', type: 'Désistements fréquents', niveau: 'ATTENTION', titre: 'Caleb Mutombo', msg: '3 désistements récents — accompagnement recommandé' },
    { id: 'p4', type: 'Volontaire peu sollicité', niveau: 'INFO', titre: 'Ruth Ngumbi', msg: 'Aucun service ce mois — à valoriser dans le service' },
  ];
  return (
    <div className="ob-fade">
      <PageHead title="Alertes pastorales" sub="Bien-être spirituel et accompagnement des STARs" right={<ConfidentialBadge />} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {alertes.map(a => <AlertCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

/* ============================ VIE DES STARS ============================ */
function VieApp({ onLogout, onSwitchRole }) {
  const [screen, setScreen] = usePv(() => localStorage.getItem('obey.vie.screen') || 'bienetre');
  React.useEffect(() => localStorage.setItem('obey.vie.screen', screen), [screen]);
  const p = OBEY.PERSONAS.vie;
  const nav = [
    { id: 'bienetre', icon: 'heart', label: 'Bien-être des STARs' },
    { id: 'charges', icon: 'spark', label: 'Charges de service' },
    { id: 'multi', icon: 'layers', label: 'Multi-départements' },
    { id: 'alertes', icon: 'alert', label: 'Alertes surcharge', badge: 2 },
  ];
  return (
    <DeskShell scope={{ sub: 'VIE DES STARS', label: 'Bien-être & charge' }} accent={VIE_ACCENT} nav={nav} active={screen} onNav={setScreen}
      user={{ nom: p.nom, role: p.role }} onLogout={onLogout} onSwitchRole={onSwitchRole} notifCount={2}>
      {screen === 'bienetre' && <VieBienEtre setScreen={setScreen} />}
      {screen === 'charges' && <VieCharges />}
      {screen === 'multi' && <VieMulti />}
      {screen === 'alertes' && <VieAlertes />}
    </DeskShell>
  );
}

function VieBienEtre({ setScreen }) {
  const dist = OBEY.chargeDistribution();
  const sain = dist.Disponible + dist.Normale;
  const surcharges = OBEY.STARS.filter(s => s.charge >= 4);
  const peu = OBEY.STARS.filter(s => s.charge === 0 && !OBEY.STATUTS[s.statut].exclu);
  return (
    <div className="ob-fade">
      <PageHead title="Bien-être des STARs" sub="Bienvenue Sephora — veille sur l'équilibre de service de chacun" />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        <Card pad={20} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <SectionTitle size={16}>Équilibre global</SectionTitle>
          <Donut value={sain} max={OBEY.STARS.length} label={Math.round(sain / OBEY.STARS.length * 100) + '%'} sub="équilibrés" color={VIE_ACCENT} size={150} />
          <div style={{ fontSize: 13, color: T.sub, textAlign: 'center' }}>{sain} STARs sur {OBEY.STARS.length} ont une charge saine</div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <StatTile icon="alert" label="Surchargés" value={surcharges.length} sub="charge élevée / critique" color={T.danger} />
          <StatTile icon="clock" label="Peu sollicités" value={peu.length} sub="à mobiliser" color={T.primary} />
          <StatTile icon="layers" label="Multi-départements" value={OBEY.STARS.filter(s => s.depts.length >= 2).length} sub="à surveiller" color={T.warn} />
          <StatTile icon="users" label="Total STARs" value={OBEY.STARS.length} sub="suivis" color={VIE_ACCENT} />
        </div>
      </div>
      <Card pad={20}>
        <SectionTitle size={16} right={<button onClick={() => setScreen('alertes')} style={{ border: 'none', background: 'transparent', color: VIE_ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Voir les alertes</button>}>STARs en surcharge</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {surcharges.sort((a, b) => b.charge - a.charge).map(s => {
            const niv = OBEY.niveauCharge(s.charge); const color = niv.tone === 'danger' ? T.danger : T.warn;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={s.nomComplet} size={34} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{s.nomComplet}</span>
                <div style={{ width: 120 }}><ProgressBar value={s.charge} max={8} color={color} height={7} /></div>
                <Badge tone={niv.tone === 'danger' ? 'danger' : 'warn'}>{niv.label} · {s.charge}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function VieCharges() {
  const stars = [...OBEY.STARS].sort((a, b) => b.charge - a.charge);
  return (
    <div className="ob-fade">
      <PageHead title="Charges de service" sub="Nombre de services par STAR sur le mois courant" />
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="ob-scroll">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
            <thead><tr style={{ background: T.surfaceAlt }}>
              {['STAR', 'Départements', 'Charge ce mois', 'Niveau'].map(h => <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 12, fontWeight: 700, color: T.sub }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {stars.map(s => {
                const niv = OBEY.niveauCharge(s.charge); const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.ok;
                return (
                  <tr key={s.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nomComplet} size={30} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.nomComplet}</span></div></td>
                    <td style={{ padding: '11px 16px', fontSize: 12.5, color: T.sub }}>{s.depts.map(d => OBEY.DEPT[d] ? OBEY.DEPT[d].nom : d).join(', ')}</td>
                    <td style={{ padding: '11px 16px', width: 200 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ flex: 1 }}><ProgressBar value={s.charge} max={8} color={color} height={7} /></div><span style={{ fontWeight: 700, color, width: 14 }}>{s.charge}</span></div></td>
                    <td style={{ padding: '11px 16px' }}><Badge tone={niv.tone === 'danger' ? 'danger' : niv.tone === 'warn' ? 'warn' : 'ok'}>{niv.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function VieMulti() {
  const multi = OBEY.STARS.filter(s => s.depts.length >= 2).sort((a, b) => b.depts.length - a.depts.length);
  return (
    <div className="ob-fade">
      <PageHead title="Multi-départements" sub="STARs engagés dans plusieurs départements — à surveiller pour éviter la surcharge" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {multi.map(s => {
          const niv = OBEY.niveauCharge(s.charge); const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.ok;
          return (
            <Card key={s.id} pad={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                <Avatar name={s.nomComplet} size={42} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.nomComplet}</div><div style={{ fontSize: 12, color: T.sub }}>{s.depts.length} départements</div></div>
                {s.depts.length >= 2 && s.charge >= 4 && <Badge tone="danger" icon="alert">À surveiller</Badge>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {s.depts.map(d => <span key={d} style={{ fontSize: 11.5, fontWeight: 600, color: OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub, background: (OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub) + '15', padding: '3px 9px', borderRadius: 999 }}>{OBEY.DEPT[d] ? OBEY.DEPT[d].nom : d}</span>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: T.sub }}>Charge</span><ProgressBar value={s.charge} max={8} color={color} height={7} /><span style={{ fontWeight: 700, color, fontSize: 12.5 }}>{s.charge}</span></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function VieAlertes() {
  const surcharges = OBEY.STARS.filter(s => s.charge >= 6);
  const alertes = surcharges.map((s, i) => ({ id: 'v' + i, type: 'Volontaire surchargé', niveau: 'CRITIQUE', titre: s.nomComplet + ' en charge critique', msg: s.charge + ' services ce mois — alléger ses affectations' }))
    .concat([{ id: 'vx', type: 'Multi-département', niveau: 'ATTENTION', titre: 'David Kimba multi-département', msg: 'Engagé sur 2 départements avec charge élevée' }]);
  return (
    <div className="ob-fade">
      <PageHead title="Alertes surcharge" sub="STARs dont la charge dépasse les seuils sains" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {alertes.map(a => <AlertCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

Object.assign(window, { PastoralApp, VieApp });
