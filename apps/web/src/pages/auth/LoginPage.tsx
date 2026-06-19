import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Field } from '@/components/primitives/Field'
import { Btn } from '@/components/primitives/Btn'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'
import { T } from '@/tokens'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
