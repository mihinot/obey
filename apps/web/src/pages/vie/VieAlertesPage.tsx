import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { Badge } from '@/components/primitives/Badge'
import { Avatar } from '@/components/primitives/Avatar'
import { stars, type Star } from '@/lib/api'
import { T } from '@/tokens'

type Alerte = {
  id: string
  niveau: 'CRITIQUE' | 'ATTENTION' | 'INFO'
  type: string
  titre: string
  msg: string
  star: Star
}

export default function VieAlertesPage() {
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stars.list().then((list: Star[]) => {
      const result: Alerte[] = []

      list.filter(s => s.statut === 'ACTIF').forEach(s => {
        if (s.charge >= 80) {
          result.push({
            id: `crit-${s.id}`, niveau: 'CRITIQUE', type: 'Surcharge critique',
            titre: `${s.prenom} ${s.nom} — charge à ${s.charge}%`,
            msg: 'Risque d\'épuisement — intervention immédiate recommandée',
            star: s,
          })
        } else if (s.charge >= 60) {
          result.push({
            id: `haut-${s.id}`, niveau: 'ATTENTION', type: 'Charge élevée',
            titre: `${s.prenom} ${s.nom} — ${s.charge}% de charge`,
            msg: 'Surveiller l\'évolution et éviter de nouveaux services ce mois',
            star: s,
          })
        }

        if (s.departments.length >= 3) {
          result.push({
            id: `multi-${s.id}`, niveau: 'ATTENTION', type: 'Multi-départements',
            titre: `${s.prenom} ${s.nom} — ${s.departments.length} départements`,
            msg: 'Engagement dans de nombreux départements — risque de surmenage',
            star: s,
          })
        }

        if (s.desist >= 3 && s.charge >= 40) {
          result.push({
            id: `desist-${s.id}`, niveau: 'ATTENTION', type: 'Désistements + charge',
            titre: `${s.prenom} ${s.nom} — ${s.desist} désistements`,
            msg: 'Cumul de désistements avec une charge élevée — signe d\'épuisement potentiel',
            star: s,
          })
        }

        if (s.fiab < 50 && s.charge >= 30) {
          result.push({
            id: `fiab-${s.id}`, niveau: 'INFO', type: 'Fiabilité basse',
            titre: `${s.prenom} ${s.nom} — fiabilité ${s.fiab}%`,
            msg: 'Taux de fiabilité en baisse — envisager un entretien',
            star: s,
          })
        }
      })

      // Trier : CRITIQUE > ATTENTION > INFO
      const order = { CRITIQUE: 0, ATTENTION: 1, INFO: 2 }
      result.sort((a, b) => order[a.niveau] - order[b.niveau])
      setAlertes(result)
    }).finally(() => setLoading(false))
  }, [])

  const NIVEAU_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    CRITIQUE: { bg: T.dangerSoft, color: T.danger, label: 'Critique' },
    ATTENTION: { bg: T.warnSoft, color: T.warn, label: 'Attention' },
    INFO: { bg: T.primarySoft, color: T.primary, label: 'Info' },
  }

  if (loading) return <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Alertes surcharge
          </h1>
          {alertes.filter(a => a.niveau === 'CRITIQUE').length > 0 && (
            <Badge tone="danger">{alertes.filter(a => a.niveau === 'CRITIQUE').length} critique{alertes.filter(a => a.niveau === 'CRITIQUE').length > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
          STARs nécessitant une attention sur leur équilibre de service
        </p>
      </div>

      {alertes.length === 0 && (
        <Card pad={40}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            Aucune alerte — toutes les charges sont équilibrées
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
        {alertes.map(a => {
          const style = NIVEAU_STYLE[a.niveau]
          return (
            <Card key={a.id} pad={16} style={{ border: `1px solid ${style.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar name={`${a.star.prenom} ${a.star.nom}`} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                      background: style.bg, color: style.color,
                    }}>
                      {style.label}
                    </span>
                    <span style={{ fontSize: '12px', color: T.muted }}>{a.type}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '2px' }}>{a.titre}</div>
                  <div style={{ fontSize: '13px', color: T.sub }}>{a.msg}</div>
                </div>
                <button
                  onClick={() => navigate(`/referent/equipe/${a.star.id}`)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                    background: '#fff', color: T.primary, cursor: 'pointer',
                  }}
                >
                  Voir le STAR
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
