import { useTurnoSmartRole } from "@/hooks/useTurnoSmartRole";
import { DashboardEmpleado } from "@/components/DashboardEmpleado";
import DashboardManager from "@/components/DashboardManager";
import DashboardOwner from "@/components/DashboardOwner";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MainLayout } from "@/components/MainLayout";

/**
 * Dashboard canónico único en /dashboard.
 * Usa useTurnoSmartRole (super_admin / fom / empleado) para decidir qué panel mostrar.
 *
 * Mapeo:
 * - super_admin → DashboardOwner (panel completo con herramientas admin)
 * - fom         → DashboardManager (gestión de equipo, turnos, ausencias)
 * - empleado    → DashboardEmpleado (mi horario, peticiones)
 */
export default function RoleBasedDashboard() {
  const { tsRole, loading } = useTurnoSmartRole();

  if (loading) {
    return <LoadingSpinner text="Cargando panel de control..." />;
  }

  let dashboardContent;

  switch (tsRole) {
    case "super_admin":
      dashboardContent = <DashboardOwner />;
      break;
    case "fom":
      dashboardContent = <DashboardManager />;
      break;
    case "empleado":
    default:
      dashboardContent = <DashboardEmpleado />;
  }

  return <MainLayout>{dashboardContent}</MainLayout>;
}
