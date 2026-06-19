import { useAuth } from '@/contexts/AuthContext'
import { T } from '@/tokens'

export default function DashboardPage() {
  const { state, logout } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '24px', color: T.ink, marginBottom: '8px' }}>
          Bienvenue, {user?.prenom} 👋
        </div>
        <div style={{ fontSize: '14px', color: T.sub, marginBottom: '24px' }}>
          {user?.roles.join(' · ')}
        </div>
        <button
          onClick={logout}
          style={{ fontSize: '13px', color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
