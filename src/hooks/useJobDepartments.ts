import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';

export interface JobDepartment {
  id: string;
  value: string;
  org_id: string;
  created_at: string;
  created_by?: string;
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
        .order('value', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setDepartments(data || []);
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