// OBEY — Espace Référent (desktop) : shell + dashboard, planning, remplacements, équipe, alertes
const { useState: useR, useEffect: useRE } = React;

function ReferentApp({ onLogout, onSwitchRole }) {
  const [screen, setScreen] = useR(() => localStorage.getItem('obey.ref.screen') || 'dashboard');
  const [evtId, setEvtId] = useR(null);
  const [mode, setMode] = useR('detail'); // detail | generation
  const [statuts, setStatuts] = useR(() => Object.fromEntries(OBEY.EVENTS.map(e => [e.id, e.statut])));
  const [toast, setToast] = useR(null);
  useRE(() => localStorage.setItem('obey.ref.screen', screen), [screen]);
  useRE(() => { if (toast) { const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); } }, [toast]);

  const me = OBEY.ME_REF;
  const events = OBEY.EVENTS.map(e => ({ ...e, statut: statuts[e.id] }));
  const event = events.find(e => e.id === evtId);
  const openEvent = (e) => { setEvtId(e.id); setMode('detail'); setScreen('event'); };
  const setStatus = (id, st) => { setStatuts(s => ({ ...s, [id]: st })); setToast(st === 'PUBLIE' ? 'Planning publié — STARs notifiés' : 'Planning validé'); };

  const nav = [
    { id: 'dashboard', icon: 'home', label: 'Tableau de bord' },
    { id: 'planning', icon: 'calendar', label: 'Planning' },
    { id: 'remplacements', icon: 'swap', label: 'Remplacements', badge: 1 },
    { id: 'equipe', icon: 'users', label: 'Équipe' },
    { id: 'alertes', icon: 'alert', label: 'Alertes', badge: 2 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      {/* Sidebar */}
      <aside style={{ width: 248, flex: '0 0 auto', background: T.surface, borderRight: `1px solid ${T.borderSoft}`, display: 'flex', flexDirection: 'column', padding: '22px 16px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 8px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wordmark size={26} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: T.accentSoft, padding: '2px 8px', borderRadius: 999 }}>V1</span>
        </div>
        <div style={{ background: T.primaryTint, borderRadius: T.radius, padding: '12px 14px', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.04em' }}>DÉPARTEMENT</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.primaryDeep }}>Accueil</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {nav.map(it => {
            const active = screen === it.id || (it.id === 'planning' && screen === 'event');
            return (
              <button key={it.id} className="ob-press" onClick={() => { setScreen(it.id); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? T.primarySoft : 'transparent', color: active ? T.primaryDeep : T.sub,
                fontWeight: active ? 600 : 500, fontSize: 14, padding: '11px 14px', borderRadius: T.radius, transition: 'all .15s',
              }}>
                <Icon name={it.icon} size={19} stroke={active ? 2.4 : 2} />{it.label}
                {it.badge && <span style={{ marginLeft: 'auto', background: T.danger, color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 19, height: 19, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{it.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="ob-press" onClick={onSwitchRole} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: T.sub, fontSize: 13, fontWeight: 500, padding: '9px 14px', borderRadius: T.radius }}><Icon name="layers" size={17} /> Changer de rôle</button>
          <button className="ob-press" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: T.sub, fontSize: 13, fontWeight: 500, padding: '9px 14px', borderRadius: T.radius }}><Icon name="logout" size={17} /> Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: `1px solid ${T.borderSoft}`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 20, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={17} color={T.muted} style={{ position: 'absolute', left: 13, top: 11 }} />
            <input placeholder="Rechercher un STAR, un événement…" style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: T.pill, padding: '9px 14px 9px 38px', fontSize: 13.5, fontFamily: T.body, outline: 'none', background: T.bgWarm }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="ob-press" style={{ position: 'relative', border: 'none', background: T.surfaceAlt, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={19} color={T.sub} />
              <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: T.danger, border: '2px solid ' + T.surface }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={me.nomComplet} size={38} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{me.nomComplet}</div>
                <div style={{ fontSize: 11.5, color: T.sub }}>Référente · Accueil</div>
              </div>
            </div>
          </div>
        </header>

        <main className="ob-scroll" style={{ flex: 1, padding: '26px 28px 40px', overflowY: 'auto' }}>
          {screen === 'dashboard' && <RefDashboard events={events} openEvent={openEvent} setScreen={setScreen} />}
          {screen === 'planning' && (
            <div className="ob-fade">
              <SectionTitle sub="Tous les événements impliquant le département Accueil" right={<Btn icon="plus">Nouvel événement</Btn>}>Planning · Accueil</SectionTitle>
              <PlanningViews events={events} onOpen={openEvent} deptFilter="ACC" />
            </div>
          )}
          {screen === 'event' && event && (mode === 'detail'
            ? <EventDetail event={event} onBack={() => setScreen('planning')} onGenerate={() => setMode('generation')} />
            : <GenerationView event={event} onBack={() => setMode('detail')} onStatus={setStatus} />)}
          {screen === 'remplacements' && <RefRemplacements toast={setToast} />}
          {screen === 'equipe' && <RefEquipe />}
          {screen === 'alertes' && <RefAlertes openEvent={(id) => openEvent(events.find(e => e.id === id))} />}
        </main>
      </div>
      {toast && <div className="ob-rise" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: T.ink, color: '#fff', padding: '13px 22px', borderRadius: T.pill, fontSize: 14, fontWeight: 600, boxShadow: T.shadowLg, zIndex: 80 }}>{toast}</div>}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function RefDashboard({ events, openEvent, setScreen }) {
  const accEvents = events.filter(e => e.besoins.some(b => b.dept === 'ACC')).sort((a, b) => new Date(a.date) - new Date(b.date));
  const next = accEvents[0];
  const equipe = OBEY.STARS.filter(s => s.depts.includes('ACC'));
  const surcharges = equipe.filter(s => s.charge >= 4).length;
  const aValider = events.filter(e => e.statut === 'A_VALIDER' || e.statut === 'BROUILLON').length;
  return (
    <div className="ob-fade">
      <SectionTitle size={24} sub="Bienvenue Esther — voici l'essentiel pour ton département">Tableau de bord</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
        <KpiCard icon="calendar" label="Prochain événement" value={next ? next.jour + ' ' + new Date(next.date).getDate() : '—'} sub={next ? next.nom : ''} color={T.primary} />
        <KpiCard icon="doc" label="Plannings à traiter" value={aValider} sub="à valider / générer" color={T.warn} />
        <KpiCard icon="users" label="STARs actifs" value={equipe.filter(s => !OBEY.STATUTS[s.statut].exclu).length} sub={'sur ' + equipe.length + ' membres'} color={T.ok} />
        <KpiCard icon="alert" label="Alertes actives" value={OBEY.ALERTES.length} sub={surcharges + ' surcharge(s)'} color={T.danger} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div>
          {next && <NextEventCard event={next} onOpen={openEvent} />}
          <div style={{ marginTop: 16 }}>
            <SectionTitle size={17} right={<button onClick={() => setScreen('planning')} style={{ border: 'none', background: 'transparent', color: T.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tout voir</button>}>Événements à venir</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accEvents.slice(1, 4).map(e => {
                const t = tauxEvt(e); const st = OBEY.STATUT_EVT[e.statut]; const color = t.pct >= 100 ? T.ok : t.pct >= 60 ? T.warn : T.danger;
                return (
                  <Card key={e.id} pad={14} hover onClick={() => openEvent(e)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, textAlign: 'center', flex: '0 0 auto' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.primary }}>{e.jour.toUpperCase()}</div>
                      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>{new Date(e.date).getDate()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}>{e.nom} <Badge tone={st.tone}>{st.label}</Badge></div>
                      <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>{e.debut}–{e.fin} · {e.lieu}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, color, fontFamily: T.display, fontSize: 17 }}>{t.cv}/{t.req}</div></div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <SectionTitle size={17} right={<button onClick={() => setScreen('alertes')} style={{ border: 'none', background: 'transparent', color: T.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tout voir</button>}>Alertes</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OBEY.ALERTES.slice(0, 3).map(a => <AlertCard key={a.id} a={a} compact />)}
          </div>
          <div style={{ marginTop: 18 }}>
            <SectionTitle size={17}>Charge de l'équipe</SectionTitle>
            <Card pad={16}>
              {equipe.filter(s => !OBEY.STATUTS[s.statut].exclu).sort((a, b) => b.charge - a.charge).slice(0, 5).map((s, i) => {
                const niv = OBEY.niveauCharge(s.charge); const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.ok;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
                    <Avatar name={s.nomComplet} size={30} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.nomComplet}</span>
                    <div style={{ width: 70 }}><ProgressBar value={s.charge} max={8} color={color} height={6} /></div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color, width: 16, textAlign: 'right' }}>{s.charge}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <Card pad={17}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} color={color} /></div>
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 28, marginTop: 12, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>{sub}</div>
    </Card>
  );
}

function NextEventCard({ event, onOpen }) {
  const t = tauxEvt(event); const cov = couvertureEvt(event);
  return (
    <Card pad={0} style={{ overflow: 'hidden', boxShadow: T.shadow }}>
      <div style={{ background: `linear-gradient(130deg, ${T.primary}, ${T.primaryDeep})`, padding: 22, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>PROCHAIN ÉVÉNEMENT · {event.dateLabel}</span>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 25, marginTop: 5 }}>{event.nom}</div>
            <div style={{ fontSize: 13.5, opacity: 0.92, marginTop: 4, display: 'flex', gap: 14 }}><span>{event.debut}–{event.fin}</span><span>·</span><span>{event.lieu}</span></div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 999 }}>{OBEY.STATUT_EVT[event.statut].label}</span>
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: T.sub }}>Couverture des postes</span>
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: t.pct >= 100 ? T.ok : T.warn }}>{t.cv}/{t.req}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {cov.map(c => {
            const full = c.couverts >= c.requis; const color = full ? T.ok : c.couverts === 0 ? T.danger : T.warn;
            return (
              <div key={c.dept}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}><Dot c={OBEY.DEPT[c.dept].couleur} s={7} />{OBEY.DEPT[c.dept].nom}</span>
                  <span style={{ fontWeight: 700, color }}>{Math.min(c.requis, c.couverts)}/{c.requis}{c.manque ? ' · ' + c.manque + ' manquant' : ''}</span>
                </div>
                <ProgressBar value={Math.min(c.requis, c.couverts)} max={c.requis} color={color} height={7} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}><Btn full icon="bolt" onClick={() => onOpen(event)}>Générer / voir le planning</Btn></div>
      </div>
    </Card>
  );
}

/* ---------------- Détail événement ---------------- */
function EventDetail({ event, onBack, onGenerate }) {
  const cov = couvertureEvt(event); const st = OBEY.STATUT_EVT[event.statut];
  return (
    <div className="ob-fade">
      <button onClick={onBack} className="ob-press" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: T.sub, fontSize: 13.5, fontWeight: 600, marginBottom: 16, padding: 0 }}><Icon name="chevL" size={18} /> Retour au planning</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 26 }}>{event.nom}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <div style={{ fontSize: 14, color: T.sub, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="calendar" size={15} color={T.muted} /> {event.dateLabel}</span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="clock" size={15} color={T.muted} /> {event.debut}–{event.fin}</span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="pin" size={15} color={T.muted} /> {event.lieu}</span>
          </div>
        </div>
        <Btn size="lg" icon="bolt" onClick={onGenerate}>{event.statut === 'BROUILLON' ? 'Générer le planning' : 'Voir / régénérer'}</Btn>
      </div>
      <SectionTitle size={17} sub="Nombre de STARs requis par département pour cet événement">Besoins par département</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
        {cov.map(c => {
          const full = c.couverts >= c.requis; const color = full ? T.ok : c.couverts === 0 ? T.danger : T.warn; const d = OBEY.DEPT[c.dept];
          return (
            <Card key={c.dept} pad={16}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Dot c={d.couleur} s={10} />{d.nom}</span>
                <Badge tone={full ? 'ok' : c.couverts === 0 ? 'danger' : 'warn'}>{Math.min(c.requis, c.couverts)}/{c.requis}</Badge>
              </div>
              <ProgressBar value={Math.min(c.requis, c.couverts)} max={c.requis} color={color} height={8} />
              <div style={{ fontSize: 12.5, color: T.sub, marginTop: 9 }}>{full ? 'Tous les postes couverts' : c.manque + ' poste(s) à pourvoir'}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Remplacements ---------------- */
function RefRemplacements({ toast }) {
  const [demandes, setDemandes] = useR([
    { id: 'r1', star: OBEY.STAR[2], evt: OBEY.EVENTS[0], motif: 'Empêchement professionnel', statut: 'SUGGESTION_FAITE', suggere: OBEY.STAR[4] },
    { id: 'r2', star: OBEY.STAR[12], evt: OBEY.EVENTS[0], motif: 'Raison de santé', statut: 'DEMANDEE', suggere: OBEY.STAR[5] },
  ]);
  const valider = id => { setDemandes(d => d.map(x => x.id === id ? { ...x, statut: 'VALIDEE' } : x)); toast('Remplaçant validé — notification envoyée'); };
  return (
    <div className="ob-fade">
      <SectionTitle size={24} sub="Désistements et propositions de remplaçants pour le département Accueil">Remplacements</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
        {demandes.map(d => (
          <Card key={d.id} pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
              <Avatar name={d.star.nomComplet} size={42} tone={T.danger} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 8 }}>{d.star.nomComplet} <Badge tone="danger">Désistement</Badge></div>
                <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{d.evt.nom} · {d.evt.dateLabel} · {d.motif}</div>
              </div>
              {d.statut === 'VALIDEE' && <Badge tone="ok" icon="check">Résolu</Badge>}
            </div>
            <div style={{ background: T.bgWarm, borderRadius: T.radius, padding: 14, display: 'flex', alignItems: 'center', gap: 13 }}>
              <Icon name="spark" size={20} color={T.primary} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>REMPLAÇANT SUGGÉRÉ PAR LE MOTEUR</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6 }}>
                  <Avatar name={d.suggere.nomComplet} size={32} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{d.suggere.nomComplet}</span>
                  <Badge tone="ok" dot>Disponible · charge {d.suggere.charge}</Badge>
                </div>
              </div>
              {d.statut !== 'VALIDEE' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" variant="outline">Autre</Btn>
                  <Btn size="sm" icon="check" onClick={() => valider(d.id)}>Valider</Btn>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Équipe ---------------- */
function RefEquipe() {
  const [q, setQ] = useR('');
  const equipe = OBEY.STARS.filter(s => s.depts.includes('ACC')).filter(s => s.nomComplet.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="ob-fade">
      <SectionTitle size={24} sub={OBEY.STARS.filter(s => s.depts.includes('ACC')).length + ' membres du département Accueil'} right={<Btn icon="plus">Ajouter un STAR</Btn>}>Équipe</SectionTitle>
      <div style={{ maxWidth: 320, marginBottom: 16 }}><Field value={q} onChange={setQ} placeholder="Rechercher un membre…" right={<Icon name="search" size={16} color={T.muted} />} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {equipe.map(s => {
          const niv = OBEY.niveauCharge(s.charge); const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.ok;
          return (
            <Card key={s.id} pad={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={s.nomComplet} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.nomComplet}</div>
                  <div style={{ fontSize: 12.5, color: T.sub }}>{s.tel}</div>
                </div>
                <Badge tone={OBEY.STATUTS[s.statut].tone}>{s.statut}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {s.depts.map(d => <span key={d} style={{ fontSize: 11, fontWeight: 600, color: OBEY.DEPT[d].couleur, background: OBEY.DEPT[d].couleur + '15', padding: '2px 8px', borderRadius: 999 }}>{OBEY.DEPT[d].nom}</span>)}
              </div>
              <div style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: T.sub, flex: '0 0 auto' }}>Charge</span>
                <ProgressBar value={s.charge} max={8} color={color} height={7} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{s.charge}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Alertes ---------------- */
function RefAlertes({ openEvent }) {
  const [filtre, setFiltre] = useR('tous');
  const list = OBEY.ALERTES.filter(a => filtre === 'tous' || OBEY.NIVEAU_ALERTE[a.niveau].tone === filtre);
  return (
    <div className="ob-fade">
      <SectionTitle size={24} sub="Surcharge, sous-effectif, désistements et événements à risque">Alertes</SectionTitle>
      <div style={{ marginBottom: 16 }}>
        <Tabs value={filtre} onChange={setFiltre} items={[{ id: 'tous', label: 'Toutes' }, { id: 'danger', label: 'Critiques' }, { id: 'warn', label: 'Attention' }, { id: 'primary', label: 'Info' }]} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
        {list.map(a => <AlertCard key={a.id} a={a} onOpen={a.evt ? () => openEvent(a.evt) : null} />)}
      </div>
    </div>
  );
}

function AlertCard({ a, compact, onOpen }) {
  const niv = OBEY.NIVEAU_ALERTE[a.niveau]; const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.primary;
  return (
    <Card pad={compact ? 13 : 16} hover={!!onOpen} onClick={onOpen} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', borderLeft: `4px solid ${color}` }}>
      <div style={{ width: compact ? 32 : 38, height: compact ? 32 : 38, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="alert" size={compact ? 16 : 19} color={color} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: compact ? 13.5 : 14.5 }}>{a.titre}</span>
          {!compact && <Badge tone={niv.tone}>{niv.label}</Badge>}
        </div>
        <div style={{ fontSize: compact ? 12 : 13, color: T.sub, marginTop: 2 }}>{a.msg}</div>
      </div>
      {onOpen && <Icon name="chevR" size={18} color={T.muted} />}
    </Card>
  );
}

Object.assign(window, { ReferentApp });
