import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'dashboard',     icon: 'home',     label: 'Vue globale' },
  { id: 'planning',      icon: 'calendar', label: 'Planning' },
  { id: 'validations',   icon: 'check',    label: 'Validations' },
  { id: 'equipe',        icon: 'users',    label: 'Équipes' },
  { id: 'departements',  icon: 'list',     label: 'Départements' },
  { id: 'alertes',       icon: 'alert',    label: 'Alertes' },
  { id: 'stats',         icon: 'list',     label: 'Statistiques' },
  { id: 'exports',       icon: 'dl',       label: 'Exports' },
  { id: 'parametres',    icon: 'settings', label: 'Paramètres' },
]

const ROUTE: Record<string, string> = {
  dashboard:    '/coordination',
  planning:     '/coordination/planning',
  validations:  '/coordination/validations',
  equipe:       '/coordination/equipe',
  departements: '/coordination/departements',
  alertes:      '/coordination/alertes',
  stats:        '/coordination/stats',
  exports:      '/coordination/exports',
  parametres:   '/coordination/parametres',
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
