import React from 'react';
import { Building2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationData } from '@/hooks/useOnboardingWizard';
import { INDUSTRIES, COUNTRIES } from './wizardTemplates';

interface WizardStep1OrganizationProps {
  data: OrganizationData;
  onChange: (data: Partial<OrganizationData>) => void;
  onNext: () => void;
}

export const WizardStep1Organization: React.FC<WizardStep1OrganizationProps> = ({
  data,
  onChange,
  onNext,
}) => {
  const isValid = data.name.trim().length > 0 && data.industry !== '';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-blue-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-accent-blue-text" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Información de tu organización
        </h2>
        <p className="text-muted-foreground">
          Cuéntanos sobre tu empresa para personalizar la configuración
        </p>
      </div>

      <div className="space-y-5">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-sm font-medium">
            Nombre de la organización *
          </Label>
          <Input
            id="org-name"
            placeholder="Ej: Hotel Cantaclaro"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-11"
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium">
            Sector / Industria *
          </Label>
          <Select
            value={data.industry}
            onValueChange={(value) => onChange({ industry: value })}
          >
            <SelectTrigger id="industry" className="h-11">
              <SelectValue placeholder="Selecciona tu sector" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INDUSTRIES).map(([key, industry]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{industry.label}</span>
                    {industry.hasTemplates && (
                      <span className="text-xs bg-accent-green-bg text-accent-green-text px-2 py-0.5 rounded-full">
                        Con plantilla
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.industry && INDUSTRIES[data.industry]?.hasTemplates && (
            <p className="text-xs text-accent-green-text">
              ✓ Este sector incluye departamentos y puestos predefinidos
            </p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            País
          </Label>
          <Select
            value={data.country}
            onValueChange={(value) => onChange({ country: value })}
          >
            <SelectTrigger id="country" className="h-11">
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <p className="text-xs text-muted-foreground text-center">
        Podrás añadir y gestionar empleados una vez dentro de la aplicación
      </p>

      <div className="pt-6">
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="w-full h-12 text-base font-medium"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
