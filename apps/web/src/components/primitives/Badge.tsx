import React from 'react'
import { Tone, TONE_COLORS } from '@/tokens'
import { Icon } from './Icon'

type BadgeProps = {
  tone?: Tone
  children: React.ReactNode
  dot?: boolean
  icon?: string
}

export function Badge({ tone = 'muted', children, dot, icon }: BadgeProps) {
  const { text, bg } = TONE_COLORS[tone]

  const style: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'Figtree, sans-serif',
    whiteSpace: 'nowrap',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: text,
    background: bg,
  }

  return (
    <span style={style}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: text,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {icon && <Icon name={icon} size={13} color={text} />}
      {children}
    </span>
  )
}
