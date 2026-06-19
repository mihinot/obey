import React, { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { Field } from '@/components/primitives/Field'
import { me, type Availability } from '@/lib/meApi'
import { T } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StarIndispos() {
  const [list, setList] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = () => me.availabilities().then(setList).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!dateFrom || !dateTo) { setError('Les deux dates sont requises.'); return }
    if (new Date(dateTo) < new Date(dateFrom)) { setError('La date de fin doit être après la date de début.'); return }
    setSaving(true)
    try {
      await me.addAvailability({ dateFrom, dateTo, motif })
      setShowForm(false)
      setDateFrom(''); setDateTo(''); setMotif('')
      load()
    } catch {
      setError('Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await me.deleteAvailability(id)
      load()
    } finally {
      setDeletingId(null)
    }
  }

  const now = new Date()
  const upcoming = list.filter((a) => new Date(a.dateTo) >= now)
  const past = list.filter((a) => new Date(a.dateTo) < now)

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
            Indisponibilités
          </div>
          <div style={{ fontSize: '13px', color: T.sub, marginTop: '2px' }}>
            Déclarez vos absences
          </div>
        </div>
        <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>
          Ajouter
        </Btn>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card pad={16} style={{ marginBottom: '20px', border: `1px solid ${T.primary}40` }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '14px' }}>
            Nouvelle indisponibilité
          </div>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Date de début" type="date" value={dateFrom} onChange={setDateFrom} />
              <Field label="Date de fin" type="date" value={dateTo} onChange={setDateTo} />
              <Field label="Motif (optionnel)" value={motif} onChange={setMotif} placeholder="Vacances, formation…" />
            </div>
            {error && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: T.danger }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <Btn variant="outline" full onClick={() => setShowForm(false)}>Annuler</Btn>
              <Btn type="submit" variant="primary" full loading={saving}>Enregistrer</Btn>
            </div>
          </form>
        </Card>
      )}

      {loading && <div style={{ fontSize: '13px', color: T.muted }}>Chargement…</div>}

      {/* Prochaines */}
      {upcoming.length > 0 && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '10px' }}>
            À venir
          </div>
          {upcoming.map((a) => (
            <div key={a.id} style={{
              background: '#fff', borderRadius: T.radius, padding: '14px 16px',
              marginBottom: '8px', border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13.5px', color: T.ink }}>
                  {fmt(a.dateFrom)}
                  {a.dateFrom !== a.dateTo && <> → {fmt(a.dateTo)}</>}
                </div>
                {a.motif && <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>{a.motif}</div>}
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, fontSize: '13px', padding: '4px 8px' }}
              >
                {deletingId === a.id ? '…' : '✕'}
              </button>
            </div>
          ))}
        </>
      )}

      {!loading && upcoming.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '14px' }}>Aucune indisponibilité déclarée</div>
        </div>
      )}

      {past.length > 0 && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.muted, marginTop: '24px', marginBottom: '10px' }}>
            Passées
          </div>
          {past.map((a) => (
            <div key={a.id} style={{
              background: '#fff', borderRadius: T.radius, padding: '12px 16px',
              marginBottom: '6px', opacity: 0.5, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: '13px', color: T.ink }}>
                {fmt(a.dateFrom)}{a.dateFrom !== a.dateTo && <> → {fmt(a.dateTo)}</>}
              </div>
              {a.motif && <div style={{ fontSize: '12px', color: T.sub }}>{a.motif}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
