const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`
      const retry = await fetch(`${BASE}${path}`, { ...init, headers })
      if (!retry.ok) throw new ApiError(retry.status, await retry.json())
      return retry.json()
    }
    clearTokens()
    window.location.href = '/connexion'
    throw new ApiError(401, { error: 'Session expirée' })
  }

  if (!res.ok) throw new ApiError(res.status, await res.json())
  return res.json()
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('accessToken', data.accessToken)
    return true
  } catch {
    return false
  }
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export class ApiError extends Error {
  constructor(public status: number, public body: { error?: string }) {
    super(body?.error ?? `HTTP ${status}`)
  }
}

// ── Auth ──────────────────────────────────────────────────────────────
export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string; prenom: string; nom: string; tel?: string }

export const auth = {
  login: (p: LoginPayload) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify(p),
    }),
  register: (p: RegisterPayload) =>
    request<{ message: string }>('/auth/register', {
      method: 'POST', body: JSON.stringify(p),
    }),
  me: () =>
    request<{
      id: number
      email: string
      statut: string
      star: { prenom: string; nom: string } | null
      roles: { type: string }[]
    }>('/auth/me'),
  googleLogin: (idToken: string) =>
    request<{ accessToken: string; refreshToken: string } | { status: 'pending' }>('/auth/google', {
      method: 'POST', body: JSON.stringify({ idToken }),
    }),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken')
    clearTokens()
    return request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {})
  },
}

// ── Events ────────────────────────────────────────────────────────────
export type EventStatut = 'BROUILLON' | 'EN_GENERATION' | 'A_VALIDER' | 'PUBLIE' | 'ANNULE'

export type EventSummary = {
  id: number
  nom: string
  type: string
  date: string
  debut: string
  fin: string
  lieu: string
  statut: EventStatut
}

export type EventNeed = { deptCode: string; requis: number }

export type EventDetail = EventSummary & {
  needs: EventNeed[]
  assignments: {
    id: number
    starId: number
    deptCode: string
    statut: string
    conflit: string | null
    star: { prenom: string; nom: string }
  }[]
}

export const events = {
  list: () => request<EventSummary[]>('/events'),
  upcoming: () => request<EventSummary[]>('/events?upcoming=true'),
  get: (id: number) => request<EventDetail>(`/events/${id}`),
  create: (data: Omit<EventSummary, 'id' | 'statut'> & { needs?: EventNeed[] }) =>
    request<EventDetail>('/events', { method: 'POST', body: JSON.stringify(data) }),
  patch: (id: number, data: Partial<EventSummary> & { needs?: EventNeed[] }) =>
    request<EventDetail>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  generate: (id: number) => request<PlanningResult>(`/events/${id}/generate`, { method: 'POST' }),
  publish: (id: number) => request<{ message: string; eventId: number }>(`/events/${id}/publish`, { method: 'POST' }),
}

// ── Stars ─────────────────────────────────────────────────────────────
export type Star = {
  id: number
  prenom: string
  nom: string
  tel: string
  statut: string
  charge: number
  fiab: number
  desist: number
  departments: { deptCode: string }[]
}

export const stars = {
  list: (params?: { statut?: string; dept?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<Star[]>(`/stars${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => request<Star>(`/stars/${id}`),
  patch: (id: number, data: Partial<Star>) =>
    request<Star>(`/stars/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Planning result types ─────────────────────────────────────────────
export type PlanningResult = {
  totalRequis: number
  totalCouverts: number
  totalManque: number
  totalConflits: number
  depts: {
    deptCode: string
    requis: number
    couverts: number
    manque: number
    conflits: { star: { id: number; prenom: string; nom: string }; conflit: string }[]
    selectionnes: {
      score: number
      conflit: string | null
      charge: string
      star: { id: number; prenom: string; nom: string }
    }[]
    reserves: {
      score: number
      star: { id: number; prenom: string; nom: string }
    }[]
    indispos: number
  }[]
}
