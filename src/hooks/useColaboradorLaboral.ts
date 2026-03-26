import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';

export interface TeamAssignment {
  department_id: string;
  department_name: string;
  has_job: boolean;
  job_title?: string;
}

export interface ColaboradorLaboralData {
  assignments: TeamAssignment[];
  jobTitle: string | null;
  departments: string[];
  contractHours: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook unificado para gestionar toda la información laboral de un colaborador
 * Consolida datos de jobs, teams y departments en una sola fuente
 */
export const useColaboradorLaboral = (colaboradorId: string | undefined) => {
  const { currentOrg } = useCurrentOrganization();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [data, setData] = useState<ColaboradorLaboralData>({
    assignments: [],
    jobTitle: null,
    departments: [],
    contractHours: 40,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchLaboralData = async () => {
      if (!colaboradorId || !currentOrg?.org_id) {
        if (mounted) setData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        if (mounted) setData(prev => ({ ...prev, loading: true, error: null }));

        // Obtener datos del colaborador incluyendo job_id
        const { data: colaboradorData, error: colaboradorError } = await supabase
          .from('colaboradores')
          .select(`
            job_id,
            tiempo_trabajo_semanal,
            jobs (
              id,
              title,
              department
            )
          `)
          .eq('id', colaboradorId)
          .eq('org_id', currentOrg.org_id)
          .single();

        if (colaboradorError) throw colaboradorError;

        // Obtener asignaciones de equipos/departamentos
        const { data: teamData, error: teamError } = await supabase
          .from('colaborador_departments')
          .select(`
            department_id,
            job_departments!inner (
              id,
              value
            )
          `)
          .eq('colaborador_id', colaboradorId)
          .eq('org_id', currentOrg.org_id)
          .eq('is_active', true);

        if (teamError) throw teamError;

        // Verificar si cada departamento tiene un job asignado
        const assignmentsWithJobs = await Promise.all(
          (teamData || []).map(async (team: any) => {
            const { data: jobData } = await supabase
              .from('jobs')
              .select('id, title')
              .eq('department_id', team.department_id)
              .eq('org_id', currentOrg.org_id)
              .maybeSingle();

            return {
              department_id: team.department_id,
              department_name: team.job_departments?.value || 'Sin nombre',
              has_job: !!jobData,
              job_title: jobData?.title,
            };
          })
        );

        // Determinar el título de trabajo principal
        const primaryJobTitle = (colaboradorData?.jobs as any)?.title ||
                                assignmentsWithJobs.find(a => a.has_job)?.job_title || 
                                null;

        const departments = assignmentsWithJobs.map(a => a.department_name);

        if (mounted) setData({
          assignments: assignmentsWithJobs,
          jobTitle: primaryJobTitle,
          departments,
          contractHours: colaboradorData?.tiempo_trabajo_semanal || 40,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        if (import.meta.env.DEV) console.error('[useColaboradorLaboral]', error);
        if (mounted) setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Error al cargar información laboral',
        }));
      }
    };

    fetchLaboralData();
    return () => { mounted = false; };
  }, [colaboradorId, currentOrg?.org_id, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger(n => n + 1);
  }, []);

  return {
    ...data,
    refetch,
  };
};
