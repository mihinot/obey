import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { me, type MyAssignment } from '@/lib/meApi'
import { T, DEPT_COLORS } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function StarAccueil() {
  const { state } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<MyAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const user = state.status === 'authenticated' ? state.user : null

  useEffect(() => {
    me.assignments().then(setAssignments).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = assignments
    .filter((a) => new Date(a.event.date) >= now && a.statut !== 'Desistee')
    .slice(0, 1)[0]

  const confirmes = assignments.filter((a) => a.statut === 'Confirmee').length
  const aConfirmer = assignments.filter((a) => ['Proposee', 'Publiee'].includes(a.statut) && new Date(a.event.date) >= now).length

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
          Bonjour, {user?.prenom} 👋
        </div>
        <div style={{ fontSize: '13px', color: T.sub, marginTop: '2px' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Prochain service */}
      {upcoming && (
        <div
          onClick={() => navigate('/star/planning')}
          style={{
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDeep} 100%)`,
            borderRadius: T.radiusLg,
            padding: '20px',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Prochain service
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>
            {upcoming.event.nom}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
            {fmt(upcoming.event.date)} · {upcoming.event.debut}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: DEPT_COLORS[upcoming.deptCode] ?? '#fff',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '6px', padding: '3px 8px',
            }}>
              {upcoming.deptCode}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              background: upcoming.statut === 'Confirmee' ? 'rgba(79,165,126,0.3)' : 'rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: '6px', padding: '3px 8px',
            }}>
              {upcoming.statut === 'Confirmee' ? '✓ Confirmé' : 'À confirmer'}
            </span>
          </div>
        </div>
      )}

      {!upcoming && !loading && (
        <Card pad={20} style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌟</div>
          <div style={{ fontSize: '14px', color: T.sub }}>Aucun service à venir</div>
        </Card>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <Card pad={16}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: T.ok }}>
            {confirmes}
          </div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>Services confirmés</div>
        </Card>
        <Card pad={16}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: aConfirmer > 0 ? T.warn : T.muted }}>
            {aConfirmer}
          </div>
          <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>À confirmer</div>
          {aConfirmer > 0 && (
            <button
              onClick={() => navigate('/star/planning')}
              style={{ marginTop: '8px', fontSize: '11px', color: T.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Voir →
            </button>
          )}
        </Card>
      </div>

      {/* Services récents */}
      <div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
          Prochains services
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading && <div style={{ fontSize: '13px', color: T.muted }}>Chargement…</div>}
          {!loading && assignments.filter((a) => new Date(a.event.date) >= now && a.statut !== 'Desistee').length === 0 && (
            <div style={{ fontSize: '13px', color: T.muted }}>Aucun service planifié</div>
          )}
          {assignments
            .filter((a) => new Date(a.event.date) >= now && a.statut !== 'Desistee')
            .slice(0, 4)
            .map((a) => (
              <div
                key={a.id}
                onClick={() => navigate('/star/planning')}
                style={{
                  background: '#fff',
                  borderRadius: T.radius,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${T.border}`,
                }}
              >
                <div style={{
                  width: '44px', flexShrink: 0,
                  background: T.primarySoft, borderRadius: '10px',
                  padding: '6px 0', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: T.primary }}>
                    {new Date(a.event.date).getDate()}
                  </div>
                  <div style={{ fontSize: '10px', color: T.sub, textTransform: 'uppercase' }}>
                    {new Date(a.event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.event.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: T.sub, marginTop: '1px' }}>
                    {a.event.debut} · {a.deptCode}
                  </div>
                </div>
                <Badge tone={a.statut === 'Confirmee' ? 'ok' : 'warn'}>
                  {a.statut === 'Confirmee' ? 'Confirmé' : 'À confirmer'}
                </Badge>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
