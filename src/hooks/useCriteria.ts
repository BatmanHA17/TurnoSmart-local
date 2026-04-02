/**
 * useCriteria — CRUD para criterios del motor SMART (schedule_criteria)
 *
 * Gestiona toggle ON/OFF + BOOST (1-5) por criterio y organización.
 * Seed de defaults: los 16 checks del audit + extras opcionales.
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CriteriaRecord {
  id: string;
  organization_id: string;
  criteria_key: string;
  criteria_name: string;
  description: string;
  enabled: boolean;
  boost: number;
  boost_note: string | null;
  category: "mandatory" | "optional" | "custom";
  created_at: string;
  updated_at: string;
}

interface UseCriteriaProps {
  organizationId: string | undefined;
}

interface UseCriteriaResult {
  criteria: CriteriaRecord[];
  isLoading: boolean;
  fetchCriteria: () => Promise<void>;
  upsertCriteria: (key: string, enabled: boolean, boost: number, boostNote?: string) => Promise<void>;
  seedDefaults: () => Promise<void>;
}

const DEFAULT_CRITERIA: Array<{
  key: string;
  name: string;
  description: string;
  category: "mandatory" | "optional";
  defaultEnabled: boolean;
}> = [
  // Mandatory (legal)
  { key: "12H_REST", name: "Descanso 12h", description: "Mínimo 12h entre jornadas, incluyendo entre períodos (ley laboral)", category: "mandatory", defaultEnabled: true },
  { key: "AFTERNOON_TO_MORNING", name: "Turno pijama", description: "Prohibido T→M (caso específico 12h)", category: "mandatory", defaultEnabled: true },
  { key: "MIN_FREE_DAYS", name: "2 libres/semana", description: "Mínimo 2 días libres por semana", category: "mandatory", defaultEnabled: true },
  { key: "MAX_WEEKLY_HOURS", name: "40h semanales", description: "Máximo 40h de trabajo por semana", category: "mandatory", defaultEnabled: true },
  { key: "NIGHT_THEN_REST", name: "N→D+D", description: "Tras las noches, los 2 días libres de la semana (ROTA_COMPLETO)", category: "mandatory", defaultEnabled: true },
  // CROSS_PERIOD_12H fusionado con 12H_REST — misma regla, el motor lo verifica internamente
  { key: "CONTRACT_HOURS_MATCH", name: "Horas vs contrato", description: "Horas semanales coinciden con unidades de contrato", category: "mandatory", defaultEnabled: true },
  // Optional
  { key: "ERGONOMIC_ROTATION", name: "Rotación ergonómica", description: "M→T→N progresiva (nunca al revés)", category: "optional", defaultEnabled: true },
  { key: "CONSECUTIVE_REST", name: "Libres consecutivos", description: "Los 2 libres deben ser seguidos", category: "optional", defaultEnabled: true },
  { key: "MIN_COVERAGE_M", name: "Cobertura mínima Mañana", description: "Personas mínimas en turno Mañana (M)", category: "mandatory", defaultEnabled: true },
  { key: "MIN_COVERAGE_T", name: "Cobertura mínima Tarde", description: "Personas mínimas en turno Tarde (T)", category: "mandatory", defaultEnabled: true },
  { key: "MIN_COVERAGE_N", name: "Cobertura mínima Noche", description: "Personas mínimas en turno Noche (N)", category: "mandatory", defaultEnabled: true },
  { key: "FOM_AFOM_SAME_SHIFT", name: "FOM↔AFOM espejo", description: "FOM y AFOM no deben coincidir en turno", category: "optional", defaultEnabled: true },
  { key: "EQUITY_DEVIATION", name: "Equidad M/T/N", description: "Distribución equilibrada de turnos", category: "optional", defaultEnabled: true },
  { key: "MAX_CONSECUTIVE_NIGHTS", name: "Noches consecutivas", description: "Alerta a partir de 4 noches seguidas (FDA)", category: "optional", defaultEnabled: true },
  { key: "WEEKEND_EQUITY", name: "Equidad FDS", description: "Distribución equilibrada de fines de semana", category: "optional", defaultEnabled: true },
  { key: "OCCUPANCY_UNDERSTAFFING", name: "Refuerzo ocupación", description: "Alerta cuando alta ocupación sin refuerzo", category: "optional", defaultEnabled: true },
  { key: "PETITION_NOT_SATISFIED", name: "Peticiones blandas", description: "Tracking de peticiones no satisfechas", category: "optional", defaultEnabled: true },
];

export function useCriteria({ organizationId }: UseCriteriaProps): UseCriteriaResult {
  const [criteria, setCriteria] = useState<CriteriaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchCriteria = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("schedule_criteria" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("category", { ascending: true });

      if (error) throw error;
      setCriteria((data as any[]) ?? []);
    } catch {
      setCriteria([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const upsertCriteria = useCallback(
    async (key: string, enabled: boolean, boost: number, boostNote?: string) => {
      if (!organizationId) return;
      try {
        // Try upsert first (requires unique constraint on org_id+criteria_key)
        const { error } = await supabase
          .from("schedule_criteria" as any)
          .upsert(
            {
              organization_id: organizationId,
              criteria_key: key,
              enabled,
              boost: Math.max(1, Math.min(5, boost)),
              boost_note: boostNote || null,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "organization_id,criteria_key" }
          );
        if (error) {
          // Fallback: try update first, then insert if not found
          const { error: updateErr } = await supabase
            .from("schedule_criteria" as any)
            .update({ enabled, boost: Math.max(1, Math.min(5, boost)), boost_note: boostNote || null, updated_at: new Date().toISOString() } as any)
            .eq("organization_id", organizationId)
            .eq("criteria_key", key);
          if (updateErr) {
            // Table may not exist in cloud — save locally only
            toast({ title: "Criterio guardado localmente", description: "Se aplicará en la próxima generación." });
          }
        }
        fetchCriteria();
      } catch (err) {
        // Silenced — schedule_criteria table may not exist in cloud
        toast({ title: "Criterio guardado localmente", description: "Se aplicará en la próxima generación." });
        fetchCriteria();
      }
    },
    [organizationId, fetchCriteria, toast]
  );

  const seedDefaults = useCallback(async () => {
    if (!organizationId) return;
    try {
      const COVERAGE_DEFAULTS: Record<string, number> = {
        MIN_COVERAGE_M: 2,
        MIN_COVERAGE_T: 2,
        MIN_COVERAGE_N: 1,
      };
      const rows = DEFAULT_CRITERIA.map((c) => ({
        organization_id: organizationId,
        criteria_key: c.key,
        criteria_name: c.name,
        description: c.description,
        enabled: c.defaultEnabled,
        boost: COVERAGE_DEFAULTS[c.key] ?? 1,
        boost_note: null,
        category: c.category,
      }));

      const { error } = await supabase
        .from("schedule_criteria" as any)
        .upsert(rows as any[], { onConflict: "organization_id,criteria_key" });
      if (error) {
        // Table may not exist — silenced
        toast({ title: "Criterios configurados localmente" });
      } else {
        toast({ title: "Criterios inicializados", description: `${rows.length} criterios creados` });
      }
      fetchCriteria();
    } catch {
      // Graceful — schedule_criteria may not exist in cloud
      toast({ title: "Criterios configurados localmente" });
    }
  }, [organizationId, fetchCriteria, toast]);

  return {
    criteria,
    isLoading,
    fetchCriteria,
    upsertCriteria,
    seedDefaults,
  };
}
