import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // FASE 3: Todos los roles redirigen a /dashboard canónico
  const getDashboardByRole = (role: string | null): string => {
    return '/dashboard';
  };

  useEffect(() => {
    let mounted = true;

    const waitForSession = async () => {
      try {
        // Give Supabase a brief moment to parse the URL hash and store the session
        for (let i = 0; i < 20; i++) { // up to ~2s
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            if (!mounted) return;
            
            // Check if this is a new user by checking if they have a profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('id, display_name, first_name')
              .eq('id', data.session.user.id)
              .single();
            
            if (error && error.code === 'PGRST116') {
              // No profile found - new user, redirect to onboarding
              console.log('New user detected, redirecting to onboarding');
              navigate("/onboarding/wizard", { replace: true });
            } else if (profile) {
              // Check if user has any organizations
              const { data: memberships } = await supabase
                .from('memberships')
                .select('org_id')
                .eq('user_id', data.session.user.id)
                .limit(1);
              
              // If no memberships, redirect to onboarding wizard
              if (!memberships || memberships.length === 0) {
                console.log('User has no organizations, redirecting to onboarding wizard');
                navigate("/onboarding/wizard", { replace: true });
                return;
              }
              
              // Existing user with organizations, get their role and redirect to dashboard
              console.log('Existing user with organizations, getting role for dashboard redirect');
              
              try {
                const { data: roleData, error: roleError } = await supabase.rpc('get_user_role_canonical', { 
                  _user_id: data.session.user.id 
                });
                
                if (!roleError && roleData) {
                  const dashboard = getDashboardByRole(roleData);
                  console.log(`Redirecting user with role ${roleData} to ${dashboard}`);
                  navigate(dashboard, { replace: true });
                } else {
                  console.log('Could not determine role, defaulting to dashboard');
                  navigate("/dashboard", { replace: true });
                }
              } catch (roleErr) {
                console.error('Error getting user role:', roleErr);
                navigate("/dashboard", { replace: true });
              }
            } else {
              // Some other error, go to auth
              console.error('Profile check error:', error);
              navigate("/auth", { replace: true });
            }
            return;
          }
          await new Promise((r) => setTimeout(r, 100));
        }
        // If no session after waiting, go to auth
        if (!mounted) return;
        navigate("/auth", { replace: true });
      } finally {
        if (mounted) setChecking(false);
      }
    };

    waitForSession();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finalizando acceso seguro...</p>
      </div>
    </div>
  );
}
