/**
 * Service: org_engine_config — CRUD for per-org engine configuration
 */

import { supabase } from "@/integrations/supabase/client";
import type { ShiftTimeConfig, RoleConfigOverride } from "@/utils/engine/types";
import { getSectorTemplate } from "@/data/sectorEngineTemplates";

export interface OrgEngineConfig {
  id?: string;
  org_id: string;
  shifts: Record<string, ShiftTimeConfig>;
  roles: RoleConfigOverride[];
  coverage: { M: number; T: number; N: number };
  weekly_hours: number;
  labor_law_preset: string;
  sector_base: string;
}

/** Load org engine config. Returns null if none exists. */
export async function loadOrgEngineConfig(orgId: string): Promise<OrgEngineConfig | null> {
  const { data, error } = await supabase
    .from("org_engine_config" as any)
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    org_id: data.org_id,
    shifts: (data.shifts ?? {}) as Record<string, ShiftTimeConfig>,
    roles: (data.roles ?? []) as RoleConfigOverride[],
    coverage: (data.coverage ?? { M: 2, T: 2, N: 1 }) as { M: number; T: number; N: number },
    weekly_hours: data.weekly_hours ?? 40,
    labor_law_preset: data.labor_law_preset ?? "spain_hospitality",
    sector_base: data.sector_base ?? "hospitality",
  };
}

/** Save (upsert) org engine config. */
export async function saveOrgEngineConfig(config: OrgEngineConfig): Promise<void> {
  const row = {
    org_id: config.org_id,
    shifts: config.shifts,
    roles: config.roles,
    coverage: config.coverage,
    weekly_hours: config.weekly_hours,
    labor_law_preset: config.labor_law_preset,
    sector_base: config.sector_base,
    updated_at: new Date().toISOString(),
  };

  if (config.id) {
    await supabase
      .from("org_engine_config" as any)
      .update(row)
      .eq("id", config.id);
  } else {
    await supabase
      .from("org_engine_config" as any)
      .insert(row);
  }
}

/** Initialize config from a sector template (first-time setup). */
export function configFromTemplate(orgId: string, sectorId: string): OrgEngineConfig {
  const tpl = getSectorTemplate(sectorId);
  return {
    org_id: orgId,
    shifts: { ...tpl.shifts },
    roles: [...tpl.roles],
    coverage: { ...tpl.defaultCoverage },
    weekly_hours: tpl.defaultWeeklyHours,
    labor_law_preset: tpl.laborLawPreset,
    sector_base: tpl.id,
  };
}
