import { useState } from 'react'
import { Btn } from '@/components/primitives/Btn'
import { Badge } from '@/components/primitives/Badge'
import { me, type MyAssignment } from '@/lib/meApi'
import { T, DEPT_COLORS } from '@/tokens'

type SheetEvent = {
  id: number
  nom: string
  type: string
  date: string
  debut: string
  fin: string
  lieu: string
}

type Props = {
  event: SheetEvent
  assignment?: MyAssignment | null
  onClose: () => void
  onUpdated?: () => void
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function EventDetailSheet({ event, assignment, onClose, onUpdated }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [desisting, setDesisting] = useState(false)
  const [flash, setFlash] = useState('')
  const [done, setDone] = useState(false)

  const daysLeft = Math.ceil((new Date(event.date).getTime() - Date.now()) / 86400000)
  const isUrgent = daysLeft >= 0 && daysLeft <= 7
  const deptColor = assignment ? (DEPT_COLORS[assignment.deptCode] ?? T.primary) : T.primary

  const handleConfirm = async () => {
    if (!assignment) return
    setConfirming(true)
    try {
      await me.confirm(assignment.id)
      setFlash('✓ Affectation confirmée')
      setDone(true)
      onUpdated?.()
    } catch {
      setFlash('Erreur lors de la confirmation')
    } finally {
      setConfirming(false)
    }
  }

  const handleDesister = async () => {
    if (!assignment) return
    setDesisting(true)
    try {
      const res = await me.desister(assignment.id)
      setFlash(res.late ? '⚠️ Désistement tardif enregistré' : 'Désistement enregistré')
      setDone(true)
      onUpdated?.()
    } catch {
      setFlash('Erreur lors du désistement')
    } finally {
      setDesisting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,37,53,0.5)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: `${T.radiusLg}px ${T.radiusLg}px 0 0`,
        width: '100%', maxWidth: '440px',
        padding: '0 0 32px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: T.border }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: T.ink, lineHeight: 1.3 }}>
                {event.nom}
              </div>
              <div style={{ fontSize: '12px', color: T.sub, marginTop: '4px' }}>{event.type}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: T.muted, padding: '0', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Infos */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isUrgent && daysLeft >= 0 && (
            <div style={{
              padding: '10px 14px', background: T.warnSoft,
              borderRadius: T.radiusSm, fontSize: '13px', color: T.warn,
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ⚠️ Événement dans {daysLeft === 0 ? "aujourd'hui" : `J-${daysLeft}`}
              {daysLeft < 7 && ' — Désistement tardif'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: T.radius,
              background: T.primarySoft, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: T.primary, lineHeight: 1 }}>
                {new Date(event.date).getDate()}
              </span>
              <span style={{ fontSize: '9px', color: T.primary, textTransform: 'uppercase' }}>
                {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink }}>{fmt(event.date)}</div>
              <div style={{ fontSize: '13px', color: T.sub, marginTop: '1px' }}>
                {event.debut}–{event.fin}
              </div>
            </div>
          </div>

          {event.lieu && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.sub }}>
              <span>📍</span> {event.lieu}
            </div>
          )}

          {assignment && (
            <div style={{
              padding: '12px 14px',
              background: T.bg,
              borderRadius: T.radius,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px', fontWeight: 700, color: deptColor,
                  background: deptColor + '18', borderRadius: '6px', padding: '2px 8px',
                }}>
                  {assignment.deptCode}
                </span>
                <span style={{ fontSize: '13px', color: T.sub }}>Mon département</span>
              </div>
              <Badge tone={
                assignment.statut === 'Confirmee' ? 'ok' :
                assignment.statut === 'Desistee' ? 'danger' : 'warn'
              }>
                {assignment.statut === 'Confirmee' ? 'Confirmé' :
                  assignment.statut === 'Desistee' ? 'Désisté' : 'À confirmer'}
              </Badge>
            </div>
          )}

          {flash && (
            <div style={{
              padding: '10px 14px',
              background: flash.includes('Erreur') ? T.dangerSoft : T.okSoft,
              borderRadius: T.radiusSm, fontSize: '13px',
              color: flash.includes('Erreur') ? T.danger : T.ok,
              fontWeight: 600,
            }}>
              {flash}
            </div>
          )}
        </div>

        {/* Actions */}
        {assignment && !done && assignment.statut !== 'Desistee' && (
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Proposee', 'Publiee'].includes(assignment.statut) && (
              <Btn variant="primary" size="lg" icon="check" full loading={confirming} onClick={handleConfirm}>
                Confirmer ma présence
              </Btn>
            )}
            <Btn variant="dangerSoft" size="lg" full loading={desisting} onClick={handleDesister}>
              {daysLeft < 7 ? '⚠️ Se désister (tardif)' : 'Me désister'}
            </Btn>
          </div>
        )}

        {(!assignment || done) && (
          <div style={{ padding: '0 20px' }}>
            <Btn variant="soft" size="lg" full onClick={onClose}>
              Fermer
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
