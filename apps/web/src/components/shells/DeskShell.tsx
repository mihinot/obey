import React, { useState } from 'react'
import { Wordmark, Badge, Avatar, Icon } from '@/components/primitives'

type NavItem = {
  id: string
  icon: string
  label: string
  badge?: number
}

type DeskShellProps = {
  scope: { label: string; sub: string }
  accent: string
  nav: NavItem[]
  active: string
  onNav: (id: string) => void
  user: { name: string; role: string }
  onLogout: () => void
  notifCount?: number
  onBell?: () => void
  children: React.ReactNode
}

export function DeskShell({
  scope,
  accent,
  nav,
  active,
  onNav,
  user,
  onLogout,
  notifCount,
  onBell,
  children,
}: DeskShellProps) {
  const [search, setSearch] = useState('')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f2fb' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: '#fff',
          borderRight: '1px solid #f4eefb',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wordmark size={26} />
          <Badge tone="muted">V1</Badge>
        </div>

        {/* Scope */}
        <div
          style={{
            background: accent + '14',
            borderRadius: '12px',
            padding: '10px 12px',
            margin: '16px 0',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#a096ad',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'Figtree, sans-serif',
            }}
          >
            {scope.sub}
          </div>
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              color: accent,
            }}
          >
            {scope.label}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {nav.map((item) => {
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: 'Figtree, sans-serif',
                  fontSize: '14px',
                  transition: 'background .15s',
                  background: isActive ? accent + '1c' : 'transparent',
                  color: isActive ? accent : '#6c6379',
                  fontWeight: isActive ? 600 : 400,
                  position: 'relative',
                }}
              >
                <Icon name={item.icon} size={16} color={isActive ? accent : '#6c6379'} />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#d76a76',
                      color: '#fff',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
          <button
            onClick={() => {}}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '9px 12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'Figtree, sans-serif',
              fontSize: '14px',
              background: 'transparent',
              color: '#6c6379',
            }}
          >
            <Icon name="layers" size={16} color="#6c6379" />
            Changer de rôle
          </button>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '9px 12px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'Figtree, sans-serif',
              fontSize: '14px',
              background: 'transparent',
              color: '#6c6379',
            }}
          >
            <Icon name="logout" size={16} color="#6c6379" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #f4eefb',
            padding: '0 28px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          }}
        >
          <div style={{ maxWidth: '360px', width: '100%', position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{
                border: '1px solid #ece3f6',
                borderRadius: '999px',
                padding: '9px 40px 9px 16px',
                fontSize: '13.5px',
                width: '100%',
                outline: 'none',
                background: '#faf7fd',
                fontFamily: 'Figtree, sans-serif',
                color: '#2c2535',
              }}
            />
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name="search" size={15} color="#a096ad" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBell}
              style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
              }}
            >
              <Icon name="bell" size={20} color="#6c6379" />
              {notifCount !== undefined && notifCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    background: '#d76a76',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {notifCount}
                </span>
              )}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={user.name} size={34} />
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#2c2535',
                  fontFamily: 'Figtree, sans-serif',
                }}
              >
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '26px 28px 40px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
