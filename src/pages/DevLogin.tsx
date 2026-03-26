import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { useAuth } from "@/hooks/useAuth";

export default function DevLogin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("goturnosmart@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/turnosmart/day', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError("Email y contraseña son obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (signInError) {
        console.error('❌ Error en login:', signInError);
        
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Credenciales inválidas. Verifica tu contraseña.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Email no confirmado. Revisa tu correo.");
        } else {
          setError(signInError.message || "Error al iniciar sesión");
        }
        return;
      }

      toast.success("¡Sesión iniciada!");
      navigate('/turnosmart/day', { replace: true });
      
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <TurnoSmartLogo className="h-10" />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mb-4">
              <Lock className="w-3 h-3" />
              DESARROLLO
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Login de Desarrollo
            </h1>
            <p className="text-gray-600">
              Acceso rápido con contraseña para desarrollo
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-gray-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-gray-50"
                placeholder="Ingresa tu contraseña de desarrollo"
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-black text-white hover:bg-black/90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>
              Para producción usa{" "}
              <button 
                onClick={() => navigate('/auth')}
                className="text-blue-600 hover:underline"
              >
                magic link
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-700 p-12 items-center justify-center">
        <div className="max-w-md text-white space-y-6">
          <h2 className="text-4xl font-bold">
            Desarrollo Rápido
          </h2>
          <p className="text-xl text-white/90">
            Login directo con contraseña para agilizar el desarrollo y testing.
          </p>
          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Sin esperas</h3>
                <p className="text-white/80 text-sm">No necesitas revisar el email cada vez</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Acceso instantáneo</h3>
                <p className="text-white/80 text-sm">Login en segundos para probar cambios rápidamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Solo desarrollo</h3>
                <p className="text-white/80 text-sm">En producción seguirás usando magic link seguro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
