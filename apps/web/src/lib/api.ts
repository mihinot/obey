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
    // Try refresh
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`
      const retry = await fetch(`${BASE}${path}`, { ...init, headers })
      if (!retry.ok) throw new ApiError(retry.status, await retry.json())
      return retry.json()
    }
    clearTokens()
    window.location.href = '/login'
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

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = { email: string; password: string; prenom: string; nom: string; tel?: string }

export const auth = {
  login: (p: LoginPayload) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  register: (p: RegisterPayload) =>
    request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  me: () =>
    request<{ user: { id: number; email: string; statut: string }; star: { prenom: string; nom: string }; roles: { type: string }[] }>('/auth/me'),
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken')
    clearTokens()
    return request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {})
  },
}
