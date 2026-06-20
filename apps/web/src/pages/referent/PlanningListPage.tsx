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

export default function PlanningListPage() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const load = () => { setLoading(true); events.list().then(setEventList).finally(() => setLoading(false)) }

  useEffect(() => { load() }, [])

  const filtered = eventList.filter((e) => {
    if (tab === 'all') return e.statut !== 'ANNULE'
    if (tab === 'todo') return ['BROUILLON', 'EN_GENERATION', 'A_VALIDER'].includes(e.statut)
    if (tab === 'publie') return e.statut === 'PUBLIE'
    return true
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Planning
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Gestion des événements et affectations</p>
        </div>
        <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>
          Nouvel événement
        </Btn>
      </div>

      {showForm && (
        <EventForm
          onSaved={(ev) => { setShowForm(false); navigate(`/referent/planning/${ev.id}`) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <Tabs
        items={[
          { id: 'all', label: 'Tous' },
          { id: 'todo', label: 'À traiter' },
          { id: 'publie', label: 'Publiés' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Aucun événement</div>
        )}
        {filtered.map((ev) => (
          <Card key={ev.id} pad={20} hover onClick={() => navigate(`/referent/planning/${ev.id}`)}>
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
              <div style={{ color: T.muted, fontSize: '13px', marginLeft: '16px' }}>
                {ev.type}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
