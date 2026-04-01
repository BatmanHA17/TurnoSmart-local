import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, Mail, User, Building } from "lucide-react";
import { OnboardingCarousel } from "@/components/onboarding/OnboardingCarousel";
import { TurnoSmartLogo } from "@/components/TurnoSmartLogo";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // Flow states
  const [flow, setFlow] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'email' | 'password' | 'profile' | 'company' | 'verification'>('email');
  const [userExists, setUserExists] = useState(false);
  
  // Form data
  const [email, setEmail] = useState(searchParams.get('email')?.trim().toLowerCase() ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Registration data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [country, setCountry] = useState("ES");
  
  // Detect password reset mode and redirect to PasswordReset page
  const mode = searchParams.get('mode');
  const isPasswordReset = searchParams.get('type') === 'recovery' ||
                          searchParams.get('mode') === 'reset-password' ||
                          mode === 'reset' ||
                          (searchParams.get('access_token') && searchParams.get('refresh_token'));

  useEffect(() => {
    if (isPasswordReset) {
      // Redirect to dedicated password reset page
      const urlParams = new URLSearchParams(searchParams);
      navigate(`/password-reset?${urlParams.toString()}`, { replace: true });
    } else if (mode === 'register') {
      // Set up registration flow
      setFlow('register');
      setStep('profile');
      document.title = "Registro | TurnoSmart";
    } else {
      document.title = "Authentication | TurnoSmart";
    }
  }, [isPasswordReset, mode, searchParams, navigate]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user && !isPasswordReset) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, isPasswordReset]);

  const checkIfUserExists = async (email: string) => {
    try {
      const emailLower = email.toLowerCase().trim();

      // Check profiles table for existing user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (profileData) {
        console.log("User found in profiles table");
        return true;
      }

      // Try to check colaboradores table
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (colaboradorData) {
        console.log("User found in colaboradores table");
        return true;
      }

      // If neither found, user doesn't exist
      console.log("User not found in any table");
      return false;
    } catch (error) {
      console.error("Error checking user:", error);
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exists = await checkIfUserExists(email);
      setUserExists(!!exists);
      
      if (exists) {
        // Usuario existente - mostrar campo de contraseña / enviar magic link
        setFlow('login');
        setStep('password');
      } else {
        // Email no encontrado: no crear cuenta desde aquí
        // Los empleados deben usar su enlace de invitación
        // Los nuevos dueños de org deben registrarse en /register
        setError('No encontramos esta cuenta. ¿Eres nuevo? Crea tu organización desde la página de inicio. ¿Eres empleado? Usa el enlace de invitación que recibiste por email.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      
      // Usar signInWithOtp con shouldCreateUser para registro passwordless
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/onboarding/wizard`,
          data: {
            first_name: firstName?.trim() || '',
            last_name: lastName?.trim() || '',
            display_name: `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim(),
            phone: phone?.trim() || '',
            position: position?.trim() || '',
            company_name: companyName?.trim() || '',
            industry: industry || '',
            company_size: companySize || '',
            country: country || 'ES',
            role_hint: 'OWNER'
          }
        }
      });

      if (error) {
        console.error('❌ Error enviando magic link:', error);
        
        if (error.message.includes('email rate limit') || error.message.includes('rate limit')) {
          throw new Error('Se ha excedido el límite de envío de emails. Por favor, inténtalo más tarde.');
        }
        
        throw new Error(error.message || 'Error enviando el enlace de verificación.');
      }

      setStep('verification');
      toast.success('¡Enlace de verificación enviado! Revisa tu email.');
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Error enviando el enlace de verificación.');
      throw error;
    }
  };

  const resendMagicLink = async () => {
    setLoading(true);
    setError('');

    try {
      
      const redirectTo = flow === 'login' 
        ? `${window.location.origin}/auth/callback`
        : `${window.location.origin}/onboarding/wizard`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: flow === 'register',
          emailRedirectTo: redirectTo
        }
      });

      if (error) {
        setError('Error reenviando el enlace. Inténtalo de nuevo.');
        return;
      }

      toast.success('¡Enlace reenviado! Revisa tu email.');
    } catch (error: any) {
      console.error('Resend error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (signInError) {
        console.error('❌ Error en login:', signInError);
        
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Email no confirmado. Revisa tu bandeja de entrada.');
        } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo.');
        }
        return;
      }

      toast.success('¡Bienvenido de nuevo!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLinkForLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (otpError) {
        if (otpError.message.includes('email rate limit') || otpError.status === 429) {
          setError('Has solicitado muchos enlaces. Espera unos minutos.');
        } else {
          setError('Error enviando el enlace. Inténtalo de nuevo.');
        }
        return;
      }

      setStep('verification');
      toast.success('¡Enlace de acceso enviado! Revisa tu email.');
    } catch (error: any) {
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("El correo electrónico es obligatorio");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellidos son obligatorios");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Enviar magic link directamente (sin data extra que causa problemas en local)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/onboarding/wizard`
        }
      });

      if (otpError) {
        console.error('❌ Error enviando magic link:', otpError);
        setError('Error enviando el enlace de verificación. Inténtalo de nuevo.');
        return;
      }

      // Guardar datos del perfil en localStorage para usarlos después de la verificación
      localStorage.setItem('signup_data', JSON.stringify({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim() || '',
        position: position.trim() || '',
        country,
        role_hint: 'OWNER'
      }));

      setStep('verification');
      toast.success('¡Te hemos enviado un enlace de verificación a tu correo!');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim() || !industry || !companySize) {
      setError("Todos los campos de la empresa son obligatorios");
      return;
    }
    
    setLoading(true);
    setError('');

    try {

      // Usar signInWithOtp con shouldCreateUser: true para registro 100% passwordless
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/onboarding/wizard`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim(),
            position: position.trim(),
            company_name: companyName.trim(),
            industry,
            company_size: companySize,
            country,
            role_hint: 'OWNER'
          }
        }
      });

      if (otpError) {
        console.error('❌ Error enviando magic link:', otpError);
        setError('Error enviando el enlace de verificación. Inténtalo de nuevo.');
        return;
      }

      setStep('verification');
      toast.success('¡Te hemos enviado un enlace de verificación a tu correo!');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Render different content based on flow and step
  const renderContent = () => {

    // Verification step (for both login and register)
    if (step === 'verification') {
      return (
        <>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Revisa tu correo electrónico
            </h2>
            <p className="text-gray-600">
              Te hemos enviado un enlace de acceso a: <br />
              <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-gray-500">
              Haz clic en el enlace para {flow === 'login' ? 'iniciar sesión' : 'continuar con el registro'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={resendMagicLink}
              variant="outline"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reenviar enlace"}
            </Button>

            <div className="text-center">
              <button 
                onClick={() => setStep('email')}
                className="text-blue-600 text-sm hover:underline"
              >
                ¿Usar otro email?
              </button>
            </div>
          </div>
        </>
      );
    }

    // Password step for existing users
    if (step === 'password' && flow === 'login') {
      return (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Ingresa tu contraseña
            </h2>
            <p className="text-gray-600">
              Accediendo como <span className="font-semibold">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300 pr-10"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-black text-white hover:bg-black/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar sesión"}
            </Button>
          </form>

          <div className="space-y-3 text-center">
            <button
              type="button"
              onClick={sendMagicLinkForLogin}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              Enviar enlace de acceso al email
            </button>
            
            <div>
              <button 
                onClick={() => {
                  setStep('email');
                  setPassword('');
                  setError('');
                }}
                className="text-gray-500 text-sm hover:underline"
              >
                ← Usar otro email
              </button>
            </div>
          </div>
        </>
      );
    }

    // Registration flow - profile step
    if (flow === 'register') {

      if (step === 'profile') {
        return (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">
                Información personal
              </h2>
              <p className="text-gray-600">
                Cuéntanos sobre ti
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-normal text-muted-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 bg-gray-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-normal text-muted-foreground">
                    Apellidos
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 bg-gray-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-normal text-muted-foreground">
                  Teléfono (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="text-sm font-normal text-muted-foreground">
                  Cargo (opcional)
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="h-11 bg-gray-50"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-black text-white hover:bg-black/90"
              >
                Continuar
              </Button>
            </form>
          </>
        );
      }

    }

    // Default - email step
    return (
      <>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            {flow === 'register' ? 'Crea tu cuenta' : 'Accede a tu cuenta'}
          </h1>
          <p className="text-gray-600">
            {flow === 'register' 
              ? 'Únete a miles de empresas que optimizan su gestión de turnos'
              : 'Ingresa tu email para continuar'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-gray-50 border-gray-300"
              required
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-black text-white hover:bg-black/90"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
          </Button>

          {/* Solo mostrar si el usuario existe, no estamos cargando y hay email */}
          {userExists && !loading && email?.trim() && (
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/auth?mode=reset&email=${encodeURIComponent(email.trim().toLowerCase())}`)
                }
                className="text-sm font-medium text-blue-600 hover:underline focus:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>
            Este formulario es para <strong>nuevas organizaciones</strong>. <br />
            Si ya tienes cuenta o te invitaron, usa{" "}
            <Link 
              to="/auth" 
              className="text-blue-600 hover:underline" 
              data-testid="link-login"
            >
              Iniciar sesión
            </Link>.
          </p>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>
            Al continuar, aceptas nuestros{' '}
            <Link to="/terms" className="text-blue-600 hover:underline">
              Términos y Condiciones
            </Link>{' '}
            y{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors">
          <TurnoSmartLogo size="sm" />
          <span className="font-medium text-sm">TurnoSmart</span>
        </Link>
      </div>
      
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Panel - Carousel */}
        <div className="hidden lg:flex items-center justify-center p-12 bg-background">
          <OnboardingCarousel />
        </div>

        {/* Right Panel - Form */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}