/**
 * TurnoSmart® — SMART Engine v3.0 — Solver
 *
 * Main entry point. Replaces the v2 10-phase pipeline.
 *
 * Flow:
 * 1. Build initial solution (constructive heuristic)
 * 2. Optimize (local search)
 * 3. Validate (post-generation checks)
 * 4. Score
 *
 * Called 3× with different weight profiles → 3 alternatives.
 */

import type {
  EngineInput, EngineOutput, ScoreBreakdown, AuditViolation,
  DayAssignmentV2, TrafficLight,
} from "../types";
import type { SolverState, SolverConfig } from "./solverTypes";
import { DEFAULT_SOLVER_CONFIG } from "./solverTypes";
import { buildInitialSolution } from "./constructive";
import { optimizeSolution } from "./optimizer";
import { ALL_VALIDATION_CHECKS } from "./validationChecks";
import { ALL_HARD_CONSTRAINTS } from "./hardConstraints";
import { ALL_SOFT_CONSTRAINTS } from "./softConstraints";
import { isWorkingShift, getWeeks, weeklyHours, countShiftOnDay } from "../helpers";

const ENGINE_VERSION = "3.0";

// ---------------------------------------------------------------------------
// SCORING
// ---------------------------------------------------------------------------

function computeScore(
  state: SolverState,
  violations: AuditViolation[],
): ScoreBreakdown {
  const { input } = state;

  // Legal: 100 - penalties
  const criticalViolations = violations.filter(v => v.severity === "critical").length;
  const warningViolations = violations.filter(v => v.severity === "warning").length;
  const legal = Math.max(0, 100 - criticalViolations * 25 - warningViolations * 5);

  // Coverage: slots covered / total slots needed
  const totalDays = input.period.totalDays;
  const minCov = input.constraints.minCoveragePerShift;
  let coveredSlots = 0;
  let totalSlots = 0;
  for (let d = 1; d <= totalDays; d++) {
    for (const shift of ["M", "T", "N"] as const) {
      const needed = minCov[shift] ?? 1;
      const actual = countShiftOnDay(state.grid as any, d, shift);
      totalSlots += needed;
      coveredSlots += Math.min(actual, needed);
    }
  }
  const coverage = totalSlots > 0 ? Math.round((coveredSlots / totalSlots) * 100) : 100;

  // Equity: deviation between employees
  const rotaEmps = input.employees.filter(e => e.rotationType === "ROTA_COMPLETO");
  let equity = 100;
  if (rotaEmps.length >= 2) {
    for (const shift of ["M", "T", "N"] as const) {
      const counts = rotaEmps.map(e => {
        let c = 0;
        for (let d = 1; d <= totalDays; d++) {
          if (state.grid[e.id][d]?.code === shift) c++;
        }
        return c;
      });
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const deviation = max - min;
      if (deviation > 3) equity -= (deviation - 3) * 10;
    }
  }
  equity = Math.max(0, Math.min(100, equity));

  // Petitions: satisfied / total
  let petSatisfied = 0;
  let petTotal = 0;
  for (const emp of input.employees) {
    for (const p of emp.petitions) {
      if (p.type !== "B") continue;
      petTotal++;
      for (const day of p.days) {
        const code = state.grid[emp.id]?.[day]?.code;
        if (p.requestedShift && code === p.requestedShift) petSatisfied++;
        else if (p.avoidShift && code !== p.avoidShift) petSatisfied++;
      }
    }
  }
  const petitions = petTotal > 0 ? Math.round((petSatisfied / petTotal) * 100) : 100;

  // Ergonomics: backward rotations penalty
  let ergoScore = 100;
  for (const emp of rotaEmps) {
    for (let d = 1; d < totalDays; d++) {
      const today = state.grid[emp.id][d]?.code;
      const tomorrow = state.grid[emp.id][d + 1]?.code;
      if (today === "N" && tomorrow === "M") ergoScore -= 10;
      else if (today === "T" && tomorrow === "M" && tomorrow !== "11x19") ergoScore -= 5;
    }
  }
  ergoScore = Math.max(0, Math.min(100, ergoScore));

  // Continuity: check first day transition
  let continuity = 100;
  // Simple: penalize if we had to make abrupt changes
  const contViolations = violations.filter(v => v.rule === "CROSS_PERIOD").length;
  continuity = Math.max(0, 100 - contViolations * 15);

  // Overall: weighted average
  const w = input.weights;
  const overall = Math.round(
    legal * w.legal +
    coverage * w.coverage +
    equity * w.equity +
    petitions * w.petitions +
    ergoScore * w.ergonomics +
    continuity * w.continuity
  );

  const trafficLight: TrafficLight = overall >= 80 ? "green" : overall >= 50 ? "orange" : "red";

  return {
    legal,
    coverage,
    equity,
    petitions,
    ergonomics: ergoScore,
    continuity,
    overall,
    trafficLight,
  };
}

// ---------------------------------------------------------------------------
// CONVERT SOLVER STATE → ENGINE OUTPUT
// ---------------------------------------------------------------------------

function stateToOutput(
  state: SolverState,
  violations: AuditViolation[],
  score: ScoreBreakdown,
  startTime: number,
): EngineOutput {
  const schedules: Record<string, Record<number, DayAssignmentV2>> = {};

  for (const emp of state.input.employees) {
    schedules[emp.id] = {};
    for (let d = 1; d <= state.input.period.totalDays; d++) {
      const cell = state.grid[emp.id][d];
      schedules[emp.id][d] = {
        code: cell.code,
        startTime: cell.startTime,
        endTime: cell.endTime,
        hours: cell.hours,
        source: cell.source,
        forced: false,
        locked: cell.locked,
        conflicts: [],
      };
    }
  }

  // DG accumulated
  const dgAccumulated: Record<string, number> = {};
  for (const emp of state.input.employees) {
    if (emp.role !== "FOM") continue;
    let dg = 0;
    for (let d = 1; d <= state.input.period.totalDays; d++) {
      if (state.grid[emp.id][d]?.code === "G" || state.grid[emp.id][d]?.code === "GT") {
        dg++;
      }
    }
    if (dg > 0) dgAccumulated[emp.id] = dg;
  }

  return {
    schedules,
    violations,
    score,
    meta: {
      generatedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - startTime),
      period: state.input.period,
      weightProfile: state.input.weights.name,
      engineVersion: ENGINE_VERSION,
      totalEmployees: state.input.employees.length,
      totalDays: state.input.period.totalDays,
    },
    dgAccumulated: Object.keys(dgAccumulated).length > 0 ? dgAccumulated : undefined,
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Run the SMART Engine v3 solver.
 * Returns an EngineOutput compatible with the v2 pipeline output.
 */
export function runSolverV3(
  input: EngineInput,
  config: SolverConfig = DEFAULT_SOLVER_CONFIG,
): EngineOutput {
  const startTime = performance.now();

  // 1. Build initial solution
  const state = buildInitialSolution(input, ALL_HARD_CONSTRAINTS, ALL_SOFT_CONSTRAINTS);

  // 2. Optimize with local search
  optimizeSolution(state, config, ALL_HARD_CONSTRAINTS, ALL_SOFT_CONSTRAINTS);

  // 3. Validate
  const violations: AuditViolation[] = [];
  for (const check of ALL_VALIDATION_CHECKS) {
    violations.push(...check.validate(state));
  }

  // 4. Score
  const score = computeScore(state, violations);

  // 5. Convert to output
  return stateToOutput(state, violations, score, startTime);
}
