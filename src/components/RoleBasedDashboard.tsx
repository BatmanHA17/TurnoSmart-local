import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { DashboardEmpleado } from "@/components/DashboardEmpleado";
import DashboardManager from "@/components/DashboardManager";
import DashboardDirector from "@/components/DashboardDirector";
import DashboardAdministrator from "@/components/DashboardAdministrator";
import DashboardOwner from "@/components/DashboardOwner";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MainLayout } from "@/components/MainLayout";

/**
 * Dashboard canónico único en /dashboard.
 * Renderiza el contenido apropiado según el rol del usuario.
 * FASE 3: Consolidación de dashboards.
 */
export default function RoleBasedDashboard() {
  const { role, loading } = useUserRoleCanonical();

  if (loading) {
    return <LoadingSpinner text="Cargando panel de control..." />;
  }

  let dashboardContent;
  
  switch (role) {
    case "EMPLOYEE":
      dashboardContent = <DashboardEmpleado />;
      break;
    case "MANAGER":
      dashboardContent = <DashboardManager />;
      break;
    case "DIRECTOR":
      dashboardContent = <DashboardDirector />;
      break;
    case "ADMIN":
      dashboardContent = <DashboardAdministrator />;
      break;
    case "OWNER":
      dashboardContent = <DashboardOwner />;
      break;
    default:
      // Fallback seguro
      dashboardContent = <DashboardEmpleado />;
  }

  return <MainLayout>{dashboardContent}</MainLayout>;
}
