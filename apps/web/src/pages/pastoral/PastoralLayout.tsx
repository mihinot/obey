import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'dashboard', icon: 'home',     label: 'Vue d\'ensemble' },
  { id: 'stars',     icon: 'users',    label: 'Fiches STARs' },
  { id: 'disciples', icon: 'check',    label: 'Discipulat' },
]

const ROUTE: Record<string, string> = {
  dashboard: '/pastoral',
  stars:     '/pastoral/stars',
  disciples: '/pastoral/disciples',
}

export function PastoralLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const user = state.status === 'authenticated' ? state.user : { prenom: '', nom: '', roles: [] }

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname || (path !== '/pastoral' && location.pathname.startsWith(path))
  )?.[0] ?? 'dashboard'

  return (
    <DeskShell
      scope={{ label: 'Corps Pastoral', sub: 'Espace' }}
      accent="#2e6b3e"
      nav={NAV}
      active={activeId}
      onNav={(id) => navigate(ROUTE[id] ?? '/pastoral')}
      user={{ name: `${user.prenom} ${user.nom}`.trim(), role: 'Corps Pastoral' }}
      onLogout={logout}
    >
      {children}
    </DeskShell>
  )
}
