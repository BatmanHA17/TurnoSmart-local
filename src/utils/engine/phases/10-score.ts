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

import type { PipelineContext, ScoreBreakdown, TrafficLight, AuditViolation } from "../types";

export function score(ctx: PipelineContext): PipelineContext {
  const { violations, input } = ctx;
  const weights = input.weights;

  const legal = calcLegal(violations);
  const coverage = calcCoverage(violations, input.period.totalDays, input.constraints.minCoveragePerShift);
  const equity = calcEquity(violations);
  const petitions = calcPetitions(violations, input.employees);
  const ergonomics = calcErgonomics(violations);
  const continuity = calcContinuity(violations);

  const overall = clamp(
    legal * weights.equity * 0 + // legal no se pondera, siempre pesa
    coverage * weights.coverage +
    equity * weights.equity +
    petitions * weights.petitions +
    ergonomics * weights.ergonomics +
    continuity * weights.continuity
  );

  // Legal siempre debe afectar: si hay críticos, el overall baja
  const legalPenalty = violations.filter((v) => v.severity === "critical").length * 5;
  const adjustedOverall = clamp(overall - legalPenalty);

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

  // Guardar en ctx para que pipeline lo recoja
  (ctx as any)._score = scoreBreakdown;

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
  return clamp(100 - maxDev * 10);
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
  return clamp(100 - inverseRotations * 5 - nonConsecutive * 3);
}

function calcContinuity(violations: AuditViolation[]): number {
  const brokenTransitions = violations.filter((v) => v.rule === "CONTINUITY_BROKEN").length;
  return clamp(100 - brokenTransitions * 10);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
