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
  { key: "12H_REST", name: "Descanso 12h", description: "Mínimo 12h entre jornadas (ley laboral)", category: "mandatory", defaultEnabled: true },
  { key: "AFTERNOON_TO_MORNING", name: "Turno pijama", description: "Prohibido T→M (caso específico 12h)", category: "mandatory", defaultEnabled: true },
  { key: "MIN_FREE_DAYS", name: "2 libres/semana", description: "Mínimo 2 días libres por semana", category: "mandatory", defaultEnabled: true },
  { key: "MAX_WEEKLY_HOURS", name: "40h semanales", description: "Máximo 40h de trabajo por semana", category: "mandatory", defaultEnabled: true },
  { key: "NIGHT_THEN_REST", name: "N→libre", description: "Tras noche, siguiente día libre (ROTA_COMPLETO)", category: "mandatory", defaultEnabled: true },
  { key: "CROSS_PERIOD_12H", name: "12h cross-período", description: "Verificar 12h entre último turno anterior y día 1", category: "mandatory", defaultEnabled: true },
  { key: "CONTRACT_HOURS_MATCH", name: "Horas vs contrato", description: "Horas semanales coinciden con unidades de contrato", category: "mandatory", defaultEnabled: true },
  // Optional
  { key: "ERGONOMIC_ROTATION", name: "Rotación ergonómica", description: "M→T→N progresiva (nunca al revés)", category: "optional", defaultEnabled: true },
  { key: "CONSECUTIVE_REST", name: "Libres consecutivos", description: "Los 2 libres deben ser seguidos", category: "optional", defaultEnabled: true },
  { key: "MIN_COVERAGE", name: "Cobertura mínima", description: "Al menos 1 persona por turno M/T/N", category: "optional", defaultEnabled: true },
  { key: "FOM_AFOM_SAME_SHIFT", name: "FOM↔AFOM espejo", description: "FOM y AFOM no deben coincidir en turno", category: "optional", defaultEnabled: true },
  { key: "EQUITY_DEVIATION", name: "Equidad M/T/N", description: "Distribución equilibrada de turnos", category: "optional", defaultEnabled: true },
  { key: "MAX_CONSECUTIVE_NIGHTS", name: "Noches consecutivas", description: "Alerta a partir de 3 noches seguidas (FDA)", category: "optional", defaultEnabled: true },
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
        if (error) throw error;
        fetchCriteria();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error guardando criterio";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [organizationId, fetchCriteria, toast]
  );

  const seedDefaults = useCallback(async () => {
    if (!organizationId) return;
    try {
      const rows = DEFAULT_CRITERIA.map((c) => ({
        organization_id: organizationId,
        criteria_key: c.key,
        criteria_name: c.name,
        description: c.description,
        enabled: c.defaultEnabled,
        boost: 1,
        boost_note: null,
        category: c.category,
      }));

      const { error } = await supabase
        .from("schedule_criteria" as any)
        .upsert(rows as any[], { onConflict: "organization_id,criteria_key" });
      if (error) throw error;
      toast({ title: "Criterios inicializados", description: `${rows.length} criterios creados` });
      fetchCriteria();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error seedeando criterios";
      toast({ title: "Error", description: msg, variant: "destructive" });
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
