import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';

export interface JobDepartment {
  id: string;
  name: string;
  value: string; // alias for name, for backwards compat
  org_id: string;
  created_at: string;
}

export function useJobDepartments() {
  const [departments, setDepartments] = useState<JobDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { org: currentOrg } = useCurrentOrganization();

  const fetchDepartments = async () => {
    if (!currentOrg?.org_id) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('job_departments')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Map 'name' to 'value' for backwards compat
      setDepartments((data || []).map((d: any) => ({ ...d, value: d.name })));
    } catch (err) {
      console.error('Error fetching job departments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [currentOrg?.org_id]);

  const refetch = () => {
    fetchDepartments();
  };

  return {
    departments,
    loading,
    error,
    refetch
  };
}