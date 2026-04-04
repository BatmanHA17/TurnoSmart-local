import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Imports críticos (carga inmediata)
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import RoleGuard from "@/components/RoleGuard";
import { TurnoSmartLanding } from "@/components/turnosmart/TurnoSmartLanding";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

// ═══════════════════════════════════════════════════════════════════════════
// V3 REBUILD — 15 rutas reales + redirects esenciales
// Eliminado: HR (17 rutas), Wiki, Mensajes, Nóminas, Productividad,
// BancoHoras, SolicitudesCambio/Ausencia, BalanceAnual, 18 Settings,
// 5 dashboard variants, 88 legacy redirects, test pages
// ═══════════════════════════════════════════════════════════════════════════

// Auth
const PasswordReset = React.lazy(() => import("@/pages/PasswordReset"));
const AuthCallback = React.lazy(() => import("@/pages/AuthCallback"));

// Onboarding
const OnboardingWizard = React.lazy(() => import("@/pages/OnboardingWizard"));
const OnboardingCreateOrganization = React.lazy(() => import("@/pages/OnboardingCreateOrganization"));

// Dashboard
const RoleBasedDashboard = React.lazy(() => import("@/components/RoleBasedDashboard"));
const MiActividad = React.lazy(() => import("@/pages/MiActividad"));
const Welcome = React.lazy(() => import("@/pages/Welcome"));

// Calendario (CORE)
const TurnosCrear = React.lazy(() => import("@/pages/TurnosCrear"));
const CalendarDay = React.lazy(() => import("@/pages/CalendarDay"));
const CalendarMonth = React.lazy(() => import("@/pages/CalendarMonth"));
const MainLayout = React.lazy(() =>
  import("@/components/MainLayout").then(m => ({ default: m.MainLayout }))
);

// Equipo
const Colaboradores = React.lazy(() => import("@/pages/Colaboradores"));
const ColaboradorDetailLayout = React.lazy(() => import("@/components/colaboradores/ColaboradorDetailLayout"));
const LegacyTabRedirect = React.lazy(() => import("@/components/colaboradores/LegacyTabRedirect"));
const ProfileTab = React.lazy(() => import("@/components/colaboradores/tabs/ProfileTab"));
const ContractTab = React.lazy(() => import("@/components/colaboradores/tabs/ContractTab"));
const PlanningTab = React.lazy(() => import("@/components/colaboradores/tabs/PlanningTab"));
const AbsencesTab = React.lazy(() => import("@/components/colaboradores/tabs/AbsencesTab"));
const AddColaboradorSheetRoute = React.lazy(() =>
  import("@/components/colaboradores/AddColaboradorSheetRoute").then(m => ({ default: m.AddColaboradorSheetRoute }))
);
const QuickCreateTeam = React.lazy(() =>
  import("@/components/colaboradores/QuickCreateTeam").then(m => ({ default: m.QuickCreateTeam }))
);

// Peticiones
const EmployeePetitionsPage = React.lazy(() => import("@/pages/EmployeePetitions"));

// Config (SMART criteria + jobs)
const SettingsLayout = React.lazy(() =>
  import("@/components/SettingsLayout").then(m => ({ default: m.SettingsLayout }))
);
const JobsSettings = React.lazy(() => import("@/pages/JobsSettings"));
const CollectiveAgreementSettings = React.lazy(() => import("@/pages/CollectiveAgreementSettings"));
const CriteriosSmartPage = React.lazy(() => import("@/pages/CriteriosSmartPage"));

// Admin
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const AdminUserManagement = React.lazy(() => import("@/pages/AdminUserManagement"));
const AdminStats = React.lazy(() => import("@/pages/AdminStats"));
const AdminSettings = React.lazy(() => import("@/pages/AdminSettings"));

// Profile
const UserProfile = React.lazy(() =>
  import("@/components/UserProfile").then(m => ({ default: m.UserProfile }))
);

// Legal
const Terms = React.lazy(() => import("@/pages/Terms"));
const Privacy = React.lazy(() => import("@/pages/Privacy"));

// Turno público
const TurnoPublicView = React.lazy(() => import("@/pages/TurnoPublicView"));

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

const ColaboradorRedirect = () => {
  const { id } = useParams();
  const rest = window.location.pathname.split(`/${id}/`)[1] || '';
  return <Navigate to={`/equipo/${id}${rest ? '/' + rest : ''}`} replace />;
};

const LandingOrDashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <TurnoSmartLanding />;
};

// ---------------------------------------------------------------------------
// ROUTES — V3 (15 rutas reales)
// ---------------------------------------------------------------------------

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ═══ 1. Landing ═══ */}
          <Route path="/" element={<LandingOrDashboard />} />
          <Route path="/home" element={<TurnoSmartLanding />} />

          {/* ═══ 2. Auth ═══ */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />

          {/* ═══ 3. Onboarding ═══ */}
          <Route path="/onboarding/wizard" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          <Route path="/onboarding/create-organization" element={<ProtectedRoute><OnboardingCreateOrganization /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

          {/* ═══ 4. Dashboard ═══ */}
          <Route path="/dashboard" element={<ProtectedRoute><SectionErrorBoundary label="dashboard"><RoleBasedDashboard /></SectionErrorBoundary></ProtectedRoute>} />
          <Route path="/mi-actividad" element={<ProtectedRoute><MiActividad /></ProtectedRoute>} />
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />

          {/* ═══ 5. Turnos (CORE) — Vista semanal por defecto ═══ */}
          <Route path="/turnos">
            <Route index element={<ProtectedRoute><SectionErrorBoundary label="calendar-week"><MainLayout><TurnosCrear /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="dia" element={<ProtectedRoute><SectionErrorBoundary label="calendar-day"><MainLayout><CalendarDay /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="mes" element={<ProtectedRoute><SectionErrorBoundary label="calendar-month"><MainLayout><CalendarMonth /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
          </Route>

          {/* ═══ 6. Equipo ═══ */}
          <Route path="/equipo">
            <Route index element={<ProtectedRoute><RoleGuard minRole="fom"><SectionErrorBoundary label="colaboradores"><Colaboradores /></SectionErrorBoundary></RoleGuard></ProtectedRoute>} />
            <Route path="nuevo" element={<ProtectedRoute><RoleGuard minRole="fom"><AddColaboradorSheetRoute /></RoleGuard></ProtectedRoute>} />
            <Route path="quick-create" element={<ProtectedRoute><RoleGuard minRole="fom"><SectionErrorBoundary label="quick-create"><MainLayout><QuickCreateTeam /></MainLayout></SectionErrorBoundary></RoleGuard></ProtectedRoute>} />
          </Route>

          {/* Equipo detail con tabs */}
          <Route path="/equipo/:id" element={<ProtectedRoute><ColaboradorDetailLayout /></ProtectedRoute>}>
            <Route index element={<LegacyTabRedirect />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="contract" element={<ContractTab />} />
            <Route path="planning" element={<PlanningTab />} />
            <Route path="absences" element={<AbsencesTab />} />
          </Route>

          {/* ═══ 7. Peticiones ═══ */}
          <Route path="/peticiones" element={<ProtectedRoute><SectionErrorBoundary label="peticiones"><MainLayout><EmployeePetitionsPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />

          {/* ═══ 8. Config (criterios SMART + puestos + convenio) ═══ */}
          <Route path="/config" element={<ProtectedRoute><RoleGuard minRole="fom"><SettingsLayout /></RoleGuard></ProtectedRoute>}>
            <Route index element={<Navigate to="/config/jobs" replace />} />
            <Route path="jobs" element={<JobsSettings />} />
            <Route path="convenio" element={<CollectiveAgreementSettings />} />
            <Route path="criterios" element={<CriteriosSmartPage />} />
          </Route>

          {/* ═══ 9. Admin ═══ */}
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/user-management" element={<ProtectedRoute><AdminRoute><AdminUserManagement /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminRoute><AdminStats /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminRoute><AdminSettings /></AdminRoute></ProtectedRoute>} />

          {/* ═══ 10. Perfil ═══ */}
          <Route path="/perfil" element={<ProtectedRoute><MainLayout><UserProfile /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<Navigate to="/perfil" replace />} />

          {/* ═══ Legal + Public ═══ */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/turno/:id" element={<TurnoPublicView />} />

          {/* ═══════════════════════════════════════════════════════════════
              LEGACY REDIRECTS — Rutas antiguas → nuevas V3
              Solo las más usadas. El resto → NotFound.
          ═══════════════════════════════════════════════════════════════ */}

          {/* Turnos legacy */}
          <Route path="/turnosmart" element={<Navigate to="/turnos" replace />} />
          <Route path="/turnosmart/week" element={<Navigate to="/turnos" replace />} />
          <Route path="/turnosmart/day" element={<Navigate to="/turnos/dia" replace />} />
          <Route path="/turnosmart/month" element={<Navigate to="/turnos/mes" replace />} />
          <Route path="/turnosmart/schedule" element={<Navigate to="/turnos" replace />} />
          <Route path="/turnosmart/create-shift" element={<Navigate to="/turnos" replace />} />
          <Route path="/cuadrante" element={<Navigate to="/turnos" replace />} />

          {/* Equipo legacy */}
          <Route path="/turnosmart/collaborators" element={<Navigate to="/equipo" replace />} />
          <Route path="/turnosmart/collaborators/new" element={<Navigate to="/equipo/nuevo" replace />} />
          <Route path="/turnosmart/collaborators/quick-create" element={<Navigate to="/equipo/quick-create" replace />} />
          <Route path="/turnosmart/collaborators/:id/*" element={<ColaboradorRedirect />} />
          <Route path="/turnosmart/colaboradores" element={<Navigate to="/equipo" replace />} />
          <Route path="/colaboradores" element={<Navigate to="/equipo" replace />} />
          <Route path="/colaboradores/:id/*" element={<ColaboradorRedirect />} />

          {/* Peticiones legacy */}
          <Route path="/turnosmart/peticiones" element={<Navigate to="/peticiones" replace />} />

          {/* Settings/Config legacy */}
          <Route path="/turnosmart/settings" element={<Navigate to="/config" replace />} />
          <Route path="/turnosmart/settings/*" element={<Navigate to="/config" replace />} />
          <Route path="/settings" element={<Navigate to="/config" replace />} />
          <Route path="/settings/*" element={<Navigate to="/config" replace />} />

          {/* Dashboard legacy */}
          <Route path="/role-redirect" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-empleado" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-manager" element={<Navigate to="/dashboard" replace />} />

          {/* Eliminated modules → redirect to dashboard */}
          <Route path="/turnosmart/hr" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/hr/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/nominas" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/mensajes" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/wiki" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/productividad" element={<Navigate to="/dashboard" replace />} />
          <Route path="/turnosmart/export" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
