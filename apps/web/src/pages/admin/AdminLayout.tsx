import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'dashboard',    icon: 'home',     label: 'Vue d\'ensemble' },
  { id: 'users',        icon: 'users',    label: 'Utilisateurs' },
  { id: 'roles',        icon: 'check',    label: 'Rôles' },
  { id: 'departements', icon: 'list',     label: 'Départements' },
  { id: 'modeles',      icon: 'calendar', label: 'Modèles' },
  { id: 'audit',        icon: 'alert',    label: 'Audit' },
  { id: 'parametres',   icon: 'settings', label: 'Paramètres' },
]

const ROUTE: Record<string, string> = {
  dashboard:    '/admin',
  users:        '/admin/users',
  roles:        '/admin/roles',
  departements: '/admin/departements',
  modeles:      '/admin/modeles',
  audit:        '/admin/audit',
  parametres:   '/admin/parametres',
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const user = state.status === 'authenticated' ? state.user : { prenom: '', nom: '', roles: [] }

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname || (path !== '/admin' && location.pathname.startsWith(path))
  )?.[0] ?? 'dashboard'

  return (
    <DeskShell
      scope={{ label: 'Administration', sub: 'Espace' }}
      accent="#1a1a2e"
      nav={NAV}
      active={activeId}
      onNav={(id) => navigate(ROUTE[id] ?? '/admin')}
      user={{ name: `${user.prenom} ${user.nom}`.trim(), role: 'Administrateur' }}
      onLogout={logout}
    >
      {children}
    </DeskShell>
  )
}
