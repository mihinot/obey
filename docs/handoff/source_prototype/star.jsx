// OBEY — Espace STAR (mobile-first) : Accueil, Mon planning, Indispos, Confirmations, Profil
const { useState: useS, useEffect: useE } = React;
const TODAY = new Date('2026-06-15');
function daysUntil(d) { return Math.round((new Date(d) - TODAY) / 86400000); }
function frDate(d) { return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }

// Affectations de Grâce (persona STAR)
const MES_AFFECTATIONS_INIT = [
  { id: 'm0', evt: 'e4', dept: 'ACC', role: 'STAR', statut: 'Confirmée' },
  { id: 'm1', evt: 'e1', dept: 'ACC', role: 'STAR', statut: 'Proposée' },
  { id: 'm2', evt: 'e2', dept: 'ACC', role: 'STAR', statut: 'Proposée' },
  { id: 'm3', evt: 'e3', dept: 'PRO', role: 'STAR', statut: 'Validée' },
];

function StarApp({ onLogout }) {
  const [tab, setTab] = useS(() => localStorage.getItem('obey.star.tab') || 'accueil');
  const [affs, setAffs] = useS(MES_AFFECTATIONS_INIT);
  const [detail, setDetail] = useS(null);
  const [toast, setToast] = useS(null);
  useE(() => localStorage.setItem('obey.star.tab', tab), [tab]);
  useE(() => { if (toast) { const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); } }, [toast]);

  const me = OBEY.ME_STAR;
  const ev = id => OBEY.EVENTS.find(e => e.id === id);
  const confirmer = id => { setAffs(a => a.map(x => x.id === id ? { ...x, statut: 'Confirmée' } : x)); setToast('Présence confirmée 🙏'); setDetail(null); };
  const desister = id => {
    const a = affs.find(x => x.id === id); const dj = daysUntil(ev(a.evt).date);
    if (dj < 7) { setToast('Délai dépassé — contacte ton référent'); return; }
    setAffs(x => x.map(y => y.id === id ? { ...y, statut: 'Désistée' } : y)); setToast('Demande de désistement envoyée'); setDetail(null);
  };

  const tabs = [
    { id: 'accueil', icon: 'home', label: 'Accueil' },
    { id: 'planning', icon: 'calendar', label: 'Planning' },
    { id: 'indispos', icon: 'clock', label: 'Indispos' },
    { id: 'profil', icon: 'user', label: 'Profil' },
  ];

  return (
    <div style={{ minHeight: '100%', background: T.bg, display: 'flex', justifyContent: 'center', padding: '0' }}>
      <div style={{ width: '100%', maxWidth: 440, background: T.bgWarm, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 0 60px rgba(96,64,160,0.10)' }}>
        {/* status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 22px 4px', fontSize: 12, fontWeight: 700, color: T.ink }}>
          <span>9:41</span><span style={{ display: 'flex', gap: 5, alignItems: 'center', color: T.primary }}><Icon name="heart" size={13} color={T.primary} /> Servir</span>
        </div>

        <div className="ob-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
          {tab === 'accueil' && <StarAccueil me={me} affs={affs} ev={ev} setTab={setTab} openDetail={setDetail} />}
          {tab === 'planning' && <StarPlanning affs={affs} ev={ev} openDetail={setDetail} />}
          {tab === 'indispos' && <StarIndispos toast={setToast} />}
          {tab === 'profil' && <StarProfil me={me} onLogout={onLogout} />}
        </div>

        {/* tab bar */}
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 8px calc(10px + env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.borderSoft}` }}>
          {tabs.map(it => {
            const a = it.id === tab;
            return (
              <button key={it.id} className="ob-press" onClick={() => setTab(it.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 12px' }}>
                <Icon name={it.icon} size={22} color={a ? T.primary : T.muted} stroke={a ? 2.4 : 2} />
                <span style={{ fontSize: 10.5, fontWeight: a ? 700 : 500, color: a ? T.primary : T.muted }}>{it.label}</span>
              </button>
            );
          })}
        </div>

        {detail && <EventDetailSheet aff={detail} ev={ev(detail.evt)} onClose={() => setDetail(null)} onConfirm={confirmer} onDesist={desister} />}
        {toast && <div className="ob-rise" style={{ position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)', background: T.ink, color: '#fff', padding: '12px 20px', borderRadius: T.pill, fontSize: 13.5, fontWeight: 600, boxShadow: T.shadowLg, zIndex: 50, maxWidth: 360 }}>{toast}</div>}
      </div>
    </div>
  );
}

function ChargePill({ n }) {
  const niv = OBEY.niveauCharge(n);
  const color = niv.tone === 'danger' ? T.danger : niv.tone === 'warn' ? T.warn : T.ok;
  return <Badge tone={niv.tone === 'danger' ? 'danger' : niv.tone === 'warn' ? 'warn' : 'ok'} dot>{niv.key === 'faible' ? 'Disponible' : niv.label} · {n}</Badge>;
}

function StarAccueil({ me, affs, ev, setTab, openDetail }) {
  const aConfirmer = affs.filter(a => a.statut === 'Proposée' || a.statut === 'Validée').length;
  const next = affs.map(a => ({ a, e: ev(a.evt) })).filter(x => daysUntil(x.e.date) >= 0).sort((x, y) => new Date(x.e.date) - new Date(y.e.date))[0];
  return (
    <div className="ob-fade" style={{ padding: '8px 20px 0' }}>
      <div style={{ fontSize: 13, color: T.sub }}>Dimanche 15 juin</div>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 27, marginTop: 2 }}>Bonjour {me.prenom}</div>

      <Card pad={16} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 7 }}>Ta charge ce mois</div>
          <ProgressBar value={me.charge} max={6} color={T.ok} animate />
        </div>
        <ChargePill n={me.charge} />
      </Card>

      {next && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ton prochain service</div>
          <Card pad={0} hover onClick={() => openDetail(next.a)} style={{ overflow: 'hidden', boxShadow: T.shadow }}>
            <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDeep})`, padding: 18, color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>{frDate(next.e.date)} · {next.e.debut}</span>
                <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 999 }}>J-{daysUntil(next.e.date)}</span>
              </div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, marginTop: 8 }}>{next.e.nom}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} color="#fff" /> {next.e.lieu} · {OBEY.DEPT[next.a.dept].nom}</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatutAff statut={next.a.statut} />
              <span style={{ fontSize: 13, fontWeight: 600, color: T.primary, display: 'flex', alignItems: 'center', gap: 4 }}>Détails <Icon name="chevR" size={15} /></span>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
        <Card pad={16} hover onClick={() => setTab('planning')} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={20} color={T.primary} /></div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>{aConfirmer}</div>
          <div style={{ fontSize: 12.5, color: T.sub }}>service(s) à confirmer</div>
        </Card>
        <Card pad={16} hover onClick={() => setTab('indispos')} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="clock" size={20} color={T.accent} /></div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>{OBEY.INDISPOS_ME.length}</div>
          <div style={{ fontSize: 12.5, color: T.sub }}>indisponibilité(s)</div>
        </Card>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Notifications récentes</div>
        <Card pad={6}>
          {OBEY.NOTIFS.slice(0, 3).map((n, i) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '11px 12px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: n.lu ? T.surfaceAlt : T.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                <Icon name="bell" size={16} color={n.lu ? T.muted : T.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{n.titre}</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>{n.msg}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{n.date}</div>
              </div>
              {!n.lu && <Dot c={T.primary} s={8} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function StatutAff({ statut }) {
  const map = { 'Confirmée': 'ok', 'Validée': 'primary', 'Proposée': 'warn', 'Publiée': 'primary', 'Désistée': 'danger' };
  const lbl = { 'Confirmée': '✓ Confirmée', 'Validée': 'À confirmer', 'Proposée': 'À confirmer', 'Publiée': 'Publiée', 'Désistée': 'Désistée' };
  return <Badge tone={map[statut] || 'muted'}>{lbl[statut] || statut}</Badge>;
}

function StarPlanning({ affs, ev, openDetail }) {
  const sorted = [...affs].sort((a, b) => new Date(ev(a.evt).date) - new Date(ev(b.evt).date));
  return (
    <div className="ob-fade" style={{ padding: '8px 20px 0' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 25, marginBottom: 4 }}>Mon planning</div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Tes affectations à venir</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(a => {
          const e = ev(a.evt); const dj = daysUntil(e.date);
          return (
            <Card key={a.id} pad={14} hover onClick={() => openDetail(a)} style={{ display: 'flex', gap: 13, opacity: a.statut === 'Désistée' ? 0.55 : 1 }}>
              <div style={{ width: 50, flex: '0 0 auto', textAlign: 'center', borderRadius: 13, background: T.primarySoft, padding: '9px 0', alignSelf: 'flex-start' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: '0.05em' }}>{e.jour.toUpperCase()}</div>
                <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 21, color: T.primaryDeep, lineHeight: 1.05 }}>{new Date(e.date).getDate()}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.primary, letterSpacing: '0.08em' }}>JUIN</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{e.nom}</div>
                  {dj >= 0 && dj <= 9 && <span style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>J-{dj}</span>}
                </div>
                <div style={{ fontSize: 12.5, color: T.sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}><Dot c={OBEY.DEPT[a.dept].couleur} s={6} /> {OBEY.DEPT[a.dept].nom} · {e.debut}</div>
                <div style={{ marginTop: 9 }}><StatutAff statut={a.statut} /></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function EventDetailSheet({ aff, ev, onClose, onConfirm, onDesist }) {
  const dj = daysUntil(ev.date); const tardLimite = dj < 7;
  const peutConfirmer = aff.statut === 'Proposée' || aff.statut === 'Validée';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} className="ob-rise" style={{ width: '100%', maxWidth: 440, background: T.surface, borderRadius: '28px 28px 0 0', padding: '10px 22px calc(28px + env(safe-area-inset-bottom))', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: T.border, margin: '4px auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <StatutAff statut={aff.statut} />
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 23, marginTop: 8 }}>{ev.nom}</div>
          </div>
          <button onClick={onClose} className="ob-press" style={{ border: 'none', background: T.surfaceAlt, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} color={T.sub} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 16 }}>
          {[['calendar', ev.dateLabel], ['clock', ev.debut + ' – ' + ev.fin], ['pin', ev.lieu], ['users', OBEY.DEPT[aff.dept].nom + ' · ' + aff.role]].map(([ic, tx], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? `1px solid ${T.borderSoft}` : 'none' }}>
              <Icon name={ic} size={18} color={T.primary} /><span style={{ fontSize: 14, color: T.ink }}>{tx}</span>
            </div>
          ))}
        </div>
        {aff.statut === 'Désistée' ? (
          <div style={{ marginTop: 18, background: T.dangerSoft, color: T.danger, padding: 14, borderRadius: T.radius, fontSize: 13.5, fontWeight: 600, textAlign: 'center' }}>Tu t'es désisté(e) de ce service.</div>
        ) : (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {peutConfirmer && <Btn full size="lg" icon="check" onClick={() => onConfirm(aff.id)}>Confirmer ma présence</Btn>}
            {aff.statut === 'Confirmée' && <div style={{ background: T.okSoft, color: T.ok, padding: 14, borderRadius: T.radius, fontSize: 13.5, fontWeight: 600, textAlign: 'center' }}>✓ Présence confirmée — merci pour ton service !</div>}
            {!tardLimite ? (
              <Btn full variant="dangerSoft" icon="swap" onClick={() => onDesist(aff.id)}>Demander un désistement</Btn>
            ) : (
              <div style={{ background: T.warnSoft, color: T.warn, padding: '12px 14px', borderRadius: T.radius, fontSize: 12.5, lineHeight: 1.45, display: 'flex', gap: 10 }}>
                <Icon name="alert" size={18} color={T.warn} style={{ marginTop: 1 }} />
                <span>Délai de désistement dépassé (J-7). Merci de contacter ton <b>référent, adjoint ou coordonnateur</b>.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StarIndispos({ toast }) {
  const [list, setList] = useS(OBEY.INDISPOS_ME);
  const [adding, setAdding] = useS(false);
  const [form, setForm] = useS({ debut: '', fin: '', motif: '' });
  const add = () => {
    if (!form.debut) { toast('Indique au moins une date'); return; }
    setList(l => [...l, { id: 'i' + Date.now(), debut: form.debut, fin: form.fin || form.debut, motif: form.motif || 'Indisponible' }]);
    setForm({ debut: '', fin: '', motif: '' }); setAdding(false); toast('Indisponibilité enregistrée');
  };
  return (
    <div className="ob-fade" style={{ padding: '8px 20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 25 }}>Mes indispos</div>
        <Btn size="sm" icon="plus" onClick={() => setAdding(v => !v)}>Ajouter</Btn>
      </div>
      <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Le moteur de planning t'exclut automatiquement sur ces dates</div>
      {adding && (
        <Card pad={16} className="ob-scalein" style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Du" type="date" value={form.debut} onChange={v => setForm(f => ({ ...f, debut: v }))} />
            <Field label="Au" type="date" value={form.fin} onChange={v => setForm(f => ({ ...f, fin: v }))} />
          </div>
          <Field label="Motif (optionnel)" value={form.motif} onChange={v => setForm(f => ({ ...f, motif: v }))} placeholder="Voyage, examen…" />
          <div style={{ display: 'flex', gap: 10 }}><Btn variant="ghost" onClick={() => setAdding(false)}>Annuler</Btn><Btn full onClick={add}>Enregistrer</Btn></div>
        </Card>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(i => (
          <Card key={i.id} pad={15} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name="clock" size={19} color={T.accent} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{i.debut === i.fin ? frDate(i.debut) : frDate(i.debut) + ' → ' + frDate(i.fin)}</div>
              <div style={{ fontSize: 12.5, color: T.sub }}>{i.motif}</div>
            </div>
            <button onClick={() => setList(l => l.filter(x => x.id !== i.id))} className="ob-press" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6 }}><Icon name="x" size={17} color={T.muted} /></button>
          </Card>
        ))}
        {list.length === 0 && <div style={{ textAlign: 'center', color: T.muted, fontSize: 13.5, padding: '30px 0' }}>Aucune indisponibilité déclarée</div>}
      </div>
    </div>
  );
}

function StarProfil({ me, onLogout }) {
  const Row = ({ label, value, ok }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
      <span style={{ fontSize: 13.5, color: T.sub }}>{label}</span>
      {typeof ok === 'boolean'
        ? <Badge tone={ok ? 'ok' : 'muted'}>{ok ? 'Oui' : 'Non'}</Badge>
        : <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{value}</span>}
    </div>
  );
  return (
    <div className="ob-fade" style={{ padding: '8px 20px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 18px' }}>
        <Avatar name={me.nomComplet} size={84} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22 }}>{me.nomComplet}</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{me.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="ok" dot>{me.statut}</Badge>
          {me.depts.map(d => <Badge key={d} tone="primary">{OBEY.DEPT[d].nom}</Badge>)}
        </div>
      </div>
      <Card pad={'4px 16px'} style={{ marginBottom: 14 }}>
        <Row label="Téléphone" value={me.tel} />
        <Row label="Baptême" ok={me.baptise} />
        <Row label="Formation 001" ok={me.f001} />
        <Row label="Formation 101" ok={me.f101} />
        <Row label="Formation 201" ok={me.f201} />
        <Row label="Famille d'Impact" value={me.famille || '—'} />
      </Card>
      <Btn full variant="outline" icon="logout" onClick={onLogout} style={{ color: T.danger, borderColor: T.dangerSoft }}>Se déconnecter</Btn>
    </div>
  );
}

Object.assign(window, { StarApp });
