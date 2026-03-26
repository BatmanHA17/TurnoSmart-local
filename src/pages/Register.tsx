import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TurnoSmartLogo } from '@/components/TurnoSmartLogo';
import { Mail, Loader2, CheckCircle, ArrowLeft, User, Building } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'email' | 'verification' | 'profile' | 'company' | 'complete'>('email');
  const [email, setEmail] = useState(searchParams.get('email')?.trim().toLowerCase() ?? '');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Profile information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  
  // Company information
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [country, setCountry] = useState('ES');

  const checkIfUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-user-exists', {
        body: { email: email.toLowerCase().trim() }
      });
      
      if (error) {
        console.error("Error checking user:", error);
        return false;
      }
      
      return data?.exists || false;
    } catch (error) {
      console.error("Error checking user:", error);
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Primero verificar si el usuario ya existe
      const userExists = await checkIfUserExists(email);
      
      if (userExists) {
        // Redirigir directamente sin toast
        navigate(`/auth?email=${encodeURIComponent(email)}`);
        setLoading(false);
        return;
      }

      // New org owners register via OTP (magic link) — no password needed, no colaborador check
      // Employees use invite links instead
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/onboarding/wizard`,
        }
      });

      if (otpError) {
        console.error('OTP error:', otpError);
        if (otpError.message.includes('rate limit') || otpError.message.includes('email rate')) {
          setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
        } else {
          setError('Error enviando el email. Inténtalo de nuevo.');
        }
        return;
      }

      setStep('verification');
      toast.success('¡Enlace de acceso enviado! Revisa tu bandeja de entrada.');

    } catch (error: any) {
      console.error('Registration error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const { data, error: verifyError } = await supabase.functions.invoke('verify-code', {
        body: {
          email: email.toLowerCase().trim(),
          code: verificationCode
        }
      });

      if (verifyError) {
        console.error('Verification error:', verifyError);
        setError('Error verificando código. Inténtalo de nuevo.');
        return;
      }

      if (!data?.success) {
        setError(data?.error || 'Código incorrecto o expirado');
        return;
      }

      // Verificación exitosa
      if (data.action === 'signin') {
        toast.success("¡Email verificado! Ya tienes una cuenta, ve al inicio de sesión.");
        navigate('/auth');
      } else {
        // Después de verificar el email, ir al paso de información de perfil
        setStep('profile');
        toast.success("¡Email verificado! Ahora completa tu perfil.");
      }

    } catch (error: any) {
      console.error('Verification error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: functionError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/onboarding/wizard`,
        }
      });
      const data = functionError ? null : { success: true };

      if (functionError || !data?.success) {
        setError("Error reenviando código");
        return;
      }

      toast.success("¡Código reenviado!");
      setVerificationCode('');

    } catch (error) {
      setError("Error reenviando código");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellidos son obligatorios");
      return;
    }
    
    setError('');
    setStep('company');
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
      // Crear usuario final con información completa
      // Se genera un password aleatorio — el usuario autentica vía magic link, nunca lo ve
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: crypto.randomUUID() + crypto.randomUUID(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard-owner`,
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
            invitation_type: 'signup'
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError('Error creando la cuenta. Inténtalo de nuevo.');
        return;
      }

      // La organización se crea automáticamente con el hook de onboarding
      if (authData.user) {
        // Crear colaborador (usando org_id de la organización creada)
        const { error: colaboradorError } = await supabase.from('colaboradores').insert({
          nombre: firstName.trim(),
          apellidos: lastName.trim(),
          email: email.toLowerCase().trim(),
          telefono_movil: phone.trim(),
          status: 'activo',
          org_id: authData.user.user_metadata?.org_id
        } as any);

        if (colaboradorError) {
          console.warn('Error creando colaborador:', colaboradorError);
        }
        // El trigger handle_new_user automáticamente asignará el rol correcto
        // No necesitamos insertar manualmente el rol aquí

        // Log activity
        await supabase.rpc('log_activity', {
          _user_name: `${firstName.trim()} ${lastName.trim()}`,
          _action: 'Usuario registrado',
          _entity_type: 'user',
          _entity_id: authData.user.id,
          _entity_name: email.toLowerCase().trim(),
          _establishment: companyName.trim(),
          _details: {
            registration_type: 'new_company_owner',
            company: companyName.trim(),
            industry,
            company_size: companySize,
            country
          }
        });

        // Esperar un momento para que el trigger procese el usuario
        setTimeout(async () => {
          try {
            // Intentar hacer login automáticamente
            // Auto-login con password no es posible (password aleatorio) — redirigir a magic link
            const signInData = null;
            const signInError = new Error('passwordless-only');
            
            if (signInError) {
              console.warn('Auto-login failed:', signInError);
              toast.success("¡Cuenta creada! Por favor inicia sesión.");
              navigate('/auth?email=' + encodeURIComponent(email));
            } else {
              toast.success("¡Cuenta creada exitosamente!");
              navigate('/dashboard-owner');
            }
          } catch (error) {
            console.error('Error in auto-login:', error);
            toast.success("¡Cuenta creada! Por favor inicia sesión.");
            navigate('/auth?email=' + encodeURIComponent(email));
          }
        }, 2000);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header con logo */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors">
          <TurnoSmartLogo size="sm" />
          <span className="font-medium text-lg">TurnoSmart</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Panel izquierdo - Bienvenida */}
        <div className="hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-800 leading-tight">
                Welcome to TurnoSmart
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join thousands of businesses optimizing their workforce management
              </p>
            </div>
            
            {/* Feature highlights */}
            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                <span className="text-gray-600">Smart scheduling automation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                <span className="text-gray-600">Real-time attendance tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                <span className="text-gray-600">Comprehensive reporting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - Formulario de registro */}
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            
            {step === 'email' && (
              <>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Empieza tu prueba de 7 días gratis
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Crea tu cuenta en un par de minutos. No necesitas agregar tu información bancaria.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 text-lg border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg rounded-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Seguir"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-gray-500">
                  <span>¿Ya tienes cuenta? </span>
                  <Link to="/auth" className="text-gray-800 hover:underline font-medium">
                    Inicia sesión
                  </Link>
                </div>
              </>
            )}

            {step === 'verification' && (
              <>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Confirma tu correo electrónico
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Te hemos enviado un enlace de confirmación a:
                  </p>
                  <p className="font-semibold text-gray-800 text-lg">
                    {email}
                  </p>
                  <p className="text-gray-600">
                    Haz clic en el enlace del email para activar tu cuenta y acceder a TurnoSmart.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center space-y-2">
                  <p className="text-green-800 font-medium">Enlace enviado a tu bandeja de entrada</p>
                  <p className="text-green-700 text-sm">
                    Haz clic en el botón del email para activar tu cuenta. El enlace expira en 1 hora.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm flex items-start gap-2">
                    <span>💡</span>
                    <span>
                      Si no lo ves en bandeja de entrada, revisa la carpeta de <strong>spam</strong> o <strong>promociones</strong>.
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleResendCode}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Reenviar email
                  </Button>
                  
                  <Button 
                    onClick={() => setStep('email')}
                    variant="ghost"
                    className="w-full h-12 text-gray-600 hover:text-gray-800 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                </div>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-500">Paso 1 de 2</div>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
                  <div className="bg-blue-600 h-1 rounded-full" style={{ width: '50%' }}></div>
                </div>

                <div className="text-center space-y-3 mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Cuéntanos sobre ti
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Información básica para configurar tu perfil
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 font-medium">
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700 font-medium">
                        Apellidos <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-gray-700 font-medium">
                      Cargo/Posición
                    </Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white">
                        <SelectValue placeholder="Selecciona tu cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Propietario</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="hr">Recursos Humanos</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400"
                      placeholder="+34 600 000 000"
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg rounded-lg mt-6"
                    disabled={loading}
                  >
                    Continuar
                  </Button>
                </form>

                <Button 
                  onClick={() => setStep('verification')}
                  variant="ghost"
                  className="w-full h-12 text-gray-600 hover:text-gray-800 rounded-lg mt-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </>
            )}

            {step === 'company' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-500">Paso 2 de 2</div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Building className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
                  <div className="bg-green-600 h-1 rounded-full" style={{ width: '100%' }}></div>
                </div>

                <div className="text-center space-y-3 mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Información de tu empresa
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Configuremos tu establecimiento en TurnoSmart
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-gray-700 font-medium">
                      Nombre de la empresa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-gray-700 font-medium">
                      Sector <span className="text-red-500">*</span>
                    </Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white">
                        <SelectValue placeholder="Selecciona el sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospitality">Hostelería</SelectItem>
                        <SelectItem value="retail">Comercio</SelectItem>
                        <SelectItem value="healthcare">Sanidad</SelectItem>
                        <SelectItem value="manufacturing">Manufactura</SelectItem>
                        <SelectItem value="services">Servicios</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize" className="text-gray-700 font-medium">
                      Tamaño de la empresa <span className="text-red-500">*</span>
                    </Label>
                    <Select value={companySize} onValueChange={setCompanySize}>
                      <SelectTrigger className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white">
                        <SelectValue placeholder="Número de empleados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 empleados</SelectItem>
                        <SelectItem value="11-50">11-50 empleados</SelectItem>
                        <SelectItem value="51-200">51-200 empleados</SelectItem>
                        <SelectItem value="201-500">201-500 empleados</SelectItem>
                        <SelectItem value="500+">Más de 500 empleados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-700 font-medium">
                      País
                    </Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="h-12 border-gray-300 rounded-lg bg-gray-50 focus:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">España</SelectItem>
                        <SelectItem value="PT">Portugal</SelectItem>
                        <SelectItem value="FR">Francia</SelectItem>
                        <SelectItem value="IT">Italia</SelectItem>
                        <SelectItem value="DE">Alemania</SelectItem>
                        <SelectItem value="UK">Reino Unido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg rounded-lg mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear mi cuenta"
                    )}
                  </Button>
                </form>

                <Button 
                  onClick={() => setStep('profile')}
                  variant="ghost"
                  className="w-full h-12 text-gray-600 hover:text-gray-800 rounded-lg mt-4"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </>
            )}

            {step === 'complete' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-green-800">
                  ¡Bienvenido a TurnoSmart!
                </h2>
                <p className="text-gray-600 text-lg">
                  Tu cuenta de propietario ha sido creada exitosamente. Tu empresa está lista para usar TurnoSmart.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    🎉 Como primer usuario, tienes permisos de <strong>super-admin</strong> y rol de <strong>propietario</strong>.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg rounded-lg"
                >
                  Acceder a mi panel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;