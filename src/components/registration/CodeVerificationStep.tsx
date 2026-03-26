import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { registrationTokens } from '@/design-tokens-registration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CodeVerificationProps {
  email: string;
  onBack: () => void;
  onResendEmail: () => Promise<void>;
  onSuccess: () => void;
}

export const CodeVerificationStep: React.FC<CodeVerificationProps> = ({
  email,
  onBack,
  onResendEmail,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  const handleCodeChange = (value: string) => {
    // Solo permitir números y máximo 6 caracteres
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    setError('');
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      
      const { data: verifyResponse, error: verifyError } = await supabase.functions.invoke(
        'verify-code',
        {
          body: {
            email: email,
            code: code
          }
        }
      );

      if (verifyError) {
        console.error('Verification function error:', verifyError);
        setError('Error al verificar el código. Inténtalo de nuevo.');
        return;
      }

      if (!verifyResponse?.success) {
        console.error('Verification response error:', verifyResponse);
        setError(verifyResponse?.error || 'Código incorrecto o expirado');
        return;
      }

      // Verificación exitosa
      if (verifyResponse.action === 'signin') {
        toast.success('¡Código verificado! Redirigiendo al inicio de sesión...');
        // Redirigir al login ya que el usuario ya existe
        navigate('/auth?tab=signin&email=' + encodeURIComponent(email));
      } else {
        toast.success('¡Código verificado exitosamente!');
        onSuccess();
      }

    } catch (error: any) {
      console.error('Code verification error:', error);
      setError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendEmail();
      toast.success('Nuevo código enviado');
      setCode(''); // Limpiar el código anterior
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('Error al reenviar el código');
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerifyCode();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card 
        className="text-center"
        style={{
          borderRadius: registrationTokens.borderRadius.lg,
          boxShadow: registrationTokens.shadows.card
        }}
      >
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle 
            style={{
              fontSize: registrationTokens.typography.title.fontSize,
              fontWeight: registrationTokens.typography.title.fontWeight,
              color: registrationTokens.colors.textPrimary
            }}
          >
            Verifica tu código
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p 
              style={{
                fontSize: registrationTokens.typography.subtitle.fontSize,
                color: registrationTokens.colors.textSecondary,
                lineHeight: '1.6'
              }}
            >
              Hemos enviado un código de 6 dígitos a:
            </p>
            <p 
              className="font-medium"
              style={{
                fontSize: registrationTokens.typography.subtitle.fontSize,
                color: registrationTokens.colors.textPrimary
              }}
            >
              {email}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="verification-code"
                style={{
                  fontSize: registrationTokens.typography.label.fontSize,
                  fontWeight: registrationTokens.typography.label.fontWeight,
                  color: registrationTokens.colors.textPrimary
                }}
              >
                Código de verificación
              </Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-2xl font-mono tracking-widest"
                style={{
                  borderRadius: registrationTokens.borderRadius.md,
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem'
                }}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {error && (
                <p 
                  className="text-sm"
                  style={{ color: registrationTokens.colors.error }}
                >
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || code.length !== 6}
              className="w-full py-2 px-8 rounded-full bg-teal-700 text-white hover:bg-teal-800 font-medium"
            >
              {isVerifying ? 'Verificando...' : 'Verificar código'}
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p 
              className="text-sm"
              style={{
                color: registrationTokens.colors.textSecondary,
                lineHeight: '1.5'
              }}
            >
              💡 El código expira en 10 minutos. Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full py-2 px-8 rounded-full"
            >
              {isResending ? 'Reenviando...' : 'Reenviar código'}
            </Button>
            
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full py-2 px-8 rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};