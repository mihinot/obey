import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/primitives/Avatar'
import { Btn } from '@/components/primitives/Btn'
import { T } from '@/tokens'

export default function StarProfil() {
  const { state, logout } = useAuth()
  const user = state.status === 'authenticated' ? state.user : null

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '20px' }}>
        Mon profil
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Avatar name={user ? `${user.prenom} ${user.nom}` : '?'} size={72} />
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginTop: '12px' }}>
          {user?.prenom} {user?.nom}
        </div>
        <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          {user?.email}
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          {user?.roles.map((r) => (
            <span key={r} style={{ fontSize: '11px', fontWeight: 700, color: T.primary, background: T.primarySoft, borderRadius: '6px', padding: '2px 8px' }}>
              {r}
            </span>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: T.radiusLg, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: '16px' }}>
        {[
          { label: 'Statut du compte', value: user?.statut ?? '—' },
          { label: 'E-mail', value: user?.email ?? '—' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', color: T.sub }}>{row.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: T.ink }}>{row.value}</span>
          </div>
        ))}
      </div>

      <Btn variant="dangerSoft" full onClick={logout}>
        Se déconnecter
      </Btn>
    </div>
  )
}
