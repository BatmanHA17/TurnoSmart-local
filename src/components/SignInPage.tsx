import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email');
  
  const [email, setEmail] = useState(emailFromParams?.trim().toLowerCase() || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(!!emailFromParams);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign In to TurnoSmart";
  }, []);

  // Redirigir usuarios ya autenticados
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const checkExistingUser = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-user-exists', {
        body: { email }
      });

      if (error) {
        // Fallback: heuristic via auth password sign in
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password: 'dummy-password-check'
        });
        if (authErr?.message?.includes("Invalid login credentials") ||
            authErr?.message?.includes("Email not confirmed") ||
            authErr?.message?.includes("Email link is invalid or has expired")) {
          return true;
        }
        return false;
      }

      return !!data?.exists;
    } catch {
      return false;
    }
  };

  const handleEmailContinue = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    const userExists = await checkExistingUser(normalizedEmail);
    setLoading(false);
    
    if (userExists) {
      // Si el usuario ya existe, redirigir directamente sin toast
      if (window.location.pathname === '/users/sign_in' && !emailFromParams) {
        navigate(`/users/sign_in?email=${encodeURIComponent(normalizedEmail)}`);
      } else {
        // Si ya estamos en la página correcta, solo mostrar el formulario de password
        setEmail(normalizedEmail);
        setShowPasswordForm(true);
      }
    } else {
      toast.error("No account found with this email. Please register first.");
    }
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showPasswordForm && !loading) {
      handleEmailContinue();
    }
  };

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showPasswordForm && !loading) {
      handlePasswordLogin();
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid password. Please try again.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      toast.success("Signed in successfully!");
      navigate("/dashboard");

    } catch (err: any) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Por favor, introduce tu email primero");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) {
        toast.error("Error al enviar el email de recuperación");
        return;
      }

      toast.success("Email de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      toast.error("Error al procesar la solicitud");
    }
  };

  const handleCleanupAllUsers = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar TODOS los usuarios? Esta acción no se puede deshacer.")) {
      try {
        const { data, error } = await supabase.functions.invoke('cleanup-all-users');
        if (error) {
          console.error('Error cleanup users:', error);
          toast.error('Error al limpiar usuarios: ' + error.message);
        } else {
          toast.success('Todos los usuarios han sido eliminados. La aplicación se reiniciará.');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (err) {
        console.error('Cleanup error:', err);
        toast.error('Error inesperado al limpiar usuarios');
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error('Error al conectar con Google: ' + error.message);
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Apple auth error:', error);
      toast.error('Error al conectar con Apple: ' + error.message);
      setLoading(false);
    }
  };

  // Mostrar loading durante la verificación de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Logo en la esquina superior izquierda */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" aria-label="Go to TurnoSmart home" className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors">
          <TurnoSmartLogo size="sm" />
          <span className="font-medium text-sm">TurnoSmart</span>
        </Link>
      </div>
      
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Carousel */}
        <div className="hidden lg:flex items-center justify-center p-12 bg-background">
          <OnboardingCarousel />
        </div>

        {/* Right Panel - Sign In Form */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-sm space-y-8">

            {/* Welcome Text */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-medium text-foreground">
                Sign In to TurnoSmart
              </h1>
              <p className="text-gray-500 text-sm">
                Welcome back! Please sign in to your account
              </p>
            </div>

            {/* Social Auth Buttons */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-11 gap-3 text-sm font-normal border-gray-300 bg-background hover:bg-muted/50"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-11 gap-3 text-sm font-normal border-gray-300 bg-background hover:bg-muted/50"
                onClick={handleAppleAuth}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-xs text-gray-500">Or continue with email</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Email Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleEmailKeyPress}
                  className="h-11 bg-muted border-gray-300"
                  disabled={showPasswordForm}
                />
              </div>

              {/* Password Form - Shows when existing user is detected */}
              {showPasswordForm && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handlePasswordKeyPress}
                    className="h-11 bg-muted border-gray-300"
                    disabled={loading}
                  />
                  <div className="text-left">
                    <button 
                      type="button" 
                      className="text-blue-600 text-sm hover:underline"
                      onClick={handleForgotPassword}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-11 border border-gray-300 bg-black text-white hover:bg-black/90 gap-2"
                onClick={showPasswordForm ? handlePasswordLogin : handleEmailContinue}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : showPasswordForm ? (
                  "Sign In"
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Continuar
                  </>
                )}
              </Button>
            </div>

            {/* Register Link */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  to="/register" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
              
              {/* Botón temporal para limpiar usuarios */}
              <button 
                onClick={handleCleanupAllUsers}
                className="text-xs text-red-600 hover:underline"
                type="button"
              >
                🗑️ Limpiar todos los usuarios (desarrollo)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}