// OBEY — Écrans d'authentification (Connexion, Inscription, Mot de passe oublié, Compte en attente)
const { useState: useStateAuth } = React;

function AuthShell({ children }) {
  return (
    <div style={{ minHeight: '100%', background: `radial-gradient(120% 90% at 50% -10%, ${T.primarySoft} 0%, ${T.bg} 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="ob-rise" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <Wordmark size={40} />
          <div style={{ marginTop: 10, fontFamily: T.display, fontStyle: 'italic', fontSize: 15, color: T.sub }}>
            Disponibles pour Servir avec Amour
          </div>
        </div>
        <Card pad={28} style={{ boxShadow: T.shadow }}>{children}</Card>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: T.muted }}>OBEY · Plateforme de service · V1</div>
      </div>
    </div>
  );
}

function Connexion({ go, onLogin }) {
  const [email, setEmail] = useStateAuth('esther.mbala@obey.church');
  const [pwd, setPwd] = useStateAuth('••••••••••');
  return (
    <AuthShell>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 23, marginBottom: 4 }}>Content de te revoir</div>
      <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 20 }}>Connecte-toi pour accéder à ton espace</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Adresse email" value={email} onChange={setEmail} placeholder="ton.email@obey.church" />
        <Field label="Mot de passe" type="password" value={pwd} onChange={setPwd} />
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <span onClick={() => go('oubli')} style={{ fontSize: 12.5, color: T.primary, fontWeight: 600, cursor: 'pointer' }}>Mot de passe oublié ?</span>
        </div>
        <Btn full size="lg" onClick={() => onLogin('star')}>Se connecter</Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.muted, fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} /> ou <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <Btn full variant="outline" onClick={() => onLogin('star')}>
          <span style={{ fontWeight: 800, color: '#4285F4', fontSize: 16 }}>G</span>&nbsp;Continuer avec Google
        </Btn>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: T.sub, marginTop: 20 }}>
        Nouveau parmi nous ? <span onClick={() => go('inscription')} style={{ color: T.primary, fontWeight: 600, cursor: 'pointer' }}>Crée ton compte</span>
      </div>
    </AuthShell>
  );
}

function Inscription({ go }) {
  const [step, setStep] = useStateAuth(0);
  const [f, setF] = useStateAuth({ prenom: '', nom: '', email: '', tel: '', pwd: '' });
  const set = k => v => setF(s => ({ ...s, [k]: v }));
  if (step === 1) return <CompteAttente go={go} prenom={f.prenom || 'cher ami'} />;
  return (
    <AuthShell>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 23, marginBottom: 4 }}>Rejoins le service</div>
      <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 20 }}>Crée ton compte STAR — il sera validé par un administrateur</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Prénom" value={f.prenom} onChange={set('prenom')} placeholder="Grâce" />
          <Field label="Nom" value={f.nom} onChange={set('nom')} placeholder="Mboto" />
        </div>
        <Field label="Adresse email" value={f.email} onChange={set('email')} placeholder="ton.email@exemple.com" />
        <Field label="Téléphone" value={f.tel} onChange={set('tel')} placeholder="06 12 34 56 78" />
        <Field label="Mot de passe" type="password" value={f.pwd} onChange={set('pwd')} hint="8 caractères minimum" />
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', background: T.surfaceAlt, borderRadius: T.radius, padding: '12px 14px', cursor: 'pointer' }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${T.primary}`, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={13} color="#fff" stroke={3} />
          </span>
          <span style={{ fontSize: 12.5, color: T.sub }}>Je ne suis pas un robot · captcha vérifié</span>
        </label>
        <Btn full size="lg" onClick={() => setStep(1)}>Créer mon compte</Btn>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: T.sub, marginTop: 18 }}>
        Déjà inscrit ? <span onClick={() => go('connexion')} style={{ color: T.primary, fontWeight: 600, cursor: 'pointer' }}>Se connecter</span>
      </div>
    </AuthShell>
  );
}

function CompteAttente({ go, prenom = 'cher ami' }) {
  return (
    <AuthShell>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="ob-scalein" style={{ width: 72, height: 72, borderRadius: '50%', background: T.warnSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Icon name="clock" size={34} color={T.warn} stroke={2} />
        </div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22 }}>Compte en attente</div>
        <div style={{ fontSize: 14, color: T.sub, marginTop: 10, lineHeight: 1.5, maxWidth: 320, margin: '10px auto 0' }}>
          Merci {prenom} ! Ton compte a bien été créé. Un administrateur va le valider sous peu. Tu recevras un email dès qu'il sera actif.
        </div>
        <div style={{ margintop: 22, marginTop: 22 }}>
          <Btn variant="soft" onClick={() => go('connexion')} icon="chevL">Retour à la connexion</Btn>
        </div>
      </div>
    </AuthShell>
  );
}

function MotDePasseOublie({ go }) {
  const [sent, setSent] = useStateAuth(false);
  const [email, setEmail] = useStateAuth('');
  return (
    <AuthShell>
      {!sent ? (
        <div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 23, marginBottom: 4 }}>Mot de passe oublié</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginBottom: 20 }}>Indique ton email, on t'envoie un lien de réinitialisation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Adresse email" value={email} onChange={setEmail} placeholder="ton.email@obey.church" />
            <Btn full size="lg" onClick={() => setSent(true)}>Envoyer le lien</Btn>
            <Btn full variant="ghost" onClick={() => go('connexion')} icon="chevL">Retour</Btn>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div className="ob-scalein" style={{ width: 72, height: 72, borderRadius: '50%', background: T.okSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <Icon name="check" size={34} color={T.ok} stroke={2.5} />
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22 }}>Email envoyé</div>
          <div style={{ fontSize: 14, color: T.sub, marginTop: 10, lineHeight: 1.5 }}>Consulte ta boîte mail pour réinitialiser ton mot de passe.</div>
          <div style={{ marginTop: 22 }}><Btn variant="soft" onClick={() => go('connexion')}>Retour à la connexion</Btn></div>
        </div>
      )}
    </AuthShell>
  );
}

Object.assign(window, { Connexion, Inscription, CompteAttente, MotDePasseOublie });
