import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { useAuth } from "@/hooks/useAuth";

export default function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const preloadedEmail = searchParams.get('email') || "";
  const [email, setEmail] = useState(preloadedEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Extract tokens from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    document.title = "Restablecer contraseña | TurnoSmart";
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Establish session from URL tokens
  useEffect(() => {
    const establishSession = async () => {
      if (accessToken && refreshToken && type === 'recovery') {
        console.log('🔐 Estableciendo sesión desde tokens de recuperación...');
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Error estableciendo sesión:', error);
            
            // Verificar si el error es por token expirado
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setError('El enlace de restablecimiento ha expirado. Por favor solicita uno nuevo.');
            } else {
              setError('Enlace de restablecimiento inválido. Por favor solicita uno nuevo.');
            }
          } else if (data?.session) {
            console.log('✅ Sesión establecida correctamente:', data.session.user.email);
            setSessionEstablished(true);
            
            // Pre-cargar el email del usuario
            if (data.session.user.email) {
              setEmail(data.session.user.email);
            }
          } else {
            setError('No se pudo establecer la sesión. Por favor solicita un nuevo enlace.');
          }
        } catch (err) {
          console.error('💥 Error al establecer sesión:', err);
          setError('Error procesando el enlace de restablecimiento.');
        }
      } else if (!accessToken || !refreshToken || type !== 'recovery') {
        setError('Enlace de restablecimiento inválido. Por favor solicita uno nuevo desde la página de login.');
      }
    };

    establishSession();
  }, [accessToken, refreshToken, type]);

  // Redirect if user is already authenticated and it's not a password reset
  useEffect(() => {
    if (!authLoading && user && sessionEstablished && type === 'recovery') {
      // Usuario autenticado mediante el link de recuperación - permanecer en esta página
      return;
    } else if (!authLoading && user && type !== 'recovery') {
      // Usuario ya autenticado por otros medios - redirigir
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, sessionEstablished, type]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError("Por favor completa ambos campos de contraseña");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error("Error actualizando contraseña:", updateError);
        setError("Error actualizando la contraseña. Inténtalo de nuevo.");
        return;
      }

      toast.success("¡Contraseña actualizada exitosamente!");
      
      // Refresh the session and redirect to role-based redirect
      await supabase.auth.refreshSession();
      
      // Optional: Sign out from other sessions
      await supabase.auth.signOut({ scope: 'others' });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
      
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Show error if invalid link or no session
  if (error && !sessionEstablished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
            <div className="text-center">
              <TurnoSmartLogo className="mx-auto mb-6" />
              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-foreground">
                  Enlace inválido
                </h1>
                <p className="text-gray-500 text-sm">
                  {error}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <p>El enlace de restablecimiento de contraseña no es válido o ha expirado.</p>
            </div>

            <div className="text-center space-y-3">
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Solicitar nuevo enlace
              </Link>
              <div>
                <Link 
                  to="/home" 
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div className="text-center">
            <TurnoSmartLogo className="mx-auto mb-6" />
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-foreground">
                Restablecer contraseña
              </h1>
              <p className="text-gray-500 text-sm">
                Ingresa tu nueva contraseña
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-4">
            {email && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
                  Email
                </Label>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300"
                  disabled={loading}
                  readOnly
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-normal text-muted-foreground">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-normal text-muted-foreground">
                Confirmar nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-xs">
              <p>La contraseña debe tener al menos 8 caracteres.</p>
            </div>

            <Button 
              type="submit"
              className="w-full h-11 bg-black text-white hover:bg-black/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </form>

          <div className="text-center">
            <Link 
              to="/auth" 
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}