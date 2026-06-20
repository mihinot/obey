import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Btn } from '@/components/primitives/Btn'
import { Tabs } from '@/components/primitives/Tabs'
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

const ROLE_LABELS: Record<string, string> = {
  STAR: 'STAR',
  REFERENT: 'Référent',
  VIE_DES_STARS: 'Vie STARs',
  COORDINATION_GENERALE: 'Coord.',
  CORPS_PASTORAL: 'Pastoral',
  ADMINISTRATEUR: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  STAR: T.muted,
  REFERENT: T.ok,
  VIE_DES_STARS: '#4fa57e',
  COORDINATION_GENERALE: T.primary,
  CORPS_PASTORAL: '#c97fb0',
  ADMINISTRATEUR: T.danger,
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [flash, setFlash] = useState('')
  const [view, setView] = useState('matrice')

  const load = () => api<UserWithRoles[]>('/admin/roles').then(setUsers).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const hasRole = (u: UserWithRoles, role: string) => u.roles.some(r => r.type === role)
  const getRoleId = (u: UserWithRoles, role: string) => u.roles.find(r => r.type === role)?.id

  const toggleRole = async (u: UserWithRoles, role: string) => {
    const key = `${u.id}-${role}`
    setSaving(key)
    try {
      if (hasRole(u, role)) {
        const roleId = getRoleId(u, role)
        if (roleId) await api(`/admin/roles/${roleId}`, { method: 'DELETE' })
      } else {
        await api('/admin/roles', { method: 'POST', body: JSON.stringify({ userId: u.id, type: role }) })
      }
      showFlash('Rôles mis à jour')
      load()
    } catch {
      showFlash('Erreur')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Gestion des rôles</h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Matrice des permissions par utilisateur</p>
        </div>
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

      <Tabs
        items={[{ id: 'matrice', label: 'Matrice' }, { id: 'liste', label: 'Liste' }]}
        value={view}
        onChange={setView}
      />

      {loading && <div style={{ color: T.muted, fontSize: '13px', marginTop: '16px' }}>Chargement…</div>}

      {/* Vue matrice */}
      {!loading && view === 'matrice' && (
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: T.sub, borderBottom: `2px solid ${T.border}`, minWidth: '180px' }}>
                  Utilisateur
                </th>
                {ALL_ROLES.map(role => (
                  <th key={role} style={{
                    padding: '10px 8px', fontSize: '11px', fontWeight: 700, color: ROLE_COLORS[role],
                    borderBottom: `2px solid ${T.border}`, textAlign: 'center', minWidth: '80px',
                  }}>
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{ background: idx % 2 === 0 ? '#fff' : T.bg }}>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={28} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>
                          {u.star ? `${u.star.prenom} ${u.star.nom}` : u.email}
                        </div>
                        <div style={{ fontSize: '11px', color: T.muted }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  {ALL_ROLES.map(role => {
                    const active = hasRole(u, role)
                    const isSaving = saving === `${u.id}-${role}`
                    const color = ROLE_COLORS[role]
                    return (
                      <td key={role} style={{ padding: '10px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        <button
                          onClick={() => toggleRole(u, role)}
                          disabled={!!saving}
                          title={active ? `Révoquer ${ROLE_LABELS[role]}` : `Attribuer ${ROLE_LABELS[role]}`}
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            border: `2px solid ${active ? color : T.border}`,
                            background: active ? color + '18' : 'transparent',
                            cursor: saving ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', transition: 'all 0.15s',
                            opacity: isSaving ? 0.5 : 1,
                            margin: 'auto',
                          }}
                        >
                          {isSaving ? '…' : active ? (
                            <span style={{ color, fontWeight: 700, fontSize: '12px' }}>✓</span>
                          ) : (
                            <span style={{ color: T.border, fontSize: '12px' }}>○</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: T.muted, fontSize: '13px' }}>Aucun utilisateur actif</div>
          )}
        </div>
      )}

      {/* Vue liste */}
      {!loading && view === 'liste' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => (
            <Card key={u.id} pad={16}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>
                    {u.star ? `${u.star.prenom} ${u.star.nom}` : u.email}
                  </div>
                  <div style={{ fontSize: '12px', color: T.muted, marginBottom: '10px' }}>{u.email}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ALL_ROLES.map(role => {
                      const active = hasRole(u, role)
                      const color = ROLE_COLORS[role]
                      return (
                        <button
                          key={role}
                          onClick={() => toggleRole(u, role)}
                          disabled={!!saving}
                          style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            border: `1.5px solid ${active ? color : T.border}`,
                            background: active ? color + '18' : '#fff',
                            color: active ? color : T.muted,
                            cursor: 'pointer',
                          }}
                        >
                          {active ? '✓ ' : ''}{ROLE_LABELS[role]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: T.muted, fontSize: '13px' }}>Aucun utilisateur actif</div>
          )}
        </div>
      )}
    </div>
  )
}
