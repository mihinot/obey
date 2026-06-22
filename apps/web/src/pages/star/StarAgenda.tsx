import { useEffect, useState } from 'react'
import { events as eventsApi } from '@/lib/api'
import { me, type MyAssignment } from '@/lib/meApi'
import { T, DEPT_COLORS } from '@/tokens'

type ChurchEvent = {
  id: number
  nom: string
  type: string
  date: string
  debut: string
  fin: string
  lieu: string
  needs: { deptCode: string; requis: number }[]
  _count: { assignments: number }
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtMonthKey(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function StarAgenda() {
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [myAssignments, setMyAssignments] = useState<MyAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      eventsApi.upcoming() as Promise<ChurchEvent[]>,
      me.assignments(),
    ]).then(([evs, asgn]) => {
      setEvents(evs)
      setMyAssignments(asgn)
    }).finally(() => setLoading(false))
  }, [])

  const myEventIds = new Set(myAssignments.map(a => a.event.id))
  const myAssignmentByEventId = new Map(myAssignments.map(a => [a.event.id, a]))

  // Grouper par mois
  const grouped: Record<string, ChurchEvent[]> = {}
  events.forEach(ev => {
    const key = fmtMonthKey(ev.date)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ev)
  })

  if (loading) return <div style={{ padding: '40px 16px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '4px' }}>
        Planning de l'église
      </div>
      <div style={{ fontSize: '13px', color: T.sub, marginBottom: '20px' }}>
        {events.length} événement{events.length !== 1 ? 's' : ''} à venir
      </div>

      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: T.muted, fontSize: '13px' }}>
          Aucun événement publié à venir
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(grouped).map(([mois, evs]) => (
          <div key={mois}>
            <div style={{
              fontSize: '12px', fontWeight: 700, color: T.primary,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '10px',
            }}>
              {mois}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {evs.map(ev => {
                const isMyService = myEventIds.has(ev.id)
                const myAsgn = myAssignmentByEventId.get(ev.id)
                const d = new Date(ev.date)
                return (
                  <div
                    key={ev.id}
                    style={{
                      background: '#fff',
                      borderRadius: T.radiusLg,
                      padding: '14px',
                      border: `1.5px solid ${isMyService ? T.primary + '55' : T.border}`,
                      position: 'relative',
                    }}
                  >
                    {isMyService && (
                      <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        fontSize: '10px', fontWeight: 700, color: T.primary,
                        background: T.primarySoft, borderRadius: '6px', padding: '2px 8px',
                      }}>
                        Je sers ·{' '}
                        <span style={{ color: myAsgn?.statut === 'Confirmee' ? T.ok : T.warn }}>
                          {myAsgn?.statut === 'Confirmee' ? 'Confirmé' : 'À confirmer'}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Pastille date */}
                      <div style={{
                        width: '46px', flexShrink: 0,
                        background: isMyService ? T.primarySoft : T.surface,
                        borderRadius: '10px', padding: '6px 0', textAlign: 'center',
                      }}>
                        <div style={{
                          fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px',
                          color: isMyService ? T.primary : T.ink,
                        }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontSize: '10px', color: T.sub, textTransform: 'uppercase' }}>
                          {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: T.ink, marginBottom: '2px' }}>
                          {ev.nom}
                        </div>
                        <div style={{ fontSize: '12px', color: T.sub, marginBottom: '8px' }}>
                          {ev.debut}–{ev.fin}{ev.lieu ? ` · ${ev.lieu}` : ''}
                        </div>

                        {/* Besoins par département */}
                        {ev.needs.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {ev.needs.map(n => (
                              <span key={n.deptCode} style={{
                                fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '7px',
                                color: DEPT_COLORS[n.deptCode] ?? T.primary,
                                background: (DEPT_COLORS[n.deptCode] ?? T.primary) + '18',
                              }}>
                                {n.deptCode} ×{n.requis}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mon rôle si affecté */}
                    {isMyService && myAsgn && (
                      <div style={{
                        marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span style={{ fontSize: '12px', color: T.sub }}>Mon département :</span>
                        <span style={{
                          fontSize: '12px', fontWeight: 700,
                          color: DEPT_COLORS[myAsgn.deptCode] ?? T.primary,
                          background: (DEPT_COLORS[myAsgn.deptCode] ?? T.primary) + '18',
                          borderRadius: '6px', padding: '2px 8px',
                        }}>
                          {myAsgn.deptCode}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
