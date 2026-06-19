import { useEffect, useState } from 'react'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { me, type MyAssignment } from '@/lib/meApi'
import { T, DEPT_COLORS } from '@/tokens'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function daysUntil(d: string) {
  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return null
  if (diff < 1) return "Aujourd'hui"
  if (diff < 2) return 'Demain'
  return `J-${Math.ceil(diff)}`
}

type DesistDialog = { assignmentId: number; eventName: string; daysLeft: number } | null

export default function StarPlanning() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [desistDialog, setDesistDialog] = useState<DesistDialog>(null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [desisting, setDesisting] = useState(false)
  const [flash, setFlash] = useState('')

  const load = () => me.assignments().then(setAssignments).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleConfirm = async (id: number) => {
    setConfirming(id)
    try {
      await me.confirm(id)
      setFlash('Affectation confirmée ✓')
      setTimeout(() => setFlash(''), 3000)
      load()
    } catch {
      setFlash('Erreur lors de la confirmation')
      setTimeout(() => setFlash(''), 3000)
    } finally {
      setConfirming(null)
    }
  }

  const handleDesister = async () => {
    if (!desistDialog) return
    setDesisting(true)
    try {
      const res = await me.desister(desistDialog.assignmentId)
      setDesistDialog(null)
      setFlash(res.late ? '⚠️ Désistement tardif enregistré' : 'Désistement enregistré')
      setTimeout(() => setFlash(''), 4000)
      load()
    } catch {
      setFlash('Erreur lors du désistement')
      setTimeout(() => setFlash(''), 3000)
    } finally {
      setDesisting(false)
    }
  }

  const now = new Date()
  const upcoming = assignments.filter((a) => new Date(a.event.date) >= now).sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())
  const past = assignments.filter((a) => new Date(a.event.date) < now).sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime()).slice(0, 5)

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '4px' }}>
        Mon planning
      </div>
      <div style={{ fontSize: '13px', color: T.sub, marginBottom: '20px' }}>
        {upcoming.length} service(s) à venir
      </div>

      {flash && (
        <div style={{
          padding: '12px 16px', background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
          borderRadius: T.radiusSm, fontSize: '13px',
          color: flash.includes('Erreur') ? T.danger : T.ok,
          marginBottom: '16px',
        }}>
          {flash}
        </div>
      )}

      {loading && <div style={{ fontSize: '13px', color: T.muted }}>Chargement…</div>}

      {/* À venir */}
      {upcoming.map((a) => {
        const days = daysUntil(a.event.date)
        const deptColor = DEPT_COLORS[a.deptCode] ?? T.primary
        const isDesistee = a.statut === 'Desistee'
        const daysNum = Math.ceil((new Date(a.event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        return (
          <div key={a.id} style={{
            background: '#fff', borderRadius: T.radiusLg, padding: '16px',
            marginBottom: '12px', border: `1px solid ${T.border}`,
            opacity: isDesistee ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: T.ink }}>{a.event.nom}</div>
                <div style={{ fontSize: '12.5px', color: T.sub, marginTop: '2px' }}>
                  {fmt(a.event.date)} · {a.event.debut}–{a.event.fin}
                </div>
                <div style={{ fontSize: '12px', color: T.sub }}>{a.event.lieu}</div>
              </div>
              {days && !isDesistee && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: daysNum <= 7 ? T.warn : T.primary,
                  background: (daysNum <= 7 ? T.warn : T.primary) + '18',
                  borderRadius: '8px', padding: '3px 8px', flexShrink: 0,
                }}>
                  {days}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: deptColor, background: deptColor + '18', borderRadius: '6px', padding: '2px 8px' }}>
                {a.deptCode}
              </span>
              <Badge tone={
                a.statut === 'Confirmee' ? 'ok' :
                a.statut === 'Desistee' ? 'danger' : 'warn'
              }>
                {a.statut === 'Confirmee' ? 'Confirmé' : a.statut === 'Desistee' ? 'Désisté' : 'À confirmer'}
              </Badge>
              {a.conflit && <Badge tone="warn">{a.conflit}</Badge>}
            </div>

            {!isDesistee && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Proposee', 'Publiee'].includes(a.statut) && (
                  <Btn
                    variant="soft" size="sm" icon="check" full
                    loading={confirming === a.id}
                    onClick={() => handleConfirm(a.id)}
                  >
                    Confirmer
                  </Btn>
                )}
                <Btn
                  variant="dangerSoft" size="sm" full
                  onClick={() => setDesistDialog({ assignmentId: a.id, eventName: a.event.nom, daysLeft: daysNum })}
                >
                  Me désister
                </Btn>
              </div>
            )}
          </div>
        )
      })}

      {/* Historique */}
      {past.length > 0 && (
        <>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px', color: T.muted, marginTop: '24px', marginBottom: '12px' }}>
            Historique récent
          </div>
          {past.map((a) => (
            <div key={a.id} style={{
              background: '#fff', borderRadius: T.radius, padding: '12px 14px',
              marginBottom: '8px', border: `1px solid ${T.border}`, opacity: 0.6,
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{a.event.nom}</div>
              <div style={{ fontSize: '12px', color: T.sub, marginTop: '2px' }}>
                {new Date(a.event.date).toLocaleDateString('fr-FR')} · {a.deptCode}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Dialog désistement */}
      {desistDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 50, padding: '0 0 0 0',
        }}>
          <div style={{
            background: '#fff', borderRadius: `${T.radiusLg}px ${T.radiusLg}px 0 0`,
            padding: '24px 20px 32px', width: '100%', maxWidth: '440px',
          }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink, marginBottom: '8px' }}>
              Confirmer le désistement
            </div>
            <div style={{ fontSize: '14px', color: T.sub, marginBottom: '16px', lineHeight: 1.6 }}>
              Vous souhaitez vous désister de <strong>{desistDialog.eventName}</strong>.
              {desistDialog.daysLeft < 7 && (
                <span style={{ color: T.danger }}> Ce désistement est tardif (J-{desistDialog.daysLeft}) et sera comptabilisé.</span>
              )}
            </div>
            {desistDialog.daysLeft < 7 && (
              <div style={{ padding: '12px', background: T.dangerSoft, borderRadius: T.radiusSm, fontSize: '13px', color: T.danger, marginBottom: '16px' }}>
                ⚠️ Moins de 7 jours avant l'événement — votre compteur de désistements sera incrémenté.
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Btn variant="outline" full onClick={() => setDesistDialog(null)}>Annuler</Btn>
              <Btn variant="danger" full loading={desisting} onClick={handleDesister}>
                Confirmer le désistement
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
