import React from 'react'

type DotProps = {
  c: string
  s?: number
}

export function Dot({ c, s = 8 }: DotProps) {
  return (
    <span
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        background: c,
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  )
}
