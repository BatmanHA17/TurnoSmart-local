import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isMountedRef } from '@/utils/safeQuery';

export interface ColaboradorOrgAccess {
  id: string;
  org_id: string;
  org_name: string;
  granted_at: string;
  is_active: boolean;
}

export const useColaboradorOrganizations = (colaboradorId: string | null) => {
  const [accesses, setAccesses] = useState<ColaboradorOrgAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccesses = useCallback(async (mounted?: { current: boolean }) => {
    if (!colaboradorId) {
      if (!mounted || mounted.current) { setAccesses([]); setLoading(false); }
      return;
    }

    try {
      if (!mounted || mounted.current) { setLoading(true); setError(null); }

      const { data, error: fetchError } = await supabase
        .from('colaborador_organization_access')
        .select(`
          id,
          org_id,
          granted_at,
          is_active,
          organizations!inner(name)
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const formattedAccesses: ColaboradorOrgAccess[] = (data || []).map(access => ({
        id: access.id,
        org_id: access.org_id,
        org_name: (access.organizations as any)?.name || 'Sin nombre',
        granted_at: access.granted_at,
        is_active: access.is_active
      }));

      if (!mounted || mounted.current) setAccesses(formattedAccesses);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useColaboradorOrganizations]', err);
      if (!mounted || mounted.current) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setAccesses([]);
      }
    } finally {
      if (!mounted || mounted.current) setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => {
    const mounted = isMountedRef();
    fetchAccesses(mounted);
    return () => { mounted.current = false; };
  }, [fetchAccesses]);

  const grantAccess = async (orgId: string) => {
    if (!colaboradorId) return false;

    try {
      const { error } = await supabase
        .from('colaborador_organization_access')
        .upsert({
          colaborador_id: colaboradorId,
          org_id: orgId,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        }, {
          onConflict: 'colaborador_id,org_id'
        });

      if (error) throw error;
      await fetchAccesses();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useColaboradorOrganizations] grantAccess:', err);
      return false;
    }
  };

  const revokeAccess = async (orgId: string) => {
    if (!colaboradorId) return false;

    try {
      const { error } = await supabase
        .from('colaborador_organization_access')
        .update({ is_active: false })
        .eq('colaborador_id', colaboradorId)
        .eq('org_id', orgId);

      if (error) throw error;
      await fetchAccesses();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useColaboradorOrganizations] revokeAccess:', err);
      return false;
    }
  };

  const updateAccesses = async (orgIds: string[]) => {
    if (!colaboradorId) return false;

    try {
      const user = await supabase.auth.getUser();
      
      // Desactivar todos los accesos actuales
      await supabase
        .from('colaborador_organization_access')
        .update({ is_active: false })
        .eq('colaborador_id', colaboradorId);

      // Crear o reactivar accesos para las organizaciones seleccionadas
      if (orgIds.length > 0) {
        const upsertData = orgIds.map(orgId => ({
          colaborador_id: colaboradorId,
          org_id: orgId,
          granted_by: user.data.user?.id,
          is_active: true
        }));

        const { error } = await supabase
          .from('colaborador_organization_access')
          .upsert(upsertData, {
            onConflict: 'colaborador_id,org_id'
          });

        if (error) throw error;
      }

      await fetchAccesses();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useColaboradorOrganizations] updateAccesses:', err);
      return false;
    }
  };

  return {
    accesses,
    loading,
    error,
    refetch: () => fetchAccesses(),
    grantAccess,
    revokeAccess,
    updateAccesses
  };
};
