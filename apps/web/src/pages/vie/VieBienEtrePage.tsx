import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { stars, type Star } from '@/lib/api'
import { T } from '@/tokens'

const VIE_ACCENT = '#4fa57e'

// charge is an integer 0-N (count of services). Thresholds: >=4 critical, >=2 elevated.
function chargeNiveau(charge: number): { label: string; color: string; tone: 'ok' | 'warn' | 'danger' | 'muted' } {
  if (charge >= 4) return { label: 'Critique', color: T.danger, tone: 'danger' }
  if (charge >= 2) return { label: 'Élevée', color: T.warn, tone: 'warn' }
  if (charge === 1) return { label: 'Normale', color: T.ok, tone: 'ok' }
  return { label: 'Disponible', color: VIE_ACCENT, tone: 'ok' }
}

function chargePct(charge: number) { return Math.min(100, Math.round(charge * 20)) }

function DonutChart({ value, max, size = 120 }: { value: number; max: number; size?: number }) {
  const pct = max === 0 ? 0 : Math.min(1, value / max)
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth="12" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={VIE_ACCENT} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
      />
    </svg>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100)
  return (
    <div style={{ flex: 1, height: '7px', background: T.border, borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px' }} />
    </div>
  )
}

export default function VieBienEtrePage() {
  const navigate = useNavigate()
  const [starList, setStarList] = useState<Star[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stars.list({ statut: 'Actif' }).then(setStarList).finally(() => setLoading(false))
  }, [])

  const total = starList.length
  const surcharges = starList.filter(s => s.charge >= 2)
  const peu = starList.filter(s => s.charge === 0)
  const multi = starList.filter(s => s.departments.length >= 2)
  const equilibres = starList.filter(s => s.charge === 1).length

  if (loading) return <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Bien-être des STARs
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Veille sur l'équilibre de service de chacun
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: '16px', alignItems: 'start', marginBottom: '20px' }}>
        {/* Donut équilibre global */}
        <Card pad={20} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>Équilibre global</div>
          <div style={{ position: 'relative' }}>
            <DonutChart value={equilibres} max={total} size={140} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: VIE_ACCENT }}>
                {total > 0 ? Math.round((equilibres / total) * 100) : 0}%
              </span>
              <span style={{ fontSize: '11px', color: T.muted }}>équilibrés</span>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: T.sub, textAlign: 'center' }}>
            {equilibres} STARs sur {total} ont une charge saine
          </div>
        </Card>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Surchargés', value: surcharges.length, sub: 'charge élevée/critique', color: T.danger },
            { label: 'Peu sollicités', value: peu.length, sub: 'à mobiliser', color: T.primary },
            { label: 'Multi-depts', value: multi.length, sub: 'à surveiller', color: T.warn },
            { label: 'Total STARs', value: total, sub: 'suivis', color: VIE_ACCENT },
          ].map(k => (
            <Card key={k.label} pad={18}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '26px', color: k.color }}>{k.value}</div>
              <div style={{ fontWeight: 600, fontSize: '12px', color: T.ink, marginTop: '2px' }}>{k.label}</div>
              <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{k.sub}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* STARs en surcharge */}
      {surcharges.length > 0 && (
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>STARs en surcharge</div>
            <button
              onClick={() => navigate('/vie/alertes')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: VIE_ACCENT, fontWeight: 600, fontSize: '13px' }}
            >
              Voir les alertes →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {surcharges.sort((a, b) => b.charge - a.charge).slice(0, 8).map(s => {
              const niv = chargeNiveau(s.charge)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={`${s.prenom} ${s.nom}`} size={34} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '13.5px', color: T.ink }}>{s.prenom} {s.nom}</span>
                  <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ProgressBar value={chargePct(s.charge)} max={100} color={niv.color} />
                    <span style={{ fontWeight: 700, color: niv.color, fontSize: '12px', width: '30px' }}>{s.charge}</span>
                  </div>
                  <Badge tone={niv.tone}>{niv.label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
