import { ApiError } from './api'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) throw new ApiError(res.status, await res.json())
  return res.json()
}

export type MyAssignment = {
  id: number
  deptCode: string
  statut: 'Proposee' | 'Publiee' | 'Confirmee' | 'Desistee'
  conflit: string | null
  event: {
    id: number
    nom: string
    date: string
    debut: string
    fin: string
    lieu: string
    statut: string
  }
}

export type Availability = {
  id: number
  dateFrom: string
  dateTo: string
  motif: string
}

export const me = {
  assignments: () => request<MyAssignment[]>('/me/assignments'),
  confirm: (id: number) => request<MyAssignment>(`/me/assignments/${id}/confirm`, { method: 'POST' }),
  desister: (id: number) =>
    request<{ message: string; late: boolean; daysUntilEvent: number }>(
      `/me/assignments/${id}/desister`, { method: 'POST' }
    ),
  availabilities: () => request<Availability[]>('/me/availabilities'),
  addAvailability: (data: { dateFrom: string; dateTo: string; motif?: string }) =>
    request<Availability>('/me/availabilities', { method: 'POST', body: JSON.stringify(data) }),
  deleteAvailability: (id: number) =>
    request<{ message: string }>(`/me/availabilities/${id}`, { method: 'DELETE' }),
}
