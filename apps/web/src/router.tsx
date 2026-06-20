import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReferentLayout } from '@/pages/referent/ReferentLayout'
import { StarLayout } from '@/pages/star/StarLayout'
import { CoordLayout } from '@/pages/coordination/CoordLayout'
import { PastoralLayout } from '@/pages/pastoral/PastoralLayout'
import { AdminLayout } from '@/pages/admin/AdminLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const PendingPage = lazy(() => import('@/pages/auth/PendingPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ReferentDashboard = lazy(() => import('@/pages/referent/ReferentDashboard'))
const PlanningListPage = lazy(() => import('@/pages/referent/PlanningListPage'))
const EventDetailPage = lazy(() => import('@/pages/referent/EventDetailPage'))
const EquipePage = lazy(() => import('@/pages/referent/EquipePage'))
const StarDetailPage = lazy(() => import('@/pages/referent/StarDetailPage'))
const AlertesPage = lazy(() => import('@/pages/referent/AlertesPage'))
const ValidationsPage = lazy(() => import('@/pages/referent/ValidationsPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage'))
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminDeptsPage = lazy(() => import('@/pages/admin/AdminDeptsPage'))
const AdminModelesPage = lazy(() => import('@/pages/admin/AdminModelesPage'))
const AdminParametresPage = lazy(() => import('@/pages/admin/AdminParametresPage'))
const PastoralDashboard = lazy(() => import('@/pages/pastoral/PastoralDashboard'))
const PastoralStarDetailPage = lazy(() => import('@/pages/pastoral/PastoralStarDetailPage'))
const DiscipulatPage = lazy(() => import('@/pages/pastoral/DiscipulatPage'))
const CoordDashboard = lazy(() => import('@/pages/coordination/CoordDashboard'))
const CoordParametresPage = lazy(() => import('@/pages/coordination/CoordParametresPage'))
const StarAccueil = lazy(() => import('@/pages/star/StarAccueil'))
const StarPlanning = lazy(() => import('@/pages/star/StarPlanning'))
const StarIndispos = lazy(() => import('@/pages/star/StarIndispos'))
const StarProfil = lazy(() => import('@/pages/star/StarProfil'))

function RoleDispatch() {
  const { state } = useAuth()
  if (state.status !== 'authenticated') return <Navigate to="/connexion" replace />
  const roles = state.user.roles
  if (roles.includes('ADMINISTRATEUR')) return <Navigate to="/admin" replace />
  if (roles.includes('CORPS_PASTORAL')) return <Navigate to="/pastoral" replace />
  if (roles.includes('COORDINATION_GENERALE')) return <Navigate to="/coordination" replace />
  if (roles.includes('VIE_DES_STARS')) return <Navigate to="/coordination/equipe" replace />
  if (roles.includes('REFERENT')) return <Navigate to="/referent" replace />
  return <Navigate to="/star" replace />
}

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
          <Route path="/referent/equipe/:id" element={<RequireAuth><ReferentLayout><StarDetailPage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/alertes" element={<RequireAuth><ReferentLayout><AlertesPage /></ReferentLayout></RequireAuth>} />
          <Route path="/referent/validations" element={<RequireAuth><ReferentLayout><ValidationsPage /></ReferentLayout></RequireAuth>} />

          {/* Espace Administrateur */}
          <Route path="/admin" element={<RequireAuth><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth><AdminLayout><AdminUsersPage /></AdminLayout></RequireAuth>} />
          <Route path="/admin/roles" element={<RequireAuth><AdminLayout><AdminRolesPage /></AdminLayout></RequireAuth>} />
          <Route path="/admin/audit" element={<RequireAuth><AdminLayout><AdminAuditPage /></AdminLayout></RequireAuth>} />
          <Route path="/admin/parametres" element={<RequireAuth><AdminLayout><AdminParametresPage /></AdminLayout></RequireAuth>} />
          <Route path="/admin/departements" element={<RequireAuth><AdminLayout><AdminDeptsPage /></AdminLayout></RequireAuth>} />
          <Route path="/admin/modeles" element={<RequireAuth><AdminLayout><AdminModelesPage /></AdminLayout></RequireAuth>} />

          {/* Espace Corps Pastoral */}
          <Route path="/pastoral" element={<RequireAuth><PastoralLayout><PastoralDashboard /></PastoralLayout></RequireAuth>} />
          <Route path="/pastoral/stars/:id" element={<RequireAuth><PastoralLayout><PastoralStarDetailPage /></PastoralLayout></RequireAuth>} />
          <Route path="/pastoral/disciples" element={<RequireAuth><PastoralLayout><DiscipulatPage /></PastoralLayout></RequireAuth>} />

          {/* Espace Coordination */}
          <Route path="/coordination" element={<RequireAuth><CoordLayout><CoordDashboard /></CoordLayout></RequireAuth>} />
          <Route path="/coordination/planning" element={<RequireAuth><CoordLayout><PlanningListPage /></CoordLayout></RequireAuth>} />
          <Route path="/coordination/planning/:id" element={<RequireAuth><CoordLayout><EventDetailPage /></CoordLayout></RequireAuth>} />
          <Route path="/coordination/equipe" element={<RequireAuth><CoordLayout><EquipePage /></CoordLayout></RequireAuth>} />
          <Route path="/coordination/validations" element={<RequireAuth><CoordLayout><ValidationsPage /></CoordLayout></RequireAuth>} />
          <Route path="/coordination/parametres" element={<RequireAuth><CoordLayout><CoordParametresPage /></CoordLayout></RequireAuth>} />

          {/* Espace STAR mobile */}
          <Route path="/star" element={<RequireAuth><StarLayout><StarAccueil /></StarLayout></RequireAuth>} />
          <Route path="/star/planning" element={<RequireAuth><StarLayout><StarPlanning /></StarLayout></RequireAuth>} />
          <Route path="/star/indispos" element={<RequireAuth><StarLayout><StarIndispos /></StarLayout></RequireAuth>} />
          <Route path="/star/profil" element={<RequireAuth><StarLayout><StarProfil /></StarLayout></RequireAuth>} />

          {/* Dispatch racine → espace selon rôle */}
          <Route path="/" element={<RequireAuth><RoleDispatch /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

