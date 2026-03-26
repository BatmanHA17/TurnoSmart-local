import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShiftBlockDay } from "./useDayCalendarData";

export function useDayCalendarActions(onRefresh: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);

  const updateShift = async (shiftId: string, updates: Partial<ShiftBlockDay>) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("calendar_shifts")
        .update({
          shift_name: updates.shift_name,
          start_time: updates.start_time,
          end_time: updates.end_time,
          break_duration: updates.break_duration,
          notes: updates.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", shiftId);

      if (error) throw error;

      toast.success("Turno actualizado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error updating shift:", error);
      toast.error("Error al actualizar el turno");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteShift = async (shiftId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("calendar_shifts")
        .delete()
        .eq("id", shiftId);

      if (error) throw error;

      toast.success("Turno eliminado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast.error("Error al eliminar el turno");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const createShift = async (shiftData: {
    date: string;
    employee_id: string;
    shift_name: string;
    start_time: string;
    end_time: string;
    org_id: string;
    break_duration?: string;
    notes?: string;
    color?: string;
  }) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("calendar_shifts")
        .insert([shiftData]);

      if (error) throw error;

      toast.success("Turno creado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error creating shift:", error);
      toast.error("Error al crear el turno");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    updateShift,
    deleteShift,
    createShift,
    isProcessing
  };
}
