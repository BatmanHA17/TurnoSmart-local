import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';
import { isMountedRef } from '@/utils/safeQuery';

export interface TeamAssignment {
  id: string;
  department_id: string;
  department_name: string;
  has_job: boolean;
  job_title?: string;
}

const useTeamAssignments = (colaboradorId: string) => {
  const { currentOrg } = useCurrentOrganization();
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (mounted?: { current: boolean }) => {
    if (!colaboradorId) {
      if (!mounted || mounted.current) { setAssignments([]); setLoading(false); }
      return;
    }

    try {
      if (!mounted || mounted.current) { setLoading(true); setError(null); }

      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select('org_id')
        .eq('id', colaboradorId)
        .single();

      if (colaboradorError) throw colaboradorError;

      if (!colaboradorData?.org_id) {
        if (!mounted || mounted.current) { setAssignments([]); setLoading(false); }
        return;
      }

      const { data: departmentAssignments, error: deptError } = await supabase
        .from('colaborador_departments')
        .select(`
          id,
          department_id,
          is_active,
          job_departments:department_id (
            id,
            value
          )
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('org_id', colaboradorData.org_id)
        .eq('is_active', true);

      if (deptError) throw deptError;

      const enrichedAssignments: TeamAssignment[] = [];

      if (departmentAssignments && departmentAssignments.length > 0) {
        for (const assignment of departmentAssignments) {
          const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('department_id', assignment.department_id)
            .eq('org_id', colaboradorData.org_id)
            .limit(1);

          const hasJob = !jobsError && jobs && jobs.length > 0;

          enrichedAssignments.push({
            id: assignment.id,
            department_id: assignment.department_id,
            department_name: (assignment.job_departments as any)?.value || 'Departamento sin nombre',
            has_job: hasJob,
            job_title: hasJob ? jobs[0].title : undefined
          });
        }
      }

      if (!mounted || mounted.current) setAssignments(enrichedAssignments);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useTeamAssignments]', err);
      if (!mounted || mounted.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setAssignments([]);
      }
    } finally {
      if (!mounted || mounted.current) setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => {
    const mounted = isMountedRef();
    fetchAssignments(mounted);
    return () => { mounted.current = false; };
  }, [fetchAssignments]);

  const refetch = useCallback(() => { fetchAssignments(); }, [fetchAssignments]);

  // Función helper para obtener el estado de los puestos de trabajo
  const getJobStatus = () => {
    const teamsWithoutJobs = assignments.filter(team => !team.has_job);
    
    if (assignments.length === 0) {
      return { type: 'none', message: 'Sin equipos asignados' };
    }
    
    if (teamsWithoutJobs.length === 0) {
      return { type: 'complete', message: 'Todos los equipos tienen puestos asignados' };
    }
    
    if (teamsWithoutJobs.length === assignments.length) {
      return { type: 'incomplete', message: 'Ningún equipo tiene puesto de trabajo asignado' };
    }
    
    return { 
      type: 'partial', 
      message: 'No hay puesto de trabajo en uno o varios de los equipos seleccionados' 
    };
  };

  return {
    assignments,
    loading,
    error,
    refetch,
    getJobStatus
  };
};

export { useTeamAssignments };