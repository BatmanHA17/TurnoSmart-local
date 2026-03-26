import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrationTokens } from '@/design-tokens-registration';
import { registrationStrings } from '@/i18n/es-registration';

interface RegisterStepEmailProps {
  email: string;
  onEmailChange: (email: string) => void;
  onNext: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RegisterStepEmail: React.FC<RegisterStepEmailProps> = ({
  email,
  onEmailChange,
  onNext,
  isLoading = false,
  error
}) => {
  const [emailError, setEmailError] = useState<string>('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError(registrationStrings.emailRequired);
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(registrationStrings.emailInvalid);
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    onEmailChange(newEmail);
    
    if (emailError && newEmail) {
      validateEmail(newEmail);
    }
  };

  const handleNext = () => {
    if (validateEmail(email)) {
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Welcome Text */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {registrationStrings.emailTitle}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {registrationStrings.emailSubtitle}
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.emailLabel}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={registrationStrings.emailPlaceholder}
            value={email}
            onChange={handleEmailChange}
            onKeyPress={handleKeyPress}
            className="h-11 bg-muted border-gray-300"
            disabled={isLoading}
            aria-invalid={!!(emailError || error)}
            aria-describedby={emailError || error ? "email-error" : undefined}
          />
          {(emailError || error) && (
            <p 
              id="email-error" 
              className="text-sm text-red-600"
              role="alert"
            >
              {emailError || error}
            </p>
          )}
        </div>

        <Button 
          className="w-full py-2 px-8 rounded-full bg-teal-700 text-white hover:bg-teal-800 font-medium"
          onClick={handleNext}
          disabled={isLoading || !email}
        >
          {isLoading ? registrationStrings.verifyingEmail : registrationStrings.continueButton}
        </Button>
      </div>

    </div>
  );
};