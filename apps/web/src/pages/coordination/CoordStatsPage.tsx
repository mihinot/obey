import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }).then(async (r) => {
    if (!r.ok) throw new ApiError(r.status, await r.json())
    return r.json()
  })
}

type Stats = {
  kpis: {
    totalStars: number; starsActifs: number; totalEvents: number; eventsPublies: number
    totalAssignments: number; confirmes: number; desistements: number; desistementsLast30: number
    starsSurcharge: number; tauxConfirmation: number
  }
  eventsByMonth: Record<string, number>
  deptStats: { deptCode: string; total: number; confirmes: number; taux: number }[]
}

function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default function CoordStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Stats>('/stats/summary').then(setStats).finally(() => setLoading(false))
  }, [])

  const handleExportDepts = () => {
    if (!stats) return
    const rows = [
      ['Département', 'Total affectations', 'Confirmées', 'Taux de confirmation'],
      ...stats.deptStats.map(d => [d.deptCode, String(d.total), String(d.confirmes), `${d.taux}%`]),
    ]
    downloadCSV('stats-departements.csv', rows)
  }

  const handleExportKpis = () => {
    if (!stats) return
    const k = stats.kpis
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Total STARs', String(k.totalStars)],
      ['STARs actifs', String(k.starsActifs)],
      ['Total événements', String(k.totalEvents)],
      ['Événements publiés', String(k.eventsPublies)],
      ['Total affectations', String(k.totalAssignments)],
      ['Confirmées', String(k.confirmes)],
      ['Désistements total', String(k.desistements)],
      ['Désistements 30 jours', String(k.desistementsLast30)],
      ['STARs en surcharge', String(k.starsSurcharge)],
      ['Taux de confirmation', `${k.tauxConfirmation}%`],
    ]
    downloadCSV('kpis-obey.csv', rows)
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>
  if (!stats) return <div style={{ padding: '40px', color: T.danger, fontSize: '14px' }}>Erreur de chargement</div>

  const { kpis, eventsByMonth, deptStats } = stats
  const maxEvents = Math.max(...Object.values(eventsByMonth), 1)

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Statistiques</h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Indicateurs de performance et suivi des équipes</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportKpis} style={{
            padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, background: '#fff', color: T.sub,
          }}>
            ↓ KPIs CSV
          </button>
          <button onClick={handleExportDepts} style={{
            padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, background: '#fff', color: T.sub,
          }}>
            ↓ Depts CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'STARs actifs', value: kpis.starsActifs, total: kpis.totalStars, color: T.ok },
          { label: 'Événements publiés', value: kpis.eventsPublies, total: kpis.totalEvents, color: T.primary },
          { label: 'Taux confirmation', value: `${kpis.tauxConfirmation}%`, color: kpis.tauxConfirmation >= 70 ? T.ok : T.warn },
          { label: 'Désistements (30j)', value: kpis.desistementsLast30, color: kpis.desistementsLast30 > 5 ? T.danger : T.warn },
          { label: 'STARs surcharge', value: kpis.starsSurcharge, color: kpis.starsSurcharge > 0 ? T.danger : T.ok },
        ].map(k => (
          <Card key={k.label} pad={16}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '26px', color: k.color }}>{k.value}</div>
            {(k as {total?: number}).total !== undefined && (
              <div style={{ fontSize: '11px', color: T.muted }}>/ {(k as {total: number}).total} total</div>
            )}
            <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Événements par mois */}
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '20px' }}>
            Événements publiés par mois
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {Object.entries(eventsByMonth).map(([mois, count]) => (
              <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: T.ink, fontWeight: 700 }}>{count > 0 ? count : ''}</div>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${Math.max((count / maxEvents) * 90, count > 0 ? 8 : 2)}px`,
                  background: count > 0 ? T.primary : T.border,
                  transition: 'height 0.3s',
                }} />
                <div style={{ fontSize: '10px', color: T.muted, textAlign: 'center', lineHeight: 1.2 }}>{mois}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Donut taux global */}
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '16px' }}>
            Taux de confirmation global
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* SVG donut */}
            <div style={{ flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke={T.border} strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={kpis.tauxConfirmation >= 70 ? T.ok : T.warn}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 38 * kpis.tauxConfirmation / 100} ${2 * Math.PI * 38}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill={T.ink}>
                  {kpis.tauxConfirmation}%
                </text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Confirmées', value: kpis.confirmes, color: T.ok },
                { label: 'Non confirmées', value: kpis.totalAssignments - kpis.confirmes - kpis.desistements, color: T.warn },
                { label: 'Désistements', value: kpis.desistements, color: T.danger },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: T.sub }}>{r.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink, marginLeft: 'auto' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Taux par département */}
      <Card pad={20}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '16px' }}>
          Taux de confirmation par département
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {deptStats.sort((a, b) => b.taux - a.taux).map(d => (
            <div key={d.deptCode}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: DEPT_COLORS[d.deptCode] ?? T.primary }}>{d.deptCode}</span>
                <span style={{ color: T.sub }}>{d.confirmes}/{d.total} affectations — <strong style={{ color: d.taux >= 70 ? T.ok : T.warn }}>{d.taux}%</strong></span>
              </div>
              <div style={{ height: '6px', background: T.surface, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${d.taux}%`,
                  background: d.taux >= 70 ? T.ok : T.warn,
                  borderRadius: '4px', transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ))}
          {deptStats.length === 0 && (
            <div style={{ color: T.muted, fontSize: '13px' }}>Aucune donnée disponible</div>
          )}
        </div>
      </Card>
    </div>
  )
}
