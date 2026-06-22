import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Field } from '@/components/primitives/Field'
import { Btn } from '@/components/primitives/Btn'
import { T } from '@/tokens'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      const r = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Lien invalide ou expiré')
        return
      }
      setDone(true)
    } catch {
      setError('Erreur réseau — réessayez')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.danger, marginBottom: '12px' }}>
            Lien invalide
          </div>
          <p style={{ fontSize: '13px', color: T.sub, marginBottom: '20px' }}>
            Ce lien de réinitialisation est manquant ou invalide.
          </p>
          <Link to="/mot-de-passe-oublie">
            <Btn variant="primary" full>Faire une nouvelle demande</Btn>
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: T.okSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '28px',
          }}>
            ✓
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '8px' }}>
            Mot de passe mis à jour
          </div>
          <p style={{ fontSize: '14px', color: T.sub, marginBottom: '24px' }}>
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Btn variant="primary" full onClick={() => navigate('/connexion')}>
            Se connecter
          </Btn>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink }}>
            Nouveau mot de passe
          </div>
          <div style={{ fontSize: '13px', color: T.sub, marginTop: '4px' }}>
            Choisissez un mot de passe d'au moins 8 caractères
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: T.dangerSoft, borderRadius: T.radiusSm,
            fontSize: '13px', color: T.danger,
          }}>
            {error}
          </div>
        )}

        <Field
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="8 caractères minimum"
          autoComplete="new-password"
        />

        <div style={{ marginTop: '12px' }}>
          <Field
            label="Confirmer le mot de passe"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Répéter le mot de passe"
            autoComplete="new-password"
          />
        </div>

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Btn type="submit" variant="primary" full loading={loading}>
            Enregistrer
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
