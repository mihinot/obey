import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReferentLayout } from '@/pages/referent/ReferentLayout'
import { StarLayout } from '@/pages/star/StarLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const PendingPage = lazy(() => import('@/pages/auth/PendingPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ReferentDashboard = lazy(() => import('@/pages/referent/ReferentDashboard'))
const PlanningListPage = lazy(() => import('@/pages/referent/PlanningListPage'))
const EventDetailPage = lazy(() => import('@/pages/referent/EventDetailPage'))
const EquipePage = lazy(() => import('@/pages/referent/EquipePage'))
const AlertesPage = lazy(() => import('@/pages/referent/AlertesPage'))
const ValidationsPage = lazy(() => import('@/pages/referent/ValidationsPage'))
const StarAccueil = lazy(() => import('@/pages/star/StarAccueil'))
const StarPlanning = lazy(() => import('@/pages/star/StarPlanning'))
const StarIndispos = lazy(() => import('@/pages/star/StarIndispos'))
const StarProfil = lazy(() => import('@/pages/star/StarProfil'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  if (state.status === 'loading') return <Loader />
  if (state.status === 'unauthenticated') return <Navigate to="/connexion" replace />
  if (state.status === 'pending') return <Navigate to="/attente" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  if (state.status === 'loading') return <Loader />
  if (state.status === 'authenticated') return <Navigate to="/" replace />
  if (state.status === 'pending') return <Navigate to="/attente" replace />
  return <>{children}</>
}

function Loader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f2fb' }}>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', color: '#a096ad' }}>Chargement…</div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Auth */}
          <Route path="/connexion" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/inscription" element={<RequireGuest><RegisterPage /></RequireGuest>} />
          <Route path="/attente" element={<PendingPage />} />
          <Route path="/mot-de-passe-oublie" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />

          {/* Espace Référent */}
          <Route path="/referent" element={<RequireAuth><ReferentLayout><ReferentDashboard /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/planning" element={<RequireAuth><ReferentLayout><PlanningListPage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/planning/:id" element={<RequireAuth><ReferentLayout><EventDetailPage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/equipe" element={<RequireAuth><ReferentLayout><EquipePage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/alertes" element={<RequireAuth><ReferentLayout><AlertesPage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/validations" element={<RequireAuth><ReferentLayout><ValidationsPage /></ReferentLayout></RequireAuth>} />

          {/* Espace STAR mobile */}
          <Route path="/star" element={<RequireAuth><StarLayout><StarAccueil /></StarLayout></RequireAuth>} />
          <Route path="/star/planning" element={<RequireAuth><StarLayout><StarPlanning /></StarLayout></RequireAuth>} />
          <Route path="/star/indispos" element={<RequireAuth><StarLayout><StarIndispos /></StarLayout></RequireAuth>} />
          <Route path="/star/profil" element={<RequireAuth><StarLayout><StarProfil /></StarLayout></RequireAuth>} />

          {/* Dispatch racine → référent si connecté */}
          <Route path="/" element={<RequireAuth><Navigate to="/referent" replace /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

