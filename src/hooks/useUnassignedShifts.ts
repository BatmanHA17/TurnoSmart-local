import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DateRange {
  start: string;
  end: string;
}

export interface UnassignedShiftInfo {
  id: string;
  date: string;
  type: string;
  name?: string;
  color?: string;
  startTime?: string;
  endTime?: string;
}

export interface NewUnassignedShift {
  shift_name: string;
  color?: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  break_duration?: number | null;
}

interface UseUnassignedShiftsResult {
  shifts: Record<string, UnassignedShiftInfo[]>;
  addUnassignedShift: (date: string, shiftData: NewUnassignedShift) => Promise<void>;
  removeUnassignedShift: (shiftId: string, date: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useUnassignedShifts = (
  orgId: string,
  dateRange: DateRange
): UseUnassignedShiftsResult => {
  const [shifts, setShifts] = useState<Record<string, UnassignedShiftInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !dateRange.start || !dateRange.end) return;

    let mounted = true;

    const fetchShifts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("calendar_shifts")
          .select("id, date, shift_name, color, start_time, end_time")
          .eq("org_id", orgId)
          .is("employee_id", null)
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);

        if (fetchError) throw fetchError;

        if (mounted && data) {
          const map: Record<string, UnassignedShiftInfo[]> = {};
          for (const row of data) {
            const dateKey = row.date as string;
            const info: UnassignedShiftInfo = {
              id: row.id as string,
              date: dateKey,
              type: row.start_time && row.end_time ? "work" : "absence",
              name: (row.shift_name as string) || undefined,
              color: (row.color as string) || "#fb923c",
              startTime: (row.start_time as string) || undefined,
              endTime: (row.end_time as string) || undefined,
            };
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(info);
          }
          setShifts(map);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error loading unassigned shifts");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchShifts();

    return () => {
      mounted = false;
    };
  }, [orgId, dateRange.start, dateRange.end]);

  const addUnassignedShift = useCallback(
    async (date: string, shiftData: NewUnassignedShift): Promise<void> => {
      if (!orgId) return;

      const newId = crypto.randomUUID();
      const newShift: UnassignedShiftInfo = {
        id: newId,
        date,
        type: shiftData.start_time && shiftData.end_time ? "work" : "absence",
        name: shiftData.shift_name || undefined,
        color: shiftData.color || "#fb923c",
        startTime: shiftData.start_time || undefined,
        endTime: shiftData.end_time || undefined,
      };

      // Optimistic update
      setShifts((prev) => ({
        ...prev,
        [date]: [...(prev[date] ?? []), newShift],
      }));

      const { error: insertError } = await supabase
        .from("calendar_shifts")
        .insert({
          id: newId,
          org_id: orgId,
          date,
          employee_id: null,
          shift_name: shiftData.shift_name,
          color: shiftData.color ?? "#fb923c",
          start_time: shiftData.start_time ?? null,
          end_time: shiftData.end_time ?? null,
          notes: shiftData.notes ?? null,
          break_duration: shiftData.break_duration ?? null,
        });

      if (insertError) {
        // Rollback optimistic update
        setShifts((prev) => {
          const updated = { ...prev };
          updated[date] = (updated[date] ?? []).filter((s) => s.id !== newId);
          if (updated[date].length === 0) delete updated[date];
          return updated;
        });
        setError(insertError.message);
        throw insertError;
      }
    },
    [orgId]
  );

  const removeUnassignedShift = useCallback(
    async (shiftId: string, date: string): Promise<void> => {
      // Optimistic update
      setShifts((prev) => {
        const updated = { ...prev };
        updated[date] = (updated[date] ?? []).filter((s) => s.id !== shiftId);
        if (updated[date].length === 0) delete updated[date];
        return updated;
      });

      const { error: deleteError } = await supabase
        .from("calendar_shifts")
        .delete()
        .eq("id", shiftId);

      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
    },
    []
  );

  return { shifts, addUnassignedShift, removeUnassignedShift, loading, error };
};
