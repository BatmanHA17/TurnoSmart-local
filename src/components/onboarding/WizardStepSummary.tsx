import React from 'react';
import { CheckCircle2, Building2, FolderOpen, Briefcase, Edit2, Loader2, Rocket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrganizationData, DepartmentData, JobData } from '@/hooks/useOnboardingWizard';
import { INDUSTRIES, COUNTRIES } from './wizardTemplates';

interface WizardStepSummaryProps {
  organization: OrganizationData;
  departments: DepartmentData[];
  jobs: JobData[];
  isLoading: boolean;
  error: string | null;
  onEdit: (step: 1 | 2 | 3 | 4) => void;
  onComplete: () => void;
  onBack: () => void;
}

export const WizardStepSummary: React.FC<WizardStepSummaryProps> = ({
  organization,
  departments,
  jobs,
  isLoading,
  error,
  onEdit,
  onComplete,
  onBack,
}) => {
  const selectedDepartments = departments.filter(d => d.selected);
  const selectedDeptIds = new Set(selectedDepartments.map(d => d.id));
  const selectedJobs = jobs.filter(j => j.selected && selectedDeptIds.has(j.departmentId));
  const totalHeadcount = selectedJobs.reduce((sum, j) => sum + (j.headcount || 1), 0);
  const industryLabel = INDUSTRIES[organization.industry]?.label || organization.industry;
  const countryLabel = COUNTRIES.find(c => c.code === organization.country)?.name || organization.country;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-green-bg rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-accent-green-text" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          ¡Todo listo!
        </h2>
        <p className="text-muted-foreground">
          Revisa la configuración antes de completar
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Organization summary */}
        <div className="p-4 bg-accent-blue-bg/50 rounded-lg border border-accent-blue-text/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent-blue-text" />
              <h3 className="font-semibold">Organización</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Nombre:</span>
              <p className="font-medium">{organization.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Sector:</span>
              <p className="font-medium">{industryLabel}</p>
            </div>
            <div>
              <span className="text-muted-foreground">País:</span>
              <p className="font-medium">{countryLabel}</p>
            </div>
          </div>
        </div>

        {/* Departments summary */}
        <div className="p-4 bg-accent-purple-bg/50 rounded-lg border border-accent-purple-text/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-accent-purple-text" />
              <h3 className="font-semibold">{selectedDepartments.length} Departamento{selectedDepartments.length !== 1 ? 's' : ''}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDepartments.map(dept => (
              <span 
                key={dept.id} 
                className="px-2 py-1 bg-background rounded text-sm"
              >
                {dept.name}
              </span>
            ))}
          </div>
        </div>

        {/* Jobs summary */}
        <div className="p-4 bg-accent-orange-bg/50 rounded-lg border border-accent-orange-text/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent-orange-text" />
              <h3 className="font-semibold">{selectedJobs.length} Puesto{selectedJobs.length !== 1 ? 's' : ''}</h3>
              <span className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />{totalHeadcount} personas
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedJobs.map(job => (
              <span
                key={job.id}
                className="px-2 py-1 bg-background rounded text-sm flex items-center gap-1"
              >
                {job.title}
                {(job.headcount || 1) > 1 && (
                  <span className="text-xs text-accent-blue-text font-semibold">×{job.headcount}</span>
                )}
                <span className="text-xs text-muted-foreground">· {job.hours}h</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 h-12"
        >
          Atrás
        </Button>
        <Button
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1 h-12 bg-accent-green-text hover:bg-accent-green-text/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Completar y empezar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
