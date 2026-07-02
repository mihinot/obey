import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
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

type PastoralStar = {
  id: number
  prenom: string
  nom: string
  statut: string
  fiab: number
  charge: number
  baptise: boolean | null
  f001: boolean | null
  f101: boolean | null
  f201: boolean | null
  disciple: boolean | null
  famille: string | null
  departments: { deptCode: string }[]
}

const STATUT_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger' | 'accent'> = {
  Actif: 'ok', Occasionnel: 'accent', Nouveau: 'muted', EnPause: 'warn', Ancien: 'muted',
}

export default function PastoralDashboard() {
  const navigate = useNavigate()
  const [stars, setStars] = useState<PastoralStar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<PastoralStar[]>('/stars').then(setStars).finally(() => setLoading(false))
  }, [])

  const total = stars.length
  const baptises = stars.filter(s => s.baptise).length
  const f001Done = stars.filter(s => s.f001).length
  const f101Done = stars.filter(s => s.f101).length
  const f201Done = stars.filter(s => s.f201).length
  const disciples = stars.filter(s => s.disciple).length
  const recents = [...stars].sort((a, b) => b.id - a.id).slice(0, 8)

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Vue d'ensemble</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Données confidentielles — Corps Pastoral</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total STARs', value: total, color: T.ink },
          { label: 'Baptisés', value: baptises, color: '#2e6b3e' },
          { label: 'F001', value: f001Done, color: T.primary },
          { label: 'F101', value: f101Done, color: T.primary },
          { label: 'F201', value: f201Done, color: T.primary },
          { label: 'En discipulat', value: disciples, color: T.warn },
        ].map(k => (
          <Card key={k.label} pad={16}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '24px', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>{k.label}</div>
          </Card>
        ))}
      </div>

      {/* Progression formations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '16px' }}>Progression des formations</div>
          {[
            { label: 'Baptême', done: baptises, pct: total > 0 ? baptises / total : 0, color: '#2e6b3e' },
            { label: 'F001 — Fondamentaux', done: f001Done, pct: total > 0 ? f001Done / total : 0, color: T.primary },
            { label: 'F101 — Bases du service', done: f101Done, pct: total > 0 ? f101Done / total : 0, color: '#7c5cd6' },
            { label: 'F201 — Leadership', done: f201Done, pct: total > 0 ? f201Done / total : 0, color: T.warn },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: T.ink }}>{f.label}</span>
                <span style={{ color: T.sub }}>{f.done}/{total}</span>
              </div>
              <div style={{ height: '6px', background: T.surface, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.pct * 100}%`, background: f.color, borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
            </div>
          ))}
        </Card>

        <Card pad={20}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '16px' }}>STARs sans baptême</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stars.filter(s => !s.baptise && s.statut === 'Actif').slice(0, 6).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => navigate(`/pastoral/stars/${s.id}`)}>
                <Avatar name={`${s.prenom} ${s.nom}`} size={32} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: T.ink }}>{s.prenom} {s.nom}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {s.departments.map(d => (
                      <span key={d.deptCode} style={{ fontSize: '10px', color: DEPT_COLORS[d.deptCode] ?? T.primary }}>{d.deptCode}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {stars.filter(s => !s.baptise && s.statut === 'Actif').length === 0 && (
              <div style={{ fontSize: '13px', color: T.muted }}>Tous les membres actifs sont baptisés ✓</div>
            )}
          </div>
        </Card>
      </div>

      {/* Liste récents */}
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
        Membres récents
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {recents.map(s => (
          <Card key={s.id} pad={16} hover onClick={() => navigate(`/pastoral/stars/${s.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={`${s.prenom} ${s.nom}`} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{s.prenom} {s.nom}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {s.baptise && <span style={{ fontSize: '10px', color: '#2e6b3e', fontWeight: 700 }}>✝ Baptisé</span>}
                  {s.f001 && <span style={{ fontSize: '10px', color: T.primary }}>F001</span>}
                  {s.f101 && <span style={{ fontSize: '10px', color: '#7c5cd6' }}>F101</span>}
                  {s.f201 && <span style={{ fontSize: '10px', color: T.warn }}>F201</span>}
                  {s.disciple && <span style={{ fontSize: '10px', color: T.warn, fontWeight: 700 }}>Disciple</span>}
                </div>
              </div>
              <Badge tone={STATUT_TONE[s.statut] ?? 'muted'}>{s.statut}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
