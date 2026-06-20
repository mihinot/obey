import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? ''

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
  baptise: boolean | null
  f001: boolean | null
  f101: boolean | null
  f201: boolean | null
  disciple: boolean | null
  famille: string | null
  departments: { deptCode: string }[]
}

const STAGES = [
  { key: 'baptise', label: 'Baptême', color: '#2e6b3e' },
  { key: 'f001', label: 'F001', color: T.primary },
  { key: 'f101', label: 'F101', color: '#7c5cd6' },
  { key: 'f201', label: 'F201', color: T.warn },
]

const STATUT_TONE: Record<string, 'ok' | 'warn' | 'muted'> = {
  Actif: 'ok', Occasionnel: 'warn', Nouveau: 'muted', EnPause: 'muted', Ancien: 'muted',
}

export default function DiscipulatPage() {
  const navigate = useNavigate()
  const [stars, setStars] = useState<PastoralStar[]>([])
  const [loading, setLoading] = useState(true)
  const [filterFamille, setFilterFamille] = useState('')

  useEffect(() => {
    api<PastoralStar[]>('/stars').then(setStars).finally(() => setLoading(false))
  }, [])

  const familles = [...new Set(stars.map(s => s.famille).filter(Boolean))] as string[]

  const filtered = stars.filter(s =>
    !filterFamille || s.famille === filterFamille
  )

  // Group by famille
  const groups: Record<string, PastoralStar[]> = {}
  filtered.forEach(s => {
    const key = s.famille ?? '— Sans famille'
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  })

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Discipulat</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Suivi du parcours spirituel par famille / cellule</p>
      </div>

      {/* Filter */}
      {familles.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setFilterFamille('')}
            style={{
              padding: '5px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
              border: `1.5px solid ${!filterFamille ? T.primary : T.border}`,
              background: !filterFamille ? T.primary + '18' : '#fff',
              color: !filterFamille ? T.primary : T.sub, fontWeight: !filterFamille ? 700 : 400,
            }}
          >
            Tous
          </button>
          {familles.map(f => (
            <button
              key={f}
              onClick={() => setFilterFamille(f)}
              style={{
                padding: '5px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                border: `1.5px solid ${filterFamille === f ? T.primary : T.border}`,
                background: filterFamille === f ? T.primary + '18' : '#fff',
                color: filterFamille === f ? T.primary : T.sub, fontWeight: filterFamille === f ? 700 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([famille, members]) => (
          <div key={famille}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '10px' }}>
              {famille}
              <span style={{ fontWeight: 400, fontSize: '13px', color: T.muted, marginLeft: '8px' }}>
                {members.length} membre{members.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map(s => {
                const stagesDone = STAGES.filter(st => s[st.key as keyof PastoralStar]).length
                return (
                  <Card key={s.id} pad={16} hover onClick={() => navigate(`/pastoral/stars/${s.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Avatar name={`${s.prenom} ${s.nom}`} size={36} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{s.prenom} {s.nom}</span>
                          <Badge tone={STATUT_TONE[s.statut] ?? 'muted'}>{s.statut}</Badge>
                          {s.disciple && <Badge tone="warn">Disciple</Badge>}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          {s.departments.map(d => (
                            <span key={d.deptCode} style={{ fontSize: '10px', fontWeight: 700, color: DEPT_COLORS[d.deptCode] ?? T.primary }}>
                              {d.deptCode}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {STAGES.map(st => {
                          const done = !!s[st.key as keyof PastoralStar]
                          return (
                            <div
                              key={st.key}
                              title={st.label}
                              style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: done ? st.color + '20' : T.surface,
                                border: `2px solid ${done ? st.color : T.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 700,
                                color: done ? st.color : T.muted,
                              }}
                            >
                              {done ? '✓' : st.label.substring(0, 1)}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ fontSize: '12px', color: T.muted, minWidth: '36px', textAlign: 'right' }}>
                        {stagesDone}/{STAGES.length}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: T.muted, fontSize: '13px' }}>
            Aucun membre
          </div>
        )}
      </div>
    </div>
  )
}
