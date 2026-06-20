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

type Department = {
  code: string
  nom: string
  couleur: string
  confidentiel: boolean
  pilotage: boolean
  actif: boolean
  memberCount: number
}

export default function AdminDeptsPage() {
  const [depts, setDepts] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const load = () => api<Department[]>('/admin/departments').then(setDepts).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const handleToggle = async (code: string, actif: boolean) => {
    setToggling(code)
    try {
      await api(`/admin/departments/${code}`, { method: 'PATCH', body: JSON.stringify({ actif }) })
      setDepts(prev => prev.map(d => d.code === code ? { ...d, actif } : d))
      showFlash(`Département ${code} ${actif ? 'activé' : 'désactivé'}`)
    } catch { showFlash('Erreur') } finally { setToggling(null) }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Départements</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Activation et configuration des départements de service</p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {depts.map(d => (
          <Card key={d.code} pad={20}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: d.couleur + '22', fontWeight: 700, fontSize: '12px', color: d.couleur,
                  }}>{d.code}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: d.actif ? T.ink : T.muted }}>{d.nom}</div>
                    <div style={{ fontSize: '12px', color: T.muted }}>{d.memberCount} membre{d.memberCount !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {d.confidentiel && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#7c5cd618', color: '#7c5cd6' }}>Confidentiel</span>
                  )}
                  {d.pilotage && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: T.warnSoft, color: T.warn }}>Pilotage</span>
                  )}
                  {!d.confidentiel && !d.pilotage && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: T.surface, color: T.muted }}>Standard</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleToggle(d.code, !d.actif)}
                disabled={toggling === d.code}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: d.actif ? '#2e6b3e' : T.border,
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px', left: d.actif ? '23px' : '3px',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
            {!d.actif && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: T.danger, fontWeight: 600 }}>Département désactivé</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
