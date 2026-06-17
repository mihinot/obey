// OBEY — Espace Administrateur
const { useState: useAd } = React;
const ADMIN_ACCENT = '#b8556a';

function AdminApp({ onLogout, onSwitchRole }) {
  const [screen, setScreen] = useAd(() => localStorage.getItem('obey.admin.screen') || 'utilisateurs');
  const [toast, setToast] = useAd(null);
  React.useEffect(() => localStorage.setItem('obey.admin.screen', screen), [screen]);
  React.useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); } }, [toast]);
  const p = OBEY.PERSONAS.admin;
  const nav = [
    { id: 'utilisateurs', icon: 'users', label: 'Utilisateurs', badge: OBEY.COMPTES.length },
    { id: 'departements', icon: 'layers', label: 'Départements' },
    { id: 'roles', icon: 'shield', label: 'Rôles' },
    { id: 'modeles', icon: 'doc', label: "Modèles d'événements" },
    { id: 'parametres', icon: 'settings', label: 'Paramètres' },
    { id: 'exports', icon: 'dl', label: 'Exports' },
    { id: 'notifications', icon: 'bell', label: 'Notifications' },
    { id: 'journaux', icon: 'list', label: "Journaux d'actions" },
  ];
  return (
    <React.Fragment>
      <DeskShell scope={{ sub: 'ADMINISTRATION', label: 'OBEY · Système' }} accent={ADMIN_ACCENT} nav={nav} active={screen} onNav={setScreen}
        user={{ nom: p.nom, role: p.role }} onLogout={onLogout} onSwitchRole={onSwitchRole} notifCount={3} onBell={() => setScreen('notifications')}>
        {screen === 'utilisateurs' && <AdminUtilisateurs toast={setToast} />}
        {screen === 'departements' && <AdminDepartements toast={setToast} />}
        {screen === 'roles' && <AdminRoles toast={setToast} />}
        {screen === 'modeles' && <AdminModeles toast={setToast} />}
        {screen === 'parametres' && <AdminParametres toast={setToast} />}
        {screen === 'exports' && <ExportsScreen toast={setToast} confidentialNote />}
        {screen === 'notifications' && <NotifCenter />}
        {screen === 'journaux' && <AdminJournaux />}
      </DeskShell>
      {toast && <div className="ob-rise" style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: T.ink, color: '#fff', padding: '13px 22px', borderRadius: T.pill, fontSize: 14, fontWeight: 600, boxShadow: T.shadowLg, zIndex: 300 }}>{toast}</div>}
    </React.Fragment>
  );
}

/* ---- Utilisateurs + validation comptes ---- */
function AdminUtilisateurs({ toast }) {
  const [tab, setTab] = useAd('actifs');
  const [comptes, setComptes] = useAd(OBEY.COMPTES);
  const [q, setQ] = useAd('');
  const traiter = (id, action) => { setComptes(c => c.filter(x => x.id !== id)); toast(action === 'ok' ? 'Compte validé — email envoyé' : 'Compte refusé'); };
  const users = OBEY.STARS.filter(s => s.nomComplet.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="ob-fade">
      <PageHead title="Utilisateurs" sub={`${OBEY.STARS.length} comptes actifs · ${comptes.length} en attente de validation`} right={<Btn icon="plus">Créer un utilisateur</Btn>} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'actifs', label: 'Comptes actifs' }, { id: 'attente', label: `En attente · ${comptes.length}` }]} />
        {tab === 'actifs' && <div style={{ width: 260 }}><Field value={q} onChange={setQ} placeholder="Rechercher…" right={<Icon name="search" size={16} color={T.muted} />} /></div>}
      </div>

      {tab === 'attente' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
          {comptes.length === 0 && <Card pad={28} style={{ textAlign: 'center', color: T.sub }}>Aucun compte en attente — tout est à jour ✦</Card>}
          {comptes.map(c => (
            <Card key={c.id} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Avatar name={c.nom} size={44} tone={T.warn} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{c.nom}</div>
                <div style={{ fontSize: 12.5, color: T.sub }}>{c.email} · {c.tel}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}><Badge tone="muted">Souhaite : {c.dept}</Badge><span style={{ fontSize: 11.5, color: T.muted }}>{c.date}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn size="sm" variant="dangerSoft" onClick={() => traiter(c.id, 'no')}>Refuser</Btn>
                <Btn size="sm" icon="check" onClick={() => traiter(c.id, 'ok')}>Valider</Btn>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }} className="ob-scroll">
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
              <thead><tr style={{ background: T.surfaceAlt }}>
                {['Nom', 'Départements', 'Statut STAR', 'Compte', 'Charge'].map(h => <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 12, fontWeight: 700, color: T.sub }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {users.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.nomComplet} size={32} /><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.nomComplet}</div><div style={{ fontSize: 11.5, color: T.sub }}>{s.email}</div></div></div></td>
                    <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{s.depts.map(d => <span key={d} style={{ fontSize: 11, fontWeight: 600, color: OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub, background: (OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub) + '15', padding: '2px 8px', borderRadius: 999 }}>{OBEY.DEPT[d] ? OBEY.DEPT[d].nom : d}</span>)}</div></td>
                    <td style={{ padding: '11px 16px' }}><Badge tone={OBEY.STATUTS[s.statut].tone}>{s.statut}</Badge></td>
                    <td style={{ padding: '11px 16px' }}><Badge tone="ok">Validé</Badge></td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: OBEY.niveauCharge(s.charge).tone === 'danger' ? T.danger : T.ink }}>{s.charge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---- Départements ---- */
function AdminDepartements({ toast }) {
  const [list, setList] = useAd(OBEY.DEPARTMENTS_ALL);
  const toggle = (code) => setList(l => l.map(d => d.code === code ? { ...d, actif: !d.actif } : d));
  return (
    <div className="ob-fade">
      <PageHead title="Départements" sub={`${list.length} départements · ${list.filter(d => d.actif).length} actifs`} right={<Btn icon="plus">Nouveau département</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {list.map(d => (
          <Card key={d.code} pad={16} style={{ opacity: d.actif ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: d.couleur + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={d.confidentiel ? 'shield' : 'layers'} size={19} color={d.couleur} /></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.2 }}>{d.nom}</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{d.code} · {d.membres} membres</div>
                </div>
              </div>
              <Toggle on={d.actif} onChange={() => toggle(d.code)} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 13, flexWrap: 'wrap' }}>
              {d.confidentiel && <ConfidentialBadge />}
              {d.pilotage && <Badge tone="primary">Pilotage</Badge>}
              {!d.confidentiel && !d.pilotage && <Badge tone="muted">Standard</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---- Rôles globaux ---- */
function AdminRoles() {
  const attribs = [
    { p: OBEY.PERSONAS.admin, roles: ['ADMINISTRATEUR'] },
    { p: OBEY.PERSONAS.coordination, roles: ['COORDINATION_GENERALE'] },
    { p: OBEY.PERSONAS.pastoral, roles: ['CORPS_PASTORAL'] },
    { p: OBEY.PERSONAS.vie, roles: ['VIE_DES_STARS'] },
    { p: { nom: 'Esther Mbala', role: 'Référente Accueil' }, roles: [] },
  ];
  return (
    <div className="ob-fade">
      <PageHead title="Rôles globaux" sub="Attribution des rôles transverses (un utilisateur peut en cumuler plusieurs)" right={<Btn icon="plus">Attribuer un rôle</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
        {Object.entries(OBEY.ROLES_GLOBAUX).map(([k, r]) => (
          <Card key={k} pad={16}>
            <Badge tone={r.tone}>{r.label}</Badge>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, marginTop: 12 }}>{attribs.filter(a => a.roles.includes(k)).length}</div>
            <div style={{ fontSize: 12.5, color: T.sub }}>utilisateur(s)</div>
          </Card>
        ))}
      </div>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="ob-scroll">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 620 }}>
            <thead><tr style={{ background: T.surfaceAlt }}>
              <th style={{ textAlign: 'left', padding: '13px 16px', fontSize: 12, fontWeight: 700, color: T.sub }}>Utilisateur</th>
              {Object.values(OBEY.ROLES_GLOBAUX).map(r => <th key={r.label} style={{ padding: '13px 10px', fontSize: 11.5, fontWeight: 700, color: T.sub, textAlign: 'center' }}>{r.label}</th>)}
            </tr></thead>
            <tbody>
              {attribs.map((a, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={a.p.nom} size={32} /><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.p.nom}</div><div style={{ fontSize: 11.5, color: T.sub }}>{a.p.role}</div></div></div></td>
                  {Object.keys(OBEY.ROLES_GLOBAUX).map(k => (
                    <td key={k} style={{ textAlign: 'center', padding: '11px 10px' }}>
                      {a.roles.includes(k) ? <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: T.okSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} color={T.ok} stroke={3} /></span> : <span style={{ color: T.border, fontSize: 18 }}>·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---- Modèles d'événements ---- */
function AdminModeles({ toast }) {
  const [list, setList] = useAd(OBEY.MODELES);
  const toggle = id => setList(l => l.map(m => m.id === id ? { ...m, actif: !m.actif } : m));
  return (
    <div className="ob-fade">
      <PageHead title="Modèles d'événements" sub="Besoins standards préremplis lors de la création d'un événement" right={<Btn icon="plus">Nouveau modèle</Btn>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
        {list.map(m => (
          <Card key={m.id} pad={16} style={{ opacity: m.actif ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15.5 }}>{m.nom}</div>
              <Toggle on={m.actif} onChange={() => toggle(m.id)} />
            </div>
            {m.besoins.length ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.besoins.map(([d, n]) => <span key={d} style={{ fontSize: 11.5, fontWeight: 600, color: OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub, background: (OBEY.DEPT[d] ? OBEY.DEPT[d].couleur : T.sub) + '15', padding: '3px 9px', borderRadius: 999 }}>{OBEY.DEPT[d] ? OBEY.DEPT[d].nom : d} · {n}</span>)}
              </div>
            ) : <div style={{ fontSize: 12.5, color: T.muted, fontStyle: 'italic' }}>Aucun besoin standard — à définir à la création</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---- Paramètres ---- */
function AdminParametres({ toast }) {
  const [params, setParams] = useAd(OBEY.PARAMS);
  const groupes = [...new Set(params.map(p => p.groupe))];
  const setVal = (cle, val) => { setParams(ps => ps.map(p => p.cle === cle ? { ...p, val } : p)); toast('Paramètre enregistré'); };
  return (
    <div className="ob-fade">
      <PageHead title="Paramètres" sub="Réglages globaux de la plateforme" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 }}>
        {groupes.map(g => (
          <div key={g}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{g}</div>
            <Card pad={'4px 18px'}>
              {params.filter(p => p.groupe === g).map((p, i) => (
                <div key={p.cle} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 12.5, color: T.sub, marginTop: 1 }}>{p.desc}</div>
                  </div>
                  {p.type === 'toggle' && <Toggle on={p.val} onChange={v => setVal(p.cle, v)} />}
                  {p.type === 'number' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" value={p.val} onChange={e => setVal(p.cle, e.target.value)} style={{ width: 64, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', fontFamily: T.body, fontSize: 14, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 12.5, color: T.sub, width: 56 }}>{p.unite}</span>
                    </div>
                  )}
                  {p.type === 'range' && <Badge tone="primary">{p.val} services</Badge>}
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Journaux d'actions ---- */
function AdminJournaux() {
  return (
    <div className="ob-fade">
      <PageHead title="Journaux d'actions" sub="Traçabilité complète des opérations (audit)" right={<Btn variant="outline" icon="dl">Exporter</Btn>} />
      <Card pad={0} style={{ overflow: 'hidden', maxWidth: 880 }}>
        {OBEY.JOURNAUX.map((j, i) => {
          const tone = { ok: T.ok, primary: T.primary, warn: T.warn, danger: T.danger, muted: T.muted }[j.tone];
          return (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: tone, flex: '0 0 auto' }} />
              <Avatar name={j.user} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{j.user}</b> <span style={{ color: T.sub }}>— {j.action.toLowerCase()}</span></div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>{j.entite}</div>
              </div>
              <Badge tone={j.tone}>{j.action}</Badge>
              <span style={{ fontSize: 11.5, color: T.muted, width: 110, textAlign: 'right' }}>{j.date}</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

Object.assign(window, { AdminApp });
