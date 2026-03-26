import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    document.title = "Iniciar sesión | TurnoSmart";
  }, []);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          setError('Se ha excedido el límite de envío de emails. Por favor, inténtalo más tarde.');
        } else if (error.message.includes('email') && error.message.includes('not found')) {
          setError('No existe una cuenta con este email. Por favor verifica o crea una nueva cuenta.');
        } else {
          setError(error.message);
        }
        return;
      }

      setEmailSent(true);
      toast.success('¡Link de acceso enviado! Revisa tu email.');
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/password-reset`
      });

      if (error) {
        setError('Error al enviar el email de recuperación. Por favor, inténtalo de nuevo.');
        return;
      }

      setEmailSent(true);
      toast.success('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
            <div className="text-center">
              <TurnoSmartLogo className="mx-auto mb-6" />
              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-foreground">
                  ¡Revisa tu email!
                </h1>
                <p className="text-gray-500 text-sm">
                  Te hemos enviado un {showForgotPassword ? 'link de recuperación' : 'link de acceso'} a <strong>{email}</strong>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
              <p>
                {showForgotPassword 
                  ? 'Haz clic en el enlace del email para restablecer tu contraseña.'
                  : 'Haz clic en el enlace del email para iniciar sesión automáticamente.'
                }
              </p>
              <p className="mt-1 text-xs text-blue-600">Si no ves el email, revisa tu carpeta de spam.</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setShowForgotPassword(false);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Cambiar email
              </button>
              <span>•</span>
              <Link to="/auth" className="text-blue-600 hover:text-blue-800">
                Crear cuenta nueva
              </Link>
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
                {showForgotPassword ? 'Recuperar contraseña' : 'Inicia sesión'}
              </h1>
              <p className="text-gray-500 text-sm">
                {showForgotPassword 
                  ? 'Ingresa tu correo para recibir un link de recuperación'
                  : 'Ingresa tu correo para continuar'
                }
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={showForgotPassword ? handleForgotPassword : handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
                Correo electrónico
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300 pl-10"
                  disabled={loading}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full h-11 bg-black text-white hover:bg-black/90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showForgotPassword ? (
                "Enviar link de recuperación"
              ) : (
                "Enviar link de acceso"
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            {!showForgotPassword && (
              <div className="text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            
            {showForgotPassword && (
              <div className="text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              ¿Aún no tienes cuenta?{" "}
              <Link 
                to="/auth" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Crear cuenta
              </Link>
            </div>
            
            <div className="flex items-center justify-center">
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