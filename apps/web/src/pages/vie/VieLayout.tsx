import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DeskShell } from '@/components/shells/DeskShell'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { id: 'bienetre', icon: 'heart',   label: 'Bien-être des STARs' },
  { id: 'charges',  icon: 'spark',   label: 'Charges de service' },
  { id: 'multi',    icon: 'layers',  label: 'Multi-départements' },
  { id: 'alertes',  icon: 'alert',   label: 'Alertes surcharge' },
]

const ROUTE: Record<string, string> = {
  bienetre: '/vie',
  charges:  '/vie/charges',
  multi:    '/vie/multi',
  alertes:  '/vie/alertes',
}

export function VieLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const user = state.status === 'authenticated' ? state.user : { prenom: '', nom: '', roles: [] }

  const activeId = Object.entries(ROUTE).find(([, path]) =>
    path === location.pathname || (path !== '/vie' && location.pathname.startsWith(path))
  )?.[0] ?? 'bienetre'

  return (
    <DeskShell
      scope={{ label: 'Bien-être & charge', sub: 'Vie des STARs' }}
      accent="#4fa57e"
      nav={NAV}
      active={activeId}
      onNav={(id) => navigate(ROUTE[id] ?? '/vie')}
      user={{ name: `${user.prenom} ${user.nom}`.trim(), role: 'Vie des STARs' }}
      onLogout={logout}
    >
      {children}
    </DeskShell>
  )
}
