// OBEY — Thème "Lumière" : tokens + primitives UI + icônes.
// Exporté vers window pour partage entre fichiers Babel.

const T = {
  bg: '#f6f2fb', bgWarm: '#faf7fd', surface: '#ffffff', surfaceAlt: '#f1eafb',
  ink: '#2c2535', sub: '#6c6379', muted: '#a096ad',
  primary: '#7c5cd6', primaryDeep: '#5b3fb0', primarySoft: '#efe7fb', primaryTint: '#f6f1fd',
  accent: '#c97fb0', accentSoft: '#fbecf4',
  border: '#ece3f6', borderSoft: '#f4eefb',
  ok: '#4fa57e', okSoft: '#eaf6f0',
  warn: '#cf9a4a', warnSoft: '#faf0df',
  danger: '#d76a76', dangerSoft: '#fbecee',
  radiusSm: 10, radius: 16, radiusLg: 24, pill: 999,
  shadow: '0 12px 32px rgba(96,64,160,0.12)',
  shadowSm: '0 4px 14px rgba(96,64,160,0.08)',
  shadowLg: '0 24px 60px rgba(72,44,130,0.20)',
  display: "'Outfit', system-ui, sans-serif",
  body: "'Figtree', system-ui, sans-serif",
};

// Global CSS (fonts assumed loaded in host HTML)
if (typeof document !== 'undefined' && !document.getElementById('obey-theme')) {
  const s = document.createElement('style');
  s.id = 'obey-theme';
  s.textContent = `
    :root { --ob-primary:${T.primary}; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:${T.body}; color:${T.ink}; -webkit-font-smoothing:antialiased; }
    button { font-family:inherit; }
    ::selection { background:${T.primarySoft}; }
    .ob-fade { animation: obFade .35s ease both; }
    @keyframes obFade { from { transform: translateY(6px); } to { transform:none; } }
    .ob-rise { animation: obRise .45s cubic-bezier(.2,.8,.3,1) both; }
    @keyframes obRise { from { transform: translateY(14px); } to { transform:none; } }
    .ob-scalein { animation: obScale .3s cubic-bezier(.2,.8,.3,1) both; }
    @keyframes obScale { from { transform: scale(.97); } to { transform:none; } }
    @media (prefers-reduced-motion: reduce) { .ob-fade,.ob-rise,.ob-scalein { animation: none !important; } }
    .ob-pop { animation: obPop .9s ease-in-out; }
    @keyframes obPop { 0%,100%{transform:none;} 30%{transform:scale(1.12);} }
    .ob-scroll::-webkit-scrollbar { width:8px; height:8px; }
    .ob-scroll::-webkit-scrollbar-thumb { background:${T.border}; border-radius:99px; }
    .ob-scroll::-webkit-scrollbar-track { background:transparent; }
    .ob-press { transition: transform .12s ease, filter .15s ease, background .15s ease, box-shadow .15s ease; }
    .ob-press:active { transform: scale(.97); }
    .ob-hov { transition: background .15s, border-color .15s, box-shadow .2s, transform .15s; }
    @keyframes obBar { from { width:0 !important; } }
  `;
  document.head.appendChild(s);
}

/* ---------- Icons (simple stroke set) ---------- */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M9.5 20a2.5 2.5 0 0 0 5 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M17 5.5a3 3 0 0 1 0 6M16.5 14.2A6 6 0 0 1 21.5 20',
  check: 'M4 12.5 9.5 18 20 6.5',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  plus: 'M12 5v14M5 12h14',
  chevR: 'M9 6l6 6-6 6', chevL: 'M15 6l-6 6 6 6', chevD: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6 6 18',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M18 6l-2.5 2.5M6 18l2.5-2.5M18 18l-2.5-2.5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  swap: 'M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1-2.7H4a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 5.3 6.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V2a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z',
  doc: 'M14 3v5h5M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5ZM8 13h8M8 17h6',
  heart: 'M12 20s-7-4.6-9.3-9A4.6 4.6 0 0 1 12 6.5 4.6 4.6 0 0 1 21.3 11C19 15.4 12 20 12 20Z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5M2 18l10 5 10-5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.3-4.3',
  filter: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z',
  dl: 'M12 4v11M8 11l4 4 4-4M5 20h14',
};
function Icon({ name, size = 20, color = 'currentColor', stroke = 2, style }) {
  const d = ICONS[name] || ICONS.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', ...style }}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

/* ---------- Primitives ---------- */
function Btn({ children, variant = 'primary', size = 'md', full, icon, onClick, disabled, style }) {
  const pads = { sm: '8px 14px', md: '11px 18px', lg: '14px 24px' };
  const fss = { sm: 13, md: 14.5, lg: 16 };
  const base = {
    fontFamily: T.body, fontWeight: 600, fontSize: fss[size], borderRadius: T.radius,
    padding: pads[size], border: 'none', cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, lineHeight: 1, opacity: disabled ? 0.5 : 1, ...style,
  };
  const v = {
    primary: { background: T.primary, color: '#fff', boxShadow: T.shadowSm },
    deep: { background: T.primaryDeep, color: '#fff' },
    soft: { background: T.primarySoft, color: T.primaryDeep },
    outline: { background: T.surface, color: T.ink, border: `1px solid ${T.border}` },
    ghost: { background: 'transparent', color: T.sub },
    danger: { background: T.danger, color: '#fff' },
    dangerSoft: { background: T.dangerSoft, color: T.danger },
  };
  return (
    <button className="ob-press" style={{ ...base, ...v[variant] }} onClick={disabled ? undefined : onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} stroke={2.2} />}{children}
    </button>
  );
}

const TONE = {
  ok: [T.ok, T.okSoft], warn: [T.warn, T.warnSoft], danger: [T.danger, T.dangerSoft],
  primary: [T.primaryDeep, T.primarySoft], accent: [T.accent, T.accentSoft], muted: [T.sub, T.surfaceAlt],
};
function Badge({ tone = 'ok', children, dot, icon }) {
  const [fg, bg] = TONE[tone] || TONE.muted;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.body, fontSize: 12,
      fontWeight: 600, color: fg, background: bg, padding: '4px 10px', borderRadius: T.pill, lineHeight: 1.15, whiteSpace: 'nowrap',
    }}>
      {dot && <Dot c={fg} />}{icon && <Icon name={icon} size={13} stroke={2.4} />}{children}
    </span>
  );
}
function Dot({ c, s = 7 }) { return <span style={{ width: s, height: s, borderRadius: '50%', background: c, display: 'inline-block', flex: '0 0 auto' }} />; }

function Card({ children, pad = 18, style, hover, onClick, className = '' }) {
  return (
    <div onClick={onClick} className={(hover ? 'ob-hov ' : '') + className}
      style={{
        background: T.surface, border: `1px solid ${T.borderSoft}`, borderRadius: T.radiusLg,
        padding: pad, boxShadow: T.shadowSm, cursor: onClick ? 'pointer' : 'default', ...style,
      }}>{children}</div>
  );
}

function Avatar({ name, size = 38, tone }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const palette = [T.primary, T.accent, '#6f8fd0', '#5fae9a', '#c08a5a'];
  const idx = name.charCodeAt(0) % palette.length;
  const c = tone || palette[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flex: '0 0 auto',
      background: c + '22', color: c, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: 700, fontFamily: T.display, fontSize: size * 0.36,
    }}>{initials}</div>
  );
}

function ProgressBar({ value, max, color, height = 8, animate }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: T.surfaceAlt, borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: pct + '%', height: '100%', background: color || T.primary, borderRadius: 999, transition: 'width .6s cubic-bezier(.2,.8,.3,1)', animation: animate ? 'obBar .8s ease' : 'none' }} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, hint, right }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{label}</span>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            width: '100%', border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '12px 14px',
            fontSize: 14, fontFamily: T.body, color: T.ink, background: T.surface, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = T.primary}
          onBlur={e => e.target.style.borderColor = T.border} />
        {right && <span style={{ position: 'absolute', right: 12 }}>{right}</span>}
      </div>
      {hint && <span style={{ fontSize: 11.5, color: T.muted }}>{hint}</span>}
    </label>
  );
}

function SectionTitle({ children, sub, right, size = 20 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: size, color: T.ink, letterSpacing: '-0.01em' }}>{children}</div>
        {sub && <div style={{ fontSize: 13, color: T.sub, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Wordmark({ size = 22, color = T.primary }) {
  return <span style={{ fontFamily: T.display, fontWeight: 800, fontSize: size, letterSpacing: '-0.01em', color, lineHeight: 1 }}>OBEY</span>;
}

function Tabs({ items, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: T.surfaceAlt, borderRadius: T.pill, padding: 4, gap: 2 }}>
      {items.map(it => {
        const active = it.id === value;
        return (
          <button key={it.id} className="ob-press" onClick={() => onChange(it.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer',
            background: active ? T.surface : 'transparent', color: active ? T.primaryDeep : T.sub,
            fontWeight: 600, fontSize: 13.5, padding: '8px 16px', borderRadius: T.pill,
            boxShadow: active ? T.shadowSm : 'none', transition: 'all .15s',
          }}>{it.icon && <Icon name={it.icon} size={16} stroke={2.2} />}{it.label}</button>
        );
      })}
    </div>
  );
}

Object.assign(window, { T, Icon, Btn, Badge, Dot, Card, Avatar, ProgressBar, Field, SectionTitle, Wordmark, Tabs });
