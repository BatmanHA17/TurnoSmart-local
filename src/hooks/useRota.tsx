import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';
import { toast } from '@/hooks/use-toast';

export interface Rota {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  order_index: number;
  member_count: number;
  created_at: string;
}

export interface CreateRotaData {
  name: string;
  description?: string;
  order_index?: number;
}

export interface RotaMember {
  id: string;
  team_id: string;
  colaborador_id: string;
  assigned_at: string;
  is_active: boolean;
  colaborador?: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export const useRota = (orgId?: string) => {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const { org: currentOrg } = useCurrentOrganization();

  const effectiveOrgId = orgId || currentOrg?.org_id;

  const fetchRotas = async () => {
    if (!effectiveOrgId) return;

    try {
      setLoading(true);
      
      // Obtener datos directamente de job_departments y contar miembros de teams
      const { data: departments, error: deptError } = await supabase
        .from('job_departments')
        .select('*')
        .eq('org_id', effectiveOrgId)
        .order('value');

      if (deptError) throw deptError;

      // Para cada department, obtener el team correspondiente y contar miembros
      const rotasWithMembers = await Promise.all(
        (departments || []).map(async (dept) => {
          // Buscar el team correspondiente
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, is_active, order_index, created_at')
            .eq('name', dept.value)
            .eq('org_id', effectiveOrgId)
            .single();

          // Contar miembros si existe el team
          let memberCount = 0;
          if (!teamError && team) {
            const { count } = await supabase
              .from('team_members')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', team.id)
              .eq('is_active', true);
            
            memberCount = count || 0;
          }

          return {
            id: team?.id || dept.id, // Usar team.id si existe, sino department.id
            name: dept.value,
            description: `Rota generada automáticamente desde equipo: ${dept.value}`,
            is_active: team?.is_active ?? true,
            order_index: team?.order_index ?? 0,
            member_count: memberCount,
            created_at: team?.created_at || dept.created_at
          };
        })
      );

      setRotas(rotasWithMembers);
    } catch (error) {
      console.error('Error fetching rotas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las rotas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRota = async (rotaData: CreateRotaData) => {
    if (!effectiveOrgId) return null;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...rotaData,
          org_id: effectiveOrgId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Rota "${rotaData.name}" creada correctamente`,
      });

      fetchRotas(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating rota:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la rota",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRota = async (rotaId: string, updates: Partial<CreateRotaData>) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', rotaId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Rota actualizada correctamente",
      });

      fetchRotas(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating rota:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la rota",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteRota = async (rotaId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', rotaId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Rota eliminada correctamente",
      });

      fetchRotas(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting rota:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la rota",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRotas();
  }, [effectiveOrgId]);

  return {
    rotas,
    loading,
    createRota,
    updateRota,
    deleteRota,
    refetch: fetchRotas,
  };
};

export const useColaboradorRotas = (colaboradorId?: string) => {
  const [colaboradorRotas, setColaboradorRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(false);
  const { org: currentOrg } = useCurrentOrganization();

  const fetchColaboradorRotas = async () => {
    if (!colaboradorId || !currentOrg?.org_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            description,
            is_active,
            order_index,
            created_at
          )
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('is_active', true);

      if (error) throw error;

      // Extract rotas from the nested structure and get member counts
      const rotaIds = data?.map(item => item.team_id).filter(Boolean) || [];
      
      if (rotaIds.length > 0) {
        const { data: rotasWithCounts, error: countError } = await supabase.rpc('get_teams_by_org', {
          org_uuid: currentOrg.org_id
        });

        if (countError) throw countError;

        const filteredRotas = (rotasWithCounts || []).filter((rota: Rota) => 
          rotaIds.includes(rota.id)
        );

        setColaboradorRotas(filteredRotas);
      } else {
        setColaboradorRotas([]);
      }
    } catch (error) {
      console.error('Error fetching colaborador rotas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las rotas del colaborador",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradorRotas();
  }, [colaboradorId, currentOrg?.org_id]);

  return {
    colaboradorRotas,
    loading,
    refetch: fetchColaboradorRotas,
  };
};

export const useRotaMembers = (rotaId?: string) => {
  const [members, setMembers] = useState<RotaMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRotaMembers = async () => {
    if (!rotaId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          colaborador_id,
          assigned_at,
          is_active,
          colaborador:colaboradores (
            id,
            nombre,
            apellidos,
            email,
            avatar_url
          )
        `)
        .eq('team_id', rotaId)
        .eq('is_active', true);

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        colaborador: Array.isArray(item.colaborador) && item.colaborador.length > 0 
          ? item.colaborador[0] 
          : null
      }));
      setMembers(formattedData);
    } catch (error) {
      console.error('Error fetching rota members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros de la rota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignColaboradorToRota = async (colaboradorId: string) => {
    if (!rotaId) return false;

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
        fetchRotaMembers(); // Refresh the list
        return true;
      } else {
        toast({
          title: "Error",
          description: "No se pudo asignar el colaborador a la rota",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error assigning colaborador to rota:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el colaborador a la rota",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeColaboradorFromRota = async (colaboradorId: string) => {
    if (!rotaId) return false;

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
        fetchRotaMembers(); // Refresh the list
        return true;
      } else {
        toast({
          title: "Error",
          description: "No se pudo remover el colaborador de la rota",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error removing colaborador from rota:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el colaborador de la rota",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRotaMembers();
  }, [rotaId]);

  return {
    members,
    loading,
    assignColaboradorToRota,
    removeColaboradorFromRota,
    refetch: fetchRotaMembers,
  };
};