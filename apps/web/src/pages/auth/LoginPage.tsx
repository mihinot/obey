import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Field } from '@/components/primitives/Field'
import { Btn } from '@/components/primitives/Btn'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    const scriptId = 'google-identity-services'
    if (document.getElementById(scriptId)) return
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !window.google) return
    setGoogleError('')
    setGoogleLoading(true)
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: { credential: string }) => {
        try {
          await loginWithGoogle(resp.credential)
          navigate('/')
        } catch {
          setGoogleError('Connexion Google échouée. Veuillez réessayer.')
        } finally {
          setGoogleLoading(false)
        }
      },
    })
    window.google.accounts.id.prompt()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          navigate('/attente')
          return
        }
        setError(err.message)
      } else {
        setError('Impossible de se connecter. Vérifiez votre connexion.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
            Connexion
          </div>
          <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Accédez à votre espace de service
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field
            label="Adresse e-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vous@exemple.com"
            autoComplete="email"
          />
          <Field
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: T.dangerSoft,
            borderRadius: T.radiusSm,
            fontSize: '13px',
            color: T.danger,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Btn type="submit" variant="primary" full loading={loading}>
            Se connecter
          </Btn>
          <div style={{ textAlign: 'center', fontSize: '13px', color: T.sub }}>
            <Link to="/mot-de-passe-oublie" style={{ color: T.primary, textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <div style={{ marginTop: '16px' }}>
            {googleError && (
              <div style={{
                marginBottom: '12px',
                padding: '12px 16px',
                background: T.dangerSoft,
                borderRadius: T.radiusSm,
                fontSize: '13px',
                color: T.danger,
              }}>
                {googleError}
              </div>
            )}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px 16px',
                background: '#ffffff',
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                color: T.ink,
                fontSize: '14px',
                fontFamily: 'Figtree, sans-serif',
                fontWeight: 500,
                cursor: googleLoading ? 'not-allowed' : 'pointer',
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Connexion…' : 'Continuer avec Google'}
            </button>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${T.border}`,
          fontSize: '13px',
          color: T.sub,
          textAlign: 'center',
        }}>
          Pas encore de compte ?{' '}
          <Link to="/inscription" style={{ color: T.primary, fontWeight: 600, textDecoration: 'none' }}>
            S'inscrire
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
