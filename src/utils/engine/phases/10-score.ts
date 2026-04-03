/**
 * Phase 10 — score
 *
 * Calcula score 0-100 por categoría + overall ponderado + semáforo.
 *
 * Fórmulas:
 *   Legal:       100 - (critical × 25) - (warnings × 5)
 *   Cobertura:   100 × (slots_cubiertos / total_slots)
 *   Equidad:     100 - (max_desviación_media × 10)
 *   Peticiones:  100 × (satisfechas / total)
 *   Ergonomía:   100 - (rotaciones_inversas × 5) - (libres_no_consecutivos × 3)
 *   Continuidad: 100 - (transiciones_bruscas × 10)
 *
 *   Overall:     media_ponderada(categorías, weight_profile)
 *   Semáforo:    ≥80 verde | ≥50 naranja | <50 rojo
 */

import type { PipelineContext, ScoreBreakdown, TrafficLight, AuditViolation, OptionalCriteria } from "../types";

/**
 * Mapeo criterio BOOST → categoría de score afectada.
 * Los IDs coinciden con criteria_key de schedule_criteria.
 */
const BOOST_CATEGORY_MAP: Record<string, keyof typeof CATEGORY_KEYS> = {
  ERGONOMIC_ROTATION: "ergonomics",
  CONSECUTIVE_REST: "ergonomics",
  MIN_COVERAGE: "coverage",
  OCCUPANCY_UNDERSTAFFING: "coverage",
  EQUITY_DEVIATION: "equity",
  WEEKEND_EQUITY: "equity",
  PETITION_NOT_SATISFIED: "petitions",
};

const CATEGORY_KEYS = {
  legal: true,
  coverage: true,
  equity: true,
  petitions: true,
  ergonomics: true,
  continuity: true,
} as const;

export function score(ctx: PipelineContext): PipelineContext {
  const { violations, input } = ctx;
  const baseWeights = { ...input.weights };
  const boostCriteria = input.constraints.optionalCriteria ?? [];

  // Aplicar BOOST: cada criterio con boost > 1 amplifica su categoría
  const adjustedWeights = applyBoost(baseWeights, boostCriteria);

  const legal = calcLegal(violations);
  const coverage = calcCoverage(violations, input.period.totalDays, input.constraints.minCoveragePerShift);
  const equity = calcEquity(violations);
  const petitions = calcPetitions(violations, input.employees);
  const ergonomics = calcErgonomics(violations);
  const continuity = calcContinuity(violations);

  const overall = clamp(
    legal * adjustedWeights.legal +
    coverage * adjustedWeights.coverage +
    equity * adjustedWeights.equity +
    petitions * adjustedWeights.petitions +
    ergonomics * adjustedWeights.ergonomics +
    continuity * adjustedWeights.continuity
  );

  const adjustedOverall = overall;

  const trafficLight: TrafficLight =
    adjustedOverall >= 80 ? "green" :
    adjustedOverall >= 50 ? "orange" :
    "red";

  const scoreBreakdown: ScoreBreakdown = {
    legal,
    coverage,
    equity,
    petitions,
    ergonomics,
    continuity,
    overall: adjustedOverall,
    trafficLight,
  };

  // Guardar en ctx para que pipeline lo recoja (tipado en PipelineContext._score)
  ctx._score = scoreBreakdown;

  return ctx;
}

// ---------------------------------------------------------------------------
// CATEGORY CALCULATORS
// ---------------------------------------------------------------------------

function calcLegal(violations: AuditViolation[]): number {
  const criticals = violations.filter((v) => v.category === "legal" && v.severity === "critical").length;
  const warnings = violations.filter((v) => v.category === "legal" && v.severity === "warning").length;
  return clamp(100 - criticals * 25 - warnings * 5);
}

function calcCoverage(violations: AuditViolation[], totalDays: number, minCoverage: number): number {
  const gaps = violations.filter((v) => v.rule === "MIN_COVERAGE").length;
  const totalSlots = totalDays * 3; // M + T + N por día
  const covered = totalSlots - gaps;
  return clamp((covered / totalSlots) * 100);
}

function calcEquity(violations: AuditViolation[]): number {
  const deviations = violations.filter((v) => v.rule === "EQUITY_DEVIATION");
  if (deviations.length === 0) return 100;
  // Extraer desviación máxima del description
  let maxDev = 0;
  for (const v of deviations) {
    const match = v.description.match(/±(\d+\.?\d*)/);
    if (match) maxDev = Math.max(maxDev, parseFloat(match[1]));
  }
  // DT-2: Softened penalty — ±3 tolerance before significant impact
  // Old: ×10 (±5 = -50 points, too harsh)
  // New: ×5 with 3h grace (±3 = 0 penalty, ±5 = -10, ±8 = -25)
  const effectiveDev = Math.max(0, maxDev - 3);
  return clamp(100 - effectiveDev * 5);
}

function calcPetitions(
  violations: AuditViolation[],
  employees: { petitions: Array<{ type: string; status: string; days: number[] }> }[]
): number {
  let totalB = 0;
  let unsatisfied = 0;
  for (const emp of employees) {
    for (const p of emp.petitions) {
      if (p.type === "B" && p.status === "approved") totalB += p.days.length;
    }
  }
  unsatisfied = violations.filter((v) => v.rule === "PETITION_NOT_SATISFIED").length;
  if (totalB === 0) return 100;
  return clamp(((totalB - unsatisfied) / totalB) * 100);
}

function calcErgonomics(violations: AuditViolation[]): number {
  const inverseRotations = violations.filter((v) => v.rule === "ERGONOMIC_ROTATION").length;
  const nonConsecutive = violations.filter((v) => v.rule === "CONSECUTIVE_REST").length;
  // DT-2: Softened — cap at -40 max, reduce per-violation impact
  return clamp(100 - Math.min(inverseRotations * 3, 30) - Math.min(nonConsecutive * 2, 10));
}

function calcContinuity(violations: AuditViolation[]): number {
  const brokenTransitions = violations.filter((v) => v.rule === "CONTINUITY_BROKEN").length;
  // DT-2: Softened — cap at -30 max (3 broken transitions = -30, not -30+)
  return clamp(100 - Math.min(brokenTransitions * 8, 30));
}

/**
 * Aplica BOOST a los pesos. Cada criterio con boost > 1 amplifica su categoría:
 *   boost=1 → sin cambio | boost=3 → 1.4× | boost=5 → 1.8×
 * Luego re-normaliza para que sumen 1.0
 */
function applyBoost(
  weights: Record<string, number>,
  criteria: OptionalCriteria[]
): Record<string, number> {
  if (criteria.length === 0) return weights;

  const w = { ...weights };

  for (const c of criteria) {
    if (!c.enabled || c.boost <= 1) continue;
    const category = BOOST_CATEGORY_MAP[c.id];
    if (!category || !(category in w)) continue;

    // boost=5 → multiplier=1.8, boost=3 → 1.4, boost=2 → 1.2
    const multiplier = 1 + (c.boost - 1) * 0.2;
    w[category] *= multiplier;
  }

  // Re-normalizar para que sumen 1.0
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (const key of Object.keys(w)) {
      w[key] /= sum;
    }
  }

  return w;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
