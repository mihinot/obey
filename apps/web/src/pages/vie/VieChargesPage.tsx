import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { stars, type Star } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

function chargeNiveau(charge: number): { label: string; color: string; tone: 'ok' | 'warn' | 'danger' | 'muted' } {
  if (charge >= 4) return { label: 'Critique', color: T.danger, tone: 'danger' }
  if (charge >= 2) return { label: 'Élevée', color: T.warn, tone: 'warn' }
  if (charge === 1) return { label: 'Normale', color: T.ok, tone: 'ok' }
  return { label: 'Disponible', color: '#4fa57e', tone: 'ok' }
}

function chargePct(charge: number) { return Math.min(100, charge * 20) }

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div style={{ flex: 1, height: '7px', background: T.border, borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px' }} />
    </div>
  )
}

export default function VieChargesPage() {
  const [starList, setStarList] = useState<Star[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    stars.list().then(setStarList).finally(() => setLoading(false))
  }, [])

  const filtered = starList
    .filter(s => `${s.prenom} ${s.nom}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.charge - a.charge)

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Charges de service
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Répartition de la charge par STAR — mois courant
        </p>
      </div>

      <div style={{ maxWidth: '300px', marginBottom: '16px' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un STAR…"
          style={{
            width: '100%', padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      {!loading && (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['STAR', 'Départements', 'Charge ce mois', 'Niveau'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '13px 16px',
                      fontSize: '12px', fontWeight: 700, color: T.sub,
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => {
                  const niv = chargeNiveau(s.charge)
                  return (
                    <tr key={s.id} style={{ borderTop: `1px solid ${T.border}`, background: idx % 2 === 0 ? '#fff' : T.bg }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={`${s.prenom} ${s.nom}`} size={30} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.prenom} {s.nom}</div>
                            <div style={{ fontSize: '11px', color: T.muted }}>{s.statut}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '12.5px', color: T.sub }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {s.departments.map(d => (
                            <span key={d.deptCode} style={{
                              fontSize: '11px', fontWeight: 600,
                              color: DEPT_COLORS[d.deptCode] ?? T.primary,
                              background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                              borderRadius: '6px', padding: '1px 6px',
                            }}>
                              {d.deptCode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', width: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ProgressBar value={chargePct(s.charge)} max={100} color={niv.color} />
                          <span style={{ fontWeight: 700, color: niv.color, fontSize: '12px', flexShrink: 0 }}>
                            {s.charge}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <Badge tone={niv.tone}>{niv.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>
                      Aucun STAR trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
