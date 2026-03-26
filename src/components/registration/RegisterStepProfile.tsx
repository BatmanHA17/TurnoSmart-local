import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registrationTokens } from '@/design-tokens-registration';
import { registrationStrings } from '@/i18n/es-registration';

interface RegisterStepProfileProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RegisterStepProfile: React.FC<RegisterStepProfileProps> = ({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onNext,
  onBack,
  isLoading = false,
  error
}) => {
  const [firstNameError, setFirstNameError] = useState<string>('');
  const [lastNameError, setLastNameError] = useState<string>('');

  const validateFields = (): boolean => {
    let isValid = true;

    if (!firstName.trim()) {
      setFirstNameError(registrationStrings.nameRequired);
      isValid = false;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError(registrationStrings.lastNameRequired);
      isValid = false;
    } else {
      setLastNameError('');
    }

    return isValid;
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFirstNameChange(value);
    
    if (firstNameError && value.trim()) {
      setFirstNameError('');
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onLastNameChange(value);
    
    if (lastNameError && value.trim()) {
      setLastNameError('');
    }
  };

  const handleNext = () => {
    if (validateFields()) {
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
      {/* Progress */}
      <div className="space-y-3">
        <div className="text-sm text-gray-500">
          {registrationStrings.step1of2}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-teal-700 h-1 rounded-full" style={{ width: '50%' }}></div>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="text-left space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {registrationStrings.personalInfoTitle}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {registrationStrings.personalInfoSubtitle}
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        {/* Campo Nombre */}
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.firstNameLabel}
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder={registrationStrings.firstNamePlaceholder}
            value={firstName}
            onChange={handleFirstNameChange}
            onKeyPress={handleKeyPress}
            className="h-11 bg-muted border-gray-300"
            disabled={isLoading}
            aria-invalid={!!firstNameError}
            aria-describedby={firstNameError ? "firstName-error" : undefined}
          />
          {firstNameError && (
            <p 
              id="firstName-error" 
              className="text-sm text-red-600"
              role="alert"
            >
              {firstNameError}
            </p>
          )}
        </div>

        {/* Campo Apellidos */}
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.lastNameLabel}
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder={registrationStrings.lastNamePlaceholder}
            value={lastName}
            onChange={handleLastNameChange}
            onKeyPress={handleKeyPress}
            className="h-11 bg-muted border-gray-300"
            disabled={isLoading}
            aria-invalid={!!lastNameError}
            aria-describedby={lastNameError ? "lastName-error" : undefined}
          />
          {lastNameError && (
            <p 
              id="lastName-error" 
              className="text-sm text-red-600"
              role="alert"
            >
              {lastNameError}
            </p>
          )}
        </div>

        {/* Error general */}
        {error && (
          <p 
            className="text-sm text-center text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Campos adicionales para paso 1 de 2 */}
        {/* Nombre de la empresa */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.companyNameLabel} <span className="text-red-600">*</span>
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder={registrationStrings.companyNamePlaceholder}
            className="h-11 bg-muted border-gray-300"
            disabled={isLoading}
          />
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <Label className="text-sm font-normal text-muted-foreground">
            {registrationStrings.positionLabel} <span className="text-red-600">*</span>
          </Label>
          <Select>
            <SelectTrigger className="h-11 bg-muted border-gray-300">
              <SelectValue placeholder={registrationStrings.positionPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(registrationStrings.positionOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-normal text-muted-foreground">
            {registrationStrings.phoneLabel} <span className="text-red-600">*</span>
          </Label>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="w-20 h-11 bg-muted border-gray-300">
                <SelectValue placeholder="🇬🇧" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+34">🇪🇸 +34</SelectItem>
                <SelectItem value="+44">🇬🇧 +44</SelectItem>
                <SelectItem value="+33">🇫🇷 +33</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder="+44"
              className="flex-1 h-11 bg-muted border-gray-300"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error general */}
        {error && (
          <p 
            className="text-sm text-center text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Botón */}
        <Button
          onClick={handleNext}
          disabled={isLoading || !firstName.trim() || !lastName.trim()}
          className="w-full h-12 rounded-full bg-teal-700 text-white hover:bg-teal-800 font-medium"
        >
          {isLoading ? registrationStrings.savingProfile : registrationStrings.nextButton}
        </Button>
      </div>
    </div>
  );
};