import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { Btn } from '@/components/primitives/Btn'
import { ApiError } from '@/lib/api'
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

type PastoralStar = {
  id: number
  prenom: string
  nom: string
  tel: string
  statut: string
  charge: number
  fiab: number
  desist: number
  baptise: boolean | null
  f001: boolean | null
  f101: boolean | null
  f201: boolean | null
  disciple: boolean | null
  famille: string | null
  departments: { deptCode: string }[]
  user: { id: number; email: string; statut: string; createdAt: string }
}

const STATUT_TONE: Record<string, 'ok' | 'warn' | 'muted' | 'danger' | 'accent'> = {
  Actif: 'ok', Occasionnel: 'accent', Nouveau: 'muted', EnPause: 'warn', Ancien: 'muted',
}

function CheckRow({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: '14px', color: T.ink }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          padding: '5px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
          border: `1.5px solid ${value ? '#2e6b3e' : T.border}`,
          background: value ? '#2e6b3e18' : '#fff',
          color: value ? '#2e6b3e' : T.muted,
          fontWeight: value ? 700 : 400,
        }}
      >
        {value ? '✓ Oui' : 'Non'}
      </button>
    </div>
  )
}

export default function PastoralStarDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [star, setStar] = useState<PastoralStar | null>(null)
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Partial<PastoralStar>>({})
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (!id) return
    api<PastoralStar>(`/stars/${id}`)
      .then(s => { setStar(s); setEdits({}) })
      .finally(() => setLoading(false))
  }, [id])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const handleToggle = (field: 'baptise' | 'f001' | 'f101' | 'f201' | 'disciple', val: boolean) => {
    setEdits(e => ({ ...e, [field]: val }))
  }

  const handleFamilleChange = (val: string) => {
    setEdits(e => ({ ...e, famille: val }))
  }

  const hasEdits = Object.keys(edits).length > 0

  const handleSave = async () => {
    if (!star || !hasEdits) return
    setSaving(true)
    try {
      const updated = await api<PastoralStar>(`/stars/${star.id}`, {
        method: 'PATCH',
        body: JSON.stringify(edits),
      })
      setStar(updated)
      setEdits({})
      showFlash('Fiche mise à jour')
    } catch {
      showFlash('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>
  if (!star) return <div style={{ padding: '40px', color: T.danger, fontSize: '14px' }}>Membre introuvable</div>

  const current = { ...star, ...edits }

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Left: identity */}
        <div>
          <Card pad={24}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
              <Avatar name={`${star.prenom} ${star.nom}`} size={60} />
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink }}>
                  {star.prenom} {star.nom}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <Badge tone={STATUT_TONE[star.statut] ?? 'muted'}>{star.statut}</Badge>
                </div>
              </div>
              {star.tel && <div style={{ fontSize: '13px', color: T.sub }}>{star.tel}</div>}
              <div style={{ fontSize: '12px', color: T.muted }}>{star.user?.email}</div>
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
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', fontSize: '12px', color: T.muted }}>
                Membre depuis {new Date(star.user?.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </Card>

          <Card pad={16} style={{ marginTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
              {[
                { label: 'Charge', value: `${star.charge}/5` },
                { label: 'Fiabilité', value: `${Math.round(star.fiab * 100)}%` },
                { label: 'Désistements', value: star.desist },
              ].map(m => (
                <div key={m.label} style={{ padding: '8px', background: T.surface, borderRadius: T.radiusSm }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: T.ink }}>{m.value}</div>
                  <div style={{ fontSize: '11px', color: T.muted }}>{m.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: pastoral data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card pad={20}>
            <div style={{ fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '4px' }}>Parcours spirituel</div>
            <div style={{ fontSize: '12px', color: T.muted, marginBottom: '16px' }}>Données confidentielles</div>

            <CheckRow
              label="✝ Baptisé(e)"
              value={current.baptise ?? null}
              onChange={(v) => handleToggle('baptise', v)}
            />
            <CheckRow
              label="F001 — Fondamentaux de la foi"
              value={current.f001 ?? null}
              onChange={(v) => handleToggle('f001', v)}
            />
            <CheckRow
              label="F101 — Bases du service"
              value={current.f101 ?? null}
              onChange={(v) => handleToggle('f101', v)}
            />
            <CheckRow
              label="F201 — Leadership & vision"
              value={current.f201 ?? null}
              onChange={(v) => handleToggle('f201', v)}
            />
            <CheckRow
              label="En discipulat actif"
              value={current.disciple ?? null}
              onChange={(v) => handleToggle('disciple', v)}
            />

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: T.ink, marginBottom: '6px' }}>Cellule / Famille</div>
              <input
                value={current.famille ?? ''}
                onChange={e => handleFamilleChange(e.target.value)}
                placeholder="Ex: Famille Grâce, Cellule Nord…"
                style={{
                  width: '100%', padding: '8px 12px', fontSize: '13px',
                  border: `1.5px solid ${edits.famille !== undefined ? T.primary : T.border}`,
                  borderRadius: T.radiusSm, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </Card>

          {hasEdits && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="outline" full onClick={() => setEdits({})}>Annuler les modifications</Btn>
              <Btn variant="primary" full loading={saving} icon="check" onClick={handleSave}>
                Enregistrer
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
