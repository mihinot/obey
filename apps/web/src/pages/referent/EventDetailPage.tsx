import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Btn } from '@/components/primitives/Btn'
import { Avatar } from '@/components/primitives/Avatar'
import { events, type EventDetail, type PlanningResult } from '@/lib/api'
import { T, DEPT_COLORS } from '@/tokens'

const STATUT_TONE: Record<string, 'warn' | 'ok' | 'primary' | 'muted' | 'danger'> = {
  BROUILLON: 'muted', EN_GENERATION: 'warn', A_VALIDER: 'warn', PUBLIE: 'ok', ANNULE: 'danger',
}
const STATUT_LABEL: Record<string, string> = {
  BROUILLON: 'Brouillon', EN_GENERATION: 'En génération', A_VALIDER: 'À valider', PUBLIE: 'Publié', ANNULE: 'Annulé',
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 80 ? T.ok : score >= 50 ? T.warn : T.danger
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, color, background: color + '1a',
      borderRadius: '6px', padding: '2px 6px',
    }}>
      {score}
    </span>
  )
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = location.pathname.startsWith('/coordination') ? '/coordination/planning' : '/referent/planning'
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [planResult, setPlanResult] = useState<PlanningResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    events.get(Number(id)).then(setEvent).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const handleGenerate = async () => {
    if (!id) return
    setError('')
    setGenerating(true)
    try {
      const result = await events.generate(Number(id))
      setPlanResult(result)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!id) return
    setError('')
    setPublishing(true)
    try {
      await events.publish(Number(id))
      load()
      setPlanResult(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la publication')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: T.muted }}>
      Chargement…
    </div>
  )
  if (!event) return (
    <div style={{ color: T.danger, padding: '40px' }}>Événement introuvable</div>
  )

  const canGenerate = ['BROUILLON', 'EN_GENERATION'].includes(event.statut)
  const canPublish = event.statut === 'A_VALIDER'
  const isPublished = event.statut === 'PUBLIE'

  // Group assignments by dept
  const byDept: Record<string, typeof event.assignments> = {}
  event.assignments.forEach((a) => {
    if (!byDept[a.deptCode]) byDept[a.deptCode] = []
    byDept[a.deptCode].push(a)
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(backPath)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: T.primary, marginBottom: '12px', padding: 0 }}
        >
          ← Retour au planning
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
                {event.nom}
              </h1>
              <Badge tone={STATUT_TONE[event.statut] ?? 'muted'}>{STATUT_LABEL[event.statut] ?? event.statut}</Badge>
            </div>
            <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
              {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{event.debut}–{event.fin}{' · '}{event.lieu}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {canGenerate && (
              <Btn variant="soft" icon="spark" loading={generating} onClick={handleGenerate}>
                Générer le planning
              </Btn>
            )}
            {canPublish && (
              <Btn variant="primary" icon="check" loading={publishing} onClick={handlePublish}>
                Publier
              </Btn>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: T.dangerSoft, borderRadius: T.radiusSm, fontSize: '13px', color: T.danger }}>
          {error}
        </div>
      )}

      {/* Planning result (juste après génération) */}
      {planResult && (
        <Card pad={20} style={{ marginBottom: '20px', border: `1px solid ${T.primary}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.primary }}>
              Résultat de la génération
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span style={{ color: T.ok }}><strong>{planResult.totalCouverts}</strong>/{planResult.totalRequis} couverts</span>
              {planResult.totalManque > 0 && <span style={{ color: T.danger }}><strong>{planResult.totalManque}</strong> manquant(s)</span>}
              {planResult.totalConflits > 0 && <span style={{ color: T.warn }}><strong>{planResult.totalConflits}</strong> conflit(s)</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {planResult.depts.map((dept) => (
              <div key={dept.deptCode} style={{ background: T.bg, borderRadius: T.radius, padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: DEPT_COLORS[dept.deptCode] ?? T.primary }}>
                    {dept.deptCode}
                  </span>
                  <span style={{ fontSize: '12px', color: dept.manque > 0 ? T.danger : T.ok }}>
                    {dept.couverts}/{dept.requis}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dept.selectionnes.map((sel) => (
                    <div key={sel.star.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Avatar name={`${sel.star.prenom} ${sel.star.nom}`} size={24} />
                        <span style={{ fontSize: '13px', color: T.ink }}>{sel.star.prenom} {sel.star.nom}</span>
                        {sel.conflit && <Badge tone="warn">{sel.conflit}</Badge>}
                      </div>
                      <ScorePill score={sel.score} />
                    </div>
                  ))}
                  {dept.manque > 0 && (
                    <div style={{ fontSize: '12px', color: T.danger, fontStyle: 'italic' }}>
                      {dept.manque} poste(s) non couverts
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {canPublish && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="primary" icon="check" loading={publishing} onClick={handlePublish}>
                Publier ce planning
              </Btn>
            </div>
          )}
        </Card>
      )}

      {/* Besoins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card pad={20}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '14px' }}>
            Besoins par département
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {event.needs.map((n) => (
              <div key={n.deptCode} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: DEPT_COLORS[n.deptCode] ?? T.primary }}>{n.deptCode}</span>
                <span style={{ fontSize: '13px', color: T.sub }}>{n.requis} poste(s)</span>
              </div>
            ))}
            {event.needs.length === 0 && <div style={{ fontSize: '13px', color: T.muted }}>Aucun besoin défini</div>}
          </div>
        </Card>

        <Card pad={20}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '14px' }}>
            Affectations {isPublished ? 'publiées' : 'proposées'}
          </h2>
          {Object.keys(byDept).length === 0 && (
            <div style={{ fontSize: '13px', color: T.muted }}>
              {canGenerate ? 'Lancez la génération pour voir les affectations.' : 'Aucune affectation.'}
            </div>
          )}
          {Object.entries(byDept).map(([dept, asgns]) => (
            <div key={dept} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: DEPT_COLORS[dept] ?? T.primary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {dept}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {asgns.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar name={`${a.star.prenom} ${a.star.nom}`} size={26} />
                    <span style={{ fontSize: '13px', color: T.ink }}>{a.star.prenom} {a.star.nom}</span>
                    {a.conflit && <Badge tone="warn">{a.conflit}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
