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

type Desistement = {
  id: number
  deptCode: string
  star: { id: number; prenom: string; nom: string; statut: string; fiab: number; charge: number; departments: { deptCode: string }[] }
  event: { id: number; nom: string; date: string; debut: string; fin: string }
}

type Candidate = {
  id: number; prenom: string; nom: string; statut: string; fiab: number; charge: number
  departments: { deptCode: string }[]
}

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function RemplacementsPage() {
  const [desistements, setDesistements] = useState<Desistement[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Desistement | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [flash, setFlash] = useState('')

  const load = () => {
    setLoading(true)
    api<Desistement[]>('/assignments/desistees').then(setDesistements).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500) }

  const openPanel = async (d: Desistement) => {
    setSelected(d)
    setLoadingCandidates(true)
    try {
      const cands = await api<Candidate[]>(`/assignments/candidates/${d.event.id}/${d.deptCode}`)
      setCandidates(cands)
    } catch { setCandidates([]) } finally { setLoadingCandidates(false) }
  }

  const handleReplace = async (newStarId: number) => {
    if (!selected) return
    setReplacing(true)
    try {
      await api(`/assignments/${selected.id}/replace`, { method: 'POST', body: JSON.stringify({ newStarId }) })
      showFlash('Remplacement effectué — le STAR a été notifié')
      setSelected(null)
      load()
    } catch { showFlash('Erreur lors du remplacement') } finally { setReplacing(false) }
  }

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Remplacements</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          {desistements.length} désistement{desistements.length !== 1 ? 's' : ''} à traiter sur des événements à venir
        </p>
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', marginBottom: '16px',
          background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
        }}>{flash}</div>
      )}

      {desistements.length === 0 && (
        <Card pad={32}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
            Aucun désistement en attente de remplacement
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {desistements.map(d => {
          const days = daysUntil(d.event.date)
          const urgent = days <= 7
          return (
            <Card key={d.id} pad={20}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar name={`${d.star.prenom} ${d.star.nom}`} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: T.ink }}>{d.star.prenom} {d.star.nom}</span>
                    <Badge tone="danger">Désisté</Badge>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: DEPT_COLORS[d.deptCode] ?? T.primary,
                      background: (DEPT_COLORS[d.deptCode] ?? T.primary) + '18',
                      borderRadius: '6px', padding: '2px 7px',
                    }}>{d.deptCode}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: T.sub }}>
                    {d.event.nom} · {new Date(d.event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {d.event.debut}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {urgent && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.danger, background: T.dangerSoft, borderRadius: '6px', padding: '2px 8px' }}>
                      J-{days}
                    </span>
                  )}
                  <Btn variant="primary" size="sm" onClick={() => openPanel(d)}>
                    Trouver un remplaçant
                  </Btn>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Panel latéral remplaçants */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.45)',
          zIndex: 40, display: 'flex', justifyContent: 'flex-end',
        }} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{
            width: '420px', height: '100%', background: '#fff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: T.ink }}>
                  Remplaçants disponibles
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: T.muted }}>×</button>
              </div>
              <div style={{ fontSize: '12px', color: T.sub }}>
                {selected.event.nom} · {selected.deptCode} · {new Date(selected.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            </div>

            <div style={{ padding: '16px 20px', flex: 1 }}>
              {loadingCandidates && <div style={{ color: T.muted, fontSize: '13px' }}>Recherche en cours…</div>}

              {!loadingCandidates && candidates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: '13px' }}>
                  Aucun STAR disponible pour ce département ce jour-là
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {candidates.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                    border: `1px solid ${T.border}`, borderRadius: T.radius, background: '#fff',
                  }}>
                    <Avatar name={`${c.prenom} ${c.nom}`} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize: '12px', color: T.sub, marginTop: '1px' }}>
                        Fiab. {Math.round(c.fiab * 100)}% · Charge {c.charge}/5
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                        {c.departments.map(dd => (
                          <span key={dd.deptCode} style={{ fontSize: '10px', fontWeight: 700, color: DEPT_COLORS[dd.deptCode] ?? T.primary }}>{dd.deptCode}</span>
                        ))}
                      </div>
                    </div>
                    <Btn variant="soft" size="sm" loading={replacing} onClick={() => handleReplace(c.id)}>
                      Affecter
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
