import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

type Desistement = {
  id: number; deptCode: string
  star: { prenom: string; nom: string }
  event: { id: number; nom: string; date: string; debut: string }
}

type Event = {
  id: number; nom: string; date: string; debut: string
  needs: { deptCode: string; requis: number }[]
  _count: { assignments: number }
  activeAssignments: number
}

type Star = { id: number; prenom: string; nom: string; charge: number; desist: number; departments: { deptCode: string }[] }

type Alerte = {
  id: string
  tone: 'danger' | 'warn' | 'primary'
  titre: string
  detail: string
  action?: { label: string; path: string }
}

export default function AlertesPage() {
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<Desistement[]>('/assignments/desistees'),
      api<Event[]>('/events?upcoming=true'),
      api<Star[]>('/stars'),
    ]).then(([desist, events, stars]) => {
      const list: Alerte[] = []
      const now = Date.now()

      // Désistements urgents (J-7)
      const urgents = desist.filter(d => {
        const days = (new Date(d.event.date).getTime() - now) / (1000 * 60 * 60 * 24)
        return days <= 7
      })
      if (urgents.length > 0) {
        list.push({
          id: 'desist-urgent',
          tone: 'danger',
          titre: `${urgents.length} désistement${urgents.length > 1 ? 's' : ''} tardif${urgents.length > 1 ? 's' : ''} — J-7`,
          detail: urgents.map(d => `${d.star.prenom} ${d.star.nom} (${d.deptCode}) — ${d.event.nom}`).join(' · '),
          action: { label: 'Gérer les remplacements', path: '/referent/remplacements' },
        })
      }

      // Désistements non urgents
      const nonUrgents = desist.filter(d => {
        const days = (new Date(d.event.date).getTime() - now) / (1000 * 60 * 60 * 24)
        return days > 7
      })
      if (nonUrgents.length > 0) {
        list.push({
          id: 'desist-normal',
          tone: 'warn',
          titre: `${nonUrgents.length} désistement${nonUrgents.length > 1 ? 's' : ''} à traiter`,
          detail: nonUrgents.slice(0, 3).map(d => `${d.star.prenom} ${d.star.nom} — ${d.event.nom}`).join(' · '),
          action: { label: 'Voir les remplacements', path: '/referent/remplacements' },
        })
      }

      // Événements sous-dotés (moins d'affectations actives que requis)
      events.forEach(ev => {
        const totalReqis = ev.needs.reduce((s, n) => s + n.requis, 0)
        const actives = ev.activeAssignments ?? ev._count.assignments
        if (actives < totalReqis) {
          const manque = totalReqis - actives
          list.push({
            id: `sous-dote-${ev.id}`,
            tone: 'warn',
            titre: `Sous-dotation — ${ev.nom}`,
            detail: `${manque} poste${manque > 1 ? 's' : ''} non pourvu${manque > 1 ? 's' : ''} · ${new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
            action: { label: 'Voir l\'événement', path: `/referent/planning/${ev.id}` },
          })
        }
      })

      // STARs en surcharge (charge >= 4)
      const surcharge = stars.filter(s => s.charge >= 4)
      if (surcharge.length > 0) {
        list.push({
          id: 'surcharge',
          tone: 'warn',
          titre: `${surcharge.length} STAR${surcharge.length > 1 ? 's' : ''} en surcharge (charge ≥ 4/5)`,
          detail: surcharge.slice(0, 4).map(s => `${s.prenom} ${s.nom}`).join(', '),
          action: { label: 'Voir l\'équipe', path: '/referent/equipe' },
        })
      }

      // STARs avec nombreux désistements (> 2)
      const mauvaiseFiab = stars.filter(s => s.desist > 2)
      if (mauvaiseFiab.length > 0) {
        list.push({
          id: 'fiab',
          tone: 'primary',
          titre: `${mauvaiseFiab.length} STAR${mauvaiseFiab.length > 1 ? 's' : ''} avec plus de 2 désistements`,
          detail: mauvaiseFiab.slice(0, 4).map(s => `${s.prenom} ${s.nom} (${s.desist})`).join(', '),
        })
      }

      setAlertes(list)
    }).finally(() => setLoading(false))
  }, [])

  const TONE_STYLES: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    danger:  { bg: T.dangerSoft, border: T.danger + '33', color: T.danger, dot: T.danger },
    warn:    { bg: T.warnSoft,   border: T.warn + '33',   color: T.warn,   dot: T.warn },
    primary: { bg: T.primarySoft, border: T.primary + '33', color: T.primary, dot: T.primary },
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Alertes</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          {alertes.length === 0 ? 'Aucune alerte active' : `${alertes.length} alerte${alertes.length > 1 ? 's' : ''} active${alertes.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {alertes.length === 0 && (
        <Card pad={40}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✓</div>
            Tout est en ordre — aucune alerte à traiter
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
                <button
                  onClick={() => navigate(a.action!.path)}
                  style={{
                    padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${s.color}`, borderRadius: T.radiusSm,
                    background: 'none', color: s.color, whiteSpace: 'nowrap',
                  }}
                >
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
