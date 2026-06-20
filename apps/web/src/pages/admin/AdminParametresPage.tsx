import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

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

type Param = { key: string; value: string; label: string; description: string | null; type: string; unite: string; groupe: string }

const GROUPE_LABELS: Record<string, string> = {
  scoring: 'Algorithme de scoring',
  desistement: 'Désistements',
  notifications: 'Notifications',
  general: 'Général',
}

export default function AdminParametresPage() {
  const [params, setParams] = useState<Param[]>([])
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flash, setFlash] = useState('')

  const load = () =>
    api<Param[]>('/admin/parameters').then(setParams).catch(() => setParams([])).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await api(`/admin/parameters/${key}`, { method: 'PUT', body: JSON.stringify({ value: edits[key] }) })
      showFlash('Paramètre mis à jour')
      setEdits(e => { const n = { ...e }; delete n[key]; return n })
      load()
    } catch { showFlash('Erreur lors de la sauvegarde') } finally { setSaving(null) }
  }

  const handleToggle = async (key: string, current: string) => {
    const newVal = current === 'true' ? 'false' : 'true'
    setSaving(key)
    try {
      await api(`/admin/parameters/${key}`, { method: 'PUT', body: JSON.stringify({ value: newVal }) })
      setParams(prev => prev.map(p => p.key === key ? { ...p, value: newVal } : p))
    } catch { showFlash('Erreur') } finally { setSaving(null) }
  }

  const grouped = params.reduce<Record<string, Param[]>>((acc, p) => {
    const g = p.groupe ?? 'general'
    if (!acc[g]) acc[g] = []
    acc[g].push(p)
    return acc
  }, {})

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Paramètres</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Configuration globale de la plateforme</p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      {params.length === 0 && !loading && (
        <Card pad={24}>
          <div style={{ fontSize: '13px', color: T.muted, textAlign: 'center' }}>
            Aucun paramètre disponible. L'endpoint <code>/admin/parameters</code> n'est pas encore alimenté.
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {Object.entries(grouped).map(([groupe, items]) => (
          <div key={groupe}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '10px' }}>
              {GROUPE_LABELS[groupe] ?? groupe}
            </h2>
            <Card pad={0}>
              {items.map((p, idx) => {
                const val = edits[p.key] ?? p.value
                const dirty = edits[p.key] !== undefined && edits[p.key] !== p.value
                return (
                  <div key={p.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    padding: '16px 20px', borderBottom: idx < items.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{p.label}</div>
                      {p.description && <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{p.description}</div>}
                      <code style={{ fontSize: '11px', color: T.sub }}>{p.key}</code>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.type === 'toggle' ? (
                        <button
                          onClick={() => handleToggle(p.key, p.value)}
                          disabled={saving === p.key}
                          style={{
                            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: p.value === 'true' ? T.primary : T.border,
                            position: 'relative', transition: 'background 0.2s',
                          }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: '3px', left: p.value === 'true' ? '23px' : '3px',
                            transition: 'left 0.2s',
                          }} />
                        </button>
                      ) : p.type === 'range' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="range" min={0} max={100} step={5}
                            value={val}
                            onChange={e => setEdits(ed => ({ ...ed, [p.key]: e.target.value }))}
                            style={{ width: '100px', accentColor: T.primary }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink, minWidth: '36px', fontFamily: 'monospace' }}>
                            {val}{p.unite}
                          </span>
                          {dirty && (
                            <button onClick={() => handleSave(p.key)} disabled={saving === p.key} style={{
                              padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                              background: T.primary, color: '#fff', border: 'none', borderRadius: T.radiusSm,
                            }}>Sauv.</button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type={p.type === 'number' ? 'number' : 'text'}
                            value={val}
                            onChange={e => setEdits(ed => ({ ...ed, [p.key]: e.target.value }))}
                            style={{
                              width: '100px', padding: '6px 10px', fontSize: '13px', fontFamily: 'monospace',
                              border: `1.5px solid ${dirty ? T.primary : T.border}`,
                              borderRadius: T.radiusSm, outline: 'none',
                            }}
                          />
                          {p.unite && <span style={{ fontSize: '12px', color: T.muted }}>{p.unite}</span>}
                          {dirty && (
                            <button onClick={() => handleSave(p.key)} disabled={saving === p.key} style={{
                              padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                              background: T.primary, color: '#fff', border: 'none', borderRadius: T.radiusSm,
                            }}>Sauv.</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '10px' }}>
          Barème du scoring automatique
        </h2>
        <Card pad={20}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
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
