import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/primitives/Card'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function api<R>(path: string): Promise<R> {
  const token = localStorage.getItem('accessToken')
  return fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }).then(async (r) => {
    if (!r.ok) throw new ApiError(r.status, await r.json())
    return r.json()
  })
}

type AuditLog = {
  id: number
  action: string
  entite: string
  entityId: string | null
  tone: string
  createdAt: string
  user: { email: string; star: { prenom: string; nom: string } | null }
}

type AdminUser = {
  id: number
  email: string
  statut: string
  star: { prenom: string; nom: string } | null
  roles: { id: number; type: string; deptCode: string | null }[]
}

const TONE_COLORS: Record<string, string> = {
  ok: T.ok, warn: T.warn, danger: T.danger, primary: T.primary,
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<AdminUser[]>('/admin/users'),
      api<{ logs: AuditLog[] }>('/admin/audit-logs?limit=10'),
    ])
      .then(([u, l]) => { setUsers(u); setLogs(l.logs) })
      .finally(() => setLoading(false))
  }, [])

  const total = users.length
  const actifs = users.filter(u => u.statut === 'Actif').length
  const enAttente = users.filter(u => u.statut === 'EnAttente').length
  const refuses = users.filter(u => u.statut === 'Refuse').length

  if (loading) return <div style={{ padding: '40px', color: T.muted, fontSize: '14px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Administration</h1>
        <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>Vue globale — gestion système</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total comptes', value: total, color: T.ink, path: '/admin/users' },
          { label: 'Actifs', value: actifs, color: T.ok, path: '/admin/users' },
          { label: 'En attente', value: enAttente, color: T.warn, path: '/admin/users' },
          { label: 'Refusés', value: refuses, color: T.danger, path: '/admin/users' },
        ].map(k => (
          <Card key={k.label} pad={18} hover onClick={() => navigate(k.path)}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: T.sub, marginTop: '3px' }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
        {/* Recent audit */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Activité récente
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map(log => (
              <Card key={log.id} pad={14}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{
                      display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                      background: TONE_COLORS[log.tone] ?? T.primary, marginRight: '8px',
                    }} />
                    <span style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{log.action}</span>
                    <span style={{ fontSize: '12px', color: T.sub, marginLeft: '6px' }}>
                      {log.entite}{log.entityId ? ` #${log.entityId}` : ''}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: T.muted }}>
                      {log.user.star ? `${log.user.star.prenom} ${log.user.star.nom}` : log.user.email}
                    </div>
                    <div style={{ fontSize: '11px', color: T.muted }}>
                      {new Date(log.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {logs.length === 0 && (
              <div style={{ color: T.muted, fontSize: '13px', padding: '20px 0' }}>Aucun log</div>
            )}
          </div>
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => navigate('/admin/audit')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.primary, fontSize: '13px' }}
            >
              Voir tout l'historique →
            </button>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '15px', color: T.ink, marginBottom: '12px' }}>
            Actions rapides
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Valider les comptes en attente', sub: `${enAttente} en attente`, path: '/admin/users', color: T.warn },
              { label: 'Gérer les rôles', sub: 'Assigner / révoquer des rôles', path: '/admin/roles', color: T.primary },
              { label: 'Voir les paramètres', sub: 'Algorithme de scoring et config', path: '/admin/parametres', color: T.ink },
              { label: 'Journal d\'audit', sub: 'Toutes les actions', path: '/admin/audit', color: T.sub },
            ].map(item => (
              <Card key={item.label} pad={14} hover onClick={() => navigate(item.path)}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: item.color }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>{item.sub}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
