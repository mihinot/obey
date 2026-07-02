import { useEffect, useState, useRef } from 'react'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

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

type Notif = { id: number; titre: string; msg: string; tone: string; lu: boolean; createdAt: string }

const TONE_COLOR: Record<string, string> = {
  ok: T.ok, warn: T.warn, danger: T.danger, primary: T.primary,
}

export function NotifCenter() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.lu).length

  const load = () => {
    setLoading(true)
    api<Notif[]>('/me/notifications').then(setNotifs).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Rafraîchissement toutes les 60s
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markRead = async (id: number) => {
    try {
      await api(`/me/notifications/${id}/read`, { method: 'PATCH' })
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api('/me/notifications/read-all', { method: 'PATCH' })
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    } catch {}
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        style={{
          position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px', borderRadius: '8px', color: T.sub, fontSize: '18px',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '0', right: '0',
            width: '16px', height: '16px', borderRadius: '50%',
            background: T.danger, color: '#fff', fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '340px', background: '#fff',
          borderRadius: T.radiusLg, border: `1px solid ${T.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          zIndex: 100, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', color: T.ink }}>
              Notifications {unread > 0 && <span style={{ color: T.danger }}>({unread})</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: '11px', color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>
                Tout marquer lu
              </button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>Chargement…</div>}
            {!loading && notifs.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: '13px' }}>
                Aucune notification
              </div>
            )}
            {notifs.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: n.lu ? '#fff' : T.primarySoft + '80',
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50', flexShrink: 0,
                  background: n.lu ? T.border : (TONE_COLOR[n.tone] ?? T.primary),
                  marginTop: '5px',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.lu ? 400 : 700, fontSize: '13px', color: T.ink, marginBottom: '2px' }}>
                    {n.titre}
                  </div>
                  <div style={{ fontSize: '12px', color: T.sub, lineHeight: 1.4 }}>{n.msg}</div>
                  <div style={{ fontSize: '11px', color: T.muted, marginTop: '4px' }}>
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
