import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { registrationStrings } from '@/i18n/es-registration';

interface RegisterStepCompanyNewProps {
  establishments: string;
  employees: string;
  industry: string;
  isFranchise: boolean;
  country: string;
  onEstablishmentsChange: (establishments: string) => void;
  onEmployeesChange: (employees: string) => void;
  onIndustryChange: (industry: string) => void;
  onFranchiseChange: (isFranchise: boolean) => void;
  onCountryChange: (country: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RegisterStepCompanyNew: React.FC<RegisterStepCompanyNewProps> = ({
  establishments,
  employees,
  industry,
  isFranchise,
  country,
  onEstablishmentsChange,
  onEmployeesChange,
  onIndustryChange,
  onFranchiseChange,
  onCountryChange,
  onComplete,
  onBack,
  isLoading = false,
  error
}) => {
  const handleComplete = () => {
    onComplete();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleComplete();
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Progress */}
      <div className="space-y-3">
        <div className="text-sm text-gray-500">
          {registrationStrings.step2of2}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-teal-700 h-1 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="text-left space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {registrationStrings.companyInfoTitle}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {registrationStrings.companyInfoSubtitle}
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Establecimientos */}
        <div className="space-y-3">
          <Label className="text-sm font-normal text-muted-foreground">
            {registrationStrings.establishmentsLabel} <span className="text-red-600">*</span>
          </Label>
          <div className="flex gap-2">
            {Object.entries(registrationStrings.establishmentsOptions).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onEstablishmentsChange(value)}
                className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                  establishments === value
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-background border-gray-300 text-muted-foreground hover:bg-muted/50'
                }`}
                disabled={isLoading}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Número de empleados */}
        <div className="space-y-2">
          <Label className="text-sm font-normal text-muted-foreground">
            {registrationStrings.employeesLabel} <span className="text-red-600">*</span>
          </Label>
          <Select value={employees} onValueChange={onEmployeesChange}>
            <SelectTrigger className="h-11 bg-muted border-gray-300">
              <SelectValue placeholder={registrationStrings.employeesPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(registrationStrings.employeesOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industria */}
        <div className="space-y-2">
          <Label className="text-sm font-normal text-muted-foreground">
            {registrationStrings.industryLabel} <span className="text-red-600">*</span>
          </Label>
          <Select value={industry} onValueChange={onIndustryChange}>
            <SelectTrigger className="h-11 bg-muted border-gray-300">
              <SelectValue placeholder={registrationStrings.industryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(registrationStrings.industryOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Franquicia */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="franchise"
            checked={isFranchise}
            onCheckedChange={(checked) => onFranchiseChange(checked as boolean)}
          />
          <Label 
            htmlFor="franchise" 
            className="text-sm font-normal text-muted-foreground cursor-pointer"
          >
            {registrationStrings.franchiseLabel}
          </Label>
        </div>

        {/* País */}
        <div className="space-y-2">
          <Label className="text-sm font-normal text-muted-foreground">
            {registrationStrings.countryLabel} <span className="text-red-600">*</span>
          </Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger className="h-11 bg-muted border-gray-300">
              <SelectValue placeholder={registrationStrings.countryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(registrationStrings.countryOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          onClick={handleComplete}
          disabled={isLoading}
          className="w-full h-12 rounded-full bg-teal-700 text-white hover:bg-teal-800 font-medium"
        >
          {isLoading ? registrationStrings.creatingAccount : registrationStrings.startButton}
        </Button>
      </div>
    </div>
  );
};