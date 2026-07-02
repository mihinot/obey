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

type StarPastoral = {
  id: number
  prenom: string
  nom: string
  statut: string
  baptise: boolean
  f001: boolean
  f101: boolean
  f201: boolean
  famille: string | null
  disciple: boolean
}

function Check({ ok }: { ok: boolean }) {
  return ok
    ? <span style={{ color: T.ok, fontWeight: 700, fontSize: '16px' }}>✓</span>
    : <span style={{ color: T.border }}>—</span>
}

export default function SuiviPastoralPage() {
  const [stars, setStars] = useState<StarPastoral[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    api<StarPastoral[]>('/pastoral/stars').then(setStars).finally(() => setLoading(false))
  }, [])

  const filtered = stars.filter(s =>
    `${s.prenom} ${s.nom}`.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>
            Suivi pastoral
          </h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Données spirituelles — accès réservé au Corps Pastoral
          </p>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
          background: '#c97fb020', color: '#c97fb0', border: '1px solid #c97fb040',
        }}>
          🔒 Confidentiel
        </span>
      </div>

      <div style={{ maxWidth: '300px', marginBottom: '16px' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un STAR…"
          style={{
            width: '100%', padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      {!loading && (
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['STAR', 'Baptême', 'F. 001', 'F. 101', 'F. 201', "Famille d'Impact", 'Disciple'].map(h => (
                    <th key={h} style={{
                      padding: '13px 14px', fontSize: '11.5px', fontWeight: 700, color: T.sub,
                      textAlign: h === 'STAR' || h === "Famille d'Impact" ? 'left' : 'center',
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${T.border}`, background: idx % 2 === 0 ? '#fff' : T.bg }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={`${s.prenom} ${s.nom}`} size={30} />
                        <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{s.prenom} {s.nom}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '11px 14px' }}><Check ok={s.baptise} /></td>
                    <td style={{ textAlign: 'center', padding: '11px 14px' }}><Check ok={s.f001} /></td>
                    <td style={{ textAlign: 'center', padding: '11px 14px' }}><Check ok={s.f101} /></td>
                    <td style={{ textAlign: 'center', padding: '11px 14px' }}><Check ok={s.f201} /></td>
                    <td style={{ padding: '11px 14px', fontSize: '13px', color: s.famille ? T.ink : T.muted }}>
                      {s.famille || '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '11px 14px' }}><Check ok={s.disciple} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>
                      Aucun STAR trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
