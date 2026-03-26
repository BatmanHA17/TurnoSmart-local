import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProgressBar } from "./ProgressBar";
import { ChevronRight, Mail, Building, User, MapPin } from "lucide-react";

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  position: string;
  phoneNumber: string;
  city: string;
}

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
    position: "",
    phoneNumber: "",
    city: ""
  });
  const navigate = useNavigate();

  const totalSteps = 3;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
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
    try {
      setLoading(true);
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

  const handleEmailSignUp = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Por favor completa email y contraseña");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            position: formData.position,
            phone: formData.phoneNumber,
            city: formData.city
          }
        }
      });

      if (error) throw error;
      
      toast.success("¡Cuenta creada exitosamente! Revisa tu email para confirmar.");
      navigate("/");
    } catch (error: any) {
      toast.error('Error al crear cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.email.length > 0;
      case 2:
        return formData.password.length >= 6 && formData.firstName.length > 0 && formData.lastName.length > 0;
      case 3:
        return formData.companyName.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceedToNext()) {
      if (currentStep < totalSteps) {
        handleNext();
      } else {
        handleEmailSignUp();
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-normal text-foreground leading-snug">
          Welcome to your new workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Get started with your account in seconds
        </p>
      </div>

      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full h-12 gap-3 text-sm font-normal border border-muted-foreground/20 bg-background hover:bg-muted/50"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <Button 
          variant="outline" 
          className="w-full h-12 gap-3 text-sm font-normal border border-muted-foreground/20 bg-background hover:bg-muted/50"
          onClick={handleAppleAuth}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/15" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">Email address</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 pl-10 bg-muted/30 border-0 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-normal text-foreground leading-snug">
          Tell us about yourself
        </h1>
        <p className="text-muted-foreground text-sm">
          We'll use this to personalize your experience
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-normal text-muted-foreground">Full name</Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={`${formData.firstName} ${formData.lastName}`.trim()}
              onChange={(e) => {
                const names = e.target.value.split(' ');
                handleInputChange('firstName', names[0] || '');
                handleInputChange('lastName', names.slice(1).join(' ') || '');
              }}
              className="h-12 pl-10 bg-muted/30 border-0 text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 bg-muted/30 border-0 text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-normal text-muted-foreground">Confirm password</Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="h-12 bg-muted/30 border-0 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Información de tu empresa
        </h1>
        <p className="text-muted-foreground">
          Ayúdanos a personalizar tu experiencia
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName" className="text-sm font-medium">Nombre de la empresa</Label>
          <Input
            id="companyName"
            placeholder="Hotel Las Palmas"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="position" className="text-sm font-medium">Tu posición</Label>
          <Input
            id="position"
            placeholder="Gerente de RRHH, Director, etc."
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-medium">Ciudad</Label>
          <Input
            id="city"
            placeholder="Las Palmas de Gran Canaria"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
      <CardContent className="p-8">
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="mt-8 space-y-4">
          {currentStep < totalSteps ? (
            <Button 
              className="w-full h-12 gap-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleNext}
              disabled={!canProceedToNext()}
            >
              <ChevronRight className="w-4 h-4" />
              Continuar
            </Button>
          ) : (
            <Button 
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
              onClick={handleEmailSignUp}
              disabled={!canProceedToNext() || loading}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          )}

          {currentStep > 1 && (
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Volver
            </Button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button 
              className="text-muted-foreground hover:underline font-normal"
              onClick={() => navigate('/auth')}
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}