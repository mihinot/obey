export const T = {
  // Fonds & surfaces
  bg: '#f6f2fb',
  bgWarm: '#faf7fd',
  surface: '#ffffff',
  surfaceAlt: '#f1eafb',
  // Texte
  ink: '#2c2535',
  sub: '#6c6379',
  muted: '#a096ad',
  // Primaire
  primary: '#7c5cd6',
  primaryDeep: '#5b3fb0',
  primarySoft: '#efe7fb',
  primaryTint: '#f6f1fd',
  // Accent & sémantique
  accent: '#c97fb0',
  accentSoft: '#fbecf4',
  ok: '#4fa57e',
  okSoft: '#eaf6f0',
  warn: '#cf9a4a',
  warnSoft: '#faf0df',
  danger: '#d76a76',
  dangerSoft: '#fbecee',
  border: '#ece3f6',
  borderSoft: '#f4eefb',
  // Ombres
  shadowSm: '0 4px 14px rgba(96,64,160,0.08)',
  shadow: '0 12px 32px rgba(96,64,160,0.12)',
  shadowLg: '0 24px 60px rgba(72,44,130,0.20)',
  // Rayons
  radiusSm: 10,
  radius: 16,
  radiusLg: 24,
  pill: 999,
} as const

// Couleurs par département
export const DEPT_COLORS: Record<string, string> = {
  ACC: '#7c5cd6',
  SEC: '#6f8fd0',
  PRO: '#c08a5a',
  LOU: '#c97fb0',
  PRI: '#5fae9a',
  COM: '#5b7fb0',
  INT: '#8a6fb0',
}

// Accents par espace
export const SPACE_ACCENTS = {
  referent: '#7c5cd6',
  coordination: '#7c5cd6',
  pastoral: '#c97fb0',
  vie: '#4fa57e',
  admin: '#b8556a',
} as const

// Helpers tone → couleurs
export type Tone = 'ok' | 'warn' | 'danger' | 'primary' | 'accent' | 'muted'

export const TONE_COLORS: Record<Tone, { text: string; bg: string }> = {
  ok:      { text: '#4fa57e', bg: '#eaf6f0' },
  warn:    { text: '#cf9a4a', bg: '#faf0df' },
  danger:  { text: '#d76a76', bg: '#fbecee' },
  primary: { text: '#5b3fb0', bg: '#efe7fb' },
  accent:  { text: '#c97fb0', bg: '#fbecf4' },
  muted:   { text: '#6c6379', bg: '#f1eafb' },
}
