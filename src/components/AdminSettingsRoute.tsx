import { ReactNode } from "react";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminSettingsRouteProps {
  children: ReactNode;
  allowView?: boolean; // Si true, permite ver pero no editar
}

export default function AdminSettingsRoute({ children, allowView = false }: AdminSettingsRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, loading } = useUserRoleCanonical();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && !allowView)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Acceso Restringido</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Solo los administradores pueden acceder a esta sección de configuración.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no es admin pero allowView está habilitado, mostrar en modo solo lectura
  if (!isAdmin && allowView) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Estás viendo esta configuración en modo solo lectura. Solo los administradores pueden realizar cambios.
            </p>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}