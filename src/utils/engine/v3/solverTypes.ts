/**
 * TurnoSmart® — SMART Engine v3.0 — Solver Types
 *
 * Constraint-based solver architecture.
 * Hard constraints → feasibility check
 * Soft constraints → scoring
 * Validation checks → post-generation audit
 */

import type {
  EngineInput,
  EngineEmployee,
  DayAssignmentV2,
  ShiftCode,
  AuditViolation,
  ScoreBreakdown,
  EquityBalance,
} from "../types";

// ---------------------------------------------------------------------------
// SOLVER GRID — mutable working state
// ---------------------------------------------------------------------------

/** Grid cell: one employee × one day */
export interface SolverCell {
  code: string;
  startTime: string;
  endTime: string;
  hours: number;
  locked: boolean;
  source: DayAssignmentV2["source"];
}

/** The complete solver state */
export interface SolverState {
  input: EngineInput;
  /** employeeId → day (1-based) → cell */
  grid: Record<string, Record<number, SolverCell>>;
  /** Pre-computed employee lookup */
  employees: Map<string, EngineEmployee>;
  /** Current equity counters for this period */
  equity: Map<string, MutableEquity>;
  /** Violations accumulated */
  violations: AuditViolation[];
  /** Night coverage round-robin index after assignNightCoverage (for cross-period persistence) */
  nightRotationIndexOut?: number;
}

export interface MutableEquity {
  M: number;
  T: number;
  N: number;
  weekendWorked: number;
  nightCoverage: number;
  petitionsSatisfied: number;
  petitionsTotal: number;
}

// ---------------------------------------------------------------------------
// CONSTRAINT INTERFACES
// ---------------------------------------------------------------------------

/**
 * Hard constraint: MUST be satisfied.
 * Returns true if assigning `shiftCode` to `employee` on `day` is feasible.
 * Called during constructive phase to prune infeasible assignments.
 */
export interface HardConstraint {
  readonly id: string;
  readonly name: string;
  /** Check if assigning this shift is feasible */
  isFeasible(
    state: SolverState,
    employeeId: string,
    day: number,
    shiftCode: string
  ): boolean;
}

/**
 * Soft constraint: contributes to the quality score.
 * Returns a score delta (positive = good, negative = bad)
 * for assigning `shiftCode` to `employee` on `day`.
 * Used by constructive heuristic to pick the best option,
 * and by local search to evaluate swaps.
 */
export interface SoftConstraint {
  readonly id: string;
  readonly name: string;
  readonly weight: number; // from boost (1-5) → normalized weight
  /** Score delta for this assignment. Higher = better. Range: roughly -100 to +100. */
  score(
    state: SolverState,
    employeeId: string,
    day: number,
    shiftCode: string
  ): number;
}

/**
 * Validation check: runs post-generation.
 * Returns violations found in the final schedule.
 */
export interface ValidationCheck {
  readonly id: string;
  readonly name: string;
  readonly severity: "blocker" | "error" | "warning" | "info";
  /** Run the check on the final state, return violations */
  validate(state: SolverState): AuditViolation[];
}

// ---------------------------------------------------------------------------
// SOLVER MOVE (for local search)
// ---------------------------------------------------------------------------

/** A single move: change one cell in the grid */
export interface SolverMove {
  type: "assign" | "swap";
  employeeId: string;
  day: number;
  fromCode: string;
  toCode: string;
  /** For swap: second employee involved */
  swapEmployeeId?: string;
  swapDay?: number;
}

// ---------------------------------------------------------------------------
// SOLVER CONFIG
// ---------------------------------------------------------------------------

export interface SolverConfig {
  /** Max iterations for local search (default: 500) */
  maxIterations: number;
  /** Temperature for simulated annealing acceptance (0 = greedy) */
  temperature: number;
  /** Stop if no improvement for N iterations */
  stagnationLimit: number;
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxIterations: 500,
  temperature: 0,
  stagnationLimit: 100,
};
