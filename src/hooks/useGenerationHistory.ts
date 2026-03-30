/**
 * useGenerationHistory — Historial de generaciones de cuadrantes
 *
 * Permite:
 * - Guardar una generación al publicar
 * - Listar generaciones anteriores (para continuidad)
 * - Cargar equity snapshot del período anterior
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  GenerationResult,
  ScoreBreakdown,
  EquityBalance,
  ContinuityHistory,
  DayAssignmentV2,
} from "@/utils/engine";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface GenerationRecord {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  total_days: number;
  total_weeks: number;
  chosen_alternative: string;
  chosen_score: number;
  traffic_light: string;
  score_breakdown: ScoreBreakdown;
  alternatives_summary: Array<{ label: string; score: number }>;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  generated_at: string;
  engine_version: string;
  duration_ms: number;
  total_employees: number;
}

interface UseGenerationHistoryProps {
  organizationId: string | undefined;
}

interface UseGenerationHistoryResult {
  generations: GenerationRecord[];
  isLoading: boolean;
  saveGeneration: (
    result: GenerationResult,
    chosenIndex: number,
    periodStart: string,
    periodEnd: string
  ) => Promise<string | null>;
  publishGeneration: (generationId: string) => Promise<void>;
  loadContinuityFromPrevious: (periodStart: string) => Promise<ContinuityHistory | undefined>;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useGenerationHistory({
  organizationId,
}: UseGenerationHistoryProps): UseGenerationHistoryResult {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchGenerations = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("schedule_generations" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("generated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setGenerations((data as any[]) ?? []);
    } catch (err) {
      console.error("Error loading generations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const saveGeneration = useCallback(
    async (
      result: GenerationResult,
      chosenIndex: number,
      periodStart: string,
      periodEnd: string
    ): Promise<string | null> => {
      if (!organizationId) return null;
      try {
        const chosen = result.alternatives[chosenIndex];
        const record = {
          organization_id: organizationId,
          period_start: periodStart,
          period_end: periodEnd,
          total_days: chosen.output.meta.totalDays,
          total_weeks: Math.ceil(chosen.output.meta.totalDays / 7),
          chosen_alternative: chosen.weights.name,
          chosen_score: chosen.output.score.overall,
          traffic_light: chosen.output.score.trafficLight,
          score_breakdown: chosen.output.score,
          alternatives_summary: result.alternatives.map((a) => ({
            label: a.label,
            score: a.output.score.overall,
          })),
          status: "draft",
          engine_version: chosen.output.meta.engineVersion,
          duration_ms: chosen.output.meta.durationMs,
          total_employees: chosen.output.meta.totalEmployees,
          generated_at: result.generatedAt,
        };

        const { data, error } = await supabase
          .from("schedule_generations" as any)
          .insert(record as any)
          .select("id")
          .single();
        if (error) throw error;
        fetchGenerations();
        return (data as any)?.id ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error guardando generación";
        toast({ title: "Error", description: msg, variant: "destructive" });
        return null;
      }
    },
    [organizationId, fetchGenerations, toast]
  );

  const publishGeneration = useCallback(
    async (generationId: string) => {
      try {
        const { error } = await supabase
          .from("schedule_generations" as any)
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          } as any)
          .eq("id", generationId);
        if (error) throw error;
        toast({ title: "Cuadrante publicado" });
        fetchGenerations();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error publicando";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [fetchGenerations, toast]
  );

  const loadContinuityFromPrevious = useCallback(
    async (periodStart: string): Promise<ContinuityHistory | undefined> => {
      if (!organizationId) return undefined;
      try {
        // Buscar la generación publicada más reciente anterior a periodStart
        const { data, error } = await supabase
          .from("schedule_generations" as any)
          .select("id, period_start, period_end")
          .eq("organization_id", organizationId)
          .eq("status", "published")
          .lt("period_start", periodStart)
          .order("period_start", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return undefined;

        // Cargar equity snapshot del período anterior
        const { data: equityData } = await supabase
          .from("employee_equity" as any)
          .select("*")
          .eq("organization_id", organizationId)
          .eq("generation_id", (data as any).id);

        if (!equityData) return undefined;

        const equitySnapshot: Record<string, EquityBalance> = {};
        for (const row of equityData as any[]) {
          equitySnapshot[row.employee_id] = {
            morningCount: row.morning_count,
            afternoonCount: row.afternoon_count,
            nightCount: row.night_count,
            weekendWorkedCount: row.weekend_worked_count,
            longWeekendCount: row.long_weekend_count,
            holidayWorkedCount: row.holiday_worked_count,
            petitionSatisfactionRatio: row.petition_satisfaction_ratio,
            nightCoverageCount: row.night_coverage_count,
          };
        }

        return {
          lastWeek: {}, // TODO: cargar últimos 7 días del período anterior desde calendar_shifts
          equitySnapshot,
          previousGenerationId: (data as any).id,
        };
      } catch {
        return undefined;
      }
    },
    [organizationId]
  );

  return {
    generations,
    isLoading,
    saveGeneration,
    publishGeneration,
    loadContinuityFromPrevious,
    refresh: fetchGenerations,
  };
}
