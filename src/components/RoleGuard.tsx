import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTurnoSmartRole, TurnoSmartRole } from "@/hooks/useTurnoSmartRole";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  /** Rol mínimo requerido para acceder */
  minRole: TurnoSmartRole;
  /** Ruta de fallback si no tiene permisos (default: /dashboard) */
  fallback?: string;
}

/**
 * Guard de ruta basado en roles TurnoSmart.
 * Jerarquía: super_admin > fom > empleado
 */

const ROLE_LEVEL: Record<TurnoSmartRole, number> = {
  empleado: 0,
  fom: 1,
  super_admin: 2,
};

export default function RoleGuard({
  children,
  minRole,
  fallback = "/dashboard",
}: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { tsRole, loading: roleLoading } = useTurnoSmartRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (ROLE_LEVEL[tsRole] < ROLE_LEVEL[minRole]) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
