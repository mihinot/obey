import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
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

type UserWithRoles = {
  id: number
  email: string
  statut: string
  star: { prenom: string; nom: string } | null
  roles: { id: number; type: string; deptCode: string | null }[]
}

const ALL_ROLES = ['STAR', 'REFERENT', 'VIE_DES_STARS', 'COORDINATION_GENERALE', 'CORPS_PASTORAL', 'ADMINISTRATEUR']
const ROLE_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger' | 'accent'> = {
  STAR: 'muted', REFERENT: 'ok', VIE_DES_STARS: 'accent', COORDINATION_GENERALE: 'accent',
  CORPS_PASTORAL: 'ok', ADMINISTRATEUR: 'danger',
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<number | null>(null)
  const [newRole, setNewRole] = useState('')
  const [flash, setFlash] = useState('')

  const load = () => api<UserWithRoles[]>('/admin/roles').then(setUsers).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleAddRole = async (userId: number) => {
    if (!newRole) return
    try {
      await api('/admin/roles', { method: 'POST', body: JSON.stringify({ userId, type: newRole }) })
      showFlash('Rôle assigné')
      setAdding(null)
      setNewRole('')
      load()
    } catch {
      showFlash('Erreur lors de l\'assignation')
    }
  }

  const handleRemoveRole = async (roleId: number) => {
    try {
      await api(`/admin/roles/${roleId}`, { method: 'DELETE' })
      showFlash('Rôle révoqué')
      load()
    } catch {
      showFlash('Erreur')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Gestion des rôles</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Assigner ou révoquer des rôles aux utilisateurs actifs</p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>
          {flash}
        </div>
      )}

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {users.map(u => (
          <Card key={u.id} pad={18}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>
                  {u.star ? `${u.star.prenom} ${u.star.nom}` : u.email}
                </div>
                <div style={{ fontSize: '12px', color: T.muted }}>{u.email}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {u.roles.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Badge tone={ROLE_TONE[r.type] ?? 'muted'}>
                        {r.type}{r.deptCode ? ` (${r.deptCode})` : ''}
                      </Badge>
                      <button
                        onClick={() => handleRemoveRole(r.id)}
                        title="Révoquer"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '12px', padding: '0 2px' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {u.roles.length === 0 && (
                    <span style={{ fontSize: '12px', color: T.muted }}>Aucun rôle</span>
                  )}
                </div>
              </div>
              <div>
                {adding === u.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      style={{ padding: '6px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, fontSize: '13px' }}
                    >
                      <option value="">Choisir…</option>
                      {ALL_ROLES.filter(r => !u.roles.some(ur => ur.type === r)).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <Btn variant="primary" size="sm" onClick={() => handleAddRole(u.id)}>OK</Btn>
                    <Btn variant="outline" size="sm" onClick={() => { setAdding(null); setNewRole('') }}>✕</Btn>
                  </div>
                ) : (
                  <Btn variant="soft" size="sm" onClick={() => setAdding(u.id)}>+ Rôle</Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
        {!loading && users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: T.muted, fontSize: '13px' }}>
            Aucun utilisateur actif
          </div>
        )}
      </div>
    </div>
  )
}
