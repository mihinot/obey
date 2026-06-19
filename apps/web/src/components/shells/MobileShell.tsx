import React from 'react'
import { Icon } from '@/components/primitives'

type MobileTab = {
  id: string
  icon: string
  label: string
  badge?: number
}

type MobileShellProps = {
  tabs: MobileTab[]
  active: string
  onTab: (id: string) => void
  children: React.ReactNode
}

export function MobileShell({ tabs, active, onTab, children }: MobileShellProps) {
  return (
    <div
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        minHeight: '100vh',
        background: '#faf7fd',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          background: '#7c5cd6',
          color: '#fff',
          padding: '12px 20px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'Figtree, sans-serif',
        }}
      >
        <span>9:41</span>
        <span>♥ Servir</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: '80px' }}>
        {children}
      </div>

      {/* Tab bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          borderTop: '1px solid #f4eefb',
          display: 'flex',
          padding: '8px 0',
          zIndex: 20,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => onTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'Figtree, sans-serif',
                transition: 'color .15s',
                color: isActive ? '#7c5cd6' : '#a096ad',
                fontWeight: isActive ? 600 : 400,
                minHeight: '44px',
                position: 'relative',
              }}
            >
              <Icon name={tab.icon} size={20} color={isActive ? '#7c5cd6' : '#a096ad'} />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '20%',
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
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
