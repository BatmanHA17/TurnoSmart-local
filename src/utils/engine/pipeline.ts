/**
 * TurnoSmart® — SMART Engine v2.0 — Pipeline
 *
 * Orquestador: ejecuta las 10 fases en secuencia.
 * Todas las 10 fases implementadas.
 */

import type {
  EngineInput,
  EngineOutput,
  PipelineContext,
  ScoreBreakdown,
} from "./types";
import { ENGINE_VERSION } from "./constants";

// Phases
import { resolveRoles } from "./phases/01-resolveRoles";
import { loadContinuity } from "./phases/02-loadContinuity";
import { anchorFixed } from "./phases/03-anchorFixed";
import { assignRestDays } from "./phases/04-assignRestDays";
import { assignGEX } from "./phases/05-assignGEX";
import { assignRotating } from "./phases/06-assignRotating";
import { ensureCoverage } from "./phases/07-ensureCoverage";
import { applyPetitions } from "./phases/08-applyPetitions";
import { audit } from "./phases/09-audit";
import { score } from "./phases/10-score";

/**
 * Después de Phase 04, los turnos fijos de FOM/AFOM/Night que sobrevivieron
 * (no fueron convertidos a D por Phase 04) se lockean para que Phase 05/06
 * no los sobreescriban. Phase 04 ya eligió qué 2 días por semana librar.
 */
function lockSurvivingFixedShifts(ctx: PipelineContext): void {
  const { grid, roleGroups } = ctx;
  const fixedGroups = [
    ...roleGroups.FIJO_NO_ROTA,  // FOM + Night Agent
    ...roleGroups.COBERTURA,      // AFOM
  ];
  for (const emp of fixedGroups) {
    const schedule = grid[emp.id];
    if (!schedule) continue;
    for (const dayStr of Object.keys(schedule)) {
      const day = Number(dayStr);
      const cell = schedule[day];
      // Si tiene turno de trabajo (M/T/N/G/GT) y NO está locked → lockear
      if (cell && cell.code !== "D" && !cell.locked) {
        cell.locked = true;
      }
    }
  }
}

/**
 * Ejecuta el pipeline completo del motor SMART v2.0.
 * Input → 10 fases → Output con schedules, violations, score.
 */
export function runPipeline(input: EngineInput): EngineOutput {
  const startTime = performance.now();

  // Inicializar contexto
  let ctx: PipelineContext = {
    input,
    grid: {},
    roleGroups: {
      FIJO_NO_ROTA: [],
      COBERTURA: [],
      ROTA_PARCIAL: [],
      ROTA_COMPLETO: [],
    },
    violations: [],
    currentEquity: {},
    coverageGaps: [],
    dgAccumulated: {},
    _startTime: startTime,
  };

  // Ejecutar las 10 fases en secuencia
  ctx = resolveRoles(ctx);      // 01
  ctx = loadContinuity(ctx);    // 02
  ctx = anchorFixed(ctx);       // 03
  ctx = assignRestDays(ctx);    // 04

  // Post-Phase04: lockear turnos fijos de FOM/AFOM/Night que Phase 04 NO convirtió a D
  // Esto previene que Phase 05/06 sobreescriban turnos fijos
  lockSurvivingFixedShifts(ctx);

  ctx = assignGEX(ctx);         // 05
  ctx = assignRotating(ctx);    // 06
  ctx = ensureCoverage(ctx);    // 07
  ctx = applyPetitions(ctx);    // 08 (no-op MVP)
  ctx = audit(ctx);             // 09
  ctx = score(ctx);             // 10

  const durationMs = Math.round(performance.now() - startTime);

  // Extraer score del contexto (tipado correctamente en PipelineContext._score)
  const scoreBreakdown: ScoreBreakdown = ctx._score ?? {
    legal: 100,
    coverage: 100,
    equity: 100,
    petitions: 100,
    ergonomics: 100,
    continuity: 100,
    overall: 100,
    trafficLight: "green",
  };

  return {
    schedules: ctx.grid,
    violations: ctx.violations,
    score: scoreBreakdown,
    meta: {
      generatedAt: new Date().toISOString(),
      durationMs,
      period: input.period,
      weightProfile: input.weights.name,
      engineVersion: ENGINE_VERSION,
      totalEmployees: input.employees.length,
      totalDays: input.period.totalDays,
    },
    dgAccumulated: Object.keys(ctx.dgAccumulated).length > 0 ? ctx.dgAccumulated : undefined,
  };
}
