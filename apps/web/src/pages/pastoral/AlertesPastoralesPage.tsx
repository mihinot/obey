import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { stars, type Star } from '@/lib/api'
import { T } from '@/tokens'

type Alerte = {
  id: string
  type: string
  niveau: 'ATTENTION' | 'CRITIQUE' | 'INFO'
  titre: string
  msg: string
  starId?: number
}

export default function AlertesPastoralesPage() {
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stars.list().then((list: Star[]) => {
      const result: Alerte[] = []

      // STARs en pause / inactifs
      list.filter(s => s.statut === 'EN_PAUSE').forEach(s => {
        result.push({
          id: `pause-${s.id}`, type: 'Volontaire inactif', niveau: 'ATTENTION',
          titre: `${s.prenom} ${s.nom} en pause`,
          msg: 'Penser à prendre des nouvelles et accompagner le retour au service',
          starId: s.id,
        })
      })

      // STARs avec désistements fréquents
      list.filter(s => s.desist >= 3).forEach(s => {
        result.push({
          id: `desist-${s.id}`, type: 'Désistements fréquents', niveau: 'ATTENTION',
          titre: `${s.prenom} ${s.nom}`,
          msg: `${s.desist} désistements récents — accompagnement pastoral recommandé`,
          starId: s.id,
        })
      })

      // STARs surchargés
      list.filter(s => s.charge >= 80 && s.statut === 'ACTIF').forEach(s => {
        result.push({
          id: `surcharge-${s.id}`, type: 'Surcharge de service', niveau: 'CRITIQUE',
          titre: `${s.prenom} ${s.nom} — charge critique`,
          msg: `Charge à ${s.charge}% — risque d'épuisement, veiller à l'équilibre`,
          starId: s.id,
        })
      })

      // STARs peu sollicités (charge < 10% et actifs depuis longtemps)
      list.filter(s => s.charge < 10 && s.statut === 'ACTIF').slice(0, 3).forEach(s => {
        result.push({
          id: `peu-${s.id}`, type: 'Peu sollicité', niveau: 'INFO',
          titre: `${s.prenom} ${s.nom}`,
          msg: 'Peu de services ce mois — à valoriser et encourager dans son implication',
          starId: s.id,
        })
      })

      setAlertes(result)
    }).finally(() => setLoading(false))
  }, [])

  const NIVEAU_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    CRITIQUE: { bg: T.dangerSoft, color: T.danger, label: 'Critique' },
    ATTENTION: { bg: T.warnSoft, color: T.warn, label: 'Attention' },
    INFO: { bg: T.primarySoft, color: T.primary, label: 'Info' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Alertes pastorales
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Bien-être spirituel et accompagnement des STARs
          </p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
          background: '#c97fb020', color: '#c97fb0', border: '1px solid #c97fb040',
        }}>
          🔒 Confidentiel
        </span>
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      {!loading && alertes.length === 0 && (
        <Card pad={40}>
          <div style={{ textAlign: 'center', color: T.muted, fontSize: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</div>
            Aucune alerte pastorale pour le moment
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px' }}>
        {alertes.map(a => {
          const style = NIVEAU_COLORS[a.niveau] ?? NIVEAU_COLORS.INFO
          return (
            <Card key={a.id} pad={18} style={{ border: `1px solid ${style.color}30` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: style.color, flexShrink: 0, marginTop: '5px',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                      background: style.bg, color: style.color,
                    }}>
                      {style.label}
                    </span>
                    <span style={{ fontSize: '12px', color: T.muted }}>{a.type}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: T.ink, marginBottom: '4px' }}>{a.titre}</div>
                  <div style={{ fontSize: '13px', color: T.sub, lineHeight: 1.5 }}>{a.msg}</div>
                </div>
                {a.starId && (
                  <button
                    onClick={() => navigate(`/pastoral/stars/${a.starId}`)}
                    style={{
                      flexShrink: 0, padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                      background: '#fff', color: T.primary, cursor: 'pointer',
                    }}
                  >
                    Voir le STAR
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
