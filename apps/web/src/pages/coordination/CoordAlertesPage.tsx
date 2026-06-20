import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

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

type Alerte = {
  id: string
  tone: 'danger' | 'warn' | 'primary'
  priorite: number
  titre: string
  detail: string
  action?: { label: string; path: string }
}

type Stats = {
  kpis: { desistementsLast30: number; starsSurcharge: number; tauxConfirmation: number; totalAssignments: number }
}

type Event = {
  id: number; nom: string; date: string; debut: string
  needs: { deptCode: string; requis: number }[]
  _count: { assignments: number }
}

type Star = { id: number; prenom: string; nom: string; charge: number; desist: number }

type Desistement = {
  id: number; deptCode: string
  star: { prenom: string; nom: string }
  event: { id: number; nom: string; date: string }
}

export default function CoordAlertesPage() {
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<Stats>('/stats/summary'),
      api<Event[]>('/events?upcoming=true'),
      api<Star[]>('/stars'),
      api<Desistement[]>('/assignments/desistees'),
    ]).then(([stats, events, stars, desist]) => {
      const list: Alerte[] = []
      const now = Date.now()

      // Taux de confirmation critique
      if (stats.kpis.tauxConfirmation < 50 && stats.kpis.totalAssignments > 0) {
        list.push({ id: 'taux-critique', tone: 'danger', priorite: 1,
          titre: `Taux de confirmation critique — ${stats.kpis.tauxConfirmation}%`,
          detail: 'Moins de 50% des STARs ont confirmé leur présence. Des relances sont nécessaires.',
        })
      }

      // Désistements urgents J-7
      const urgents = desist.filter(d => (new Date(d.event.date).getTime() - now) / 86400000 <= 7)
      if (urgents.length > 0) {
        list.push({ id: 'desist-urgent', tone: 'danger', priorite: 2,
          titre: `${urgents.length} désistement${urgents.length > 1 ? 's' : ''} tardif${urgents.length > 1 ? 's' : ''} — moins de 7 jours`,
          detail: urgents.map(d => `${d.star.prenom} ${d.star.nom} (${d.deptCode}) — ${d.event.nom}`).join(' · '),
          action: { label: 'Gérer', path: '/coordination/remplacements' },
        })
      }

      // Événements prochains sous-dotés
      const prochains = events.filter(ev => (new Date(ev.date).getTime() - now) / 86400000 <= 14)
      prochains.forEach(ev => {
        const requis = ev.needs.reduce((s, n) => s + n.requis, 0)
        if (ev._count.assignments < requis) {
          list.push({ id: `sous-dote-${ev.id}`, tone: 'danger', priorite: 3,
            titre: `Sous-dotation — ${ev.nom}`,
            detail: `${requis - ev._count.assignments} poste${requis - ev._count.assignments > 1 ? 's' : ''} non pourvu${requis - ev._count.assignments > 1 ? 's' : ''} · ${new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
            action: { label: 'Voir l\'événement', path: `/coordination/planning/${ev.id}` },
          })
        }
      })

      // STARs en surcharge
      if (stats.kpis.starsSurcharge > 0) {
        const surcharge = stars.filter(s => s.charge >= 4)
        list.push({ id: 'surcharge', tone: 'warn', priorite: 4,
          titre: `${stats.kpis.starsSurcharge} STAR${stats.kpis.starsSurcharge > 1 ? 's' : ''} en surcharge (charge ≥ 4/5)`,
          detail: surcharge.slice(0, 5).map(s => `${s.prenom} ${s.nom}`).join(', '),
          action: { label: 'Voir l\'équipe', path: '/coordination/equipe' },
        })
      }

      // Désistements en hausse (30 jours)
      if (stats.kpis.desistementsLast30 >= 5) {
        list.push({ id: 'desist-trend', tone: 'warn', priorite: 5,
          titre: `${stats.kpis.desistementsLast30} désistements sur les 30 derniers jours`,
          detail: 'Ce chiffre est supérieur au seuil recommandé. Vérifiez la charge des équipes.',
        })
      }

      // STARs avec nombreux désistements
      const mauvaiseFiab = stars.filter(s => s.desist >= 3)
      if (mauvaiseFiab.length > 0) {
        list.push({ id: 'fiab-critique', tone: 'primary', priorite: 6,
          titre: `${mauvaiseFiab.length} STAR${mauvaiseFiab.length > 1 ? 's' : ''} avec 3 désistements ou plus`,
          detail: mauvaiseFiab.slice(0, 4).map(s => `${s.prenom} ${s.nom} (${s.desist}x)`).join(', '),
        })
      }

      setAlertes(list.sort((a, b) => a.priorite - b.priorite))
    }).finally(() => setLoading(false))
  }, [])

  const TONE_STYLES: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    danger:  { bg: T.dangerSoft, border: T.danger + '33', color: T.danger, dot: T.danger },
    warn:    { bg: T.warnSoft, border: T.warn + '33', color: T.warn, dot: T.warn },
    primary: { bg: T.primarySoft, border: T.primary + '33', color: T.primary, dot: T.primary },
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Alertes critiques</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          {alertes.length === 0 ? 'Aucune alerte active' : `${alertes.length} alerte${alertes.length > 1 ? 's' : ''} active${alertes.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {alertes.length === 0 && (
        <Card pad={48}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✓</div>
            Aucune alerte critique — la coordination est en ordre
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alertes.map(a => {
          const s = TONE_STYLES[a.tone]
          return (
            <div key={a.id} style={{
              padding: '16px 20px', borderRadius: T.radius,
              background: s.bg, border: `1.5px solid ${s.border}`,
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot, marginTop: '5px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: T.ink, marginBottom: '3px' }}>{a.titre}</div>
                <div style={{ fontSize: '12px', color: T.sub }}>{a.detail}</div>
              </div>
              {a.action && (
                <button onClick={() => navigate(a.action!.path)} style={{
                  padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${s.color}`, borderRadius: T.radiusSm,
                  background: 'none', color: s.color, whiteSpace: 'nowrap',
                }}>
                  {a.action.label}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
