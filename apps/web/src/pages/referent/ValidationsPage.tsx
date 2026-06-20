import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Avatar } from '@/components/primitives/Avatar'
import { ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? ''

function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers as object) },
  }).then(async (r) => {
    if (!r.ok) throw new ApiError(r.status, await r.json())
    return r.json()
  })
}

type PendingUser = {
  id: number
  email: string
  statut: string
  createdAt: string
  star: { id: number; prenom: string; nom: string; statut: string; departments: { deptCode: string }[] } | null
  roles: { type: string }[]
}

type ApproveDialog = { user: PendingUser; depts: string[] } | null

const AVAILABLE_DEPTS = ['ACC', 'SEC', 'PRO', 'LOU', 'PRI', 'COM']

export default function ValidationsPage() {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<ApproveDialog>(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejectingId] = useState<number | null>(null)
  const [flash, setFlash] = useState('')

  const load = () =>
    api<PendingUser[]>('/admin/users?statut=EnAttente')
      .then(setUsers)
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  const handleApprove = async () => {
    if (!dialog) return
    setApproving(true)
    try {
      await api(`/admin/users/${dialog.user.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ depts: dialog.depts, starStatut: 'Nouveau' }),
      })
      setDialog(null)
      showFlash(`✓ ${dialog.user.star?.prenom} ${dialog.user.star?.nom} validé(e)`)
      load()
    } catch {
      showFlash('Erreur lors de la validation')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async (id: number, name: string) => {
    setRejectingId(id)
    try {
      await api(`/admin/users/${id}/reject`, { method: 'POST' })
      showFlash(`Demande de ${name} refusée`)
      load()
    } catch {
      showFlash('Erreur')
    } finally {
      setRejectingId(null)
    }
  }

  const toggleDept = (dept: string) => {
    if (!dialog) return
    const depts = dialog.depts.includes(dept)
      ? dialog.depts.filter((d) => d !== dept)
      : [...dialog.depts, dept]
    setDialog({ ...dialog, depts })
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
          Validations
        </h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          Comptes en attente de validation ({users.length})
        </p>
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

      {!loading && users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: T.radiusLg, border: `1px solid ${T.border}`, color: T.muted }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
          Aucun compte en attente
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map((u) => (
          <Card key={u.id} pad={20}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={u.star ? `${u.star.prenom} ${u.star.nom}` : u.email} size={44} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: T.ink }}>
                    {u.star ? `${u.star.prenom} ${u.star.nom}` : u.email}
                  </div>
                  <div style={{ fontSize: '13px', color: T.sub, marginTop: '2px' }}>{u.email}</div>
                  <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>
                    Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
              <Badge tone="warn">En attente</Badge>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Btn
                variant="soft" size="sm" icon="check" full
                onClick={() => setDialog({ user: u, depts: [] })}
              >
                Valider
              </Btn>
              <Btn
                variant="dangerSoft" size="sm" full
                loading={rejecting === u.id}
                onClick={() => handleReject(u.id, u.star ? `${u.star.prenom} ${u.star.nom}` : u.email)}
              >
                Refuser
              </Btn>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog approbation */}
      {dialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '20px',
        }}>
          <div style={{
            background: '#fff', borderRadius: T.radiusLg,
            padding: '28px 24px', width: '100%', maxWidth: '440px',
          }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink, marginBottom: '6px' }}>
              Valider le compte
            </div>
            <div style={{ fontSize: '13px', color: T.sub, marginBottom: '20px' }}>
              {dialog.user.star?.prenom} {dialog.user.star?.nom} · {dialog.user.email}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: T.ink, marginBottom: '10px' }}>
                Affecter aux départements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {AVAILABLE_DEPTS.map((dept) => {
                  const active = dialog.depts.includes(dept)
                  const color = DEPT_COLORS[dept] ?? T.primary
                  return (
                    <button
                      key={dept}
                      onClick={() => toggleDept(dept)}
                      style={{
                        padding: '6px 14px', borderRadius: '10px', border: `1.5px solid ${active ? color : T.border}`,
                        background: active ? color + '18' : '#fff', color: active ? color : T.sub,
                        fontWeight: active ? 700 : 400, fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      {dept}
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: '12px', color: T.muted, marginTop: '8px' }}>
                Laissez vide pour ne pas affecter de département maintenant.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="outline" full onClick={() => setDialog(null)}>Annuler</Btn>
              <Btn variant="primary" full loading={approving} icon="check" onClick={handleApprove}>
                Confirmer
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
