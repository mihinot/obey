import React from 'react'
import { T } from '@/tokens'

type CardProps = {
  children: React.ReactNode
  pad?: number
  hover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export function Card({ children, pad = 18, hover, onClick, style, className }: CardProps) {
  const base: React.CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.borderSoft}`,
    borderRadius: `${T.radiusLg}px`,
    boxShadow: T.shadowSm,
    padding: `${pad}px`,
    cursor: hover || onClick ? 'pointer' : undefined,
    ...style,
  }

  return (
    <div
      style={base}
      className={`${hover ? 'ob-hov' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
