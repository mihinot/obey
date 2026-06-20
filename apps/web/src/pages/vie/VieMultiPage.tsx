import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { stars, type Star } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const DEPT_NAMES: Record<string, string> = {
  ACC: 'Accueil', MUS: 'Musique', MED: 'Médias', INT: 'Intercession',
  ENF: 'Enfants', JEU: 'Jeunesse', LOG: 'Logistique', TECH: 'Technique',
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ flex: 1, height: '7px', background: T.border, borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: '4px' }} />
    </div>
  )
}

export default function VieMultiPage() {
  const [starList, setStarList] = useState<Star[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stars.list().then(setStarList).finally(() => setLoading(false))
  }, [])

  const multi = starList
    .filter(s => s.departments.length >= 2 && s.statut === 'ACTIF')
    .sort((a, b) => b.departments.length - a.departments.length || b.charge - a.charge)

  if (loading) return <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Multi-départements
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          STARs engagés dans plusieurs départements — à surveiller pour éviter la surcharge
        </p>
      </div>

      {multi.length === 0 && (
        <Card pad={40}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            Aucun STAR actif dans plusieurs départements
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {multi.map(s => {
          const isRisque = s.departments.length >= 2 && s.charge >= 60
          const chargeColor = s.charge >= 80 ? T.danger : s.charge >= 60 ? T.warn : T.ok

          return (
            <Card key={s.id} pad={16} style={{ border: isRisque ? `1.5px solid ${T.warn}` : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '12px' }}>
                <Avatar name={`${s.prenom} ${s.nom}`} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14.5px', color: T.ink }}>{s.prenom} {s.nom}</div>
                  <div style={{ fontSize: '12px', color: T.sub }}>{s.departments.length} département{s.departments.length > 1 ? 's' : ''}</div>
                </div>
                {isRisque && <Badge tone="warn">À surveiller</Badge>}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {s.departments.map(d => (
                  <span key={d.deptCode} style={{
                    fontSize: '11.5px', fontWeight: 600,
                    color: DEPT_COLORS[d.deptCode] ?? T.primary,
                    background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                    padding: '3px 9px', borderRadius: '999px',
                  }}>
                    {DEPT_NAMES[d.deptCode] ?? d.deptCode}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: T.sub, flexShrink: 0 }}>Charge</span>
                <ProgressBar value={s.charge} color={chargeColor} />
                <span style={{ fontWeight: 700, color: chargeColor, fontSize: '12.5px', flexShrink: 0 }}>{s.charge}%</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
