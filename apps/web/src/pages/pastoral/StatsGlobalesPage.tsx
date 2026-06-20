import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(async r => { if (!r.ok) throw new ApiError(r.status, await r.json()); return r.json() })
}

type Summary = {
  kpis: {
    totalStars: number; starsActifs: number; totalEvents: number; eventsPublies: number
    totalAssignments: number; confirmes: number; desistements: number; desistementsLast30: number
    starsSurcharge: number; tauxConfirmation: number
  }
  eventsByMonth: { month: string; count: number }[]
  deptStats: { deptCode: string; total: number; actifs: number; tauxConfirmation: number }[]
}

function KpiTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card pad={20}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: color ?? T.ink }}>{value}</div>
      <div style={{ fontWeight: 600, fontSize: '13px', color: T.sub, marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{sub}</div>}
    </Card>
  )
}

export default function StatsGlobalesPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Summary>('/stats/summary').then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>
  if (!data) return <div style={{ color: T.danger }}>Erreur de chargement</div>

  const { kpis, eventsByMonth, deptStats } = data
  const maxEvents = Math.max(...eventsByMonth.map(e => e.count), 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Statistiques globales
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Vue d'ensemble du service et de l'engagement des STARs
          </p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
          background: '#c97fb020', color: '#c97fb0', border: '1px solid #c97fb040',
        }}>
          🔒 Confidentiel
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile label="STARs actifs" value={kpis.starsActifs} sub={`/ ${kpis.totalStars} total`} color={T.primary} />
        <KpiTile label="Taux confirmation" value={`${kpis.tauxConfirmation}%`} color={kpis.tauxConfirmation >= 80 ? T.ok : T.warn} />
        <KpiTile label="Événements publiés" value={kpis.eventsPublies} sub={`/ ${kpis.totalEvents}`} color={T.ok} />
        <KpiTile label="Désistements (30j)" value={kpis.desistementsLast30} color={kpis.desistementsLast30 > 5 ? T.danger : T.muted} />
        <KpiTile label="STARs surchargés" value={kpis.starsSurcharge} color={kpis.starsSurcharge > 0 ? T.danger : T.muted} />
      </div>

      {/* Graphe événements/mois */}
      {eventsByMonth.length > 0 && (
        <Card pad={20} style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '16px' }}>
            Événements par mois
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
            {eventsByMonth.slice(-6).map(({ month, count }) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: T.primary }}>{count}</div>
                <div style={{
                  width: '100%', background: T.primarySoft, borderRadius: '4px 4px 0 0',
                  height: `${Math.round((count / maxEvents) * 80)}px`, minHeight: '4px',
                }} />
                <div style={{ fontSize: '10px', color: T.muted, whiteSpace: 'nowrap' }}>
                  {new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tableau par département */}
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink }}>
            Par département
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['Département', 'Membres', 'Actifs', 'Taux confirmation'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', fontSize: '11.5px', fontWeight: 700, color: T.sub,
                    textAlign: h === 'Département' ? 'left' : 'center',
                    borderBottom: `1px solid ${T.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptStats.filter(d => d.deptCode !== 'INT').map((d, idx) => {
                const taux = d.tauxConfirmation
                const color = taux >= 80 ? T.ok : taux >= 60 ? T.warn : T.danger
                return (
                  <tr key={d.deptCode} style={{ borderTop: `1px solid ${T.border}`, background: idx % 2 === 0 ? '#fff' : T.bg }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700 }}>{d.deptCode}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: T.sub }}>{d.total}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: T.ok }}>{d.actifs}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color }}>{taux}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
