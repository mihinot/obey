// OBEY — Vues de planning (liste / calendrier / tableau) + moteur de génération
const { useState: useP, useEffect: usePE, useMemo: usePM } = React;

/* ============ Couverture utilitaire ============ */
function couvertureEvt(e) {
  return e.besoins.map(b => {
    const g = OBEY.genererDept(e, b.dept);
    return { dept: b.dept, requis: b.requis, couverts: e.statut === 'PUBLIE' || e.statut === 'A_VALIDER' ? Math.min(b.requis, g.couverts) : g.couverts, manque: g.manque };
  });
}
function tauxEvt(e) {
  const c = couvertureEvt(e); const req = c.reduce((s, x) => s + x.requis, 0); const cv = c.reduce((s, x) => s + Math.min(x.requis, x.couverts), 0);
  return { req, cv, pct: req ? Math.round(cv / req * 100) : 100 };
}

/* ============ Sélecteur de vue + conteneur ============ */
function PlanningViews({ events, onOpen, deptFilter }) {
  const [view, setView] = useP(() => localStorage.getItem('obey.planview') || 'liste');
  usePE(() => localStorage.setItem('obey.planview', view), [view]);
  const list = deptFilter ? events.filter(e => e.besoins.some(b => b.dept === deptFilter)) : events;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <Tabs value={view} onChange={setView} items={[
          { id: 'liste', label: 'Liste', icon: 'list' },
          { id: 'calendrier', label: 'Calendrier', icon: 'calendar' },
          { id: 'tableau', label: 'Par département', icon: 'grid' },
        ]} />
        <div style={{ fontSize: 13, color: T.sub }}>{list.length} événements · Juin 2026</div>
      </div>
      {view === 'liste' && <VueListe events={list} onOpen={onOpen} />}
      {view === 'calendrier' && <VueCalendrier events={list} onOpen={onOpen} />}
      {view === 'tableau' && <VueTableau events={list} onOpen={onOpen} deptFilter={deptFilter} />}
    </div>
  );
}

/* ---- Vue Liste ---- */
function VueListe({ events, onOpen }) {
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(e => {
        const t = tauxEvt(e); const st = OBEY.STATUT_EVT[e.statut];
        const color = t.pct >= 100 ? T.ok : t.pct >= 60 ? T.warn : T.danger;
        return (
          <Card key={e.id} pad={0} hover onClick={() => onOpen(e)} style={{ overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: 6, background: color }} />
            <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ width: 54, textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.primary, letterSpacing: '0.05em' }}>{e.jour.toUpperCase()}</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, color: T.ink, lineHeight: 1 }}>{new Date(e.date).getDate()}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: T.muted, letterSpacing: '0.08em' }}>JUIN</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17 }}>{e.nom}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div style={{ fontSize: 13, color: T.sub, marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><Icon name="clock" size={14} color={T.muted} /> {e.debut}–{e.fin}</span>
                  <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><Icon name="pin" size={14} color={T.muted} /> {e.lieu}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
                  {e.besoins.map(b => <span key={b.dept} style={{ fontSize: 11.5, fontWeight: 600, color: OBEY.DEPT[b.dept].couleur, background: OBEY.DEPT[b.dept].couleur + '18', padding: '3px 9px', borderRadius: 999 }}>{OBEY.DEPT[b.dept].nom}</span>)}
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: '0 0 auto', minWidth: 92 }}>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color }}>{t.cv}/{t.req}</div>
                <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 6 }}>postes couverts</div>
                <div style={{ width: 92 }}><ProgressBar value={t.cv} max={t.req} color={color} height={6} /></div>
              </div>
              <Icon name="chevR" size={20} color={T.muted} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---- Vue Calendrier (juin 2026) ---- */
function VueCalendrier({ events, onOpen }) {
  const days = []; const first = new Date('2026-06-01'); const startDow = (first.getDay() + 6) % 7; // Mon=0
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= 30; d++) days.push(d);
  const byDay = {};
  events.forEach(e => { const d = new Date(e.date).getDate(); (byDay[d] = byDay[d] || []).push(e); });
  return (
    <Card pad={18}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {days.map((d, i) => {
          const evs = d ? (byDay[d] || []) : [];
          const isToday = d === 15;
          return (
            <div key={i} style={{ minHeight: 92, borderRadius: 12, border: `1px solid ${isToday ? T.primary : T.borderSoft}`, background: d ? (isToday ? T.primaryTint : T.surface) : 'transparent', padding: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d && <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 600, color: isToday ? T.primary : T.sub }}>{d}</div>}
              {evs.map(e => {
                const t = tauxEvt(e); const color = t.pct >= 100 ? T.ok : t.pct >= 60 ? T.warn : T.danger;
                return (
                  <div key={e.id} onClick={() => onOpen(e)} className="ob-press" style={{ cursor: 'pointer', background: color + '18', borderLeft: `3px solid ${color}`, borderRadius: 6, padding: '4px 6px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nom}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{e.debut} · {t.cv}/{t.req}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---- Vue Tableau (événements × départements) ---- */
function VueTableau({ events, onOpen, deptFilter }) {
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const depts = deptFilter ? [deptFilter] : OBEY.DEPARTMENTS.filter(d => !d.confidentiel && sorted.some(e => e.besoins.some(b => b.dept === d.code))).map(d => d.code);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }} className="ob-scroll">
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, fontWeight: 700, color: T.sub, position: 'sticky', left: 0, background: T.surfaceAlt }}>Événement</th>
              {depts.map(d => <th key={d} style={{ padding: '14px 12px', fontSize: 12, fontWeight: 700, color: OBEY.DEPT[d].couleur, minWidth: 88 }}>{OBEY.DEPT[d].nom}</th>)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((e, ri) => {
              const cov = Object.fromEntries(couvertureEvt(e).map(c => [c.dept, c]));
              return (
                <tr key={e.id} onClick={() => onOpen(e)} className="ob-hov" style={{ cursor: 'pointer', borderTop: `1px solid ${T.borderSoft}` }}>
                  <td style={{ padding: '12px 16px', position: 'sticky', left: 0, background: T.surface }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.nom}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{e.jour} {new Date(e.date).getDate()}/06 · {e.debut}</div>
                  </td>
                  {depts.map(d => {
                    const c = cov[d];
                    if (!c) return <td key={d} style={{ textAlign: 'center', color: T.border }}>—</td>;
                    const full = c.couverts >= c.requis; const color = full ? T.ok : c.couverts === 0 ? T.danger : T.warn;
                    return (
                      <td key={d} style={{ textAlign: 'center', padding: '12px 10px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color }}>
                          <Dot c={color} s={7} />{c.couverts}/{c.requis}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ============================================================
   MOTEUR DE GÉNÉRATION — flux animé + résultats + validation
   ============================================================ */
function GenerationView({ event, onBack, onStatus }) {
  const [phase, setPhase] = useP('intro'); // intro | running | results
  const [step, setStep] = useP(0);
  const [statut, setStatut] = useP(event.statut);
  const result = usePM(() => OBEY.genererPlanning(event), [event]);
  const steps = ['Récupération des besoins de l\'événement', 'Chargement des STARs disponibles', 'Exclusion des indisponibles', 'Calcul des scores d\'affectation', 'Détection des conflits', 'Génération des propositions'];

  usePE(() => {
    if (phase !== 'running') return;
    if (step < steps.length) { const t = setTimeout(() => setStep(step + 1), 520); return () => clearTimeout(t); }
    const t = setTimeout(() => setPhase('results'), 500); return () => clearTimeout(t);
  }, [phase, step]);

  const totalRequis = result.reduce((s, r) => s + r.requis, 0);
  const totalCouv = result.reduce((s, r) => s + Math.min(r.requis, r.couverts), 0);
  const totalManque = result.reduce((s, r) => s + r.manque, 0);
  const totalConflits = result.reduce((s, r) => s + r.conflits.length, 0);

  return (
    <div className="ob-fade">
      <button onClick={onBack} className="ob-press" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: T.sub, fontSize: 13.5, fontWeight: 600, marginBottom: 16, padding: 0 }}><Icon name="chevL" size={18} /> Retour à l'événement</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Génération de planning</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 26 }}>{event.nom}</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 2 }}>{event.dateLabel} · {event.debut}–{event.fin} · {event.lieu}</div>
        </div>
        {phase === 'results' && <Badge tone={OBEY.STATUT_EVT[statut].tone}>{OBEY.STATUT_EVT[statut].label}</Badge>}
      </div>

      {phase === 'intro' && (
        <Card pad={28} style={{ textAlign: 'center', maxWidth: 560, margin: '20px auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: T.shadow }}>
            <Icon name="bolt" size={36} color="#fff" />
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 21 }}>Génération automatique</div>
          <div style={{ fontSize: 14, color: T.sub, marginTop: 8, lineHeight: 1.5, maxWidth: 420, margin: '8px auto 0' }}>
            Le moteur va analyser {OBEY.STARS.length} STARs, appliquer les règles de score et proposer une affectation pour <b>{event.besoins.length} départements</b> ({totalRequis} postes).
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {event.besoins.map(b => <Badge key={b.dept} tone="muted">{OBEY.DEPT[b.dept].nom} · {b.requis}</Badge>)}
          </div>
          <div style={{ marginTop: 22 }}><Btn size="lg" icon="bolt" onClick={() => { setPhase('running'); setStep(0); }}>Lancer la génération</Btn></div>
        </Card>
      )}

      {phase === 'running' && (
        <Card pad={28} style={{ maxWidth: 520, margin: '20px auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((s, i) => {
              const done = i < step; const active = i === step;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, opacity: i <= step ? 1 : 0.4, transition: 'opacity .3s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? T.ok : active ? T.primarySoft : T.surfaceAlt }}>
                    {done ? <Icon name="check" size={16} color="#fff" stroke={3} /> : active ? <span className="ob-spin" style={{ width: 14, height: 14, border: `2px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'obspin .7s linear infinite' }} /> : <Dot c={T.muted} s={7} />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? T.ink : done ? T.sub : T.muted }}>{s}</span>
                </div>
              );
            })}
          </div>
          <style>{'@keyframes obspin{to{transform:rotate(360deg)}}'}</style>
        </Card>
      )}

      {phase === 'results' && (
        <div className="ob-rise">
          {/* summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 18 }}>
            <SummaryStat label="Postes couverts" value={`${totalCouv}/${totalRequis}`} color={totalManque ? T.warn : T.ok} icon="users" />
            <SummaryStat label="Postes non couverts" value={totalManque} color={totalManque ? T.danger : T.ok} icon="alert" />
            <SummaryStat label="Conflits détectés" value={totalConflits} color={totalConflits ? T.warn : T.ok} icon="swap" />
            <SummaryStat label="Départements" value={result.length} color={T.primary} icon="layers" />
          </div>
          {result.map(r => <DeptResult key={r.deptCode} r={r} event={event} />)}

          {/* validation bar */}
          <div style={{ position: 'sticky', bottom: 0, marginTop: 8, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${T.border}`, padding: '16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13.5, color: T.sub }}>
              {statut === 'PUBLIE' ? <span style={{ color: T.ok, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={16} color={T.ok} /> Planning publié — les STARs ont été notifiés</span>
                : totalManque > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="alert" size={15} color={T.warn} /> {totalManque} poste(s) non couvert(s) — tu peux valider quand même</span>
                : 'Tous les postes sont couverts ✦'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {statut !== 'PUBLIE' && <Btn variant="outline" onClick={() => { setPhase('running'); setStep(0); }} icon="bolt">Régénérer</Btn>}
              {statut === 'A_VALIDER' && <Btn icon="check" onClick={() => { setStatut('PUBLIE'); onStatus && onStatus(event.id, 'PUBLIE'); }}>Publier le planning</Btn>}
              {(statut === 'BROUILLON' || statut === 'EN_GENERATION') && <Btn icon="check" onClick={() => { setStatut('A_VALIDER'); onStatus && onStatus(event.id, 'A_VALIDER'); }}>Valider le planning</Btn>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, color, icon }) {
  return (
    <Card pad={15}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name={icon} size={16} color={color} /><span style={{ fontSize: 12, color: T.sub }}>{label}</span>
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 24, color }}>{value}</div>
    </Card>
  );
}

function DeptResult({ r, event }) {
  const [open, setOpen] = useP(false);
  const d = OBEY.DEPT[r.deptCode];
  const full = r.manque === 0;
  return (
    <Card pad={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '15px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.borderSoft}`, background: d.couleur + '0c' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Dot c={d.couleur} s={11} />
          <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16.5 }}>{d.nom}</span>
          {r.indispos > 0 && <Badge tone="muted">{r.indispos} indispo</Badge>}
        </div>
        <Badge tone={full ? 'ok' : r.couverts === 0 ? 'danger' : 'warn'}>{r.couverts}/{r.requis} couverts</Badge>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {r.selectionnes.map((c, i) => <CandidateRow key={c.star.id} c={c} rank={i + 1} />)}
        {Array.from({ length: r.manque }).map((_, i) => (
          <div key={'m' + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: T.radius, border: `1.5px dashed ${T.danger}`, background: T.dangerSoft }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: `1.5px dashed ${T.danger}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} color={T.danger} /></div>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: T.danger }}>Poste non couvert — aucun STAR disponible</span>
          </div>
        ))}
      </div>
      {r.reserves.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <button onClick={() => setOpen(o => !o)} className="ob-press" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: '11px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.sub, fontSize: 13, fontWeight: 600 }}>
            <span>Réserve · {r.reserves.length} STAR(s) en attente</span>
            <Icon name={open ? 'chevD' : 'chevR'} size={16} />
          </button>
          {open && <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>{r.reserves.map(c => <CandidateRow key={c.star.id} c={c} reserve />)}</div>}
        </div>
      )}
    </Card>
  );
}

function CandidateRow({ c, rank, reserve }) {
  const [detail, setDetail] = useP(false);
  const s = c.star;
  const conf = c.conflit;
  return (
    <div style={{ borderRadius: T.radius, border: `1px solid ${conf ? (conf.level === 'INCOMPATIBLE' ? T.danger : T.warn) + '55' : T.borderSoft}`, background: reserve ? T.bgWarm : T.surface, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px' }}>
        <Avatar name={s.nomComplet} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{s.nomComplet}</span>
            <Badge tone={OBEY.STATUTS[s.statut].tone}>{s.statut}</Badge>
            {conf && <Badge tone={conf.level === 'INCOMPATIBLE' ? 'danger' : 'warn'} icon="alert">{conf.level === 'INCOMPATIBLE' ? 'Incompatible' : 'Avertissement'}</Badge>}
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>{conf ? conf.message : `Charge ${c.charge.label.toLowerCase()} · ${s.charge} services`}</div>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 18, color: c.score >= 70 ? T.ok : c.score >= 45 ? T.warn : T.danger }}>{c.score}</div>
          <button onClick={() => setDetail(d => !d)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11.5, color: T.primary, fontWeight: 600, padding: 0 }}>{detail ? 'Masquer' : 'Score'}</button>
        </div>
      </div>
      {detail && (
        <div className="ob-fade" style={{ padding: '4px 13px 13px 63px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {c.breakdown.map((b, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: T.sub }}>{b.label}</span>
              <span style={{ fontWeight: 700, color: b.pts >= 0 ? T.ok : T.danger }}>{b.pts >= 0 ? '+' : ''}{b.pts}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 6, marginTop: 2 }}>
            <span style={{ fontWeight: 700 }}>Score total</span><span style={{ fontWeight: 800, color: T.primary }}>{c.score}</span>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PlanningViews, GenerationView, couvertureEvt, tauxEvt });
