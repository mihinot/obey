import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { me, type MyAssignment } from '@/lib/meApi'
import { ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function apiGet<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }).then(async (r) => {
    if (!r.ok) throw new ApiError(r.status, await r.json())
    return r.json()
  })
}

type ChurchEvent = {
  id: number
  nom: string
  type: string
  date: string
  debut: string
  fin: string
  lieu: string
  needs: { deptCode: string; requis: number }[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function StarAccueil() {
  const { state } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<MyAssignment[]>([])
  const [churchEvents, setChurchEvents] = useState<ChurchEvent[]>([])
  const [loading, setLoading] = useState(true)

  const user = state.status === 'authenticated' ? state.user : null

  useEffect(() => {
    Promise.all([
      me.assignments(),
      apiGet<ChurchEvent[]>('/events?upcoming=true'),
    ]).then(([asgn, events]) => {
      setAssignments(asgn)
      setChurchEvents(events.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const myUpcoming = assignments
    .filter((a) => new Date(a.event.date) >= now && a.statut !== 'Desistee')
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())

  const nextService = myUpcoming[0]
  const confirmes = assignments.filter((a) => a.statut === 'Confirmee').length
  const aConfirmer = myUpcoming.filter((a) => ['Proposee', 'Publiee'].includes(a.statut)).length

  // IDs des événements auxquels le STAR est affecté
  const myEventIds = new Set(assignments.map(a => a.event.id))

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Salutation */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
          Bonjour, {user?.prenom} 👋
        </div>
        <div style={{ fontSize: '13px', color: T.sub, marginTop: '2px' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Prochain service personnel */}
      {nextService && (
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
            Mon prochain service
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff', marginBottom: '4px' }}>
            {nextService.event.nom}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
            {fmt(nextService.event.date)} · {nextService.event.debut}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '12px', fontWeight: 700,
              color: DEPT_COLORS[nextService.deptCode] ?? '#fff',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '6px', padding: '3px 8px',
            }}>
              {nextService.deptCode}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              background: nextService.statut === 'Confirmee' ? 'rgba(79,165,126,0.3)' : 'rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: '6px', padding: '3px 8px',
            }}>
              {nextService.statut === 'Confirmee' ? '✓ Confirmé' : 'À confirmer'}
            </span>
          </div>
        </div>
      )}

      {!nextService && !loading && (
        <Card pad={20} style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌟</div>
          <div style={{ fontSize: '14px', color: T.sub }}>Aucun service planifié pour toi</div>
        </Card>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
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

      {/* Prochains événements de l'église */}
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink }}>
          Prochains événements de l'église
        </div>
        <button
          onClick={() => navigate('/star/agenda')}
          style={{ fontSize: '12px', color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Tout voir →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {loading && <div style={{ fontSize: '13px', color: T.muted }}>Chargement…</div>}
        {!loading && churchEvents.length === 0 && (
          <div style={{ fontSize: '13px', color: T.muted }}>Aucun événement à venir</div>
        )}
        {churchEvents.map(ev => {
          const isMyService = myEventIds.has(ev.id)
          return (
            <div
              key={ev.id}
              onClick={() => navigate('/star/agenda')}
              style={{
                background: '#fff',
                borderRadius: T.radius,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                border: `1.5px solid ${isMyService ? T.primary + '44' : T.border}`,
              }}
            >
              <div style={{
                width: '44px', flexShrink: 0,
                background: isMyService ? T.primarySoft : T.surface,
                borderRadius: '10px',
                padding: '6px 0', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: isMyService ? T.primary : T.ink }}>
                  {new Date(ev.date).getDate()}
                </div>
                <div style={{ fontSize: '10px', color: T.sub, textTransform: 'uppercase' }}>
                  {new Date(ev.date).toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.nom}
                </div>
                <div style={{ fontSize: '12px', color: T.sub, marginTop: '1px' }}>
                  {ev.debut}–{ev.fin} {ev.lieu ? `· ${ev.lieu}` : ''}
                </div>
              </div>
              {isMyService && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.primary, background: T.primarySoft, borderRadius: '6px', padding: '2px 6px', flexShrink: 0 }}>
                  Je sers
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mes prochains services (liste) */}
      {myUpcoming.length > 1 && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Mes services à venir
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myUpcoming.slice(1, 4).map((a) => (
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
        </>
      )}
    </div>
  )
}
