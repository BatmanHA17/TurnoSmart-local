import { useState, useEffect } from 'react';
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

  const fetchRotasFromOrgs = async () => {
    if (!colaboradorId || accesses.length === 0) {
      setRotas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Obtener todas las rotas de todas las organizaciones del colaborador
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

      // Contar miembros para cada rota
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
            org_name: (rota.organizations as any)?.name || 'Sin nombre',
            is_active: rota.is_active,
          };
        })
      );

      setRotas(rotasWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] fetchRotasFromOrgs:', error);
      setRotas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchColaboradorRotas = async () => {
    if (!colaboradorId) {
      setColaboradorRotas([]);
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
          const team = tm.teams as any;
          
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

      setColaboradorRotas(rotasWithCounts);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] fetchColaboradorRotas:', error);
      setColaboradorRotas([]);
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
        toast({
          title: "Éxito",
          description: "Colaborador asignado a la rota correctamente",
        });
        await fetchColaboradorRotas();
        await fetchRotasFromOrgs();
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] assignToRota:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el colaborador a la rota",
        variant: "destructive",
      });
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
        toast({
          title: "Éxito",
          description: "Colaborador removido de la rota correctamente",
        });
        await fetchColaboradorRotas();
        await fetchRotasFromOrgs();
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useRotasMultiOrg] removeFromRota:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el colaborador de la rota",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    let active = true;
    if (active) {
      fetchRotasFromOrgs();
      fetchColaboradorRotas();
    }
    return () => { active = false; };
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
