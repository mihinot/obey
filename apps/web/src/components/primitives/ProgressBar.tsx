import React from 'react'

type ProgressBarProps = {
  value: number
  max: number
  color?: string
  height?: number
  animate?: boolean
}

export function ProgressBar({ value, max, color = '#7c5cd6', height = 8, animate }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      style={{
        background: '#f1eafb',
        borderRadius: '999px',
        height: `${height}px`,
        overflow: 'hidden',
      }}
    >
      <div
        className={animate ? 'ob-bar-animate' : undefined}
        style={{
          background: color,
          height: '100%',
          borderRadius: '999px',
          transition: 'width .6s cubic-bezier(.2,.8,.3,1)',
          width: `${pct}%`,
        }}
      />
    </div>
  )
}
