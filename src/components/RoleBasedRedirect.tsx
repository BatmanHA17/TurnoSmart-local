import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function RoleBasedRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, getDefaultDashboard } = useUserRoleCanonical();
  const { organizations, loading: orgLoading } = useCurrentOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (authLoading || roleLoading || orgLoading) return;

      if (!user) {
        // No hay sesión - no forzar navegación, dejar en /login o /password-reset
        return;
      }

      try {
        // Adjuntar memberships pendientes de invitaciones por email
        const { data: attachedMemberships } = await supabase.rpc('attach_memberships_for_current_user');
        
        if (attachedMemberships && attachedMemberships.length > 0) {
          // Refrescar datos después de adjuntar memberships
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error('Error al adjuntar memberships:', error);
        // Continuar con el flujo normal aunque falle
      }

      // Check if user needs onboarding (has no organizations)
      if (organizations && organizations.length === 0) {
        navigate('/onboarding/wizard', { replace: true });
        return;
      }

      // User has organizations, redirect based on role
      if (role) {
        const dashboard = getDefaultDashboard();
        navigate(dashboard, { replace: true });
      }
    };

    handleRedirect();
  }, [authLoading, roleLoading, orgLoading, user, role, organizations, navigate, getDefaultDashboard]);

  if (authLoading || roleLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirigiendo a tu panel de control...</p>
        </div>
      </div>
    );
  }

  return null;
}