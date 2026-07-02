import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
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

type User = {
  id: number
  email: string
  statut: string
  createdAt: string
  star: { id: number; prenom: string; nom: string; statut: string; departments: { deptCode: string }[] } | null
  roles: { type: string; deptCode: string | null }[]
}

const COMPTE_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger'> = {
  Actif: 'ok', EnAttente: 'warn', Refuse: 'danger',
}

const STAR_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'accent'> = {
  Actif: 'ok', Occasionnel: 'accent', Nouveau: 'muted', EnPause: 'warn', Ancien: 'muted',
}

const ALL_DEPTS = ['ACC', 'MUS', 'MED', 'INT', 'ENF', 'JEU', 'LOG', 'TECH']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'actifs' | 'attente'>('actifs')
  const [search, setSearch] = useState('')
  const [flash, setFlash] = useState('')
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [approveDepts, setApproveDepts] = useState<Record<number, string[]>>({})

  const load = () => {
    setLoading(true)
    api<User[]>('/admin/users').then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleApprove = async (userId: number) => {
    setApprovingId(userId)
    try {
      const depts = approveDepts[userId] ?? []
      await api(`/admin/users/${userId}/approve`, { method: 'POST', body: JSON.stringify({ depts, starStatut: 'Nouveau' }) })
      showFlash('Compte validé')
      load()
    } catch { showFlash('Erreur') } finally { setApprovingId(null) }
  }

  const handleReject = async (userId: number) => {
    setRejectingId(userId)
    try {
      await api(`/admin/users/${userId}/reject`, { method: 'POST', body: '{}' })
      showFlash('Compte refusé')
      load()
    } catch { showFlash('Erreur') } finally { setRejectingId(null) }
  }

  const actifs = users.filter(u => u.statut === 'Actif')
  const attente = users.filter(u => u.statut === 'EnAttente')

  const filtered = (tab === 'actifs' ? actifs : attente).filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.star?.prenom ?? '').toLowerCase().includes(q) ||
      (u.star?.nom ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Utilisateurs</h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Gestion des comptes membres</p>
        </div>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: `1px solid ${T.border}`, paddingBottom: '0' }}>
        {([['actifs', `Comptes actifs (${actifs.length})`], ['attente', `En attente (${attente.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: tab === t ? 700 : 400,
            color: tab === t ? T.primary : T.sub, background: 'none', border: 'none',
            borderBottom: tab === t ? `2px solid ${T.primary}` : '2px solid transparent',
            cursor: 'pointer', marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          style={{
            width: '320px', padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, outline: 'none',
          }}
        />
      </div>

      {tab === 'actifs' && (
        <Card pad={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Membre', 'Départements', 'Statut STAR', 'Compte', 'Rôles'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, color: T.ink }}>{u.star ? `${u.star.prenom} ${u.star.nom}` : '—'}</div>
                        <div style={{ color: T.muted, fontSize: '12px' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(u.star?.departments ?? []).map(d => (
                        <span key={d.deptCode} style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px',
                          color: DEPT_COLORS[d.deptCode] ?? T.primary,
                          background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                        }}>{d.deptCode}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.star ? <Badge tone={STAR_TONE[u.star.statut] ?? 'muted'}>{u.star.statut}</Badge> : <span style={{ color: T.muted }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge tone={COMPTE_TONE[u.statut] ?? 'muted'}>{u.statut === 'Actif' ? 'Validé' : u.statut}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px', color: T.ink, fontWeight: 600 }}>
                    {u.roles.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {u.roles.map((r, i) => <span key={i} style={{ fontSize: '11px', color: T.sub }}>{r.type}</span>)}
                      </div>
                    ) : <span style={{ color: T.muted, fontSize: '12px' }}>Aucun</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: T.muted }}>Aucun utilisateur</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'attente' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 && (
            <Card pad={24}><div style={{ textAlign: 'center', color: T.muted, fontSize: '13px' }}>Aucun compte en attente de validation</div></Card>
          )}
          {filtered.map(u => {
            const depts = approveDepts[u.id] ?? []
            return (
              <Card key={u.id} pad={20}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: T.ink }}>{u.star ? `${u.star.prenom} ${u.star.nom}` : u.email}</div>
                    <div style={{ fontSize: '12px', color: T.muted, marginBottom: '10px' }}>{u.email} — {new Date(u.createdAt).toLocaleDateString('fr-FR')}</div>
                    <div style={{ fontSize: '12px', color: T.sub, marginBottom: '6px', fontWeight: 600 }}>Affecter aux départements :</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {ALL_DEPTS.map(d => {
                        const sel = depts.includes(d)
                        return (
                          <button key={d} onClick={() => setApproveDepts(prev => ({
                            ...prev, [u.id]: sel ? depts.filter(x => x !== d) : [...depts, d]
                          }))} style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 700,
                            border: `1.5px solid ${sel ? (DEPT_COLORS[d] ?? T.primary) : T.border}`,
                            background: sel ? (DEPT_COLORS[d] ?? T.primary) + '18' : '#fff',
                            color: sel ? (DEPT_COLORS[d] ?? T.primary) : T.muted,
                          }}>{d}</button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn variant="outline" size="sm" loading={rejectingId === u.id} onClick={() => handleReject(u.id)}>Refuser</Btn>
                    <Btn variant="primary" size="sm" loading={approvingId === u.id} icon="check" onClick={() => handleApprove(u.id)}>Valider</Btn>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
