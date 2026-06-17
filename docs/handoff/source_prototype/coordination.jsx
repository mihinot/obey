// OBEY — Espace Coordination Générale (portée globale)
const { useState: useCo } = React;

function CoordinationApp({ onLogout, onSwitchRole }) {
  const [screen, setScreen] = useCo(() => localStorage.getItem('obey.coord.screen') || 'dashboard');
  const [statuts, setStatuts] = useCo(() => Object.fromEntries(OBEY.EVENTS.map(e => [e.id, e.statut])));
  const [evtId, setEvtId] = useCo(null);
  const [creating, setCreating] = useCo(false);
  const [toast, setToast] = useCo(null);
  React.useEffect(() => localStorage.setItem('obey.coord.screen', screen), [screen]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); } }, [toast]);
  const p = OBEY.PERSONAS.coordination;
  const events = OBEY.EVENTS.map(e => ({ ...e, statut: statuts[e.id] }));
  const event = events.find(e => e.id === evtId);
  const setStatus = (id, st) => { setStatuts(s => ({ ...s, [id]: st })); setToast(st === 'PUBLIE' ? 'Planning publié — tous les départements notifiés' : 'Planning validé'); };
  const openEvt = e => { setEvtId(e.id); setScreen('event'); };
  const nav = [
    { id: 'dashboard', icon: 'home', label: 'Tableau de bord' },
    { id: 'planning', icon: 'calendar', label: 'Planning global' },
    { id: 'validation', icon: 'check', label: 'Validation', badge: events.filter(e => e.statut === 'A_VALIDER').length || null },
    { id: 'alertes', icon: 'alert', label: 'Alertes critiques', badge: 1 },
    { id: 'departements', icon: 'layers', label: 'Départements' },
    { id: 'statistiques', icon: 'spark', label: 'Statistiques' },
    { id: 'exports', icon: 'dl', label: 'Exports' },
  ];
  return (
    <React.Fragment>
      <DeskShell scope={{ sub: 'COORDINATION GÉNÉRALE', label: 'Vue globale' }} accent={T.primary} nav={nav} active={screen === 'event' ? 'planning' : screen} onNav={setScreen}
        user={{ nom: p.nom, role: p.role }} onLogout={onLogout} onSwitchRole={onSwitchRole} notifCount={4} onBell={() => setScreen('notifications')}>
        {screen === 'dashboard' && <CoordDashboard events={events} openEvt={openEvt} setScreen={setScreen} />}
        {screen === 'planning' && !creating && (
          <div className="ob-fade">
            <PageHead title="Planning global" sub="Tous les événements, tous départements" right={<Btn icon="plus" onClick={() => setCreating(true)}>Nouvel événement</Btn>} />
            <PlanningViews events={events} onOpen={openEvt} />
          </div>
        )}
        {screen === 'planning' && creating && <EventForm onCancel={() => setCreating(false)} onSave={() => { setCreating(false); setToast('Événement créé'); }} />}
        {screen === 'event' && event && <GenerationView event={event} onBack={() => setScreen('planning')} onStatus={setStatus} />}
        {screen === 'validation' && <CoordValidation events={events} openEvt={openEvt} />}
        {screen === 'alertes' && <CoordAlertes openEvt={(id) => openEvt(events.find(e => e.id === id))} />}
        {screen === 'departements' && <CoordDepartements events={events} />}
        {screen === 'statistiques' && <StatsGlobales />}
        {screen === 'exports' && <ExportsScreen toast={setToast} confidentialNote />}
        {screen === 'notifications' && <NotifCenter />}
      </DeskShell>
      {toast && <div className="ob-rise" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: T.ink, color: '#fff', padding: '13px 22px', borderRadius: T.pill, fontSize: 14, fontWeight: 600, boxShadow: T.shadowLg, zIndex: 300 }}>{toast}</div>}
    </React.Fragment>
  );
}

function CoordDashboard({ events, openEvt, setScreen }) {
  const aVenir = events.filter(e => new Date(e.date) >= new Date('2026-06-15')).length;
  const aValider = events.filter(e => e.statut === 'A_VALIDER').length;
  const totReq = events.reduce((s, e) => s + tauxEvt(e).req, 0);
  const totCv = events.reduce((s, e) => s + tauxEvt(e).cv, 0);
  const pct = Math.round(totCv / totReq * 100);
  const deptCov = OBEY.DEPARTMENTS.filter(d => !d.confidentiel).map(d => {
    let req = 0, cv = 0; events.forEach(e => { const b = e.besoins.find(x => x.dept === d.code); if (b) { const g = OBEY.genererDept(e, d.code); req += b.requis; cv += Math.min(b.requis, g.couverts); } });
    return { label: d.nom.split(' ')[0], value: req ? Math.round(cv / req * 100) : 100, color: d.couleur };
  });
  return (
    <div className="ob-fade">
      <PageHead title="Tableau de bord global" sub="Bienvenue Myriam — vue d'ensemble de tous les départements" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <StatTile icon="calendar" label="Événements à venir" value={aVenir} sub="ce mois" color={T.primary} />
        <StatTile icon="check" label="Plannings à valider" value={aValider} sub="en attente de toi" color={T.warn} />
        <StatTile icon="users" label="Taux de couverture" value={pct + '%'} sub={totCv + '/' + totReq + ' postes'} color={pct >= 80 ? T.ok : T.warn} />
        <StatTile icon="alert" label="Alertes critiques" value={1} sub="à traiter" color={T.danger} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <Card pad={20}>
          <SectionTitle size={16} sub="Postes couverts par département (tous événements à venir)">Couverture par département</SectionTitle>
          <BarChart data={deptCov} height={160} />
        </Card>
        <div>
          <SectionTitle size={16} right={<button onClick={() => setScreen('validation')} style={{ border: 'none', background: 'transparent', color: T.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tout voir</button>}>À valider</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.filter(e => e.statut === 'A_VALIDER' || e.statut === 'BROUILLON').slice(0, 3).map(e => {
              const t = tauxEvt(e);
              return (
                <Card key={e.id} pad={14} hover onClick={() => openEvt(e)} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.nom}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{e.jour} {new Date(e.date).getDate()}/06 · {t.cv}/{t.req} postes</div>
                  </div>
                  <Badge tone={OBEY.STATUT_EVT[e.statut].tone}>{OBEY.STATUT_EVT[e.statut].label}</Badge>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoordValidation({ events, openEvt }) {
  const toValid = events.filter(e => e.statut === 'A_VALIDER' || e.statut === 'BROUILLON' || e.statut === 'PUBLIE');
  return (
    <div className="ob-fade">
      <PageHead title="Validation des plannings" sub="Valide et publie les plannings générés par les référents" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820 }}>
        {toValid.map(e => {
          const t = tauxEvt(e); const st = OBEY.STATUT_EVT[e.statut]; const color = t.pct >= 100 ? T.ok : t.pct >= 60 ? T.warn : T.danger;
          return (
            <Card key={e.id} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 50, textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.primary }}>{e.jour.toUpperCase()}</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 24 }}>{new Date(e.date).getDate()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>{e.nom} <Badge tone={st.tone}>{st.label}</Badge></div>
                <div style={{ fontSize: 12.5, color: T.sub, marginTop: 3 }}>{e.debut}–{e.fin} · {e.lieu}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: T.display, fontWeight: 700, color, fontSize: 18 }}>{t.cv}/{t.req}</div>
                <div style={{ fontSize: 11, color: T.sub }}>postes</div>
              </div>
              <Btn size="sm" icon="chevR" variant="soft" onClick={() => openEvt(e)}>Examiner</Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CoordAlertes({ openEvt }) {
  const all = [...OBEY.ALERTES, { id: 'a5', type: 'Événement à risque', niveau: 'CRITIQUE', titre: 'Culte du 22/06 à risque', msg: 'Louange & Sécurité sous-effectifs simultanément', evt: 'e1' }];
  return (
    <div className="ob-fade">
      <PageHead title="Alertes critiques" sub="Toutes les alertes nécessitant une intervention" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {all.map(a => <AlertCard key={a.id} a={a} onOpen={a.evt ? () => openEvt(a.evt) : null} />)}
      </div>
    </div>
  );
}

function CoordDepartements({ events }) {
  const depts = OBEY.DEPARTMENTS.filter(d => !d.confidentiel);
  return (
    <div className="ob-fade">
      <PageHead title="Départements" sub="Vue d'ensemble de la couverture par département" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {depts.map(d => {
          let req = 0, cv = 0; events.forEach(e => { const b = e.besoins.find(x => x.dept === d.code); if (b) { const g = OBEY.genererDept(e, d.code); req += b.requis; cv += Math.min(b.requis, g.couverts); } });
          const pct = req ? Math.round(cv / req * 100) : 100; const color = pct >= 90 ? T.ok : pct >= 60 ? T.warn : T.danger;
          const membres = OBEY.STARS.filter(s => s.depts.includes(d.code)).length;
          return (
            <Card key={d.code} pad={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: d.couleur + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="layers" size={18} color={d.couleur} /></div>
                <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.nom}</div><div style={{ fontSize: 11.5, color: T.muted }}>{membres} membres</div></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}><span style={{ color: T.sub }}>Couverture</span><span style={{ fontWeight: 700, color }}>{cv}/{req}</span></div>
              <ProgressBar value={cv} max={req || 1} color={color} height={7} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatsGlobales() {
  const dist = OBEY.chargeDistribution();
  const distData = [
    { label: 'Disponible', value: dist.Disponible, color: T.ok },
    { label: 'Normale', value: dist.Normale, color: T.primary },
    { label: 'Élevée', value: dist['Élevée'], color: T.warn },
    { label: 'Critique', value: dist.Critique, color: T.danger },
  ];
  return (
    <div className="ob-fade">
      <PageHead title="Statistiques" sub="Charge, engagement et contribution des STARs" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        <Card pad={20}>
          <SectionTitle size={16} sub="Répartition des STARs par niveau de charge">Charge des volontaires</SectionTitle>
          <BarChart data={distData} height={160} />
        </Card>
        <Card pad={20} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <SectionTitle size={16}>Taux d'engagement</SectionTitle>
          <Donut value={82} max={100} label="82%" sub="ce mois" color={T.ok} size={150} />
          <div style={{ fontSize: 13, color: T.sub, textAlign: 'center' }}>STARs ayant confirmé leur présence</div>
        </Card>
        <Card pad={20}>
          <SectionTitle size={16} sub="Taux de présence par département">Engagement par département</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            {OBEY.ENGAGEMENT.map(e => (
              <div key={e.dept}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{e.dept}</span><span style={{ fontWeight: 700, color: e.taux >= 85 ? T.ok : T.warn }}>{e.taux}%</span></div>
                <ProgressBar value={e.taux} max={100} color={e.taux >= 85 ? T.ok : T.warn} height={7} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { CoordinationApp });
