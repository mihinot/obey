import { Link } from 'react-router-dom'
import { AuthShell } from '@/components/shells/AuthShell'
import { Btn } from '@/components/primitives/Btn'
import { useAuth } from '@/contexts/AuthContext'
import { T } from '@/tokens'

export default function PendingPage() {
  const { logout } = useAuth()

  return (
    <AuthShell>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: T.warnSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '28px',
        }}>
          🕐
        </div>

        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: T.ink, marginBottom: '8px' }}>
          Compte en attente
        </div>
        <div style={{ fontSize: '14px', color: T.sub, lineHeight: 1.6, marginBottom: '24px' }}>
          Votre inscription a bien été reçue.<br />
          Un référent va valider votre compte prochainement.<br />
          Vous recevrez une notification dès que votre accès sera activé.
        </div>

        <div style={{
          padding: '16px',
          background: T.warnSoft,
          borderRadius: T.radius,
          fontSize: '13px',
          color: T.warn,
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <strong>Que se passe-t-il maintenant ?</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: 1.8 }}>
            <li>Votre référent de département reçoit une alerte</li>
            <li>Il valide et vous affecte à votre département</li>
            <li>Vous recevez un e-mail de confirmation</li>
          </ul>
        </div>

        <Btn variant="ghost" full onClick={logout}>
          Se déconnecter
        </Btn>

        <div style={{ marginTop: '16px', fontSize: '12px', color: T.muted }}>
          Un problème ?{' '}
          <Link to="/connexion" style={{ color: T.primary, textDecoration: 'none' }}>
            Contactez votre référent
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
