import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { events, type EventSummary } from '@/lib/api'
import { T } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function DateBox({ date }: { date: string }) {
  const d = new Date(date)
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit' })
  const month = d.toLocaleDateString('fr-FR', { month: 'short' })
  return (
    <div style={{
      width: '50px', flexShrink: 0, textAlign: 'center',
      background: T.primarySoft, borderRadius: T.radius, padding: '8px 4px',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: T.primary, lineHeight: 1 }}>{day}</div>
      <div style={{ fontSize: '11px', color: T.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{month}</div>
    </div>
  )
}

export default function CoordValidationsPage() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    events.list().then(all => {
      setEventList(all.filter(e => e.statut === 'A_VALIDER').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Validations planning
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Plannings générés en attente de validation avant publication
        </p>
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>}

      {!loading && eventList.length === 0 && (
        <Card pad={40}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            Aucun planning en attente de validation
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {eventList.map((ev) => {
          const daysLeft = Math.ceil((new Date(ev.date).getTime() - Date.now()) / 86400000)
          const urgent = daysLeft <= 7
          return (
            <Card key={ev.id} pad={20} style={{ border: urgent ? `1.5px solid ${T.warn}` : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <DateBox date={ev.date} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: T.ink }}>{ev.nom}</span>
                    <Badge tone="warn">À valider</Badge>
                    {urgent && <Badge tone="danger">J-{daysLeft}</Badge>}
                  </div>
                  <div style={{ fontSize: '13px', color: T.sub }}>
                    {fmt(ev.date)} · {ev.debut}–{ev.fin} · {ev.lieu}
                  </div>
                  <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{ev.type}</div>
                </div>
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/coordination/planning/${ev.id}`)}
                >
                  Examiner
                </Btn>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
