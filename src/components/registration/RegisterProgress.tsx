import React from 'react';
import { registrationTokens } from '@/design-tokens-registration';
import { registrationStrings } from '@/i18n/es-registration';

interface RegisterProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const RegisterProgress: React.FC<RegisterProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full mb-8">
      {/* Progress text */}
      <div className="flex justify-between items-center mb-3">
        <span 
          className="text-sm font-medium"
          style={{ 
            color: registrationTokens.colors.textSecondary,
            fontSize: registrationTokens.typography.label.fontSize,
            fontWeight: registrationTokens.typography.label.fontWeight
          }}
        >
          {currentStep === 1 ? registrationStrings.progressStep1 : registrationStrings.progressStep2}
        </span>
        <span 
          className="text-sm font-medium"
          style={{ 
            color: registrationTokens.colors.textSecondary,
            fontSize: registrationTokens.typography.label.fontSize,
            fontWeight: registrationTokens.typography.label.fontWeight
          }}
        >
          {currentStep === 1 ? registrationStrings.progress50 : registrationStrings.progress100}
        </span>
      </div>
      
      {/* Progress bar */}
      <div 
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ 
          backgroundColor: registrationTokens.colors.progressBg,
          borderRadius: registrationTokens.borderRadius.full
        }}
      >
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: registrationTokens.colors.progressFill,
            transition: registrationTokens.transitions.slow
          }}
        />
      </div>
    </div>
  );
};