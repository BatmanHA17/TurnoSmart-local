import { useState, useCallback } from 'react';

export interface OrganizationData {
  name: string;
  industry: string;
  country: string;
}

export interface DepartmentData {
  id: string;
  name: string;
  selected: boolean;
}

export interface JobData {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  hours: number;
  headcount: number;
  selected: boolean;
  /** SMART engine role for shift generation (default: ROTA_COMPLETO) */
  engine_role?: string;
}

export interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4;
  organization: OrganizationData;
  departments: DepartmentData[];
  jobs: JobData[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  currentStep: 1,
  organization: {
    name: '',
    industry: '',
    country: 'ES',
  },
  departments: [],
  jobs: [],
  isComplete: false,
  isLoading: false,
  error: null,
};

export const useOnboardingWizard = () => {
  const [state, setState] = useState<OnboardingState>(initialState);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 4) as 1 | 2 | 3 | 4,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as 1 | 2 | 3 | 4,
    }));
  }, []);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const updateOrganization = useCallback((data: Partial<OrganizationData>) => {
    setState(prev => ({
      ...prev,
      organization: { ...prev.organization, ...data },
    }));
  }, []);

  const setDepartments = useCallback((departments: DepartmentData[]) => {
    setState(prev => ({ ...prev, departments }));
  }, []);

  const toggleDepartment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.map(dept =>
        dept.id === id ? { ...dept, selected: !dept.selected } : dept
      ),
    }));
  }, []);

  const addDepartment = useCallback((name: string) => {
    const newDept: DepartmentData = {
      id: `custom-${Date.now()}`,
      name,
      selected: true,
    };
    setState(prev => ({
      ...prev,
      departments: [...prev.departments, newDept],
    }));
  }, []);

  const removeDepartment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      departments: prev.departments.filter(dept => dept.id !== id),
    }));
  }, []);

  const setJobs = useCallback((jobs: JobData[]) => {
    setState(prev => ({ ...prev, jobs }));
  }, []);

  const toggleJob = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job =>
        job.id === id ? { ...job, selected: !job.selected } : job
      ),
    }));
  }, []);

  const updateJobHeadcount = useCallback((id: string, headcount: number) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job =>
        job.id === id ? { ...job, headcount: Math.max(1, headcount) } : job
      ),
    }));
  }, []);

  const addJob = useCallback((title: string, departmentId: string, departmentName: string, hours: number = 8) => {
    const newJob: JobData = {
      id: `custom-${Date.now()}`,
      title,
      departmentId,
      departmentName,
      hours,
      headcount: 1,
      selected: true,
    };
    setState(prev => ({
      ...prev,
      jobs: [...prev.jobs, newJob],
    }));
  }, []);

  const updateJobHours = useCallback((id: string, hours: number) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job =>
        job.id === id ? { ...job, hours } : job
      ),
    }));
  }, []);

  const removeJob = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== id),
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setComplete = useCallback((isComplete: boolean) => {
    setState(prev => ({ ...prev, isComplete }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const getSelectedDepartments = useCallback(() => {
    return state.departments.filter(dept => dept.selected);
  }, [state.departments]);

  const getSelectedJobs = useCallback(() => {
    return state.jobs.filter(job => job.selected);
  }, [state.jobs]);

  return {
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
    removeJob,
    updateJobHeadcount,
    setLoading,
    setError,
    setComplete,
    reset,
    getSelectedDepartments,
    getSelectedJobs,
  };
};
