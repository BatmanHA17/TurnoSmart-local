import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import { registrationTokens } from '@/design-tokens-registration';
import { registrationStrings } from '@/i18n/es-registration';

interface EmailConfirmationProps {
  email: string;
  onBack: () => void;
  onResendEmail: () => Promise<void>;
}

export const EmailConfirmationStep: React.FC<EmailConfirmationProps> = ({
  email,
  onBack,
  onResendEmail
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendEmail();
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (error) {
      console.error('Error resending email:', error);
    } finally {
      setIsResending(false);
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle 
            style={{
              fontSize: registrationTokens.typography.title.fontSize,
              fontWeight: registrationTokens.typography.title.fontWeight,
              color: registrationTokens.colors.textPrimary
            }}
          >
            Confirma tu correo electrónico
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
              Te hemos enviado un enlace de confirmación a:
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
            <p 
              style={{
                fontSize: registrationTokens.typography.subtitle.fontSize,
                color: registrationTokens.colors.textSecondary,
                lineHeight: '1.6'
              }}
            >
              Haz clic en el enlace del email para activar tu cuenta y acceder a TurnoSmart.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p 
              className="text-sm"
              style={{
                color: registrationTokens.colors.textSecondary,
                lineHeight: '1.5'
              }}
            >
              💡 Revisa tu carpeta de spam si no ves el email en tu bandeja de entrada.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResend}
              disabled={isResending || resent}
              variant="outline"
              className="w-full"
              style={{
                fontSize: registrationTokens.typography.button.fontSize,
                fontWeight: registrationTokens.typography.button.fontWeight,
                borderRadius: registrationTokens.borderRadius.md,
                transition: registrationTokens.transitions.default
              }}
            >
              {isResending ? 'Reenviando...' : resent ? '✓ Email reenviado' : 'Reenviar email'}
            </Button>
            
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full"
              style={{
                fontSize: registrationTokens.typography.button.fontSize,
                fontWeight: registrationTokens.typography.button.fontWeight,
                borderRadius: registrationTokens.borderRadius.md,
                transition: registrationTokens.transitions.default
              }}
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