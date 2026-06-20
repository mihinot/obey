import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { events, stars, type EventSummary, type Star } from '@/lib/api'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
function apiGet<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}
import { T, DEPT_COLORS } from '@/tokens'

const STATUT_TONE: Record<string, 'warn' | 'ok' | 'muted' | 'danger'> = {
  BROUILLON: 'muted', EN_GENERATION: 'warn', A_VALIDER: 'warn', PUBLIE: 'ok', ANNULE: 'danger',
}
const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon', EN_GENERATION: 'En génération', A_VALIDER: 'À valider', PUBLIE: 'Publié', ANNULE: 'Annulé',
}

export default function CoordDashboard() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventSummary[]>([])
  const [starList, setStarList] = useState<Star[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([events.list(), stars.list(), apiGet<{ id: number }[]>('/admin/users?statut=EnAttente')])
      .then(([e, s, pending]) => { setEventList(e); setStarList(s); setPendingCount(pending.length) })
      .finally(() => setLoading(false))
  }, [])

  // Aggregations
  const total = starList.length
  const actifs = starList.filter(s => s.statut === 'Actif').length
  const enAttente = pendingCount
  const aValider = eventList.filter(e => e.statut === 'A_VALIDER').length
  const publies = eventList.filter(e => e.statut === 'PUBLIE').length

  // Charge par département
  const deptStats: Record<string, { stars: number; avgCharge: number; avgFiab: number }> = {}
  starList.forEach(s => {
    s.departments.forEach(d => {
      if (!deptStats[d.deptCode]) deptStats[d.deptCode] = { stars: 0, avgCharge: 0, avgFiab: 0 }
      deptStats[d.deptCode].stars += 1
      deptStats[d.deptCode].avgCharge += s.charge
      deptStats[d.deptCode].avgFiab += s.fiab
    })
  })
  Object.keys(deptStats).forEach(k => {
    const n = deptStats[k].stars
    deptStats[k].avgCharge = n > 0 ? deptStats[k].avgCharge / n : 0
    deptStats[k].avgFiab = n > 0 ? deptStats[k].avgFiab / n : 0
  })

  const prochains = [...eventList]
    .filter(e => !['ANNULE'].includes(e.statut))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Vue globale</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Coordination générale — tous départements</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total STARs', value: total, color: T.ink },
          { label: 'Actifs', value: actifs, color: T.ok },
          { label: 'À valider', value: enAttente, color: T.warn },
          { label: 'Events publiés', value: publies, color: T.primary },
          { label: 'À publier', value: aValider, color: T.danger },
        ].map(k => (
          <Card key={k.label} pad={18}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: T.sub, marginTop: '3px' }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        {/* Événements */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Événements
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {prochains.map(ev => (
              <Card key={ev.id} pad={16} hover onClick={() => navigate(`/coordination/planning/${ev.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{ev.nom}</div>
                    <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>
                      {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{ev.debut}–{ev.fin}
                    </div>
                  </div>
                  <Badge tone={STATUT_TONE[ev.statut] ?? 'muted'}>{STATUT_LABEL[ev.statut] ?? ev.statut}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Santé par département */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Santé des départements
          </h2>
          <Card pad={20}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(deptStats).sort((a, b) => a[0].localeCompare(b[0])).map(([dept, stat]) => {
                const color = DEPT_COLORS[dept] ?? T.primary
                const chargeColor = stat.avgCharge >= 4 ? T.danger : stat.avgCharge >= 2 ? T.warn : T.ok
                return (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color }}>{dept}</span>
                      <span style={{ color: T.muted }}>{stat.stars} membre{stat.stars > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: T.muted }}>
                        <span>Charge moy.</span>
                        <span style={{ color: chargeColor }}>{stat.avgCharge.toFixed(1)}/5</span>
                      </div>
                      <ProgressBar value={stat.avgCharge} max={5} color={chargeColor} height={4} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: T.muted, marginTop: '2px' }}>
                        <span>Fiabilité moy.</span>
                        <span style={{ color: stat.avgFiab >= 0.85 ? T.ok : T.warn }}>{Math.round(stat.avgFiab * 100)}%</span>
                      </div>
                      <ProgressBar value={stat.avgFiab * 100} max={100} color={stat.avgFiab >= 0.85 ? T.ok : T.warn} height={4} />
                    </div>
                  </div>
                )
              })}
              {Object.keys(deptStats).length === 0 && (
                <div style={{ fontSize: '13px', color: T.muted }}>Aucune donnée</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
