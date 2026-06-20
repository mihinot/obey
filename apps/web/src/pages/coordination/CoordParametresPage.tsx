import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? ''

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

type Param = { key: string; value: string; description: string | null }

const PARAM_LABELS: Record<string, string> = {
  DESIST_THRESHOLD_DAYS: 'Seuil désistement tardif (jours)',
  MAX_CHARGE: 'Charge maximale autorisée',
  FIAB_WEIGHT: 'Poids fiabilité dans le scoring',
  CHARGE_WEIGHT: 'Poids charge dans le scoring',
  DEPT_WEIGHT: 'Poids département dans le scoring',
  NOTIFY_EMAIL: 'Notifications par email',
  NOTIFY_WHATSAPP: 'Notifications WhatsApp',
}

export default function CoordParametresPage() {
  const [params, setParams] = useState<Param[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flash, setFlash] = useState('')

  const load = () =>
    api<Param[]>('/admin/parameters')
      .then(setParams)
      .catch(() => setParams([]))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await api(`/admin/parameters/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: edits[key] }),
      })
      showFlash(`Paramètre "${key}" mis à jour`)
      setEdits(e => { const n = { ...e }; delete n[key]; return n })
      load()
    } catch {
      showFlash('Erreur lors de la sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Paramètres</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Configuration globale de la plateforme</p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok, marginBottom: '16px',
        }}>
          {flash}
        </div>
      )}

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      {!loading && params.length === 0 && (
        <Card pad={24}>
          <div style={{ fontSize: '13px', color: T.muted, textAlign: 'center' }}>
            Aucun paramètre disponible. L'endpoint <code>/admin/parameters</code> n'est pas encore implémenté.
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {params.map(p => {
          const label = PARAM_LABELS[p.key] ?? p.key
          const val = edits[p.key] ?? p.value
          const dirty = edits[p.key] !== undefined && edits[p.key] !== p.value
          return (
            <Card key={p.key} pad={20}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{label}</div>
                  {p.description && (
                    <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{p.description}</div>
                  )}
                  <code style={{ fontSize: '11px', color: T.sub }}>{p.key}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    value={val}
                    onChange={e => setEdits(ed => ({ ...ed, [p.key]: e.target.value }))}
                    style={{
                      width: '120px', padding: '6px 10px', fontSize: '13px',
                      border: `1.5px solid ${dirty ? T.primary : T.border}`,
                      borderRadius: T.radiusSm, outline: 'none', fontFamily: 'monospace',
                    }}
                  />
                  {dirty && (
                    <Btn variant="primary" size="sm" loading={saving === p.key} onClick={() => handleSave(p.key)}>
                      Sauv.
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Scoring weights info */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
          Algorithme de scoring
        </h2>
        <Card pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Disponible', pts: '+40', color: T.ok },
              { label: 'Département correspondant', pts: '+25', color: T.ok },
              { label: 'Charge faible', pts: '+20', color: T.ok },
              { label: 'Fiabilité élevée', pts: '+10', color: T.ok },
              { label: 'Pas de conflit récent', pts: '+5', color: T.ok },
              { label: 'Conflit d\'horaire', pts: '−20', color: T.danger },
              { label: 'Charge modérée (≥3)', pts: '−15', color: T.warn },
              { label: 'Charge élevée (≥4)', pts: '−30', color: T.danger },
              { label: 'Désistement récent', pts: '−10', color: T.warn },
              { label: 'Statut Occasionnel', pts: '−10', color: T.warn },
              { label: 'Statut Nouveau', pts: '−15', color: T.warn },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.ink }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color, fontFamily: 'monospace' }}>{row.pts}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
