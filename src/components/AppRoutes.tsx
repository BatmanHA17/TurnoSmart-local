import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Imports críticos (carga inmediata)
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { TurnoSmartLanding } from "@/components/turnosmart/TurnoSmartLanding";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

// Lazy imports — se cargan solo cuando el usuario navega a esa ruta
const Index = React.lazy(() => import("@/pages/Index"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Login = React.lazy(() => import("@/pages/Login"));
const PasswordReset = React.lazy(() => import("@/pages/PasswordReset"));
const TestPasswordFlow = React.lazy(() => import("@/pages/TestPasswordFlow"));
const DatabaseCleanup = React.lazy(() => import("@/pages/DatabaseCleanup"));
const TurnoPublicView = React.lazy(() => import("@/pages/TurnoPublicView"));
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const AdminUserManagement = React.lazy(() => import("@/pages/AdminUserManagement"));
const AdminStats = React.lazy(() => import("@/pages/AdminStats"));
const AdminSettings = React.lazy(() => import("@/pages/AdminSettings"));
const Onboarding = React.lazy(() => import("@/pages/Onboarding"));
const OnboardingCreateOrganization = React.lazy(() => import("@/pages/OnboardingCreateOrganization"));
const OnboardingWizard = React.lazy(() => import("@/pages/OnboardingWizard"));
const Terms = React.lazy(() => import("@/pages/Terms"));
const Privacy = React.lazy(() => import("@/pages/Privacy"));
const AuthCallback = React.lazy(() => import("@/pages/AuthCallback"));
const InviteAccept = React.lazy(() => import("@/pages/InviteAccept"));
const RegisterInvite = React.lazy(() => import("@/pages/RegisterInvite"));
const LinkAccount = React.lazy(() => import("@/pages/LinkAccount"));
const EstablishmentDetail = React.lazy(() => import("@/pages/EstablishmentDetail"));
const DashboardEmpleado = React.lazy(() => import("@/pages/DashboardEmpleado"));
const DashboardManager = React.lazy(() => import("@/pages/DashboardManager"));
const DashboardDirector = React.lazy(() => import("@/pages/DashboardDirector"));
const DashboardAdministrator = React.lazy(() => import("@/pages/DashboardAdministrator"));
const DashboardOwner = React.lazy(() => import("@/pages/DashboardOwner"));
const RoleBasedRedirect = React.lazy(() => import("@/components/RoleBasedRedirect"));
const RoleBasedDashboard = React.lazy(() => import("@/components/RoleBasedDashboard"));
const DebugEmails = React.lazy(() => import("@/pages/DebugEmails"));
const MiActividad = React.lazy(() => import("@/pages/MiActividad"));

// Colaboradores
const Colaboradores = React.lazy(() => import("@/pages/Colaboradores"));
const ColaboradorDetailLayout = React.lazy(() => import("@/components/colaboradores/ColaboradorDetailLayout"));
const LegacyTabRedirect = React.lazy(() => import("@/components/colaboradores/LegacyTabRedirect"));
const ProfileTab = React.lazy(() => import("@/components/colaboradores/tabs/ProfileTab"));
const ContractTab = React.lazy(() => import("@/components/colaboradores/tabs/ContractTab"));
const PlanningTab = React.lazy(() => import("@/components/colaboradores/tabs/PlanningTab"));
const AbsencesTab = React.lazy(() => import("@/components/colaboradores/tabs/AbsencesTab"));
const PermissionsTab = React.lazy(() => import("@/components/colaboradores/tabs/PermissionsTab"));
const SystemTab = React.lazy(() => import("@/components/colaboradores/tabs/SystemTab"));
const AddColaboradorSheetRoute = React.lazy(() =>
  import("@/components/colaboradores/AddColaboradorSheetRoute").then(m => ({ default: m.AddColaboradorSheetRoute }))
);
const AddAbsenceRequestRoute = React.lazy(() =>
  import("@/components/routing/AddAbsenceRequestRoute").then(m => ({ default: m.AddAbsenceRequestRoute }))
);
const AbsenceDetailRoute = React.lazy(() =>
  import("@/components/routing/AbsenceDetailRoute").then(m => ({ default: m.AbsenceDetailRoute }))
);
const TiempoTrabajo = React.lazy(() => import("@/pages/TiempoTrabajo"));

// HR
const HR = React.lazy(() => import("@/pages/HR"));
const HRResumen = React.lazy(() => import("@/pages/hr/HRResumen"));
const HROnboarding = React.lazy(() => import("@/pages/hr/HROnboarding"));
const HRExits = React.lazy(() => import("@/pages/hr/HRExits"));
const HRFinPeriodoPrueba = React.lazy(() => import("@/pages/hr/HRFinPeriodoPrueba"));
const HRIncompleteProfiles = React.lazy(() => import("@/pages/hr/HRIncompleteProfiles"));
const HRVacationCounter = React.lazy(() => import("@/pages/hr/HRVacationCounter"));
const HRAbsenceLog = React.lazy(() => import("@/pages/hr/HRAbsenceLog"));
const HRWorkPermits = React.lazy(() => import("@/pages/hr/HRWorkPermits"));
const HRContractModifications = React.lazy(() => import("@/pages/hr/HRContractModifications"));
const HRClockInTracking = React.lazy(() => import("@/pages/hr/HRClockInTracking"));
const HRDocumentSigning = React.lazy(() => import("@/pages/hr/HRDocumentSigning"));
const HRPayrollDistribution = React.lazy(() => import("@/pages/hr/HRPayrollDistribution"));
const HROverview = React.lazy(() => import("@/pages/hr/HROverview"));
const HRTeam = React.lazy(() => import("@/pages/hr/HRTeam"));
const HRHoursWorked = React.lazy(() => import("@/pages/hr/HRHoursWorked"));
const HRAbsences = React.lazy(() => import("@/pages/hr/HRAbsences"));
const HRAuditPolicies = React.lazy(() => import("@/pages/hr/HRAuditPolicies"));

// Turnos y calendario
const Turnos = React.lazy(() => import("@/pages/Turnos"));
const TurnosCrear = React.lazy(() => import("@/pages/TurnosCrear"));
const TurnosGuardados = React.lazy(() => import("@/pages/TurnosGuardados"));
const PlanificacionAutomatica = React.lazy(() => import("@/pages/PlanificacionAutomatica"));
const TurnosRotativos = React.lazy(() => import("@/pages/TurnosRotativos"));
const TurnosNocturnos = React.lazy(() => import("@/pages/TurnosNocturnos"));
const CalendarDay = React.lazy(() => import("@/pages/CalendarDay"));
const CalendarMonth = React.lazy(() => import("@/pages/CalendarMonth"));
const BiWeeklyCalendarPage = React.lazy(() =>
  import("@/components/BiWeeklyCalendarView").then(m => ({ default: m.BiWeeklyCalendarView }))
);
const DevLogin = React.lazy(() => import("@/pages/DevLogin"));
const BancoHoras = React.lazy(() => import("@/pages/BancoHoras"));
const GestionJornadaLaboralCrear = React.lazy(() => import("@/pages/GestionJornadaLaboralCrear"));
const SolicitudesCambio = React.lazy(() => import("@/pages/SolicitudesCambio"));
const SolicitudesAusencia = React.lazy(() => import("@/pages/SolicitudesAusencia"));
const BalanceAnual = React.lazy(() => import("@/pages/BalanceAnual"));
const PoliticasLaborales = React.lazy(() => import("@/pages/PoliticasLaborales"));
const Ausencias = React.lazy(() => import("@/pages/Ausencias"));
const GestionJornadaLaboral = React.lazy(() =>
  import("@/components/GestionJornadaLaboral").then(m => ({ default: m.GestionJornadaLaboral }))
);

// Settings
const SettingsLayout = React.lazy(() =>
  import("@/components/SettingsLayout").then(m => ({ default: m.SettingsLayout }))
);
const SettingsSchedulesLayout = React.lazy(() =>
  import("@/components/SettingsSchedulesLayout").then(m => ({ default: m.SettingsSchedulesLayout }))
);
const ContactSettings = React.lazy(() => import("@/pages/ContactSettings"));
const CollectiveAgreementSettings = React.lazy(() => import("@/pages/CollectiveAgreementSettings"));
const ProductivitySettings = React.lazy(() => import("@/pages/ProductivitySettings"));
const EstablishmentsSettings = React.lazy(() => import("@/pages/EstablishmentsSettings"));
const PrintSettings = React.lazy(() => import("@/pages/PrintSettings"));
const PreferencesSettings = React.lazy(() => import("@/pages/PreferencesSettings"));
const NotificationsSettings = React.lazy(() => import("@/pages/NotificationsSettings"));
const WageAnalysisSettings = React.lazy(() => import("@/pages/WageAnalysisSettings"));
const PaymentPreferencesSettings = React.lazy(() => import("@/pages/PaymentPreferencesSettings"));
const TimeoffRulesSettings = React.lazy(() => import("@/pages/TimeoffRulesSettings"));
const TemplatesDocusSettings = React.lazy(() => import("@/pages/TemplatesDocusSettings"));
const JobsSettings = React.lazy(() => import("@/pages/JobsSettings"));
const ClockinClockoutSettings = React.lazy(() => import("@/pages/ClockinClockoutSettings"));
const MarketplaceSettings = React.lazy(() => import("@/pages/MarketplaceSettings"));
const RGPDSettings = React.lazy(() => import("@/pages/RGPDSettings"));
const AddEstablishment = React.lazy(() => import("@/pages/AddEstablishment"));
const ConfigurationLegacy = React.lazy(() => import("@/pages/ConfigurationLegacy"));

// Misc
const Exportar = React.lazy(() => import("@/pages/Exportar"));
const Ayuda = React.lazy(() => import("@/pages/Ayuda"));
const FAQ = React.lazy(() => import("@/pages/FAQ"));
const PerfilAdmin = React.lazy(() => import("@/pages/PerfilAdmin"));
const OldTurnosmart = React.lazy(() => import("@/pages/OldTurnosmart"));
const Activity = React.lazy(() => import("@/pages/Activity"));
const MisPreferencias = React.lazy(() => import("@/pages/MisPreferencias"));
const UserProfile = React.lazy(() =>
  import("@/components/UserProfile").then(m => ({ default: m.UserProfile }))
);
const MainLayout = React.lazy(() =>
  import("@/components/MainLayout").then(m => ({ default: m.MainLayout }))
);

// Fallback de carga
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

// Component for handling landing vs dashboard routing
const LandingOrDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/turnosmart/day" replace />;
  return <TurnoSmartLanding />;
};

// Protected Dashboard wrapper with role-based routing
const DashboardWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Index />;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page - Pública */}
          <Route path="/home" element={<TurnoSmartLanding />} />

          {/* Ruta raíz - Decide entre landing o dashboard */}
          <Route path="/" element={<LandingOrDashboard />} />

          {/* Authentication */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/dev-login" element={<DevLogin />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Invitation acceptance */}
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route path="/register-invite" element={<RegisterInvite />} />
          <Route path="/link-account" element={<LinkAccount />} />

          {/* Onboarding routes */}
          <Route path="/onboarding/wizard" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          <Route path="/onboarding/create-organization" element={<ProtectedRoute><OnboardingCreateOrganization /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

          {/* Legacy redirects */}
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route path="/users/sign_in" element={<Navigate to="/auth" replace />} />

          {/* Legal pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Dev/debug pages */}
          <Route path="/test-password-flow" element={<TestPasswordFlow />} />
          <Route path="/database-cleanup" element={<DatabaseCleanup />} />
          <Route path="/debug-emails" element={<DebugEmails />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><SectionErrorBoundary label="dashboard"><RoleBasedDashboard /></SectionErrorBoundary></ProtectedRoute>} />
          <Route path="/role-redirect" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-empleado" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-manager" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-director" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-administrator" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard-owner" element={<Navigate to="/dashboard" replace />} />

          {/* Preview routes */}
          <Route path="/dashboard-empleado-preview" element={<DashboardEmpleado />} />
          <Route path="/dashboard-manager-preview" element={<DashboardManager />} />
          <Route path="/dashboard-director-preview" element={<DashboardDirector />} />
          <Route path="/dashboard-administrator-preview" element={<DashboardAdministrator />} />
          <Route path="/dashboard-owner-preview" element={<DashboardOwner />} />
          <Route path="/mi-actividad" element={<ProtectedRoute><MiActividad /></ProtectedRoute>} />

          {/* Colaboradores */}
          <Route path="/colaboradores">
            <Route index element={<ProtectedRoute><SectionErrorBoundary label="colaboradores"><Colaboradores /></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="new" element={<ProtectedRoute><AddColaboradorSheetRoute /></ProtectedRoute>} />
          </Route>

          {/* Ausencias routes */}
          <Route path="/ausencias">
            <Route path="request/new" element={<ProtectedRoute><AddAbsenceRequestRoute /></ProtectedRoute>} />
            <Route path=":requestId" element={<ProtectedRoute><AbsenceDetailRoute /></ProtectedRoute>} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/equipo" element={<Navigate to="/colaboradores" replace />} />
          <Route path="/equipo/new" element={<Navigate to="/colaboradores/new" replace />} />
          <Route path="/equipo/:id/*" element={<Navigate to="/colaboradores/:id" replace />} />

          {/* Colaborador detail con tabs */}
          <Route path="/colaboradores/:id" element={<ProtectedRoute><ColaboradorDetailLayout /></ProtectedRoute>}>
            <Route index element={<LegacyTabRedirect />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="contract" element={<ContractTab />} />
            <Route path="planning" element={<PlanningTab />} />
            <Route path="absences" element={<AbsencesTab />} />
            <Route path="permissions" element={<PermissionsTab />} />
            <Route path="system" element={<SystemTab />} />
          </Route>

          <Route path="/colaboradores/:empleadoId/tiempo-trabajo" element={<ProtectedRoute><TiempoTrabajo /></ProtectedRoute>} />

          {/* HR */}
          <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
          <Route path="/hr/home" element={<ProtectedRoute><HRResumen /></ProtectedRoute>} />
          <Route path="/hr/onboarding" element={<ProtectedRoute><HROnboarding /></ProtectedRoute>} />
          <Route path="/hr/exits" element={<ProtectedRoute><HRExits /></ProtectedRoute>} />
          <Route path="/hr/fin-periodo-prueba" element={<ProtectedRoute><HRFinPeriodoPrueba /></ProtectedRoute>} />
          <Route path="/hr/incomplete-profiles" element={<ProtectedRoute><HRIncompleteProfiles /></ProtectedRoute>} />
          <Route path="/hr/vacation-counter" element={<ProtectedRoute><HRVacationCounter /></ProtectedRoute>} />
          <Route path="/hr/absence-log" element={<ProtectedRoute><HRAbsenceLog /></ProtectedRoute>} />
          <Route path="/hr/work-permits" element={<ProtectedRoute><HRWorkPermits /></ProtectedRoute>} />
          <Route path="/hr/contract-modifications" element={<ProtectedRoute><HRContractModifications /></ProtectedRoute>} />
          <Route path="/hr/clock-in-tracking" element={<ProtectedRoute><HRClockInTracking /></ProtectedRoute>} />
          <Route path="/hr/document-signing" element={<ProtectedRoute><HRDocumentSigning /></ProtectedRoute>} />
          <Route path="/hr/payroll-distribution" element={<ProtectedRoute><HRPayrollDistribution /></ProtectedRoute>} />
          <Route path="/hr/overview" element={<ProtectedRoute><HROverview /></ProtectedRoute>} />
          <Route path="/hr/team" element={<ProtectedRoute><HRTeam /></ProtectedRoute>} />
          <Route path="/hr/hours-worked" element={<ProtectedRoute><HRHoursWorked /></ProtectedRoute>} />
          <Route path="/hr/absences" element={<ProtectedRoute><HRAbsences /></ProtectedRoute>} />
          <Route path="/hr/audit-policies" element={<ProtectedRoute><HRAuditPolicies /></ProtectedRoute>} />

          {/* Turnos y calendario */}
          <Route path="/cuadrante" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
          <Route path="/turnosmart">
            <Route index element={<Navigate to="/turnosmart/week" replace />} />
            <Route path="week" element={<ProtectedRoute><SectionErrorBoundary label="calendar-week"><MainLayout><TurnosCrear /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="day" element={<ProtectedRoute><SectionErrorBoundary label="calendar-day"><MainLayout><CalendarDay /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="month" element={<ProtectedRoute><SectionErrorBoundary label="calendar-month"><MainLayout><CalendarMonth /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="biweek" element={<ProtectedRoute><SectionErrorBoundary label="calendar-biweek"><MainLayout><BiWeeklyCalendarPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="tags" element={<Navigate to="/turnosmart/week" replace />} />
            <Route path="attendance" element={<Navigate to="/turnosmart/week" replace />} />
          </Route>

          <Route path="/turnos">
            <Route index element={<Navigate to="/turnosmart/day" replace />} />
            <Route path="day" element={<Navigate to="/turnosmart/day" replace />} />
            <Route path="week" element={<Navigate to="/turnosmart/week" replace />} />
          </Route>

          <Route path="/turnos/guardados" element={<ProtectedRoute><TurnosGuardados /></ProtectedRoute>} />
          <Route path="/turnos/crear" element={<ProtectedRoute><TurnosCrear /></ProtectedRoute>} />
          <Route path="/planificacion-automatica" element={<ProtectedRoute><PlanificacionAutomatica /></ProtectedRoute>} />
          <Route path="/banco-horas" element={<ProtectedRoute><BancoHoras /></ProtectedRoute>} />
          <Route path="/solicitudes-cambio" element={<ProtectedRoute><SolicitudesCambio /></ProtectedRoute>} />
          <Route path="/solicitudes-ausencia" element={<ProtectedRoute><SolicitudesAusencia /></ProtectedRoute>} />
          <Route path="/balance-anual" element={<ProtectedRoute><BalanceAnual /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
            <Route index element={null} />
            <Route path="contact" element={<ContactSettings />} />
            <Route path="collective-agreement" element={<CollectiveAgreementSettings />} />
            <Route path="productivity" element={<ProductivitySettings />} />
            <Route path="locations" element={<EstablishmentsSettings />} />
            <Route path="locations/new" element={<AddEstablishment />} />
            <Route path="locations/:establishmentName" element={<EstablishmentDetail />} />
            <Route path="print" element={<PrintSettings />} />
            <Route path="preferences" element={<PreferencesSettings />} />
            <Route path="notifications" element={<NotificationsSettings />} />
            <Route path="wage-analysis" element={<WageAnalysisSettings />} />
            <Route path="payment-preferences" element={<PaymentPreferencesSettings />} />
            <Route path="timeoff-rules" element={<TimeoffRulesSettings />} />
            <Route path="templates-docus" element={<TemplatesDocusSettings />} />
            <Route path="jobs" element={<JobsSettings />} />
            <Route path="clockin-clockout" element={<ClockinClockoutSettings />} />
            <Route path="marketplace" element={<MarketplaceSettings />} />
            <Route path="RGPD" element={<RGPDSettings />} />
          </Route>

          <Route path="/settings/schedules" element={<ProtectedRoute><SettingsSchedulesLayout /></ProtectedRoute>}>
            <Route path="shifts" element={<Turnos />} />
            <Route path="saved" element={<TurnosGuardados />} />
            <Route path="night" element={<TurnosNocturnos />} />
            <Route path="rotating" element={<TurnosRotativos />} />
            <Route path="policies" element={<PoliticasLaborales />} />
            <Route path="workday" element={<GestionJornadaLaboral />} />
          </Route>

          {/* Legacy schedule redirects */}
          <Route path="/turnos" element={<Navigate to="/settings/schedules/shifts" replace />} />
          <Route path="/turnos-guardados" element={<Navigate to="/settings/schedules/saved" replace />} />
          <Route path="/turnos-nocturnos" element={<Navigate to="/settings/schedules/night" replace />} />
          <Route path="/turnos-rotativos" element={<Navigate to="/settings/schedules/rotating" replace />} />
          <Route path="/politicas-laborales" element={<Navigate to="/settings/schedules/policies" replace />} />
          <Route path="/gestion-jornada-laboral/crear" element={<Navigate to="/settings/schedules/workday" replace />} />

          <Route path="/configuracion-legacy" element={<ProtectedRoute><ConfigurationLegacy /></ProtectedRoute>} />
          <Route path="/ausencias" element={<ProtectedRoute><Ausencias /></ProtectedRoute>} />
          <Route path="/exportar" element={<ProtectedRoute><Exportar /></ProtectedRoute>} />

          {/* Help */}
          <Route path="/ayuda" element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />

          {/* Misc protected */}
          <Route path="/perfil-admin" element={<ProtectedRoute><PerfilAdmin /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/mis-preferencias" element={<ProtectedRoute><MisPreferencias /></ProtectedRoute>} />
          <Route path="/old-turnosmart" element={<ProtectedRoute><MainLayout><OldTurnosmart /></MainLayout></ProtectedRoute>} />

          {/* Public views */}
          <Route path="/turno/:id" element={<TurnoPublicView />} />

          {/* User profile */}
          <Route path="/perfil" element={<ProtectedRoute><MainLayout><UserProfile /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<Navigate to="/perfil" replace />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/user-management" element={<ProtectedRoute><AdminRoute><AdminUserManagement /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminRoute><AdminStats /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminRoute><AdminSettings /></AdminRoute></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
