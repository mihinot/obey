import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Tabs } from '@/components/primitives/Tabs'
import { EventForm } from '@/components/EventForm'
import { events, type EventSummary } from '@/lib/api'
import { T } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUT_TONE: Record<string, 'warn' | 'ok' | 'primary' | 'muted' | 'danger'> = {
  BROUILLON: 'muted', EN_GENERATION: 'warn', A_VALIDER: 'warn', PUBLIE: 'ok', ANNULE: 'danger',
}
const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon', EN_GENERATION: 'En génération', A_VALIDER: 'À valider', PUBLIE: 'Publié', ANNULE: 'Annulé',
}

const STATUT_COLORS: Record<string, string> = {
  BROUILLON: T.muted, EN_GENERATION: T.warn, A_VALIDER: T.warn, PUBLIE: T.ok, ANNULE: T.danger,
}

// ── Vue Liste ────────────────────────────────────────────────────────────────
function ListView({ events: list, onNavigate }: { events: EventSummary[]; onNavigate: (id: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {list.map((ev) => (
        <Card key={ev.id} pad={20} hover onClick={() => onNavigate(ev.id)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px', color: T.ink }}>{ev.nom}</span>
                <Badge tone={STATUT_TONE[ev.statut] ?? 'muted'}>{STATUT_LABEL[ev.statut] ?? ev.statut}</Badge>
              </div>
              <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
                {fmt(ev.date)} · {ev.debut}–{ev.fin} · {ev.lieu}
              </div>
            </div>
            <div style={{ color: T.muted, fontSize: '13px', marginLeft: '16px' }}>{ev.type}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── Vue Tableau ───────────────────────────────────────────────────────────────
function TableView({ events: list, onNavigate }: { events: EventSummary[]; onNavigate: (id: number) => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.border}` }}>
            {['Date', 'Événement', 'Type', 'Horaires', 'Lieu', 'Statut'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: T.sub, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((ev, idx) => (
            <tr
              key={ev.id}
              onClick={() => onNavigate(ev.id)}
              style={{ borderBottom: `1px solid ${T.border}`, background: idx % 2 === 0 ? '#fff' : T.bg, cursor: 'pointer' }}
            >
              <td style={{ padding: '10px 14px', fontWeight: 600, color: T.ink, whiteSpace: 'nowrap' }}>
                {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </td>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: T.ink }}>{ev.nom}</td>
              <td style={{ padding: '10px 14px', color: T.sub }}>{ev.type}</td>
              <td style={{ padding: '10px 14px', color: T.sub, whiteSpace: 'nowrap' }}>{ev.debut}–{ev.fin}</td>
              <td style={{ padding: '10px 14px', color: T.sub }}>{ev.lieu}</td>
              <td style={{ padding: '10px 14px' }}>
                <Badge tone={STATUT_TONE[ev.statut] ?? 'muted'}>{STATUT_LABEL[ev.statut] ?? ev.statut}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>Aucun événement</div>
      )}
    </div>
  )
}

// ── Vue Calendrier ────────────────────────────────────────────────────────────
function CalendarView({ events: list, onNavigate }: { events: EventSummary[]; onNavigate: (id: number) => void }) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = month.getFullYear()
  const monthNum = month.getMonth()
  const firstDay = new Date(year, monthNum, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // lundi = 0
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate()

  const eventsByDay: Record<number, EventSummary[]> = {}
  list.forEach(ev => {
    const d = new Date(ev.date)
    if (d.getFullYear() === year && d.getMonth() === monthNum) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(ev)
    }
  })

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()

  return (
    <div>
      {/* Nav mois */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={() => setMonth(new Date(year, monthNum - 1, 1))}
          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '6px 12px', cursor: 'pointer', color: T.ink, fontSize: '13px' }}
        >
          ←
        </button>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: T.ink, textTransform: 'capitalize' }}>
          {month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => setMonth(new Date(year, monthNum + 1, 1))}
          style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: '6px 12px', cursor: 'pointer', color: T.ink, fontSize: '13px' }}
        >
          →
        </button>
      </div>

      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: T.muted, padding: '4px' }}>{d}</div>
        ))}
      </div>

      {/* Cellules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, i) => {
          const isToday = day !== null && today.getDate() === day && today.getMonth() === monthNum && today.getFullYear() === year
          const dayEvents = day !== null ? (eventsByDay[day] ?? []) : []
          return (
            <div
              key={i}
              style={{
                minHeight: '80px',
                background: day === null ? 'transparent' : isToday ? T.primarySoft : '#fff',
                border: day === null ? 'none' : `1px solid ${isToday ? T.primary + '44' : T.border}`,
                borderRadius: T.radiusSm,
                padding: '6px',
              }}
            >
              {day !== null && (
                <>
                  <div style={{
                    fontSize: '12px', fontWeight: isToday ? 700 : 400,
                    color: isToday ? T.primary : T.sub,
                    marginBottom: '4px',
                  }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => onNavigate(ev.id)}
                        title={ev.nom}
                        style={{
                          background: STATUT_COLORS[ev.statut] + '20',
                          borderLeft: `2.5px solid ${STATUT_COLORS[ev.statut]}`,
                          borderRadius: '3px',
                          padding: '2px 4px',
                          fontSize: '10px', fontWeight: 600,
                          color: STATUT_COLORS[ev.statut],
                          cursor: 'pointer',
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.nom}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: '10px', color: T.muted, paddingLeft: '4px' }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PlanningListPage() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('liste')
  const [showForm, setShowForm] = useState(false)

  const load = () => { setLoading(true); events.list().then(setEventList).finally(() => setLoading(false)) }

  useEffect(() => { load() }, [])

  const filtered = eventList.filter((e) => {
    if (filter === 'all') return e.statut !== 'ANNULE'
    if (filter === 'todo') return ['BROUILLON', 'EN_GENERATION', 'A_VALIDER'].includes(e.statut)
    if (filter === 'publie') return e.statut === 'PUBLIE'
    return true
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const handleNavigate = (id: number) => {
    const base = window.location.pathname.startsWith('/coordination') ? '/coordination' : '/referent'
    navigate(`${base}/planning/${id}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Planning
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Gestion des événements et affectations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sélecteur de vue */}
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: 'hidden' }}>
            {[{ id: 'liste', label: '☰' }, { id: 'tableau', label: '⊞' }, { id: 'calendrier', label: '📅' }].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                title={v.id.charAt(0).toUpperCase() + v.id.slice(1)}
                style={{
                  padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '14px',
                  background: view === v.id ? T.primarySoft : '#fff',
                  color: view === v.id ? T.primary : T.muted,
                  borderRight: v.id !== 'calendrier' ? `1px solid ${T.border}` : 'none',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>
            Nouvel événement
          </Btn>
        </div>
      </div>

      {showForm && (
        <EventForm
          onSaved={(ev) => {
            setShowForm(false)
            handleNavigate(ev.id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <Tabs
        items={[
          { id: 'all', label: 'Tous' },
          { id: 'todo', label: 'À traiter' },
          { id: 'publie', label: 'Publiés' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div style={{ marginTop: '16px' }}>
        {loading && <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>}
        {!loading && filtered.length === 0 && view !== 'calendrier' && (
          <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Aucun événement</div>
        )}
        {!loading && view === 'liste' && <ListView events={filtered} onNavigate={handleNavigate} />}
        {!loading && view === 'tableau' && <TableView events={filtered} onNavigate={handleNavigate} />}
        {!loading && view === 'calendrier' && <CalendarView events={filtered} onNavigate={handleNavigate} />}
      </div>
    </div>
  )
}
