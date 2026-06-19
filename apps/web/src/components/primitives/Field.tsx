import React, { useState } from 'react'
import { T } from '@/tokens'

type FieldProps = {
  label?: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  hint?: string
  right?: React.ReactNode
  disabled?: boolean
  autoComplete?: string
}

export function Field({ label, value, onChange, type = 'text', placeholder, hint, right, disabled, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {label && (
        <label
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: T.sub,
            marginBottom: '5px',
            fontFamily: 'Figtree, sans-serif',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            border: `1px solid ${focused ? T.primary : T.border}`,
            borderRadius: '16px',
            padding: '12px 14px',
            fontSize: '14px',
            width: '100%',
            outline: 'none',
            background: T.bgWarm,
            fontFamily: 'Figtree, sans-serif',
            color: T.ink,
            paddingRight: right ? '42px' : '14px',
            transition: 'border-color .15s',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {right && (
          <div
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {right}
          </div>
        )}
      </div>
      {hint && (
        <span
          style={{
            fontSize: '11.5px',
            color: T.muted,
            marginTop: '4px',
            fontFamily: 'Figtree, sans-serif',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
