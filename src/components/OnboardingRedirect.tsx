import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Loader2 } from "lucide-react";

export function OnboardingRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading } = useCurrentOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || orgLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // FASE 3: If user has organizations, redirect to dashboard canónico
    if (organizations && organizations.length > 0) {
      console.log('Usuario ya tiene organizaciones, redirigiendo a dashboard');
      navigate('/dashboard', { replace: true });
    } else {
      // User has no organizations, redirect to create one
      console.log('Usuario sin organizaciones, redirigiendo a crear organización');
      navigate('/onboarding/wizard', { replace: true });
    }
  }, [user, organizations, authLoading, orgLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Configurando tu experiencia...</p>
      </div>
    </div>
  );
}