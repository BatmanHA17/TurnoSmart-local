import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOnboardingWizard } from '@/hooks/useOnboardingWizard';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { WizardStep1Organization } from '@/components/onboarding/WizardStep1Organization';
import { WizardStep2Departments } from '@/components/onboarding/WizardStep2Departments';
import { WizardStep3Jobs } from '@/components/onboarding/WizardStep3Jobs';
import { WizardStepSummary } from '@/components/onboarding/WizardStepSummary';
import { INDUSTRIES } from '@/components/onboarding/wizardTemplates';

const WIZARD_STEPS = ['Organización', 'Departamentos', 'Puestos', 'Resumen'];

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    state,
    nextStep,
    prevStep,
    goToStep,
    updateOrganization,
    setDepartments,
    toggleDepartment,
    addDepartment,
    removeDepartment,
    setJobs,
    toggleJob,
    addJob,
    updateJobHours,
    updateJobHeadcount,
    removeJob,
    setLoading,
    setError,
    getSelectedDepartments,
    getSelectedJobs,
  } = useOnboardingWizard();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load templates when industry changes
  useEffect(() => {
    if (state.organization.industry && INDUSTRIES[state.organization.industry]) {
      const template = INDUSTRIES[state.organization.industry];
      if (template.hasTemplates) {
        setDepartments(template.departments);
        setJobs(template.jobs);
      } else {
        setDepartments([]);
        setJobs([]);
      }
    }
  }, [state.organization.industry, setDepartments, setJobs]);

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const selectedDepts = getSelectedDepartments();
      const selectedDeptIds = new Set(selectedDepts.map(d => d.id));
      const selectedJobs = getSelectedJobs().filter(
        j => selectedDeptIds.has(j.departmentId) || j.id.startsWith('custom-')
      );

      // Call edge function to complete onboarding
      const { data, error } = await supabase.functions.invoke('complete-onboarding', {
        body: {
          organization: state.organization,
          departments: selectedDepts,
          jobs: selectedJobs,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('¡Organización configurada correctamente!');
        // Navigate to dashboard
        navigate('/turnosmart/day');
      } else {
        throw new Error(data?.error || 'Error al completar la configuración');
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Error al completar la configuración');
      toast.error('Error al completar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const industryLabel = INDUSTRIES[state.organization.industry]?.label || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">TurnoSmart</h1>
          <p className="text-muted-foreground mt-1">Configuración inicial</p>
        </div>

        {/* Progress */}
        <OnboardingProgress
          currentStep={state.currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS}
        />

        {/* Card container */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          {state.currentStep === 1 && (
            <WizardStep1Organization
              data={state.organization}
              onChange={updateOrganization}
              onNext={nextStep}
            />
          )}

          {state.currentStep === 2 && (
            <WizardStep2Departments
              departments={state.departments}
              industryLabel={industryLabel}
              onToggle={toggleDepartment}
              onAdd={addDepartment}
              onRemove={removeDepartment}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {state.currentStep === 3 && (
            <WizardStep3Jobs
              jobs={state.jobs}
              departments={state.departments}
              onToggle={toggleJob}
              onAdd={addJob}
              onRemove={removeJob}
              onUpdateHours={updateJobHours}
              onUpdateHeadcount={updateJobHeadcount}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {state.currentStep === 4 && (
            <WizardStepSummary
              organization={state.organization}
              departments={state.departments}
              jobs={state.jobs}
              isLoading={state.isLoading}
              error={state.error}
              onEdit={goToStep}
              onComplete={handleComplete}
              onBack={prevStep}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Necesitas ayuda? <a href="/ayuda" className="text-primary hover:underline">Contacta con soporte</a>
        </p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
