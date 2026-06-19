import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { Tabs } from '@/components/primitives/Tabs'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { stars, type Star } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const STATUT_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger' | 'accent'> = {
  Actif: 'ok', Occasionnel: 'accent', Nouveau: 'muted', EnPause: 'warn', Ancien: 'muted', EnAttente: 'warn',
}

function fiabColor(f: number) {
  if (f >= 0.85) return T.ok
  if (f >= 0.6) return T.warn
  return T.danger
}

export default function EquipePage() {
  const [starList, setStarList] = useState<Star[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    stars.list().then(setStarList).finally(() => setLoading(false))
  }, [])

  const filtered = starList.filter((s) => {
    if (tab === 'all') return true
    if (tab === 'actif') return s.statut === 'Actif'
    if (tab === 'attente') return s.statut === 'EnAttente'
    if (tab === 'pause') return ['EnPause', 'Ancien'].includes(s.statut)
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Équipe</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          {starList.length} membres · {starList.filter((s) => s.statut === 'Actif').length} actifs
        </p>
      </div>

      <Tabs
        items={[
          { id: 'all', label: 'Tous' },
          { id: 'actif', label: 'Actifs' },
          { id: 'attente', label: 'En attente' },
          { id: 'pause', label: 'Pause / Anciens' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {loading && <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>}
        {filtered.map((star) => (
          <Card key={star.id} pad={16} hover>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Avatar name={`${star.prenom} ${star.nom}`} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>
                    {star.prenom} {star.nom}
                  </span>
                  <Badge tone={(STATUT_TONE[star.statut] as 'ok' | 'warn' | 'muted' | 'danger' | 'accent') ?? 'muted'}>
                    {star.statut}
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {star.departments.map((d) => (
                    <span key={d.deptCode} style={{
                      fontSize: '11px', fontWeight: 700, color: DEPT_COLORS[d.deptCode] ?? T.primary,
                      background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                      borderRadius: '6px', padding: '2px 6px',
                    }}>
                      {d.deptCode}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.sub }}>
                    <span>Charge</span>
                    <span style={{ color: star.charge >= 4 ? T.danger : star.charge >= 2 ? T.warn : T.ok }}>
                      {star.charge}/5
                    </span>
                  </div>
                  <ProgressBar
                    value={star.charge}
                    max={5}
                    color={star.charge >= 4 ? T.danger : star.charge >= 2 ? T.warn : T.ok}
                    height={4}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: T.sub, marginTop: '2px' }}>
                    <span>Fiabilité</span>
                    <span style={{ color: fiabColor(star.fiab) }}>{Math.round(star.fiab * 100)}%</span>
                  </div>
                  <ProgressBar value={star.fiab * 100} max={100} color={fiabColor(star.fiab)} height={4} />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Aucun membre</div>
        )}
      </div>
    </div>
  )
}
