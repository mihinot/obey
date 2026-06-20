import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { ProgressBar } from '@/components/primitives/ProgressBar'
import { Btn } from '@/components/primitives/Btn'
import { stars, type Star, ApiError } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

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

type Assignment = {
  id: number
  deptCode: string
  statut: string
  conflit: string | null
  confirme: boolean
  createdAt: string
  event: { id: number; nom: string; date: string; debut: string; fin: string; statut: string }
}

const ASSIGNMENT_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger'> = {
  Confirmee: 'ok', Proposee: 'warn', Desistee: 'danger', Effectuee: 'ok', Absente: 'danger',
}
const STATUT_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger' | 'accent'> = {
  Actif: 'ok', Occasionnel: 'accent', Nouveau: 'muted', EnPause: 'warn', Ancien: 'muted',
}

function fiabColor(f: number) {
  if (f >= 0.85) return T.ok
  if (f >= 0.6) return T.warn
  return T.danger
}

export default function StarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [star, setStar] = useState<Star | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [editStatut, setEditStatut] = useState(false)
  const [newStatut, setNewStatut] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (!id) return
    const starId = parseInt(id)
    Promise.all([
      stars.get(starId),
      api<Assignment[]>(`/stars/${starId}/assignments`),
    ])
      .then(([s, a]) => { setStar(s); setAssignments(a); setNewStatut(s.statut) })
      .finally(() => setLoading(false))
  }, [id])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleSaveStatut = async () => {
    if (!star) return
    setSaving(true)
    try {
      const updated = await stars.patch(star.id, { statut: newStatut as Star['statut'] })
      setStar(updated)
      setEditStatut(false)
      showFlash('Statut mis à jour')
    } catch {
      showFlash('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>
  if (!star) return <div style={{ padding: '40px', color: T.danger, fontSize: '14px' }}>Membre introuvable</div>

  const effectuees = assignments.filter(a => a.statut === 'Effectuee' || a.statut === 'Confirmee').length
  const desistements = assignments.filter(a => a.statut === 'Desistee').length
  const absences = assignments.filter(a => a.statut === 'Absente').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, fontSize: '14px', padding: '4px 8px', borderRadius: T.radiusSm }}
        >
          ← Retour
        </button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
        {/* Left: Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card pad={24}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <Avatar name={`${star.prenom} ${star.nom}`} size={64} />
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
                  {star.prenom} {star.nom}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <Badge tone={STATUT_TONE[star.statut] ?? 'muted'}>{star.statut}</Badge>
                </div>
              </div>
              {star.tel && (
                <div style={{ fontSize: '13px', color: T.sub }}>{star.tel}</div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {star.departments.map(d => (
                  <span key={d.deptCode} style={{
                    fontSize: '12px', fontWeight: 700,
                    color: DEPT_COLORS[d.deptCode] ?? T.primary,
                    background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                    borderRadius: '6px', padding: '3px 8px',
                  }}>
                    {d.deptCode}
                  </span>
                ))}
              </div>
            </div>

            {/* Edit statut */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${T.border}` }}>
              {!editStatut ? (
                <Btn variant="outline" size="sm" full onClick={() => setEditStatut(true)}>
                  Modifier le statut
                </Btn>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select
                    value={newStatut}
                    onChange={e => setNewStatut(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, fontSize: '13px' }}
                  >
                    {['Nouveau', 'Actif', 'Occasionnel', 'EnPause', 'Ancien'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn variant="outline" size="sm" full onClick={() => setEditStatut(false)}>Annuler</Btn>
                    <Btn variant="primary" size="sm" full loading={saving} onClick={handleSaveStatut}>Sauvegarder</Btn>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Métriques */}
          <Card pad={20}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '14px' }}>Métriques</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: T.sub, marginBottom: '4px' }}>
                  <span>Charge actuelle</span>
                  <span style={{ fontWeight: 600, color: star.charge >= 4 ? T.danger : star.charge >= 2 ? T.warn : T.ok }}>
                    {star.charge}/5
                  </span>
                </div>
                <ProgressBar value={star.charge} max={5} color={star.charge >= 4 ? T.danger : star.charge >= 2 ? T.warn : T.ok} height={6} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: T.sub, marginBottom: '4px' }}>
                  <span>Fiabilité</span>
                  <span style={{ fontWeight: 600, color: fiabColor(star.fiab) }}>{Math.round(star.fiab * 100)}%</span>
                </div>
                <ProgressBar value={star.fiab * 100} max={100} color={fiabColor(star.fiab)} height={6} />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              {[
                { label: 'Services', value: assignments.length, color: T.ink },
                { label: 'Désist.', value: desistements, color: T.warn },
                { label: 'Absences', value: absences, color: T.danger },
              ].map(m => (
                <div key={m.label} style={{ padding: '10px 4px', background: T.surface, borderRadius: T.radiusSm }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Assignment history */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Historique des services ({assignments.length})
          </h2>

          {assignments.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: '13px', background: '#fff', borderRadius: T.radiusLg, border: `1px solid ${T.border}` }}>
              Aucun service enregistré
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignments.map(a => (
              <Card key={a.id} pad={16} hover onClick={() => navigate(`/referent/planning/${a.event.id}`)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{a.event.nom}</div>
                    <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>
                      {new Date(a.event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{a.event.debut}–{a.event.fin}
                    </div>
                    {a.conflit && (
                      <div style={{ fontSize: '11px', color: T.warn, marginTop: '2px' }}>⚠ {a.conflit}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Badge tone={ASSIGNMENT_TONE[a.statut] ?? 'muted'}>{a.statut}</Badge>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: DEPT_COLORS[a.deptCode] ?? T.primary,
                    }}>
                      {a.deptCode}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {effectuees > 0 && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: T.okSoft, borderRadius: T.radiusSm, fontSize: '13px', color: T.ok }}>
              ✓ {effectuees} service{effectuees > 1 ? 's' : ''} effectué{effectuees > 1 ? 's' : ''} sur {assignments.length} assignations
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
