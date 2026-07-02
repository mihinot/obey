import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MobileShell } from '@/components/shells/MobileShell'

const TABS = [
  { id: 'accueil',  icon: 'home',     label: 'Accueil' },
  { id: 'planning', icon: 'calendar', label: 'Mes services' },
  { id: 'agenda',   icon: 'list',     label: 'Agenda' },
  { id: 'indispos', icon: 'x',        label: 'Indispos' },
  { id: 'profil',   icon: 'user',     label: 'Profil' },
]

const ROUTE: Record<string, string> = {
  accueil:  '/star',
  planning: '/star/planning',
  agenda:   '/star/agenda',
  indispos: '/star/indispos',
  profil:   '/star/profil',
}

export function StarLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname
  )?.[0] ?? 'accueil'

  return (
    <MobileShell
      tabs={TABS}
      active={activeId}
      onTab={(id) => navigate(ROUTE[id] ?? '/star')}
    >
      {children}
    </MobileShell>
  )
}
