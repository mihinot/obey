import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(async r => { if (!r.ok) throw new ApiError(r.status, await r.json()); return r.json() })
}

type StarMember = {
  id: number
  prenom: string
  nom: string
  statut: string
}

export default function IntercessionPage() {
  const [members, setMembers] = useState<StarMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Département Intercession (INT) — confidentiel
    api<{ starDepts: { star: StarMember }[] }>('/departments/INT').then(d => {
      setMembers(d.starDepts.map(sd => sd.star))
    }).catch(() => setMembers([])).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Département Intercession
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Confidentiel — visible uniquement par le Corps Pastoral
          </p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
          background: '#c97fb020', color: '#c97fb0', border: '1px solid #c97fb040',
        }}>
          🔒 Confidentiel
        </span>
      </div>

      <div style={{
        background: '#8a6fb010', border: '1px solid #8a6fb030',
        borderRadius: T.radius, padding: '16px',
        display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '720px',
      }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</span>
        <div style={{ fontSize: '13px', color: '#5f4f7a', lineHeight: 1.5 }}>
          Ce département est marqué <strong>confidentiel</strong>. Ses membres, plannings et statistiques
          sont masqués des vues globales, des exports standards et des statistiques publiques.
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', color: T.ink }}>
          Membres
        </div>
        <div style={{ fontSize: '13px', color: T.muted, marginTop: '2px' }}>
          {loading ? '…' : `${members.length} intercesseur${members.length > 1 ? 's' : ''}`}
        </div>
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {members.map(m => (
          <Card key={m.id} pad={14} style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <Avatar name={`${m.prenom} ${m.nom}`} size={38} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: T.ink }}>{m.prenom} {m.nom}</div>
              <div style={{ fontSize: '11.5px', color: T.sub }}>Intercesseur</div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                <span style={{
                  padding: '1px 6px', borderRadius: '4px', fontSize: '10px',
                  background: m.statut === 'ACTIF' ? T.okSoft : T.warnSoft,
                  color: m.statut === 'ACTIF' ? T.ok : T.warn, fontWeight: 600,
                }}>
                  {m.statut}
                </span>
              </div>
            </div>
          </Card>
        ))}
        {!loading && members.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>
            Aucun membre dans ce département
          </div>
        )}
      </div>
    </div>
  )
}
