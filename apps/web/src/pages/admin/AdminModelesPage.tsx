import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
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

type Template = {
  id: number
  nom: string
  actif: boolean
  needs: { id: number; deptCode: string; requis: number }[]
}

export default function AdminModelesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [newNom, setNewNom] = useState('')

  const load = () => api<Template[]>('/admin/templates').then(setTemplates).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const handleToggle = async (id: number, actif: boolean) => {
    setToggling(id)
    try {
      const updated = await api<Template>(`/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify({ actif }) })
      setTemplates(prev => prev.map(t => t.id === id ? updated : t))
    } catch { showFlash('Erreur') } finally { setToggling(null) }
  }

  const handleCreate = async () => {
    if (!newNom.trim()) return
    setCreating(true)
    try {
      const tpl = await api<Template>('/admin/templates', { method: 'POST', body: JSON.stringify({ nom: newNom.trim() }) })
      setTemplates(prev => [...prev, tpl])
      setNewNom('')
      showFlash('Modèle créé')
    } catch { showFlash('Erreur') } finally { setCreating(false) }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Modèles d'événements</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Gabarits de besoins par département pour chaque type de service</p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={newNom}
          onChange={e => setNewNom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="Nom du nouveau modèle…"
          style={{
            flex: 1, maxWidth: '320px', padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newNom.trim()}
          style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            background: T.primary, color: '#fff', border: 'none', borderRadius: T.radiusSm,
            opacity: creating || !newNom.trim() ? 0.5 : 1,
          }}
        >
          + Créer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {templates.map(t => (
          <Card key={t.id} pad={20}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: t.actif ? T.ink : T.muted, marginBottom: '8px' }}>{t.nom}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {t.needs.length === 0 && <span style={{ fontSize: '12px', color: T.muted }}>Aucun besoin configuré</span>}
                  {t.needs.map(n => (
                    <span key={n.id} style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px',
                      color: DEPT_COLORS[n.deptCode] ?? T.primary,
                      background: (DEPT_COLORS[n.deptCode] ?? T.primary) + '18',
                    }}>
                      {n.deptCode} ×{n.requis}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleToggle(t.id, !t.actif)}
                disabled={toggling === t.id}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: t.actif ? T.primary : T.border,
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px', left: t.actif ? '23px' : '3px',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </Card>
        ))}
        {templates.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: T.muted, fontSize: '13px' }}>
            Aucun modèle créé
          </div>
        )}
      </div>
    </div>
  )
}
