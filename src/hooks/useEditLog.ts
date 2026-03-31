/**
 * useEditLog — Tracking de cambios post-publicación
 *
 * Escribe en schedule_edit_log cada vez que el FOM edita un turno
 * después de publicar el cuadrante.
 *
 * Flujo: edición manual → logEdit() → insert en DB → visual azul en celda
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EditLogEntry {
  id: string;
  shift_id: string | null;
  employee_id: string;
  generation_id: string | null;
  shift_date: string;
  previous_code: string;
  new_code: string;
  previous_start_time: string | null;
  previous_end_time: string | null;
  new_start_time: string | null;
  new_end_time: string | null;
  changed_by: string;
  reason: string | null;
  change_type: "manual" | "swap" | "force_majeure" | "coverage";
  is_post_publication: boolean;
  created_at: string;
}

interface UseEditLogProps {
  organizationId: string | undefined;
}

interface UseEditLogResult {
  editLog: EditLogEntry[];
  isLoading: boolean;
  postPubCount: number;
  logEdit: (params: LogEditParams) => Promise<void>;
  fetchEditLog: (generationId?: string) => Promise<void>;
  isPostPubEdited: (employeeId: string, date: string) => boolean;
}

interface LogEditParams {
  shiftId?: string;
  employeeId: string;
  generationId?: string;
  shiftDate: string;
  previousCode: string;
  newCode: string;
  previousStartTime?: string;
  previousEndTime?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
  changeType?: "manual" | "swap" | "force_majeure" | "coverage";
}

export function useEditLog({ organizationId }: UseEditLogProps): UseEditLogResult {
  const [editLog, setEditLog] = useState<EditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchEditLog = useCallback(
    async (generationId?: string) => {
      if (!organizationId) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from("schedule_edit_log" as any)
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false })
          .limit(200);

        if (generationId) query = query.eq("generation_id", generationId);

        const { data, error } = await query;
        if (error) throw error;
        setEditLog((data as any[]) ?? []);
      } catch (err) {
        // Table may not exist yet — silently ignore
        setEditLog([]);
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId]
  );

  const logEdit = useCallback(
    async (params: LogEditParams) => {
      if (!organizationId) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("schedule_edit_log" as any)
          .insert({
            organization_id: organizationId,
            shift_id: params.shiftId || null,
            employee_id: params.employeeId,
            generation_id: params.generationId || null,
            shift_date: params.shiftDate,
            previous_code: params.previousCode,
            new_code: params.newCode,
            previous_start_time: params.previousStartTime || null,
            previous_end_time: params.previousEndTime || null,
            new_start_time: params.newStartTime || null,
            new_end_time: params.newEndTime || null,
            changed_by: user?.id || null,
            reason: params.reason || null,
            change_type: params.changeType || "manual",
            is_post_publication: true,
          } as any);

        if (error) throw error;

        // Add to local state for immediate UI feedback
        setEditLog((prev) => [
          {
            id: crypto.randomUUID(),
            shift_id: params.shiftId || null,
            employee_id: params.employeeId,
            generation_id: params.generationId || null,
            shift_date: params.shiftDate,
            previous_code: params.previousCode,
            new_code: params.newCode,
            previous_start_time: params.previousStartTime || null,
            previous_end_time: params.previousEndTime || null,
            new_start_time: params.newStartTime || null,
            new_end_time: params.newEndTime || null,
            changed_by: user?.id || "",
            reason: params.reason || null,
            change_type: params.changeType || "manual",
            is_post_publication: true,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error registrando cambio";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [organizationId, toast]
  );

  const isPostPubEdited = useCallback(
    (employeeId: string, date: string): boolean => {
      return editLog.some(
        (e) => e.employee_id === employeeId && e.shift_date === date && e.is_post_publication
      );
    },
    [editLog]
  );

  const postPubCount = editLog.filter((e) => e.is_post_publication).length;

  return {
    editLog,
    isLoading,
    postPubCount,
    logEdit,
    fetchEditLog,
    isPostPubEdited,
  };
}
