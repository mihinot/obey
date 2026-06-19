import React from 'react'

type WordmarkProps = {
  size?: number
  color?: string
}

export function Wordmark({ size = 28, color = '#2c2535' }: WordmarkProps) {
  return (
    <span
      style={{
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 800,
        fontSize: size,
        color,
        letterSpacing: '-0.01em',
      }}
    >
      OBEY
    </span>
  )
}
