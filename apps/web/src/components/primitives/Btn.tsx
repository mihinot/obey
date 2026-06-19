import React from 'react'
import { T } from '@/tokens'
import { Icon } from './Icon'

type BtnProps = {
  variant?: 'primary' | 'deep' | 'soft' | 'outline' | 'ghost' | 'danger' | 'dangerSoft'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  icon?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const VARIANT_STYLES: Record<NonNullable<BtnProps['variant']>, React.CSSProperties> = {
  primary:    { background: T.primary, color: '#fff', boxShadow: T.shadowSm },
  deep:       { background: T.primaryDeep, color: '#fff' },
  soft:       { background: T.primarySoft, color: T.primaryDeep },
  outline:    { background: '#fff', color: T.ink, border: `1px solid ${T.border}` },
  ghost:      { background: 'transparent', color: T.sub },
  danger:     { background: T.danger, color: '#fff' },
  dangerSoft: { background: T.dangerSoft, color: T.danger },
}

const SIZE_STYLES: Record<NonNullable<BtnProps['size']>, React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: '13px' },
  md: { padding: '11px 18px', fontSize: '14.5px' },
  lg: { padding: '14px 24px', fontSize: '16px' },
}

export function Btn({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  onClick,
  disabled,
  loading,
  type = 'button',
  children,
  style,
  className,
}: BtnProps) {
  const isDisabled = disabled || loading
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity .15s',
    borderRadius: '16px',
    fontFamily: 'Figtree, sans-serif',
    fontWeight: 600,
    opacity: isDisabled ? 0.5 : 1,
    ...(full ? { width: '100%', justifyContent: 'center' } : {}),
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
    ...style,
  }

  return (
    <button
      type={type}
      style={base}
      disabled={isDisabled}
      onClick={onClick}
      className={`ob-press${className ? ` ${className}` : ''}`}
    >
      {loading && <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ob-spin 0.6s linear infinite' }} />}
      {!loading && icon && <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  )
}
