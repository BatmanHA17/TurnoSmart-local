import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from './useCurrentOrganization';
import { toast } from '@/hooks/use-toast';

export interface RotaShift {
  id: string;
  rota_id: string;
  colaborador_id: string;
  org_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  color: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateRotaShiftData {
  rota_id: string;
  colaborador_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration?: number;
  color?: string;
  notes?: string;
}

export interface RotaScheduleAssignment {
  id: string;
  rota_id: string;
  colaborador_id: string;
  org_id: string;
  work_date: string;
  rota_shift_id?: string;
  status_code: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_by?: string;
}

export const useRotaShifts = (rotaId?: string, colaboradorId?: string) => {
  const [rotaShifts, setRotaShifts] = useState<RotaShift[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useCurrentOrganization();

  const fetchRotaShifts = async () => {
    if (!currentOrg?.org_id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('rota_shifts')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .eq('is_active', true)
        .order('shift_name');

      if (rotaId) {
        query = query.eq('rota_id', rotaId);
      }

      if (colaboradorId) {
        query = query.eq('colaborador_id', colaboradorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRotaShifts(data || []);
    } catch (error) {
      console.error('Error fetching rota shifts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios de la rota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRotaShift = async (shiftData: CreateRotaShiftData) => {
    if (!currentOrg?.org_id) return null;

    try {
      const { data, error } = await supabase
        .from('rota_shifts')
        .insert({
          ...shiftData,
          org_id: currentOrg.org_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Horario "${shiftData.shift_name}" creado correctamente`,
      });

      fetchRotaShifts();
      return data;
    } catch (error) {
      console.error('Error creating rota shift:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el horario de rota",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRotaShift = async (shiftId: string, updates: Partial<CreateRotaShiftData>) => {
    try {
      const { data, error } = await supabase
        .from('rota_shifts')
        .update(updates)
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Horario actualizado correctamente",
      });

      fetchRotaShifts();
      return data;
    } catch (error) {
      console.error('Error updating rota shift:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el horario",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteRotaShift = async (shiftId: string) => {
    try {
      const { error } = await supabase
        .from('rota_shifts')
        .update({ is_active: false })
        .eq('id', shiftId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Horario eliminado correctamente",
      });

      fetchRotaShifts();
      return true;
    } catch (error) {
      console.error('Error deleting rota shift:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRotaShifts();
  }, [currentOrg?.org_id, rotaId, colaboradorId]);

  return {
    rotaShifts,
    loading,
    createRotaShift,
    updateRotaShift,
    deleteRotaShift,
    refetch: fetchRotaShifts,
  };
};

export const useRotaSchedule = (rotaId?: string, startDate?: string, endDate?: string) => {
  const [scheduleAssignments, setScheduleAssignments] = useState<RotaScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useCurrentOrganization();

  const fetchScheduleAssignments = async () => {
    if (!currentOrg?.org_id || !rotaId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('rota_schedule_assignments')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .eq('rota_id', rotaId)
        .order('work_date', { ascending: true });

      if (startDate) {
        query = query.gte('work_date', startDate);
      }

      if (endDate) {
        query = query.lte('work_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScheduleAssignments(data || []);
    } catch (error) {
      console.error('Error fetching schedule assignments:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las asignaciones del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignShiftToDay = async (
    colaboradorId: string,
    workDate: string,
    rotaShiftId: string,
    statusCode: string = 'X'
  ) => {
    if (!currentOrg?.org_id || !rotaId) return null;

    try {
      const { data, error } = await supabase
        .from('rota_schedule_assignments')
        .upsert({
          rota_id: rotaId,
          colaborador_id: colaboradorId,
          org_id: currentOrg.org_id,
          work_date: workDate,
          rota_shift_id: rotaShiftId,
          status_code: statusCode,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Turno asignado correctamente",
      });

      fetchScheduleAssignments();
      return data;
    } catch (error) {
      console.error('Error assigning shift:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el turno",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchScheduleAssignments();
  }, [currentOrg?.org_id, rotaId, startDate, endDate]);

  return {
    scheduleAssignments,
    loading,
    assignShiftToDay,
    refetch: fetchScheduleAssignments,
  };
};