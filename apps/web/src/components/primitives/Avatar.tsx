import React from 'react'

type AvatarProps = {
  name: string
  size?: number
  tone?: string
}

const PALETTE = ['#7c5cd6', '#c97fb0', '#6f8fd0', '#5fae9a', '#c08a5a']

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, size = 38 }: AvatarProps) {
  const color = PALETTE[name.charCodeAt(0) % 5]
  const bg = color + '22'
  const initials = getInitials(name)

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: bg,
    color,
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 700,
    fontSize: size * 0.38,
    userSelect: 'none',
  }

  return <div style={style}>{initials}</div>
}
