import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurnoSmartRole } from "@/hooks/useTurnoSmartRole";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { DashboardEmpleado } from "@/components/DashboardEmpleado";
import DashboardManager from "@/components/DashboardManager";
import DashboardOwner from "@/components/DashboardOwner";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dashboard canónico único en /dashboard.
 * Usa useTurnoSmartRole (super_admin / fom / empleado) para decidir qué panel mostrar.
 *
 * Si el usuario autenticado no tiene profile o memberships, redirige al onboarding wizard.
 *
 * Mapeo:
 * - super_admin → DashboardOwner (panel completo con herramientas admin)
 * - fom         → DashboardManager (gestión de equipo, turnos, ausencias)
 * - empleado    → DashboardEmpleado (mi horario, peticiones)
 */
export default function RoleBasedDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { org, loading: orgLoading } = useCurrentOrganization();
  const { tsRole, loading } = useTurnoSmartRole();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (authLoading || orgLoading) return;

    // If user is authenticated but has no org, check if they need onboarding
    if (user && !org?.id) {
      const checkMemberships = async () => {
        const { data: memberships } = await supabase
          .from("memberships")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1);

        if (!memberships || memberships.length === 0) {
          // No memberships — new user, redirect to onboarding
          navigate("/onboarding/wizard", { replace: true });
          return;
        }
        setCheckingOnboarding(false);
      };
      checkMemberships();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user, org?.id, authLoading, orgLoading, navigate]);

  if (authLoading || loading || checkingOnboarding) {
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
