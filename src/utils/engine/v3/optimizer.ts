/**
 * TurnoSmart® — SMART Engine v3.0 — Local Search Optimizer
 *
 * Improves an initial solution by iteratively trying swap moves.
 * Uses greedy hill-climbing: accept a move if it improves total soft score.
 *
 * Move types:
 * 1. Shift swap: change one employee's shift on one day
 * 2. Day swap: exchange shifts between two employees on the same day
 */

import type {
  SolverState, SolverCell, SolverConfig, HardConstraint, SoftConstraint,
  MutableEquity,
} from "./solverTypes";
import { DEFAULT_SOLVER_CONFIG } from "./solverTypes";
import { ALL_HARD_CONSTRAINTS } from "./hardConstraints";
import { ALL_SOFT_CONSTRAINTS } from "./softConstraints";
import { SHIFT_TIMES, ROLE_CONFIGS } from "../constants";
import { isWorkingShift, isPeriodWeekend } from "../helpers";

// ---------------------------------------------------------------------------
// SCORE EVALUATION
// ---------------------------------------------------------------------------

/** Calculate total soft score for the entire grid */
function totalScore(
  state: SolverState,
  softConstraints: SoftConstraint[],
): number {
  let total = 0;
  const totalDays = state.input.period.totalDays;

  for (const emp of state.input.employees) {
    for (let d = 1; d <= totalDays; d++) {
      const code = state.grid[emp.id][d]?.code ?? "D";
      for (const sc of softConstraints) {
        total += sc.score(state, emp.id, d, code) * sc.weight;
      }
    }
  }
  return total;
}

/** Calculate soft score delta for changing one cell */
function scoreDelta(
  state: SolverState,
  empId: string,
  day: number,
  oldCode: string,
  newCode: string,
  softConstraints: SoftConstraint[],
): number {
  let delta = 0;
  for (const sc of softConstraints) {
    const oldScore = sc.score(state, empId, day, oldCode) * sc.weight;
    const newScore = sc.score(state, empId, day, newCode) * sc.weight;
    delta += newScore - oldScore;
  }
  return delta;
}

// ---------------------------------------------------------------------------
// MOVE: Change shift
// ---------------------------------------------------------------------------

function tryShiftChange(
  state: SolverState,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[],
): boolean {
  const emps = state.input.employees.filter(
    e => e.rotationType === "ROTA_COMPLETO"
  );
  if (emps.length === 0) return false;

  const totalDays = state.input.period.totalDays;

  // Pick random employee and day
  const emp = emps[Math.floor(Math.random() * emps.length)];
  const day = 1 + Math.floor(Math.random() * totalDays);
  const cell = state.grid[emp.id][day];

  if (cell.locked) return false;
  if (!isWorkingShift(cell.code) && cell.code !== "D") return false;

  // Try alternative shifts
  const config = ROLE_CONFIGS[emp.role];
  if (!config) return false;
  const candidates = config.allowedShifts.filter(s => isWorkingShift(s) && s !== cell.code);
  if (candidates.length === 0) return false;

  // Evaluate each candidate
  let bestDelta = 0;
  let bestCode: string | null = null;

  for (const code of candidates) {
    const feasible = hardConstraints.every(hc => hc.isFeasible(state, emp.id, day, code));
    if (!feasible) continue;

    const delta = scoreDelta(state, emp.id, day, cell.code, code, softConstraints);
    if (delta > bestDelta) {
      bestDelta = delta;
      bestCode = code;
    }
  }

  if (bestCode) {
    applyChange(state, emp.id, day, bestCode);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// MOVE: Swap between two employees
// ---------------------------------------------------------------------------

function tryDaySwap(
  state: SolverState,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[],
): boolean {
  const emps = state.input.employees.filter(
    e => e.rotationType === "ROTA_COMPLETO"
  );
  if (emps.length < 2) return false;

  const totalDays = state.input.period.totalDays;

  // Pick random pair
  const i = Math.floor(Math.random() * emps.length);
  let j = Math.floor(Math.random() * (emps.length - 1));
  if (j >= i) j++;

  const empA = emps[i];
  const empB = emps[j];
  const day = 1 + Math.floor(Math.random() * totalDays);

  const cellA = state.grid[empA.id][day];
  const cellB = state.grid[empB.id][day];

  if (cellA.locked || cellB.locked) return false;
  if (cellA.code === cellB.code) return false; // no point swapping same shift

  // Check feasibility of swap
  const aCanTakeB = hardConstraints.every(hc => hc.isFeasible(state, empA.id, day, cellB.code));
  const bCanTakeA = hardConstraints.every(hc => hc.isFeasible(state, empB.id, day, cellA.code));

  if (!aCanTakeB || !bCanTakeA) return false;

  // Calculate delta
  const deltaA = scoreDelta(state, empA.id, day, cellA.code, cellB.code, softConstraints);
  const deltaB = scoreDelta(state, empB.id, day, cellB.code, cellA.code, softConstraints);
  const totalDelta = deltaA + deltaB;

  if (totalDelta > 0) {
    applyChange(state, empA.id, day, cellB.code);
    applyChange(state, empB.id, day, cellA.code);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// APPLY CHANGE (update cell + equity)
// ---------------------------------------------------------------------------

function applyChange(state: SolverState, empId: string, day: number, newCode: string): void {
  const cell = state.grid[empId][day];
  const oldCode = cell.code;
  const eq = state.equity.get(empId);

  // Decrement old
  if (eq && (oldCode === "M" || oldCode === "T" || oldCode === "N")) {
    eq[oldCode]--;
  }
  if (eq && isWorkingShift(oldCode) && isPeriodWeekend(state.input.period.startDate, day)) {
    eq.weekendWorked--;
  }

  // Update cell
  const shift = SHIFT_TIMES[newCode];
  cell.code = newCode;
  cell.startTime = shift?.startTime ?? "00:00";
  cell.endTime = shift?.endTime ?? "00:00";
  cell.hours = shift?.hours ?? 0;

  // Increment new
  if (eq && (newCode === "M" || newCode === "T" || newCode === "N")) {
    eq[newCode]++;
  }
  if (eq && isWorkingShift(newCode) && isPeriodWeekend(state.input.period.startDate, day)) {
    eq.weekendWorked++;
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: Run local search
// ---------------------------------------------------------------------------

export function optimizeSolution(
  state: SolverState,
  config: SolverConfig = DEFAULT_SOLVER_CONFIG,
  hardConstraints: HardConstraint[] = ALL_HARD_CONSTRAINTS,
  softConstraints: SoftConstraint[] = ALL_SOFT_CONSTRAINTS,
): SolverState {
  let stagnation = 0;

  for (let iter = 0; iter < config.maxIterations; iter++) {
    // Alternate between shift changes and day swaps
    const improved = iter % 2 === 0
      ? tryShiftChange(state, hardConstraints, softConstraints)
      : tryDaySwap(state, hardConstraints, softConstraints);

    if (improved) {
      stagnation = 0;
    } else {
      stagnation++;
    }

    if (stagnation >= config.stagnationLimit) break;
  }

  return state;
}
