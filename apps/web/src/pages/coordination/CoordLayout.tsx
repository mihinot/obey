import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'dashboard',   icon: 'home',     label: 'Vue globale' },
  { id: 'planning',    icon: 'calendar', label: 'Planning' },
  { id: 'equipe',      icon: 'users',    label: 'Équipes' },
  { id: 'validations', icon: 'check',    label: 'Validations' },
  { id: 'parametres',  icon: 'settings', label: 'Paramètres' },
]

const ROUTE: Record<string, string> = {
  dashboard:   '/coordination',
  planning:    '/coordination/planning',
  equipe:      '/coordination/equipe',
  validations: '/coordination/validations',
  parametres:  '/coordination/parametres',
}

export function CoordLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const user = state.status === 'authenticated' ? state.user : { prenom: '', nom: '', roles: [] }

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname || (path !== '/coordination' && location.pathname.startsWith(path))
  )?.[0] ?? 'dashboard'

  return (
    <DeskShell
      scope={{ label: 'Coordination', sub: 'Espace' }}
      accent="#5b3fb0"
      nav={NAV}
      active={activeId}
      onNav={(id) => navigate(ROUTE[id] ?? '/coordination')}
      user={{ name: `${user.prenom} ${user.nom}`.trim(), role: 'Coordination' }}
      onLogout={logout}
    >
      {children}
    </DeskShell>
  )
}
