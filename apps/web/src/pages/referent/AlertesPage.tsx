import { T } from '@/tokens'

export default function AlertesPage() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Alertes</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Notifications et actions requises</p>
      </div>
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#fff',
        borderRadius: T.radiusLg,
        border: `1px solid ${T.border}`,
        color: T.muted,
        fontSize: '14px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
        Aucune alerte pour le moment
      </div>
    </div>
  )
}
