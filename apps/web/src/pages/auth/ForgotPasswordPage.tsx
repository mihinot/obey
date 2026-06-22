import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Field } from '@/components/primitives/Field'
import { Btn } from '@/components/primitives/Btn'
import { T } from '@/tokens'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: T.okSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '28px',
          }}>
            ✉️
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '8px' }}>
            E-mail envoyé
          </div>
          <div style={{ fontSize: '14px', color: T.sub, lineHeight: 1.6, marginBottom: '24px' }}>
            Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
          </div>
          <Link to="/connexion">
            <Btn variant="primary" full>Retour à la connexion</Btn>
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
            Mot de passe oublié
          </div>
          <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Entrez votre e-mail pour recevoir un lien de réinitialisation
          </div>
        </div>

        <Field
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="vous@exemple.com"
          autoComplete="email"
        />

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Btn type="submit" variant="primary" full loading={loading}>
            Envoyer le lien
          </Btn>
          <div style={{ textAlign: 'center' }}>
            <Link to="/connexion" style={{ fontSize: '13px', color: T.primary, textDecoration: 'none' }}>
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}
