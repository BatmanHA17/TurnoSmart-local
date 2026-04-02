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
import { ReceptionEmployeeManager } from "@/components/ReceptionEmployeeManager";
import { TestReceptionEmployeeManager } from "@/pages/TestReceptionEmployeeManager";

// Lazy imports — se cargan solo cuando el usuario navega a esa ruta
const Index = React.lazy(() => import("@/pages/Index"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Login = React.lazy(() => import("@/pages/Login"));
const PasswordReset = React.lazy(() => import("@/pages/PasswordReset"));
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
const EmployeePetitionsPage = React.lazy(() => import("@/pages/EmployeePetitions"));
const QuickCreateTeamPage = React.lazy(() => import("@/pages/QuickCreateTeam"));
const Welcome = React.lazy(() => import("@/pages/Welcome"));
const DashboardManager = React.lazy(() => import("@/pages/DashboardManager"));
const DashboardDirector = React.lazy(() => import("@/pages/DashboardDirector"));
const DashboardAdministrator = React.lazy(() => import("@/pages/DashboardAdministrator"));
const DashboardOwner = React.lazy(() => import("@/pages/DashboardOwner"));
const RoleBasedRedirect = React.lazy(() => import("@/components/RoleBasedRedirect"));
const RoleBasedDashboard = React.lazy(() => import("@/components/RoleBasedDashboard"));
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
const NominasTab = React.lazy(() => import("@/components/colaboradores/tabs/NominasTab"));
const Nominas = React.lazy(() => import("@/pages/Nominas"));
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
const TagsCalendarPage = React.lazy(() =>
  import("@/components/calendar/TagsCalendarView").then(m => ({ default: m.TagsCalendarView }))
);
const AttendanceCalendarPage = React.lazy(() =>
  import("@/components/calendar/AttendanceCalendarView").then(m => ({ default: m.AttendanceCalendarView }))
);
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

// Mensajería interna
const Mensajes = React.lazy(() => import("@/pages/Mensajes"));

// Productividad
const Productividad = React.lazy(() => import("@/pages/Productividad"));

// Wiki
const Wiki = React.lazy(() => import("@/pages/Wiki"));

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

// Legacy redirect helper: reads :id param and redirects to the correct /turnosmart/collaborators/:id path
const ColaboradorRedirect = () => {
  const { id } = useParams();
  const rest = window.location.pathname.split(`/${id}/`)[1] || '';
  return <Navigate to={`/turnosmart/collaborators/${id}${rest ? '/' + rest : ''}`} replace />;
};

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

          {/* Test Pages - Pública para testing sin auth */}
          <Route path="/test/reception-employees" element={<TestReceptionEmployeeManager />} />

          {/* Ruta raíz - Decide entre landing o dashboard */}
          <Route path="/" element={<LandingOrDashboard />} />

          {/* Authentication */}
          <Route path="/auth" element={<Auth />} />
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
          <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
          <Route path="/users/sign_in" element={<Navigate to="/auth" replace />} />

          {/* Legal pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

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

          {/* Colaboradores — solo FOM+ */}
          <Route path="/turnosmart/collaborators">
            <Route index element={<ProtectedRoute><RoleGuard minRole="fom"><SectionErrorBoundary label="colaboradores"><Colaboradores /></SectionErrorBoundary></RoleGuard></ProtectedRoute>} />
            <Route path="new" element={<ProtectedRoute><RoleGuard minRole="fom"><AddColaboradorSheetRoute /></RoleGuard></ProtectedRoute>} />
            <Route path="quick-create" element={<ProtectedRoute><RoleGuard minRole="fom"><QuickCreateTeamPage /></RoleGuard></ProtectedRoute>} />
          </Route>

          {/* Reception Employee Manager - Phase 3 Testing */}
          <Route path="/turnosmart/reception-employees" element={<ProtectedRoute><ReceptionEmployeeManager /></ProtectedRoute>} />

          {/* Ausencias routes */}
          <Route path="/turnosmart/absences">
            <Route path="request/new" element={<ProtectedRoute><AddAbsenceRequestRoute /></ProtectedRoute>} />
            <Route path=":requestId" element={<ProtectedRoute><AbsenceDetailRoute /></ProtectedRoute>} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/turnosmart/colaboradores" element={<Navigate to="/turnosmart/collaborators" replace />} />
          <Route path="/colaboradores" element={<Navigate to="/turnosmart/collaborators" replace />} />
          <Route path="/colaboradores/new" element={<Navigate to="/turnosmart/collaborators/new" replace />} />
          <Route path="/colaboradores/:id/*" element={<ColaboradorRedirect />} />
          <Route path="/equipo" element={<Navigate to="/turnosmart/collaborators" replace />} />
          <Route path="/equipo/new" element={<Navigate to="/turnosmart/collaborators/new" replace />} />
          <Route path="/equipo/:id/*" element={<ColaboradorRedirect />} />
          <Route path="/ausencias" element={<Navigate to="/turnosmart/absences" replace />} />

          {/* Colaborador detail con tabs */}
          <Route path="/turnosmart/collaborators/:id" element={<ProtectedRoute><ColaboradorDetailLayout /></ProtectedRoute>}>
            <Route index element={<LegacyTabRedirect />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="contract" element={<ContractTab />} />
            <Route path="planning" element={<PlanningTab />} />
            <Route path="absences" element={<AbsencesTab />} />
            <Route path="permissions" element={<PermissionsTab />} />
            <Route path="system" element={<SystemTab />} />
            <Route path="nominas" element={<NominasTab />} />
          </Route>

          <Route path="/turnosmart/collaborators/:empleadoId/work-time" element={<ProtectedRoute><TiempoTrabajo /></ProtectedRoute>} />

          {/* HR — solo FOM+ */}
          <Route path="/turnosmart/hr" element={<ProtectedRoute><RoleGuard minRole="fom"><HR /></RoleGuard></ProtectedRoute>} />
          <Route path="/turnosmart/hr/home" element={<ProtectedRoute><HRResumen /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/onboarding" element={<ProtectedRoute><HROnboarding /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/exits" element={<ProtectedRoute><HRExits /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/fin-periodo-prueba" element={<ProtectedRoute><HRFinPeriodoPrueba /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/incomplete-profiles" element={<ProtectedRoute><HRIncompleteProfiles /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/vacation-counter" element={<ProtectedRoute><HRVacationCounter /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/absence-log" element={<ProtectedRoute><HRAbsenceLog /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/work-permits" element={<ProtectedRoute><HRWorkPermits /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/contract-modifications" element={<ProtectedRoute><HRContractModifications /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/clock-in-tracking" element={<ProtectedRoute><HRClockInTracking /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/document-signing" element={<ProtectedRoute><HRDocumentSigning /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/payroll-distribution" element={<ProtectedRoute><HRPayrollDistribution /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/overview" element={<ProtectedRoute><HROverview /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/team" element={<ProtectedRoute><HRTeam /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/hours-worked" element={<ProtectedRoute><HRHoursWorked /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/absences" element={<ProtectedRoute><HRAbsences /></ProtectedRoute>} />
          <Route path="/turnosmart/hr/audit-policies" element={<ProtectedRoute><HRAuditPolicies /></ProtectedRoute>} />

          {/* Legacy HR redirects */}
          <Route path="/hr" element={<Navigate to="/turnosmart/hr" replace />} />
          <Route path="/hr/home" element={<Navigate to="/turnosmart/hr/home" replace />} />
          <Route path="/hr/onboarding" element={<Navigate to="/turnosmart/hr/onboarding" replace />} />
          <Route path="/hr/exits" element={<Navigate to="/turnosmart/hr/exits" replace />} />
          <Route path="/hr/fin-periodo-prueba" element={<Navigate to="/turnosmart/hr/fin-periodo-prueba" replace />} />
          <Route path="/hr/incomplete-profiles" element={<Navigate to="/turnosmart/hr/incomplete-profiles" replace />} />
          <Route path="/hr/vacation-counter" element={<Navigate to="/turnosmart/hr/vacation-counter" replace />} />
          <Route path="/hr/absence-log" element={<Navigate to="/turnosmart/hr/absence-log" replace />} />
          <Route path="/hr/work-permits" element={<Navigate to="/turnosmart/hr/work-permits" replace />} />
          <Route path="/hr/contract-modifications" element={<Navigate to="/turnosmart/hr/contract-modifications" replace />} />
          <Route path="/hr/clock-in-tracking" element={<Navigate to="/turnosmart/hr/clock-in-tracking" replace />} />
          <Route path="/hr/document-signing" element={<Navigate to="/turnosmart/hr/document-signing" replace />} />
          <Route path="/hr/payroll-distribution" element={<Navigate to="/turnosmart/hr/payroll-distribution" replace />} />
          <Route path="/hr/overview" element={<Navigate to="/turnosmart/hr/overview" replace />} />
          <Route path="/hr/team" element={<Navigate to="/turnosmart/hr/team" replace />} />
          <Route path="/hr/hours-worked" element={<Navigate to="/turnosmart/hr/hours-worked" replace />} />
          <Route path="/hr/absences" element={<Navigate to="/turnosmart/hr/absences" replace />} />
          <Route path="/hr/audit-policies" element={<Navigate to="/turnosmart/hr/audit-policies" replace />} />

          {/* Turnos y calendario */}
          <Route path="/turnosmart/schedule" element={<ProtectedRoute><Turnos /></ProtectedRoute>} />
          <Route path="/turnosmart">
            <Route index element={<Navigate to="/turnosmart/week" replace />} />
            <Route path="week" element={<ProtectedRoute><SectionErrorBoundary label="calendar-week"><MainLayout><TurnosCrear /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="day" element={<ProtectedRoute><SectionErrorBoundary label="calendar-day"><MainLayout><CalendarDay /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="month" element={<ProtectedRoute><SectionErrorBoundary label="calendar-month"><MainLayout><CalendarMonth /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="biweekly" element={<ProtectedRoute><SectionErrorBoundary label="calendar-biweek"><MainLayout><BiWeeklyCalendarPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="biweek" element={<Navigate to="/turnosmart/biweekly" replace />} />
            <Route path="tags" element={<ProtectedRoute><SectionErrorBoundary label="calendar-tags"><MainLayout><TagsCalendarPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
            <Route path="attendance" element={<ProtectedRoute><SectionErrorBoundary label="calendar-attendance"><MainLayout><AttendanceCalendarPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />
          </Route>

          {/* Legacy schedule redirects */}
          <Route path="/cuadrante" element={<Navigate to="/turnosmart/schedule" replace />} />

          <Route path="/turnosmart/saved-shifts" element={<ProtectedRoute><TurnosGuardados /></ProtectedRoute>} />
          <Route path="/turnosmart/create-shift" element={<ProtectedRoute><TurnosCrear /></ProtectedRoute>} />
          <Route path="/turnosmart/auto-planning" element={<ProtectedRoute><PlanificacionAutomatica /></ProtectedRoute>} />
          <Route path="/turnosmart/hours-bank" element={<ProtectedRoute><BancoHoras /></ProtectedRoute>} />
          <Route path="/turnosmart/change-requests" element={<ProtectedRoute><SolicitudesCambio /></ProtectedRoute>} />
          <Route path="/turnosmart/absence-requests" element={<ProtectedRoute><SolicitudesAusencia /></ProtectedRoute>} />
          <Route path="/turnosmart/annual-balance" element={<ProtectedRoute><BalanceAnual /></ProtectedRoute>} />

          {/* Legacy shifts redirects */}
          <Route path="/turnos" element={<Navigate to="/turnosmart/schedule" replace />} />
          <Route path="/turnos/guardados" element={<Navigate to="/turnosmart/saved-shifts" replace />} />
          <Route path="/turnos/crear" element={<Navigate to="/turnosmart/create-shift" replace />} />
          <Route path="/planificacion-automatica" element={<Navigate to="/turnosmart/auto-planning" replace />} />
          <Route path="/banco-horas" element={<Navigate to="/turnosmart/hours-bank" replace />} />
          <Route path="/solicitudes-cambio" element={<Navigate to="/turnosmart/change-requests" replace />} />
          <Route path="/solicitudes-ausencia" element={<Navigate to="/turnosmart/absence-requests" replace />} />
          <Route path="/balance-anual" element={<Navigate to="/turnosmart/annual-balance" replace />} />

          {/* Settings — solo FOM+ */}
          <Route path="/turnosmart/settings" element={<ProtectedRoute><RoleGuard minRole="fom"><SettingsLayout /></RoleGuard></ProtectedRoute>}>
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

          <Route path="/turnosmart/settings/schedules" element={<ProtectedRoute><SettingsSchedulesLayout /></ProtectedRoute>}>
            <Route path="shifts" element={<Turnos />} />
            <Route path="saved" element={<TurnosGuardados />} />
            <Route path="night" element={<TurnosNocturnos />} />
            <Route path="rotating" element={<TurnosRotativos />} />
            <Route path="policies" element={<PoliticasLaborales />} />
            <Route path="workday" element={<GestionJornadaLaboral />} />
          </Route>

          {/* Legacy settings redirects */}
          <Route path="/settings" element={<Navigate to="/turnosmart/settings" replace />} />
          <Route path="/settings/contact" element={<Navigate to="/turnosmart/settings/contact" replace />} />
          <Route path="/settings/collective-agreement" element={<Navigate to="/turnosmart/settings/collective-agreement" replace />} />
          <Route path="/settings/productivity" element={<Navigate to="/turnosmart/settings/productivity" replace />} />
          <Route path="/settings/locations" element={<Navigate to="/turnosmart/settings/locations" replace />} />
          <Route path="/settings/locations/new" element={<Navigate to="/turnosmart/settings/locations/new" replace />} />
          <Route path="/settings/print" element={<Navigate to="/turnosmart/settings/print" replace />} />
          <Route path="/settings/preferences" element={<Navigate to="/turnosmart/settings/preferences" replace />} />
          <Route path="/settings/notifications" element={<Navigate to="/turnosmart/settings/notifications" replace />} />
          <Route path="/settings/wage-analysis" element={<Navigate to="/turnosmart/settings/wage-analysis" replace />} />
          <Route path="/settings/payment-preferences" element={<Navigate to="/turnosmart/settings/payment-preferences" replace />} />
          <Route path="/settings/timeoff-rules" element={<Navigate to="/turnosmart/settings/timeoff-rules" replace />} />
          <Route path="/settings/templates-docus" element={<Navigate to="/turnosmart/settings/templates-docus" replace />} />
          <Route path="/settings/jobs" element={<Navigate to="/turnosmart/settings/jobs" replace />} />
          <Route path="/settings/clockin-clockout" element={<Navigate to="/turnosmart/settings/clockin-clockout" replace />} />
          <Route path="/settings/marketplace" element={<Navigate to="/turnosmart/settings/marketplace" replace />} />
          <Route path="/settings/RGPD" element={<Navigate to="/turnosmart/settings/RGPD" replace />} />
          <Route path="/settings/schedules" element={<Navigate to="/turnosmart/settings/schedules" replace />} />
          <Route path="/settings/schedules/shifts" element={<Navigate to="/turnosmart/settings/schedules/shifts" replace />} />
          <Route path="/settings/schedules/saved" element={<Navigate to="/turnosmart/settings/schedules/saved" replace />} />
          <Route path="/settings/schedules/night" element={<Navigate to="/turnosmart/settings/schedules/night" replace />} />
          <Route path="/settings/schedules/rotating" element={<Navigate to="/turnosmart/settings/schedules/rotating" replace />} />
          <Route path="/settings/schedules/policies" element={<Navigate to="/turnosmart/settings/schedules/policies" replace />} />
          <Route path="/settings/schedules/workday" element={<Navigate to="/turnosmart/settings/schedules/workday" replace />} />
          <Route path="/turnos" element={<Navigate to="/turnosmart/settings/schedules/shifts" replace />} />
          <Route path="/turnos-guardados" element={<Navigate to="/turnosmart/settings/schedules/saved" replace />} />
          <Route path="/turnos-nocturnos" element={<Navigate to="/turnosmart/settings/schedules/night" replace />} />
          <Route path="/turnos-rotativos" element={<Navigate to="/turnosmart/settings/schedules/rotating" replace />} />
          <Route path="/politicas-laborales" element={<Navigate to="/turnosmart/settings/schedules/policies" replace />} />
          <Route path="/gestion-jornada-laboral/crear" element={<Navigate to="/turnosmart/settings/schedules/workday" replace />} />

          <Route path="/turnosmart/export" element={<ProtectedRoute><Exportar /></ProtectedRoute>} />
          <Route path="/turnosmart/help" element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />
          <Route path="/turnosmart/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
          <Route path="/turnosmart/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/turnosmart/preferences" element={<ProtectedRoute><MisPreferencias /></ProtectedRoute>} />

          {/* Legacy misc redirects */}
          <Route path="/configuracion-legacy" element={<Navigate to="/turnosmart/settings" replace />} />
          <Route path="/configuracion" element={<Navigate to="/turnosmart/settings" replace />} />
          <Route path="/turnosmart/configuracion" element={<Navigate to="/turnosmart/settings" replace />} />
          <Route path="/exportar" element={<Navigate to="/turnosmart/export" replace />} />
          <Route path="/ayuda" element={<Navigate to="/turnosmart/help" replace />} />
          <Route path="/faq" element={<Navigate to="/turnosmart/faq" replace />} />
          <Route path="/perfil-admin" element={<Navigate to="/turnosmart/settings" replace />} />
          <Route path="/activity" element={<Navigate to="/turnosmart/activity" replace />} />
          <Route path="/mis-preferencias" element={<Navigate to="/turnosmart/preferences" replace />} />
          <Route path="/old-turnosmart" element={<Navigate to="/turnosmart/week" replace />} />

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

          {/* Peticiones del empleado (todos los roles) */}
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="/turnosmart/peticiones" element={<ProtectedRoute><SectionErrorBoundary label="peticiones"><MainLayout><EmployeePetitionsPage /></MainLayout></SectionErrorBoundary></ProtectedRoute>} />

          {/* Nóminas — solo FOM+ */}
          <Route path="/turnosmart/nominas" element={<ProtectedRoute><RoleGuard minRole="fom"><Nominas /></RoleGuard></ProtectedRoute>} />

          {/* Mensajería interna */}
          <Route path="/turnosmart/mensajes" element={<ProtectedRoute><Mensajes /></ProtectedRoute>} />

          {/* Wiki / Knowledge Base */}
          <Route path="/turnosmart/wiki" element={<ProtectedRoute><Wiki /></ProtectedRoute>} />

          {/* Productividad — solo FOM+ */}
          <Route path="/turnosmart/productividad" element={<ProtectedRoute><RoleGuard minRole="fom"><Productividad /></RoleGuard></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
