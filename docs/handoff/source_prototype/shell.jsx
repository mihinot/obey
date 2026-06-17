// OBEY — Coquille desktop réutilisable (DeskShell) + composants partagés (stats, charts, toggle)
const { useState: useK } = React;

function DeskShell({ scope, accent = T.primary, nav, active, onNav, user, onLogout, onSwitchRole, notifCount = 0, onBell, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      <aside style={{ width: 250, flex: '0 0 auto', background: T.surface, borderRight: `1px solid ${T.borderSoft}`, display: 'flex', flexDirection: 'column', padding: '22px 16px', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '0 8px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wordmark size={26} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: T.accentSoft, padding: '2px 8px', borderRadius: 999 }}>V1</span>
        </div>
        <div style={{ background: accent + '14', borderRadius: T.radius, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{scope.sub}</div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16, color: accent, lineHeight: 1.2, marginTop: 1 }}>{scope.label}</div>
        </div>
        <nav className="ob-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
          {nav.map(it => {
            const a = active === it.id;
            return (
              <button key={it.id} className="ob-press" onClick={() => onNav(it.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: a ? accent + '1c' : 'transparent', color: a ? accent : T.sub,
                fontWeight: a ? 600 : 500, fontSize: 13.5, padding: '10px 14px', borderRadius: T.radius, transition: 'background .15s, color .15s',
              }}>
                <Icon name={it.icon} size={18} stroke={a ? 2.4 : 2} />{it.label}
                {it.badge ? <span style={{ marginLeft: 'auto', background: T.danger, color: '#fff', fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{it.badge}</span> : null}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className="ob-press" onClick={onSwitchRole} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: T.sub, fontSize: 13, fontWeight: 500, padding: '9px 14px', borderRadius: T.radius }}><Icon name="layers" size={17} /> Changer de rôle</button>
          <button className="ob-press" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: T.sub, fontSize: 13, fontWeight: 500, padding: '9px 14px', borderRadius: T.radius }}><Icon name="logout" size={17} /> Déconnexion</button>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: `1px solid ${T.borderSoft}`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 20, gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={17} color={T.muted} style={{ position: 'absolute', left: 13, top: 11 }} />
            <input placeholder="Rechercher…" style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: T.pill, padding: '9px 14px 9px 38px', fontSize: 13.5, fontFamily: T.body, outline: 'none', background: T.bgWarm }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="ob-press" onClick={onBell} style={{ position: 'relative', border: 'none', background: T.surfaceAlt, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={19} color={T.sub} />
              {notifCount > 0 && <span style={{ position: 'absolute', top: 6, right: 7, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: T.danger, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid ' + T.surface }}>{notifCount}</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={user.nom} size={38} tone={accent} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{user.nom}</div>
                <div style={{ fontSize: 11.5, color: T.sub }}>{user.role}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="ob-scroll" style={{ flex: 1, padding: '26px 28px 40px', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}

/* ---- Shared tiles & charts ---- */
function StatTile({ icon, label, value, sub, color = T.primary, trend }) {
  return (
    <Card pad={17}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} color={color} /></div>
        {trend && <Badge tone={trend.startsWith('+') ? 'ok' : 'muted'}>{trend}</Badge>}
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 28, marginTop: 12, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>{sub}</div>}
    </Card>
  );
}

function Donut({ value, max, color = T.primary, size = 120, label, sub }) {
  const r = (size - 16) / 2; const c = 2 * Math.PI * r; const pct = Math.min(1, value / max);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.surfaceAlt} strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: size * 0.24, color: T.ink, lineHeight: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, color = T.primary, height = 130 }) {
  const max = Math.max(...data.map(d => d.value)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: d.color || color }}>{d.value}</div>
          <div style={{ width: '100%', maxWidth: 44, background: (d.color || color), height: `${(d.value / max) * (height - 46)}px`, borderRadius: '8px 8px 0 0', minHeight: 6, transition: 'height .6s cubic-bezier(.2,.8,.3,1)' }} />
          <div style={{ fontSize: 11, color: T.sub, textAlign: 'center', lineHeight: 1.15 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className="ob-press" style={{ width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? T.primary : T.border, position: 'relative', transition: 'background .2s', flex: '0 0 auto' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </button>
  );
}

function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 25, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 13.5, color: T.sub, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function ConfidentialBadge() {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#8a6fb0', background: '#8a6fb015', padding: '4px 10px', borderRadius: 999 }}><Icon name="shield" size={13} color="#8a6fb0" /> Confidentiel</span>;
}

Object.assign(window, { DeskShell, StatTile, Donut, BarChart, Toggle, PageHead, ConfidentialBadge });
