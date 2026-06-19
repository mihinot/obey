import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const PendingPage = lazy(() => import('@/pages/auth/PendingPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))

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
          <Route path="/connexion" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/inscription" element={<RequireGuest><RegisterPage /></RequireGuest>} />
          <Route path="/attente" element={<PendingPage />} />
          <Route path="/mot-de-passe-oublie" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />
          <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
