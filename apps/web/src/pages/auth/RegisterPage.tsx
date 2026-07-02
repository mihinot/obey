import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Field } from '@/components/primitives/Field'
import { Btn } from '@/components/primitives/Btn'
import { ApiError, auth } from '@/lib/api'
import { T } from '@/tokens'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    try {
      await auth.register({ prenom, nom, email, password })
      navigate('/attente')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Cette adresse e-mail est déjà utilisée.')
      } else {
        setError('Une erreur est survenue. Réessayez.')
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
            Créer un compte
          </div>
          <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Rejoignez l'équipe de service
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Prénom" value={prenom} onChange={setPrenom} placeholder="Sophie" autoComplete="given-name" />
            <Field label="Nom" value={nom} onChange={setNom} placeholder="Martin" autoComplete="family-name" />
          </div>
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
            placeholder="8 caractères minimum"
            autoComplete="new-password"
          />
          <Field
            label="Confirmer le mot de passe"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            autoComplete="new-password"
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

        <div style={{ marginTop: '24px' }}>
          <Btn type="submit" variant="primary" full loading={loading}>
            Créer mon compte
          </Btn>
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${T.border}`,
          fontSize: '13px',
          color: T.sub,
          textAlign: 'center',
        }}>
          Déjà un compte ?{' '}
          <Link to="/connexion" style={{ color: T.primary, fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
