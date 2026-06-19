import React from 'react'
import { Wordmark } from '@/components/primitives'

type AuthShellProps = {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at 60% 40%, #efe7fb 0%, #f6f2fb 70%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(72,44,130,0.20)',
          padding: '40px 36px',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <Wordmark size={40} />
          <div
            style={{
              fontSize: '13px',
              color: '#6c6379',
              fontStyle: 'italic',
              marginTop: '4px',
            }}
          >
            Disponibles pour Servir avec Amour
          </div>
        </div>
        {children}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: '#a096ad',
          textAlign: 'center',
        }}
      >
        OBEY · Plateforme de service · V1
      </div>
    </div>
  )
}
