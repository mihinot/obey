import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, clearTokens } from '@/lib/api'

type User = {
  id: number
  email: string
  statut: string
  prenom: string
  nom: string
  roles: string[]
}

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User }
  | { status: 'pending' }  // EnAttente — logged in but not approved

type AuthCtx = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setState({ status: 'unauthenticated' }); return }
    try {
      const data = await auth.me()
      const user: User = {
        id: data.id,
        email: data.email,
        statut: data.statut,
        prenom: data.star?.prenom ?? '',
        nom: data.star?.nom ?? '',
        roles: data.roles.map((r) => r.type),
      }
      if (data.statut === 'EnAttente') {
        setState({ status: 'pending' })
      } else {
        setState({ status: 'authenticated', user })
      }
    } catch {
      clearTokens()
      setState({ status: 'unauthenticated' })
    }
  }, [])

  useEffect(() => { loadMe() }, [loadMe])

  const login = async (email: string, password: string) => {
    const data = await auth.login({ email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    await loadMe()
  }

  const logout = async () => {
    await auth.logout()
    setState({ status: 'unauthenticated' })
  }

  return <Ctx.Provider value={{ state, login, logout, refresh: loadMe }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
