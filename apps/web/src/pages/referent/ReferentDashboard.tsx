import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { events, stars, type EventSummary, type Star } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function statutTone(s: string): 'warn' | 'ok' | 'primary' | 'muted' | 'danger' {
  if (s === 'BROUILLON') return 'muted'
  if (s === 'EN_GENERATION') return 'warn'
  if (s === 'A_VALIDER') return 'warn'
  if (s === 'PUBLIE') return 'ok'
  if (s === 'ANNULE') return 'danger'
  return 'muted'
}

function statutLabel(s: string) {
  const map: Record<string, string> = {
    BROUILLON: 'Brouillon', EN_GENERATION: 'En génération',
    A_VALIDER: 'À valider', PUBLIE: 'Publié', ANNULE: 'Annulé',
  }
  return map[s] ?? s
}

export default function ReferentDashboard() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventSummary[]>([])
  const [starList, setStarList] = useState<Star[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([events.list(), stars.list()])
      .then(([e, s]) => { setEventList(e); setStarList(s) })
      .finally(() => setLoading(false))
  }, [])

  const actifs = starList.filter((s) => s.statut === 'Actif').length
  const occasionnels = starList.filter((s) => s.statut === 'Occasionnel').length
  const enAttente = starList.filter((s) => s.statut === 'EnAttente').length
  const aValider = eventList.filter((e) => e.statut === 'A_VALIDER').length
  const prochains = [...eventList]
    .filter((e) => e.statut !== 'ANNULE')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  // charge par dept
  const deptCharges: Record<string, { total: number; count: number }> = {}
  starList.forEach((s) => {
    s.departments.forEach((d) => {
      if (!deptCharges[d.deptCode]) deptCharges[d.deptCode] = { total: 0, count: 0 }
      deptCharges[d.deptCode].total += s.charge
      deptCharges[d.deptCode].count += 1
    })
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: T.muted }}>
      Chargement…
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Vue d'ensemble de votre espace</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Actifs', value: actifs, color: T.primary },
          { label: 'Occasionnels', value: occasionnels, color: T.accent },
          { label: 'En attente', value: enAttente, color: T.warn },
          { label: 'À valider', value: aValider, color: T.danger },
        ].map((kpi) => (
          <Card key={kpi.label} pad={20}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '32px', color: kpi.color }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '12.5px', color: T.sub, marginTop: '4px' }}>{kpi.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Événements */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>
              Prochains événements
            </h2>
            <Btn variant="soft" size="sm" icon="plus" onClick={() => navigate('/referent/planning')}>
              Nouveau
            </Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {prochains.length === 0 && (
              <div style={{ fontSize: '13px', color: T.muted, padding: '20px 0' }}>Aucun événement</div>
            )}
            {prochains.map((ev) => (
              <Card key={ev.id} pad={16} hover onClick={() => navigate(`/referent/planning/${ev.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{ev.nom}</div>
                    <div style={{ fontSize: '12.5px', color: T.sub, marginTop: '2px' }}>
                      {fmt(ev.date)} · {ev.debut}–{ev.fin} · {ev.lieu}
                    </div>
                  </div>
                  <Badge tone={statutTone(ev.statut)}>{statutLabel(ev.statut)}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charge par département */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink, marginBottom: '14px' }}>
            Charge moyenne / dept
          </h2>
          <Card pad={20}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(deptCharges).map(([dept, { total, count }]) => {
                const avg = count > 0 ? total / count : 0
                const color = DEPT_COLORS[dept] ?? T.primary
                return (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 600, color }}>{dept}</span>
                      <span style={{ color: T.sub }}>{avg.toFixed(1)} / 5</span>
                    </div>
                    <ProgressBar value={avg} max={5} color={color} height={6} />
                  </div>
                )
              })}
              {Object.keys(deptCharges).length === 0 && (
                <div style={{ fontSize: '13px', color: T.muted }}>Aucune donnée</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
