/**
 * useOccupancyData — Input manual + import de ocupación diaria
 *
 * Fase 1: Input manual (FOM escribe check-in/check-out por día)
 * Fase 2 (futura): Import CSV/PDF/Excel del PMS
 * Fase 3 (futura): API directa con PMS (Opera, Mews, Cloudbeds)
 *
 * Umbral de refuerzo configurable (default 40 movimientos).
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { DailyOccupancy } from "@/utils/engine";
import { DEFAULT_REINFORCEMENT_THRESHOLD } from "@/utils/engine";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface OccupancyRecord {
  id: string;
  organization_id: string;
  date: string;        // ISO YYYY-MM-DD
  check_ins: number;
  check_outs: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UseOccupancyDataProps {
  organizationId: string | undefined;
  year: number;
  month: number;
  reinforcementThreshold?: number;
}

interface UseOccupancyDataResult {
  occupancy: DailyOccupancy[];
  records: OccupancyRecord[];
  isLoading: boolean;
  error: string | null;
  upsertDay: (date: string, checkIns: number, checkOuts: number) => Promise<void>;
  upsertBatch: (entries: Array<{ date: string; checkIns: number; checkOuts: number }>) => Promise<void>;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useOccupancyData({
  organizationId,
  year,
  month,
  reinforcementThreshold = DEFAULT_REINFORCEMENT_THRESHOLD,
}: UseOccupancyDataProps): UseOccupancyDataResult {
  const [records, setRecords] = useState<OccupancyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOccupancy = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

      const { data, error: dbError } = await supabase
        .from("daily_occupancy" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (dbError) throw dbError;
      setRecords((data as any[]) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error cargando ocupación";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, year, month]);

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  // Transformar records a DailyOccupancy[] para el motor
  const occupancy: DailyOccupancy[] = records.map((r) => {
    const day = new Date(r.date).getDate();
    const totalMovements = r.check_ins + r.check_outs;
    return {
      day,
      checkIns: r.check_ins,
      checkOuts: r.check_outs,
      totalMovements,
      needsReinforcement: totalMovements >= reinforcementThreshold,
    };
  });

  const upsertDay = useCallback(
    async (date: string, checkIns: number, checkOuts: number) => {
      if (!organizationId) return;
      try {
        const { error: dbError } = await supabase
          .from("daily_occupancy" as any)
          .upsert({
            organization_id: organizationId,
            date,
            check_ins: checkIns,
            check_outs: checkOuts,
            updated_at: new Date().toISOString(),
          } as any, { onConflict: "organization_id,date" });
        if (dbError) throw dbError;
        fetchOccupancy();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error guardando ocupación";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [organizationId, fetchOccupancy, toast]
  );

  const upsertBatch = useCallback(
    async (entries: Array<{ date: string; checkIns: number; checkOuts: number }>) => {
      if (!organizationId) return;
      try {
        const rows = entries.map((e) => ({
          organization_id: organizationId,
          date: e.date,
          check_ins: e.checkIns,
          check_outs: e.checkOuts,
          updated_at: new Date().toISOString(),
        }));
        const { error: dbError } = await supabase
          .from("daily_occupancy" as any)
          .upsert(rows as any[], { onConflict: "organization_id,date" });
        if (dbError) throw dbError;
        toast({ title: `${entries.length} días de ocupación actualizados` });
        fetchOccupancy();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error guardando ocupación";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [organizationId, fetchOccupancy, toast]
  );

  return {
    occupancy,
    records,
    isLoading,
    error,
    upsertDay,
    upsertBatch,
    refresh: fetchOccupancy,
  };
}
