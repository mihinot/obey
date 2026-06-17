// OBEY — Écrans transverses : Notifications, Exports, Formulaire d'événement, Statistiques
const { useState: useTx } = React;

/* ---- Centre de notifications ---- */
const NOTIFS_FULL = [
  { id: 'n1', titre: 'Nouvelle affectation', msg: 'Tu es affecté(e) au Culte du 22/06 — Accueil', date: 'Il y a 2 h', lu: false, canal: 'INTERNE', tone: 'primary' },
  { id: 'n2', titre: 'Désistement à traiter', msg: 'David Kimba s\'est désisté du Culte du 22/06', date: 'Il y a 3 h', lu: false, canal: 'INTERNE', tone: 'danger' },
  { id: 'n3', titre: 'Rappel d\'événement', msg: 'Réunion de prière demain à 19:00 — Salle B', date: 'Il y a 5 h', lu: false, canal: 'EMAIL', tone: 'warn' },
  { id: 'n4', titre: 'Planning publié', msg: 'Le planning du Jeûne & prière du 20/06 est publié', date: 'Hier', lu: true, canal: 'INTERNE', tone: 'ok' },
  { id: 'n5', titre: 'Remplaçant validé', msg: 'Ruth Ngumbi remplace Esther sur le Culte du 22/06', date: 'Hier', lu: true, canal: 'EMAIL', tone: 'ok' },
  { id: 'n6', titre: 'Compte validé', msg: 'Bienvenue ! Ton compte STAR est désormais actif', date: 'Il y a 2 j', lu: true, canal: 'EMAIL', tone: 'primary' },
];
const CANAL = { INTERNE: ['Interne', 'home'], EMAIL: ['Email', 'doc'], WHATSAPP: ['WhatsApp', 'bell'] };

function NotifCenter() {
  const [list, setList] = useTx(NOTIFS_FULL);
  const [filtre, setFiltre] = useTx('toutes');
  const tone = t => ({ ok: T.ok, primary: T.primary, warn: T.warn, danger: T.danger })[t];
  const shown = list.filter(n => filtre === 'toutes' || (filtre === 'non-lues' && !n.lu));
  const tout = () => setList(l => l.map(n => ({ ...n, lu: true })));
  return (
    <div className="ob-fade">
      <PageHead title="Notifications" sub={`${list.filter(n => !n.lu).length} non lue(s)`} right={<Btn variant="outline" icon="check" onClick={tout}>Tout marquer comme lu</Btn>} />
      <div style={{ marginBottom: 16 }}><Tabs value={filtre} onChange={setFiltre} items={[{ id: 'toutes', label: 'Toutes' }, { id: 'non-lues', label: 'Non lues' }]} /></div>
      <Card pad={6} style={{ maxWidth: 740 }}>
        {shown.map((n, i) => (
          <div key={n.id} onClick={() => setList(l => l.map(x => x.id === n.id ? { ...x, lu: true } : x))} className="ob-hov"
            style={{ display: 'flex', gap: 13, padding: '14px 14px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none', cursor: 'pointer', borderRadius: 12, background: n.lu ? 'transparent' : T.primaryTint }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: tone(n.tone) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Icon name={CANAL[n.canal][1]} size={18} color={tone(n.tone)} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{n.titre}</span>
                <Badge tone="muted">{CANAL[n.canal][0]}</Badge>
              </div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{n.msg}</div>
              <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{n.date}</div>
            </div>
            {!n.lu && <Dot c={T.primary} s={9} />}
          </div>
        ))}
        {shown.length === 0 && <div style={{ textAlign: 'center', color: T.sub, padding: 28 }}>Aucune notification</div>}
      </Card>
    </div>
  );
}

/* ---- Exports PDF / Excel ---- */
function ExportsScreen({ toast, confidentialNote }) {
  const [type, setType] = useTx('evenement');
  const [format, setFormat] = useTx('pdf');
  const types = [
    { id: 'global', label: 'Planning global', icon: 'calendar' },
    { id: 'evenement', label: 'Planning par événement', icon: 'doc' },
    { id: 'departement', label: 'Planning par département', icon: 'layers' },
    { id: 'stats', label: 'Statistiques de charge', icon: 'spark' },
  ];
  return (
    <div className="ob-fade">
      <PageHead title="Exports" sub="Générer des documents PDF ou Excel à partir des plannings" />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad={16}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 10 }}>TYPE D'EXPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map(t => (
                <button key={t.id} className="ob-press" onClick={() => setType(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, border: `1px solid ${type === t.id ? T.primary : T.border}`, background: type === t.id ? T.primarySoft : T.surface, color: type === t.id ? T.primaryDeep : T.ink, cursor: 'pointer', padding: '11px 13px', borderRadius: T.radius, fontSize: 13.5, fontWeight: 600, textAlign: 'left' }}>
                  <Icon name={t.icon} size={18} color={type === t.id ? T.primary : T.sub} />{t.label}
                </button>
              ))}
            </div>
          </Card>
          <Card pad={16}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 10 }}>FORMAT</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['pdf', 'PDF'], ['excel', 'Excel']].map(([id, l]) => (
                <button key={id} className="ob-press" onClick={() => setFormat(id)} style={{ flex: 1, border: `1px solid ${format === id ? T.primary : T.border}`, background: format === id ? T.primarySoft : T.surface, color: format === id ? T.primaryDeep : T.sub, cursor: 'pointer', padding: '11px', borderRadius: T.radius, fontSize: 13.5, fontWeight: 700 }}>{l}</button>
              ))}
            </div>
          </Card>
          {confidentialNote && <div style={{ display: 'flex', gap: 10, background: '#8a6fb012', borderRadius: T.radius, padding: 13, fontSize: 12.5, color: '#6f5a90', lineHeight: 1.45 }}><Icon name="shield" size={17} color="#8a6fb0" style={{ marginTop: 1, flex: '0 0 auto' }} /><span>Le département <b>Intercession</b> et les données pastorales sont automatiquement exclus des exports standards.</span></div>}
          <Btn full size="lg" icon="dl" onClick={() => toast(`Export ${format.toUpperCase()} généré`)}>Télécharger le {format.toUpperCase()}</Btn>
        </div>
        {/* Preview */}
        <Card pad={0} style={{ overflow: 'hidden', background: T.surfaceAlt }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 12.5, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="search" size={15} color={T.muted} /> Aperçu</div>
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            {format === 'pdf' ? <PdfPreview type={type} /> : <ExcelPreview type={type} />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PdfPreview({ type }) {
  const rows = OBEY.genererDept(OBEY.EVENTS[0], 'ACC').selectionnes.slice(0, 5);
  return (
    <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 6, boxShadow: T.shadow, padding: '34px 36px', fontFamily: T.body, minHeight: 460 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${T.primary}`, paddingBottom: 14 }}>
        <div><Wordmark size={24} /><div style={{ fontSize: 10, color: T.muted, fontStyle: 'italic', marginTop: 2 }}>Disponibles pour Servir avec Amour</div></div>
        <div style={{ textAlign: 'right', fontSize: 10.5, color: T.sub }}>Édité le 15/06/2026<br />Page 1 / 1</div>
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, marginTop: 18 }}>Planning · Culte dominical</div>
      <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Dimanche 22 juin 2026 · 09:00 – 12:30 · Auditorium principal</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, marginTop: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Département Accueil</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 12 }}>
        <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}><th style={{ textAlign: 'left', padding: '6px 0', color: T.sub, fontWeight: 600 }}>STAR</th><th style={{ textAlign: 'left', color: T.sub, fontWeight: 600 }}>Rôle</th><th style={{ textAlign: 'right', color: T.sub, fontWeight: 600 }}>Statut</th></tr></thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <td style={{ padding: '7px 0', fontWeight: 600 }}>{c.star.nomComplet}</td>
              <td style={{ color: T.sub }}>STAR</td>
              <td style={{ textAlign: 'right', color: T.ok, fontWeight: 600 }}>Confirmé</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 28, fontSize: 9.5, color: T.muted, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 8 }}>Document généré par OBEY — confidentiel · usage interne</div>
    </div>
  );
}

function ExcelPreview({ type }) {
  const cols = ['STAR', 'Département', 'Rôle', 'Statut', 'Charge'];
  const rows = OBEY.STARS.filter(s => s.depts.includes('ACC')).slice(0, 8);
  return (
    <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 6, boxShadow: T.shadow, overflow: 'hidden', fontFamily: T.body, fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e7145', color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 600 }}><Icon name="grid" size={14} color="#fff" /> planning_accueil.xlsx</div>
      <div style={{ display: 'grid', gridTemplateColumns: `28px repeat(${cols.length}, 1fr)` }}>
        <div style={{ background: '#f3f3f3', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }} />
        {cols.map((c, i) => <div key={i} style={{ background: '#f3f3f3', padding: '7px 10px', fontWeight: 700, borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', color: '#444' }}>{c}</div>)}
        {rows.map((s, ri) => (
          <React.Fragment key={ri}>
            <div style={{ background: '#f8f8f8', padding: '7px 6px', fontSize: 10.5, color: '#999', textAlign: 'center', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #eee' }}>{ri + 1}</div>
            <div style={{ padding: '7px 10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', fontWeight: 600 }}>{s.nomComplet}</div>
            <div style={{ padding: '7px 10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', color: '#555' }}>Accueil</div>
            <div style={{ padding: '7px 10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', color: '#555' }}>STAR</div>
            <div style={{ padding: '7px 10px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', color: '#555' }}>{s.statut}</div>
            <div style={{ padding: '7px 10px', borderBottom: '1px solid #eee', color: '#555' }}>{s.charge}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---- Formulaire d'événement ---- */
function EventForm({ onCancel, onSave }) {
  const [modele, setModele] = useTx('m1');
  const m = OBEY.MODELES.find(x => x.id === modele);
  const [form, setForm] = useTx({ nom: 'Culte dominical', date: '2026-07-06', debut: '09:00', fin: '12:30', lieu: 'Auditorium principal' });
  const [besoins, setBesoins] = useTx(m.besoins.map(([d, n]) => ({ dept: d, n })));
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const pickModele = id => { const mm = OBEY.MODELES.find(x => x.id === id); setModele(id); setForm(f => ({ ...f, nom: mm.nom })); setBesoins(mm.besoins.map(([d, n]) => ({ dept: d, n }))); };
  const total = besoins.reduce((s, b) => s + Number(b.n || 0), 0);
  return (
    <div className="ob-fade">
      <button onClick={onCancel} className="ob-press" style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: T.sub, fontSize: 13.5, fontWeight: 600, marginBottom: 16, padding: 0 }}><Icon name="chevL" size={18} /> Retour</button>
      <PageHead title="Nouvel événement" sub="Crée un événement depuis un modèle ou personnalisé" />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, alignItems: 'start', maxWidth: 920 }}>
        <Card pad={20} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>MODÈLE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OBEY.MODELES.filter(x => x.actif).slice(0, 6).map(mm => (
              <button key={mm.id} className="ob-press" onClick={() => pickModele(mm.id)} style={{ border: `1px solid ${modele === mm.id ? T.primary : T.border}`, background: modele === mm.id ? T.primarySoft : T.surface, color: modele === mm.id ? T.primaryDeep : T.sub, cursor: 'pointer', padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>{mm.nom}</button>
            ))}
          </div>
          <Field label="Nom de l'événement" value={form.nom} onChange={set('nom')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Date" type="date" value={form.date} onChange={set('date')} />
            <Field label="Lieu" value={form.lieu} onChange={set('lieu')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Heure de début" type="time" value={form.debut} onChange={set('debut')} />
            <Field label="Heure de fin" type="time" value={form.fin} onChange={set('fin')} />
          </div>
        </Card>
        <Card pad={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>BESOINS PAR DÉPARTEMENT</div>
            <Badge tone="primary">{total} postes</Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {besoins.map((b, i) => (
              <div key={b.dept} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgWarm, borderRadius: T.radius, padding: '10px 12px' }}>
                <Dot c={OBEY.DEPT[b.dept] ? OBEY.DEPT[b.dept].couleur : T.sub} s={9} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{OBEY.DEPT[b.dept] ? OBEY.DEPT[b.dept].nom : b.dept}</span>
                <input type="number" value={b.n} onChange={e => setBesoins(bs => bs.map((x, j) => j === i ? { ...x, n: e.target.value } : x))} style={{ width: 56, border: `1px solid ${T.border}`, borderRadius: 9, padding: '7px 9px', fontFamily: T.body, fontSize: 14, textAlign: 'center', outline: 'none' }} />
                <button onClick={() => setBesoins(bs => bs.filter((_, j) => j !== i))} className="ob-press" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}><Icon name="x" size={16} color={T.muted} /></button>
              </div>
            ))}
            <button className="ob-press" style={{ border: `1.5px dashed ${T.border}`, background: 'transparent', color: T.sub, cursor: 'pointer', padding: '10px', borderRadius: T.radius, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="plus" size={16} /> Ajouter un département</button>
          </div>
        </Card>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, maxWidth: 920 }}>
        <Btn variant="ghost" onClick={onCancel}>Annuler</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="outline" onClick={onSave}>Enregistrer en brouillon</Btn>
        <Btn icon="bolt" onClick={onSave}>Enregistrer et générer</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { NotifCenter, ExportsScreen, EventForm });
