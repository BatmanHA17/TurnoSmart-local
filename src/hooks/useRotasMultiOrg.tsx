import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useColaboradorOrganizations } from './useColaboradorOrganizations';
import { toast } from './use-toast';

export interface RotaWithOrg {
  id: string;
  name: string;
  member_count: number;
  org_id: string;
  org_name: string;
  is_active: boolean;
}

export interface ColaboradorRotaAssignment {
  id: string;
  name: string;
  member_count: number;
  org_id: string;
  org_name: string;
}

export const useRotasMultiOrg = (colaboradorId: string | null) => {
  const [rotas, setRotas] = useState<RotaWithOrg[]>([]);
  const [colaboradorRotas, setColaboradorRotas] = useState<ColaboradorRotaAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { accesses } = useColaboradorOrganizations(colaboradorId);
  const mountedRef = useRef(true);

  const fetchRotasFromOrgs = async () => {
    if (!colaboradorId || accesses.length === 0) {
      if (mountedRef.current) {
        setRotas([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (mountedRef.current) setLoading(true);

      const orgIds = accesses.map(a => a.org_id);

      const { data: allRotas, error: rotasError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          org_id,
          is_active,
          organizations!inner(name)
        `)
        .in('org_id', orgIds)
        .eq('is_active', true)
        .order('name');

      if (rotasError) throw rotasError;

      const rotasWithCounts = await Promise.all(
        (allRotas || []).map(async (rota) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', rota.id)
            .eq('is_active', true);

          return {
            id: rota.id,
            name: rota.name,
            member_count: count || 0,
            org_id: rota.org_id,
            org_name: (rota.organizations as { name?: string })?.name || 'Sin nombre',
            is_active: rota.is_active,
          };
        })
      );

      if (mountedRef.current) setRotas(rotasWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] fetchRotasFromOrgs:', error);
      if (mountedRef.current) setRotas([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const fetchColaboradorRotas = async () => {
    if (!colaboradorId) {
      if (mountedRef.current) setColaboradorRotas([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(
            id,
            name,
            org_id,
            is_active,
            organizations!inner(name)
          )
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('is_active', true);

      if (error) throw error;

      const rotasWithCounts = await Promise.all(
        (data || []).map(async (tm) => {
          const team = tm.teams as { id: string; name: string; org_id: string; is_active: boolean; organizations?: { name?: string } };

          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('is_active', true);

          return {
            id: team.id,
            name: team.name,
            member_count: count || 0,
            org_id: team.org_id,
            org_name: team.organizations?.name || 'Sin nombre',
          };
        })
      );

      if (mountedRef.current) setColaboradorRotas(rotasWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] fetchColaboradorRotas:', error);
      if (mountedRef.current) setColaboradorRotas([]);
    }
  };

  const assignToRota = async (rotaId: string) => {
    if (!colaboradorId) return false;

    try {
      const { data, error } = await supabase.rpc('assign_colaborador_to_team', {
        colaborador_uuid: colaboradorId,
        team_uuid: rotaId,
      });

      if (error) throw error;

      if (data) {
        toast({ title: "Éxito", description: "Colaborador asignado a la rota correctamente" });
        await fetchColaboradorRotas();
        await fetchRotasFromOrgs();
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] assignToRota:', error);
      toast({ title: "Error", description: "No se pudo asignar el colaborador a la rota", variant: "destructive" });
      return false;
    }
  };

  const removeFromRota = async (rotaId: string) => {
    if (!colaboradorId) return false;

    try {
      const { data, error } = await supabase.rpc('remove_colaborador_from_team', {
        colaborador_uuid: colaboradorId,
        team_uuid: rotaId,
      });

      if (error) throw error;

      if (data) {
        toast({ title: "Éxito", description: "Colaborador removido de la rota correctamente" });
        await fetchColaboradorRotas();
        await fetchRotasFromOrgs();
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] removeFromRota:', error);
      toast({ title: "Error", description: "No se pudo remover el colaborador de la rota", variant: "destructive" });
      return false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchRotasFromOrgs();
    fetchColaboradorRotas();
    return () => { mountedRef.current = false; };
  }, [colaboradorId, accesses.length]);

  return {
    rotas,
    colaboradorRotas,
    loading,
    assignToRota,
    removeFromRota,
    refetch: () => {
      fetchRotasFromOrgs();
      fetchColaboradorRotas();
    },
  };
};
