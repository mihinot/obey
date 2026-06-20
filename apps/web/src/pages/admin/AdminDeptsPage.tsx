import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
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

const PRESET_COLORS = ['#7c5cd6', '#e07b39', '#3b82c4', '#2e6b3e', '#c97fb0', '#d4a017', '#b8556a', '#4fa57e']

export default function AdminDeptsPage() {
  const [depts, setDepts] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', nom: '', couleur: '#7c5cd6', confidentiel: false, pilotage: false })

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

  const handleCreate = async () => {
    if (!form.code || !form.nom) { showFlash('Code et nom requis'); return }
    setCreating(true)
    try {
      const dept = await api<Department>('/admin/departments', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setDepts(prev => [...prev, dept])
      setShowCreate(false)
      setForm({ code: '', nom: '', couleur: '#7c5cd6', confidentiel: false, pilotage: false })
      showFlash(`Département ${dept.code} créé`)
    } catch (e) {
      showFlash(e instanceof ApiError ? e.message : 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Départements</h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Activation et configuration des départements de service</p>
        </div>
        <Btn variant="primary" size="sm" icon="plus" onClick={() => setShowCreate(true)}>
          Nouveau département
        </Btn>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') || flash.includes('requis') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') || flash.includes('requis') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      {/* Modal création */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.5)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{
            background: '#fff', borderRadius: T.radiusLg, width: '100%', maxWidth: '440px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)', padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink }}>
                Nouveau département
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.muted }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Code * (ex: ACC, MUS)</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 6) }))}
                  placeholder="ACC"
                  maxLength={6}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '5px' }}>Nom *</label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Accueil"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: T.sub, display: 'block', marginBottom: '8px' }}>Couleur</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, couleur: c }))}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: form.couleur === c ? `3px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { key: 'confidentiel', label: 'Confidentiel' },
                  { key: 'pilotage', label: 'Pilotage' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: T.sub }}>
                    <input
                      type="checkbox"
                      checked={form[key as 'confidentiel' | 'pilotage']}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 600, border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, background: '#fff', color: T.sub, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <Btn variant="primary" onClick={handleCreate} loading={creating} style={{ flex: 2 }}>
                Créer le département
              </Btn>
            </div>
          </div>
        </div>
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
