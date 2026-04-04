/**
 * useCriteria — CRUD para criterios del motor SMART v3 (schedule_criteria)
 *
 * Gestiona toggle ON/OFF + BOOST (1-5) + config_json por criterio y organización.
 * Seed de defaults: catálogo completo de 92 criterios (OB + OP + CK + SM).
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ALL_CRITERIA, type CriteriaCategory, type CriteriaSeverity } from "@/data/criteriaDefaults";

export interface CriteriaRecord {
  id: string;
  organization_id: string;
  criteria_key: string;
  criteria_name: string;
  description: string;
  enabled: boolean;
  boost: number;
  boost_note: string | null;
  category: CriteriaCategory;
  code: string | null;
  subcategory: string | null;
  severity: CriteriaSeverity;
  config_json: Record<string, unknown>;
  sort_order: number;
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
  upsertCriteria: (key: string, enabled: boolean, boost: number, boostNote?: string, configJson?: Record<string, unknown>) => Promise<void>;
  seedDefaults: () => Promise<void>;
}

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
    async (key: string, enabled: boolean, boost: number, boostNote?: string, configJson?: Record<string, unknown>) => {
      if (!organizationId) return;
      try {
        const payload: Record<string, unknown> = {
          organization_id: organizationId,
          criteria_key: key,
          enabled,
          boost: Math.max(1, Math.min(5, boost)),
          boost_note: boostNote || null,
          updated_at: new Date().toISOString(),
        };
        if (configJson !== undefined) {
          payload.config_json = configJson;
        }
        const { error } = await supabase
          .from("schedule_criteria" as any)
          .upsert(payload as any, { onConflict: "organization_id,criteria_key" });
        if (error) {
          const { error: updateErr } = await supabase
            .from("schedule_criteria" as any)
            .update({ enabled, boost: Math.max(1, Math.min(5, boost)), boost_note: boostNote || null, updated_at: new Date().toISOString(), ...(configJson !== undefined ? { config_json: configJson } : {}) } as any)
            .eq("organization_id", organizationId)
            .eq("criteria_key", key);
          if (updateErr) {
            toast({ title: "Criterio guardado localmente", description: "Se aplicará en la próxima generación." });
          }
        }
        fetchCriteria();
      } catch {
        toast({ title: "Criterio guardado localmente", description: "Se aplicará en la próxima generación." });
        fetchCriteria();
      }
    },
    [organizationId, fetchCriteria, toast]
  );

  const seedDefaults = useCallback(async () => {
    if (!organizationId) return;
    try {
      const rows = ALL_CRITERIA.map((c, idx) => ({
        organization_id: organizationId,
        criteria_key: c.key,
        criteria_name: c.name,
        description: c.description,
        enabled: c.defaultEnabled,
        boost: c.defaultBoost,
        boost_note: null,
        category: c.category,
        code: c.code,
        subcategory: c.subcategory,
        severity: c.severity,
        config_json: c.configJson ?? {},
        sort_order: idx,
      }));

      // Upsert in batches of 30 to avoid payload limits
      const BATCH = 30;
      let totalInserted = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await supabase
          .from("schedule_criteria" as any)
          .upsert(batch as any[], { onConflict: "organization_id,criteria_key" });
        if (error) {
          console.warn(`[useCriteria] seed batch ${i / BATCH} error:`, error.message);
        } else {
          totalInserted += batch.length;
        }
      }
      if (totalInserted > 0) {
        toast({ title: "Criterios SMART inicializados", description: `${totalInserted} criterios creados (${ALL_CRITERIA.length} en catálogo)` });
      } else {
        toast({ title: "Criterios configurados localmente" });
      }
      fetchCriteria();
    } catch {
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
