import React, { useState } from 'react'
import {
  Wordmark, Btn, Badge, Avatar, Card, Tabs, ProgressBar, Field, SectionTitle, Icon,
} from '@/components/primitives'
import { DeskShell } from '@/components/shells/DeskShell'
import { MobileShell } from '@/components/shells/MobileShell'
import { Tone } from '@/tokens'

const TONES: Tone[] = ['ok', 'warn', 'danger', 'primary', 'accent', 'muted']

const DEMO_NAMES = ['Sophie Martin', 'Jean Dupont', 'Marie Claire', 'Paul Bernard', 'Lucie Morel']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <div
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: '13px',
          color: '#a096ad',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '16px',
          borderBottom: '1px solid #ece3f6',
          paddingBottom: '8px',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  )
}

function DeskDemo() {
  const [activeNav, setActiveNav] = useState('dashboard')
  return (
    <div style={{ border: '1px solid #ece3f6', borderRadius: '24px', overflow: 'hidden', height: '500px' }}>
      <DeskShell
        scope={{ label: 'Référent', sub: 'Espace' }}
        accent="#7c5cd6"
        nav={[
          { id: 'dashboard', icon: 'home', label: 'Dashboard' },
          { id: 'planning', icon: 'calendar', label: 'Planning', badge: 3 },
          { id: 'equipe', icon: 'users', label: 'Équipe' },
        ]}
        active={activeNav}
        onNav={setActiveNav}
        user={{ name: 'Sophie Martin', role: 'Référent' }}
        onLogout={() => {}}
        notifCount={5}
        onBell={() => {}}
      >
        <SectionTitle sub="Vue d'ensemble de votre espace">Dashboard</SectionTitle>
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card pad={20}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: '#7c5cd6' }}>12</div>
            <div style={{ fontSize: '13px', color: '#6c6379', marginTop: '4px' }}>Membres actifs</div>
          </Card>
          <Card pad={20}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: '#4fa57e' }}>8</div>
            <div style={{ fontSize: '13px', color: '#6c6379', marginTop: '4px' }}>Disponibles</div>
          </Card>
          <Card pad={20}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '28px', color: '#cf9a4a' }}>3</div>
            <div style={{ fontSize: '13px', color: '#6c6379', marginTop: '4px' }}>En attente</div>
          </Card>
        </div>
      </DeskShell>
    </div>
  )
}

function MobileDemo() {
  const [activeTab, setActiveTab] = useState('home')
  return (
    <div style={{ border: '1px solid #ece3f6', borderRadius: '24px', overflow: 'hidden', maxWidth: '360px' }}>
      <MobileShell
        tabs={[
          { id: 'home', icon: 'home', label: 'Accueil' },
          { id: 'calendar', icon: 'calendar', label: 'Planning' },
          { id: 'bell', icon: 'bell', label: 'Notifs', badge: 2 },
          { id: 'user', icon: 'user', label: 'Profil' },
        ]}
        active={activeTab}
        onTab={setActiveTab}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '20px', color: '#2c2535', marginBottom: '4px' }}>
            Bonjour, Sophie 👋
          </div>
          <div style={{ fontSize: '13px', color: '#6c6379' }}>Espace STAR · Samedi</div>
          <Card pad={16} style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#7c5cd6', marginBottom: '8px' }}>Prochain service</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#2c2535' }}>Dimanche 10h00</div>
            <div style={{ fontSize: '13px', color: '#6c6379', marginTop: '2px' }}>Accueil — Salle principale</div>
          </Card>
        </div>
      </MobileShell>
    </div>
  )
}

export default function App() {
  const [tabValue, setTabValue] = useState('tab1')
  const [fieldValue, setFieldValue] = useState('')

  return (
    <div style={{ background: '#f6f2fb', padding: '32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600,
            fontSize: '28px',
            color: '#2c2535',
            marginBottom: '40px',
          }}
        >
          OBEY — Bibliothèque de composants
        </h1>

        <Section title="Wordmark">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Wordmark size={24} />
            <Wordmark size={36} />
            <Wordmark size={48} color="#7c5cd6" />
          </div>
        </Section>

        <Section title="Boutons — Variants">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <Btn variant="primary">Primary</Btn>
            <Btn variant="deep">Deep</Btn>
            <Btn variant="soft">Soft</Btn>
            <Btn variant="outline">Outline</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="danger">Danger</Btn>
            <Btn variant="dangerSoft">Danger Soft</Btn>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
            <Btn size="sm" icon="plus">Petit</Btn>
            <Btn size="md" icon="check">Moyen</Btn>
            <Btn size="lg" icon="spark">Grand</Btn>
          </div>
          <div style={{ maxWidth: '300px' }}>
            <Btn full icon="heart">Bouton pleine largeur</Btn>
          </div>
        </Section>

        <Section title="Badges">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {TONES.map((t) => (
              <Badge key={t} tone={t} dot>{t}</Badge>
            ))}
            {TONES.map((t) => (
              <Badge key={t + 'icon'} tone={t} icon="check">{t}</Badge>
            ))}
          </div>
        </Section>

        <Section title="Avatars">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {DEMO_NAMES.map((name, i) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Avatar name={name} size={[32, 38, 48, 60, 72][i]} />
                <span style={{ fontSize: '11px', color: '#a096ad' }}>{[32, 38, 48, 60, 72][i]}px</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Cards">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <Card pad={24}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                Card simple
              </div>
              <p style={{ fontSize: '14px', color: '#6c6379', lineHeight: 1.5 }}>
                Une carte avec du contenu basique. Border radius 24px, ombre douce.
              </p>
            </Card>
            <Card pad={24} hover onClick={() => alert('Clicked!')}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                Card interactive
              </div>
              <p style={{ fontSize: '14px', color: '#6c6379', lineHeight: 1.5 }}>
                Cette carte a l'effet hover et un onClick. Cliquez pour tester.
              </p>
            </Card>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            items={[
              { id: 'tab1', label: 'Tout', icon: 'grid' },
              { id: 'tab2', label: 'En cours', icon: 'clock' },
              { id: 'tab3', label: 'Terminé', icon: 'check' },
            ]}
            value={tabValue}
            onChange={setTabValue}
          />
          <div style={{ marginTop: '16px', fontSize: '14px', color: '#6c6379' }}>
            Onglet actif : <strong>{tabValue}</strong>
          </div>
        </Section>

        <Section title="Progress Bars">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
            <ProgressBar value={75} max={100} color="#7c5cd6" height={8} />
            <ProgressBar value={42} max={100} color="#4fa57e" height={10} />
            <ProgressBar value={90} max={100} color="#c97fb0" height={6} />
          </div>
        </Section>

        <Section title="Field">
          <div style={{ maxWidth: '360px' }}>
            <Field
              label="Nom complet"
              value={fieldValue}
              onChange={setFieldValue}
              placeholder="Ex: Sophie Martin"
              hint="Votre prénom suivi de votre nom de famille"
              right={<Icon name="user" size={16} color="#a096ad" />}
            />
          </div>
        </Section>

        <Section title="DeskShell">
          <DeskDemo />
        </Section>

        <Section title="MobileShell">
          <MobileDemo />
        </Section>
      </div>
    </div>
  )
}
