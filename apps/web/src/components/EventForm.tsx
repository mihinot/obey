import { useState, useEffect } from 'react'
import { ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string, init?: RequestInit): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers as object) },
  }).then(async (r) => {
    if (!r.ok) throw new ApiError(r.status, await r.json())
    return r.json()
  })
}

type Need = { deptCode: string; requis: number }

type EventFormData = {
  nom: string; type: string; date: string; debut: string; fin: string; lieu: string
  needs: Need[]
}

type EventFormProps = {
  initial?: Partial<EventFormData> & { id?: number }
  onSaved: (event: { id: number }) => void
  onCancel: () => void
}

type Dept = { code: string; nom: string; couleur: string }

const EVENT_TYPES = ['Culte dominical', 'Culte spécial', 'Concert', 'Formation', 'Réunion', 'Autre']

export function EventForm({ initial, onSaved, onCancel }: EventFormProps) {
  const isEdit = !!initial?.id
  const [depts, setDepts] = useState<Dept[]>([])
  const [form, setForm] = useState<EventFormData>({
    nom: initial?.nom ?? '',
    type: initial?.type ?? 'Culte dominical',
    date: initial?.date ? new Date(initial.date).toISOString().split('T')[0] : '',
    debut: initial?.debut ?? '09:00',
    fin: initial?.fin ?? '12:00',
    lieu: initial?.lieu ?? '',
    needs: initial?.needs ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Dept[]>('/admin/departments').then(setDepts).catch(() => {})
  }, [])

  const setField = (field: keyof EventFormData, value: EventFormData[keyof EventFormData]) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleDept = (code: string) => {
    setForm(f => {
      const has = f.needs.find(n => n.deptCode === code)
      return {
        ...f,
        needs: has
          ? f.needs.filter(n => n.deptCode !== code)
          : [...f.needs, { deptCode: code, requis: 1 }],
      }
    })
  }

  const setReqis = (code: string, val: number) => {
    setForm(f => ({
      ...f,
      needs: f.needs.map(n => n.deptCode === code ? { ...n, requis: Math.max(1, val) } : n),
    }))
  }

  const handleSubmit = async () => {
    if (!form.nom || !form.date || !form.debut || !form.fin) {
      setError('Nom, date et horaires sont requis')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        date: new Date(form.date).toISOString(),
        needs: form.needs.filter(n => n.requis > 0),
      }
      let saved: { id: number }
      if (isEdit) {
        saved = await api(`/events/${initial.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        saved = await api('/events', { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved(saved)
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.5)',
      zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={{
        background: '#fff', borderRadius: T.radiusLg, width: '100%', maxWidth: '540px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink }}>
            {isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.muted }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 14px', background: T.dangerSoft, borderRadius: T.radiusSm, fontSize: '13px', color: T.danger }}>
              {error}
            </div>
          )}

          {/* Nom */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Nom *</label>
            <input
              value={form.nom}
              onChange={e => setField('nom', e.target.value)}
              placeholder="Ex: Culte du dimanche 15 juin"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Type</label>
            <select
              value={form.type}
              onChange={e => setField('type', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', background: '#fff' }}
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setField('date', e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Horaires */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Début *</label>
              <input
                type="time"
                value={form.debut}
                onChange={e => setField('debut', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Fin *</label>
              <input
                type="time"
                value={form.fin}
                onChange={e => setField('fin', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Lieu</label>
            <input
              value={form.lieu}
              onChange={e => setField('lieu', e.target.value)}
              placeholder="Ex: Salle principale"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Besoins par département */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '8px' }}>
              Besoins par département
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {depts.map(dept => {
                const code = dept.code
                const need = form.needs.find(n => n.deptCode === code)
                const selected = !!need
                const color = dept.couleur ? dept.couleur : (DEPT_COLORS[code] ?? T.primary)
                return (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => toggleDept(code)}
                      style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${selected ? color : T.border}`,
                        background: selected ? color + '18' : '#fff',
                        color: selected ? color : T.muted,
                      }}
                    >{code}</button>
                    {selected && (
                      <input
                        type="number" min={1} max={20} value={need!.requis}
                        onChange={e => setReqis(code, parseInt(e.target.value) || 1)}
                        style={{
                          width: '40px', padding: '4px 6px', fontSize: '12px', textAlign: 'center',
                          border: `1.5px solid ${color}`, borderRadius: '6px', outline: 'none',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, background: '#fff', color: T.sub,
          }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 2, padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            border: 'none', borderRadius: T.radiusSm, background: T.primary, color: '#fff',
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer l\'événement'}
          </button>
        </div>
      </div>
    </div>
  )
}
