import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'dashboard',    icon: 'home',     label: 'Dashboard' },
  { id: 'planning',     icon: 'calendar', label: 'Planning' },
  { id: 'equipe',       icon: 'users',    label: 'Équipe' },
  { id: 'validations',  icon: 'check',    label: 'Validations' },
  { id: 'alertes',      icon: 'alert',    label: 'Alertes' },
]

const ROUTE: Record<string, string> = {
  dashboard:   '/referent',
  planning:    '/referent/planning',
  equipe:      '/referent/equipe',
  validations: '/referent/validations',
  alertes:     '/referent/alertes',
}

export function ReferentLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifCount] = useState(0)

  const user = state.status === 'authenticated' ? state.user : { prenom: '', nom: '', roles: [] }

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname || (path !== '/referent' && location.pathname.startsWith(path))
  )?.[0] ?? 'dashboard'

  return (
    <DeskShell
      scope={{ label: 'Espace Référent', sub: 'Rôle' }}
      accent="#7c5cd6"
      nav={NAV}
      active={activeId}
      onNav={(id) => navigate(ROUTE[id] ?? '/referent')}
      user={{ name: `${user.prenom} ${user.nom}`.trim(), role: 'Référent' }}
      onLogout={logout}
      notifCount={notifCount}
      onBell={() => navigate('/referent/alertes')}
    >
      {children}
    </DeskShell>
  )
}
