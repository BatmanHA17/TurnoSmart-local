import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Building2, UserCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteData {
  orgName: string;
  role: string;
  email: string;
  requiresPassword: boolean;
}

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [password, setPassword] = useState('');

  // Verificar token al cargar
  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    try {
      
      const { data, error: invokeError } = await supabase.functions.invoke(
        'accept-invite',
        {
          body: { token }
        }
      );

      if (invokeError) {
        console.error('Invoke error:', invokeError);
        setError('Error validando invitación. Por favor contacta al administrador.');
        setLoading(false);
        return;
      }

      // Caso 1: Colaborador existente - requiere vinculación de cuenta
      if (data.requiresAccountLinking) {
        
        // Guardar datos de invitación en sessionStorage para vinculación
        sessionStorage.setItem('invite_data', JSON.stringify(data.inviteData));
        
        // Redirigir a página de vinculación
        toast.info('Vincula tu cuenta para acceder con tu nuevo email');
        navigate('/link-account');
        return;
      }

      // Caso 2: Usuario nuevo - requiere registro completo
      if (data.requiresRegistration) {
        
        // Guardar datos de invitación en sessionStorage para el registro
        sessionStorage.setItem('invite_data', JSON.stringify(data.inviteData));
        
        // Redirigir a página de registro
        toast.info('Por favor completa tu registro para aceptar la invitación');
        navigate('/register-invite');
        return;
      }

      // Caso 3: Error en la invitación
      if (!data.success) {
        setError(data.error || 'Invitación inválida o expirada');
        setLoading(false);
        return;
      }

      // Caso 4: Usuario existente - invitación aceptada exitosamente

      // SIEMPRE usar magic link para usuarios existentes
      if (data.success && data.magicLink) {
        toast.success('¡Invitación aceptada! Redirigiendo...');
        
        // Pequeño delay para que el usuario vea el mensaje
        setTimeout(() => {
          window.location.href = data.magicLink;
        }, 1000);
        
        return;
      }

      // Si NO hay magic link, mostrar error
      if (data.success && !data.magicLink) {
        setError('Error al generar el enlace de acceso. Por favor contacta al administrador.');
        setLoading(false);
        return;
      }
      
      // Fallback (no debería llegar aquí)
      navigate(data.redirectTo || '/dashboard');

    } catch (error) {
      console.error('Error validating token:', error);
      setError('Error validando invitación');
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inviteData?.requiresPassword && !password) {
      toast.error('La contraseña es obligatoria');
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('accept-invite', {
        body: { 
          token,
          password: inviteData?.requiresPassword ? password : undefined
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.error) {
        setError(data.error);
        return;
      }

      // Éxito
      toast.success(`¡Bienvenido a ${data.organization.name}!`);
      
      // Si hay magic link, redirigir a él directamente (incluye autenticación automática)
      if (data.magicLink) {
        window.location.href = data.magicLink;
        return;
      }

      // Fallback: redirigir al dashboard apropiado
      navigate(data.redirectTo || '/dashboard');

    } catch (err: any) {
      console.error('Error accepting invite:', err);
      setError(err.message || 'Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Validando invitación...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invitación no válida</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Las invitaciones expiran después de 7 días. Si necesitas una nueva invitación, 
                  contacta con el administrador de tu organización.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
                variant="outline"
              >
                Ir al inicio de sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay inviteData pero NO requiere password, mostrar loading mientras se procesa
  if (inviteData && !inviteData.requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Procesando invitación...</h3>
                <p className="text-sm text-muted-foreground">
                  Te estamos redirigiendo a tu dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si requiere password, mostrar formulario (solo para colaboradores que necesitan crear cuenta)
  if (inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>¡Te están esperando!</CardTitle>
            <CardDescription>
              Únete a <strong>{inviteData.orgName}</strong> como <strong>{inviteData.role}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{inviteData.orgName}</p>
                  <p className="text-sm text-muted-foreground">Organización</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{inviteData.role}</p>
                  <p className="text-sm text-muted-foreground">Tu rol</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAcceptInvite} className="space-y-4">
              {inviteData.requiresPassword && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Crea tu contraseña
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa una contraseña segura"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uniéndome...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Unirme a {inviteData.orgName}
                  </>
                )}
              </Button>

              <Button 
                type="button"
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Al unirte, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}