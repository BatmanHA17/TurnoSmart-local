import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { registrationTokens } from '@/design-tokens-registration';
import { registrationStrings } from '@/i18n/es-registration';

interface RegisterStepPasswordProps {
  email: string;
  password: string;
  onPasswordChange: (password: string) => void;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RegisterStepPassword: React.FC<RegisterStepPasswordProps> = ({
  email,
  password,
  onPasswordChange,
  termsAccepted,
  onTermsChange,
  onNext,
  onBack,
  isLoading = false,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [termsError, setTermsError] = useState<string>('');

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError(registrationStrings.passwordRequired);
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError(registrationStrings.passwordTooShort);
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    onPasswordChange(newPassword);
    
    if (passwordError && newPassword) {
      validatePassword(newPassword);
    }
  };

  const handleNext = () => {
    const isPasswordValid = validatePassword(password);
    
    if (!termsAccepted) {
      setTermsError(registrationStrings.termsRequired);
      return;
    } else {
      setTermsError('');
    }
    
    if (isPasswordValid && termsAccepted) {
      onNext();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Welcome Text */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {registrationStrings.passwordTitle}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {registrationStrings.passwordSubtitle}
        </p>
      </div>

      {/* Email Display */}
      <div className="space-y-2">
        <Label className="text-sm font-normal text-muted-foreground">
          {registrationStrings.emailLabel}
        </Label>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md border border-gray-300">
          <span className="text-sm text-muted-foreground flex-1">{email}</span>
          <button 
            onClick={onBack}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            {registrationStrings.modifyButton}
          </button>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.passwordLabel}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={registrationStrings.passwordPlaceholder}
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              className="h-11 bg-muted border-gray-300 pr-10"
              disabled={isLoading}
              aria-invalid={!!(passwordError || error)}
              aria-describedby={passwordError || error ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? registrationStrings.hidePassword : registrationStrings.showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {(passwordError || error) && (
            <p 
              id="password-error" 
              className="text-sm text-red-600"
              role="alert"
            >
              {passwordError || error}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {registrationStrings.passwordMinText}
          </p>
        </div>

        {/* Términos y condiciones */}
        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => {
                onTermsChange(checked as boolean);
                if (checked) setTermsError('');
              }}
              className="mt-1"
              aria-invalid={!!termsError}
              aria-describedby={termsError ? "terms-error" : undefined}
            />
            <Label 
              htmlFor="terms" 
              className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
            >
              {registrationStrings.termsText}
              <a 
                href="/terms" 
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {registrationStrings.termsLink}
              </a>
              {registrationStrings.andText}
              <a 
                href="/privacy" 
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {registrationStrings.privacyLink}
              </a>
              {registrationStrings.turnosmartBrand}
            </Label>
          </div>
          {termsError && (
            <p 
              id="terms-error" 
              className="text-sm text-red-600"
              role="alert"
            >
              {termsError}
            </p>
          )}
        </div>

        {/* Botón */}
        <Button
          onClick={handleNext}
          disabled={isLoading || !password || !termsAccepted}
          className="w-full py-2 px-8 rounded-full bg-teal-700 text-white hover:bg-teal-800 font-medium"
        >
          {isLoading ? registrationStrings.creatingAccount : registrationStrings.createAccountButton}
        </Button>
      </div>
    </div>
  );
};