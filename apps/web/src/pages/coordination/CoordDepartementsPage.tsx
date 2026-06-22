import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json())
}

type DeptDetail = {
  code: string
  nom: string
  description: string | null
  actif: boolean
  confidentiel: boolean
  pilotage: boolean
  starDepts: { star: { statut: string } }[]
}

type EventSummary = { statut: string; date: string; needs: { deptCode: string; requis: number }[] }

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const color = pct >= 80 ? T.ok : pct >= 50 ? T.warn : T.danger
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: T.muted }}>{value}/{max} membres actifs</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: T.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

const DEPT_NAMES: Record<string, string> = {
  ACC: 'Accueil', MUS: 'Musique', MED: 'Médias', INT: 'Intercession',
  ENF: 'Enfants', JEU: 'Jeunesse', LOG: 'Logistique', TECH: 'Technique',
}

export default function CoordDepartementsPage() {
  const [depts, setDepts] = useState<DeptDetail[]>([])
  const [upcomingNeeds, setUpcomingNeeds] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<DeptDetail[]>('/departments'),
      api<EventSummary[]>('/events?upcoming=true'),
    ]).then(([d, evs]) => {
      setDepts(d)
      // Aggregate required spots per dept from upcoming events
      const needs: Record<string, number> = {}
      evs.forEach(ev => {
        ev.needs?.forEach(n => {
          needs[n.deptCode] = (needs[n.deptCode] ?? 0) + n.requis
        })
      })
      setUpcomingNeeds(needs)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>

  const activeDepts = depts.filter(d => d.actif)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Départements
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Vue consolidée des équipes et de leur capacité de service
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {activeDepts.map((dept) => {
          const color = DEPT_COLORS[dept.code] ?? T.primary
          const total = dept.starDepts.length
          const actifs = dept.starDepts.filter(sd => sd.star.statut === 'Actif').length
          const besoin = upcomingNeeds[dept.code] ?? 0

          return (
            <Card key={dept.code} pad={20}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: T.radius,
                    background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px', color,
                  }}>
                    {dept.code}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: T.ink }}>
                      {DEPT_NAMES[dept.code] ?? dept.nom}
                    </div>
                    <div style={{ fontSize: '12px', color: T.muted }}>{total} membres</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  {dept.confidentiel && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: T.dangerSoft, color: T.danger, fontWeight: 600 }}>
                      Confidentiel
                    </span>
                  )}
                  {dept.pilotage && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: T.primarySoft, color: T.primary, fontWeight: 600 }}>
                      Pilotage
                    </span>
                  )}
                </div>
              </div>

              <ProgressBar value={actifs} max={total} />

              {besoin > 0 && (
                <div style={{
                  marginTop: '12px', padding: '8px 12px',
                  background: T.warnSoft, borderRadius: T.radiusSm,
                  fontSize: '12px', color: T.warn, fontWeight: 600,
                }}>
                  {besoin} poste(s) requis sur les prochains événements
                </div>
              )}

              {dept.description && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: T.muted, lineHeight: 1.5 }}>
                  {dept.description}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
