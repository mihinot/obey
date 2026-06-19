import React from 'react'

type SectionTitleProps = {
  children: React.ReactNode
  sub?: string
  right?: React.ReactNode
  size?: number
}

export function SectionTitle({ children, sub, right, size = 20 }: SectionTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            fontSize: `${size}px`,
            color: '#2c2535',
          }}
        >
          {children}
        </div>
        {sub && (
          <div style={{ fontSize: '13px', color: '#6c6379', marginTop: '2px' }}>
            {sub}
          </div>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
