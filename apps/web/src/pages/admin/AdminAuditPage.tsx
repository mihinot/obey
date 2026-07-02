import { useEffect, useState } from 'react'
import { Card } from '@/components/primitives/Card'
import { Btn } from '@/components/primitives/Btn'
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

const TONE_COLORS: Record<string, string> = {
  ok: T.ok, warn: T.warn, danger: T.danger, primary: T.primary,
}

const PAGE_SIZE = 50

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [allLogs, setAllLogs] = useState<AuditLog[]>([])

  const exportCSV = () => {
    const rows = allLogs.length > 0 ? allLogs : logs
    const csv = [
      ['Date', 'Action', 'Entité', 'ID Entité', 'Utilisateur', 'Email'],
      ...rows.map(l => [
        new Date(l.createdAt).toLocaleString('fr-FR'),
        l.action, l.entite, l.entityId ?? '',
        l.user.star ? `${l.user.star.prenom} ${l.user.star.nom}` : '',
        l.user.email,
      ]),
    ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    setLoading(true)
    api<{ logs: AuditLog[]; total: number }>(`/admin/audit-logs?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      .then(d => { setLogs(d.logs); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    // Pré-charger tous les logs pour l'export (limité à 1000)
    api<{ logs: AuditLog[] }>('/admin/audit-logs?limit=1000&offset=0').then(d => setAllLogs(d.logs)).catch(() => {})
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '22px', color: T.ink }}>Journal d'audit</h1>
          <p style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>{total} entrée{total > 1 ? 's' : ''} au total</p>
        </div>
        <Btn variant="soft" size="sm" onClick={exportCSV}>
          Exporter CSV
        </Btn>
      </div>

      {loading && <div style={{ color: T.muted, fontSize: '13px' }}>Chargement…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {logs.map(log => (
          <Card key={log.id} pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  background: TONE_COLORS[log.tone] ?? T.primary,
                }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: T.ink }}>{log.action}</span>
                  <span style={{ fontSize: '12px', color: T.sub, marginLeft: '8px' }}>
                    {log.entite}{log.entityId ? ` #${log.entityId}` : ''}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', color: T.ink }}>
                  {log.user.star ? `${log.user.star.prenom} ${log.user.star.nom}` : log.user.email}
                </div>
                <div style={{ fontSize: '11px', color: T.muted }}>
                  {new Date(log.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: T.muted, fontSize: '13px' }}>Aucun log</div>
        )}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '6px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
              background: '#fff', cursor: page === 0 ? 'default' : 'pointer',
              color: page === 0 ? T.muted : T.ink, fontSize: '13px',
            }}
          >
            ← Précédent
          </button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: T.sub }}>
            {page + 1} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '6px 16px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
              background: '#fff', cursor: (page + 1) * PAGE_SIZE >= total ? 'default' : 'pointer',
              color: (page + 1) * PAGE_SIZE >= total ? T.muted : T.ink, fontSize: '13px',
            }}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
