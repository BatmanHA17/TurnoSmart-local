/**
 * TurnoSmart® — SMART Engine v3.0 — Constructive Heuristic
 *
 * Builds an initial feasible solution by assigning shifts day-by-day.
 *
 * Strategy:
 * 1. Anchor fixed employees (FOM, Night Agent, absences, hard petitions)
 * 2. Assign rest days (2 consecutive per week per employee)
 * 3. Fill remaining cells by scoring all feasible shifts
 *
 * The constructive phase guarantees hard constraint satisfaction.
 * The local search phase (optimizer.ts) improves the soft score.
 */

import type {
  SolverState, SolverCell, MutableEquity, HardConstraint, SoftConstraint,
} from "./solverTypes";
import type { EngineInput, EngineEmployee, ShiftCode } from "../types";
import {
  SHIFT_TIMES, WORKING_SHIFTS, ROLE_CONFIGS, FOM_AFOM_MIRROR,
} from "../constants";
import {
  isWorkingShift, makeAssignment, getWeeks,
  periodDayOfWeekISO, isPeriodWeekend,
} from "../helpers";
import { ALL_HARD_CONSTRAINTS } from "./hardConstraints";
import { ALL_SOFT_CONSTRAINTS } from "./softConstraints";

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------

function initState(input: EngineInput): SolverState {
  const employees = new Map<string, EngineEmployee>();
  const grid: Record<string, Record<number, SolverCell>> = {};
  const equity = new Map<string, MutableEquity>();

  for (const emp of input.employees) {
    employees.set(emp.id, emp);
    grid[emp.id] = {};
    for (let d = 1; d <= input.period.totalDays; d++) {
      grid[emp.id][d] = {
        code: "D",
        startTime: "00:00",
        endTime: "00:00",
        hours: 0,
        locked: false,
        source: "engine",
      };
    }
    // Initialize equity from historical balance
    equity.set(emp.id, {
      M: emp.equityBalance.morningCount,
      T: emp.equityBalance.afternoonCount,
      N: emp.equityBalance.nightCount,
      weekendWorked: emp.equityBalance.weekendWorkedCount,
      nightCoverage: emp.equityBalance.nightCoverageCount,
      petitionsSatisfied: 0,
      petitionsTotal: emp.petitions.filter(p => p.type === "B").length,
    });
  }

  return { input, grid, employees, equity, violations: [] };
}

function assignCell(
  state: SolverState,
  empId: string,
  day: number,
  code: string,
  source: SolverCell["source"] = "engine",
  lock = false,
): void {
  const shift = SHIFT_TIMES[code];
  state.grid[empId][day] = {
    code,
    startTime: shift?.startTime ?? "00:00",
    endTime: shift?.endTime ?? "00:00",
    hours: shift?.hours ?? 0,
    locked: lock,
    source,
  };
  // Update equity
  const eq = state.equity.get(empId);
  if (eq && (code === "M" || code === "T" || code === "N")) {
    eq[code]++;
  }
  if (eq && isWorkingShift(code) && isPeriodWeekend(state.input.period.startDate, day)) {
    eq.weekendWorked++;
  }
}

// ---------------------------------------------------------------------------
// PHASE 1: Anchor fixed employees
// ---------------------------------------------------------------------------

function anchorFixed(state: SolverState): void {
  const { input } = state;
  const totalDays = input.period.totalDays;

  for (const emp of input.employees) {
    // 1. Lock absences (V, E, PM, PC, etc.)
    for (const abs of emp.absences) {
      if (abs.day >= 1 && abs.day <= totalDays) {
        assignCell(state, emp.id, abs.day, abs.code, "engine", true);
      }
    }

    // 2. Lock hard petitions (type A)
    for (const p of emp.petitions) {
      if (p.type !== "A" || p.status === "rejected") continue;
      for (const day of p.days) {
        if (day < 1 || day > totalDays) continue;
        if (state.grid[emp.id][day].locked) continue;
        if (p.requestedShift) {
          assignCell(state, emp.id, day, p.requestedShift, "petition_a", true);
        }
      }
    }

    // 3. FOM: fixed schedule
    if (emp.role === "FOM") {
      anchorFOM(state, emp);
    }

    // 4. Night Agent: N every day
    if (emp.role === "NIGHT_SHIFT_AGENT") {
      for (let d = 1; d <= totalDays; d++) {
        if (!state.grid[emp.id][d].locked) {
          assignCell(state, emp.id, d, "N", "engine", false);
        }
      }
    }
  }

  // 5. AFOM: mirror of FOM (after FOM is anchored)
  const fom = input.employees.find(e => e.role === "FOM");
  const afom = input.employees.find(e => e.role === "AFOM");
  if (fom && afom) {
    anchorAFOM(state, fom, afom);
  }
}

function anchorFOM(state: SolverState, fom: EngineEmployee): void {
  const totalDays = state.input.period.totalDays;
  const guardiaDays = new Set(state.input.fomGuardiaDays ?? []);

  for (let d = 1; d <= totalDays; d++) {
    if (state.grid[fom.id][d].locked) continue;

    const isWE = isPeriodWeekend(state.input.period.startDate, d);

    if (isWE) {
      if (guardiaDays.has(d)) {
        assignCell(state, fom.id, d, "G", "engine", true);
      } else {
        assignCell(state, fom.id, d, "D", "engine", true);
      }
    } else {
      // Weekday: M
      assignCell(state, fom.id, d, "M", "engine", false);
    }
  }
}

function anchorAFOM(state: SolverState, fom: EngineEmployee, afom: EngineEmployee): void {
  const totalDays = state.input.period.totalDays;

  for (let d = 1; d <= totalDays; d++) {
    if (state.grid[afom.id][d].locked) continue;

    const fomCode = state.grid[fom.id][d]?.code ?? "D";
    const mirrorCode = FOM_AFOM_MIRROR[fomCode] ?? "M";
    assignCell(state, afom.id, d, mirrorCode, "engine", false);
  }
}

// ---------------------------------------------------------------------------
// PHASE 2: Assign rest days (2 consecutive per week)
// ---------------------------------------------------------------------------

function assignRestDays(state: SolverState): void {
  const totalDays = state.input.period.totalDays;
  const weeks = getWeeks(totalDays);

  for (const emp of state.input.employees) {
    // FOM/AFOM already have rest days from anchoring
    if (emp.role === "FOM" || emp.role === "AFOM") continue;

    for (const week of weeks) {
      assignWeeklyRest(state, emp, week);
    }
  }
}

function assignWeeklyRest(state: SolverState, emp: EngineEmployee, weekDays: number[]): void {
  const schedule = state.grid[emp.id];

  // Count existing rest/absence days in this week
  const existingRests = weekDays.filter(d => {
    const c = schedule[d]?.code;
    return c === "D" || c === "V" || c === "E" || c === "PM" || c === "PC" || c === "DB" || c === "DG";
  });

  if (existingRests.length >= 2) return; // Already has enough rest

  const needed = 2 - existingRests.filter(d => schedule[d]?.locked).length;
  if (needed <= 0) return;

  // Score each consecutive pair of days
  const candidates: Array<{ days: number[]; score: number }> = [];

  for (let i = 0; i < weekDays.length - 1; i++) {
    const d1 = weekDays[i];
    const d2 = weekDays[i + 1];
    if (schedule[d1].locked && schedule[d1].code !== "D") continue;
    if (schedule[d2].locked && schedule[d2].code !== "D") continue;

    // Score: prefer days where others are NOT resting (staggering)
    let score = 0;
    for (const [id, grid] of Object.entries(state.grid)) {
      if (id === emp.id) continue;
      if (grid[d1]?.code === "D") score -= 10;
      if (grid[d2]?.code === "D") score -= 10;
    }

    // Bonus for weekend rest for non-fixed roles
    const dow1 = periodDayOfWeekISO(state.input.period.startDate, d1);
    if (dow1 === 5 || dow1 === 6) score += 3; // slight weekend preference variety

    candidates.push({ days: [d1, d2], score });
  }

  // Also allow single days if no consecutive pair works
  if (candidates.length === 0) {
    for (const d of weekDays) {
      if (!schedule[d].locked || schedule[d].code === "D") {
        candidates.push({ days: [d], score: -50 }); // penalty for non-consecutive
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const best = candidates[0];
    for (const d of best.days) {
      if (!schedule[d].locked) {
        assignCell(state, emp.id, d, "D", "engine", true);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 3: Fill remaining cells with best feasible shift
// ---------------------------------------------------------------------------

function fillRemaining(
  state: SolverState,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[],
): void {
  const totalDays = state.input.period.totalDays;

  // Process employees in priority order: GEX first, then ROTA_COMPLETO
  const sortedEmps = [...state.input.employees].sort((a, b) => {
    const order: Record<string, number> = {
      FIJO_NO_ROTA: 0, COBERTURA: 1, ROTA_PARCIAL: 2, ROTA_COMPLETO: 3,
    };
    return (order[a.rotationType] ?? 9) - (order[b.rotationType] ?? 9);
  });

  for (const emp of sortedEmps) {
    // FOM, AFOM, Night Agent already fully assigned
    if (emp.role === "FOM" || emp.role === "AFOM" || emp.role === "NIGHT_SHIFT_AGENT") continue;

    for (let d = 1; d <= totalDays; d++) {
      const cell = state.grid[emp.id][d];
      if (cell.locked) continue;
      if (isWorkingShift(cell.code)) continue; // already assigned a working shift

      // Get candidate shifts for this role
      const candidates = getCandidateShifts(emp);
      const best = pickBestShift(state, emp.id, d, candidates, hardConstraints, softConstraints);

      if (best) {
        assignCell(state, emp.id, d, best, "engine");
      }
      // If no feasible shift found, stays as D (rest)
    }
  }
}

function getCandidateShifts(emp: EngineEmployee): string[] {
  const config = ROLE_CONFIGS[emp.role];
  if (!config) return ["M", "T", "N"];

  // Only working shifts as candidates (not D, V, E, etc.)
  return config.allowedShifts.filter(s => isWorkingShift(s));
}

function pickBestShift(
  state: SolverState,
  empId: string,
  day: number,
  candidates: string[],
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[],
): string | null {
  let bestCode: string | null = null;
  let bestScore = -Infinity;

  for (const code of candidates) {
    // Check all hard constraints
    const feasible = hardConstraints.every(hc => hc.isFeasible(state, empId, day, code));
    if (!feasible) continue;

    // Score with all soft constraints
    let totalScore = 0;
    for (const sc of softConstraints) {
      totalScore += sc.score(state, empId, day, code) * sc.weight;
    }

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCode = code;
    }
  }

  return bestCode;
}

// ---------------------------------------------------------------------------
// PHASE 4: GEX assignment by occupancy
// ---------------------------------------------------------------------------

function assignGEX(state: SolverState): void {
  const totalDays = state.input.period.totalDays;
  const occupancy = state.input.occupancy;
  const occMap = new Map(occupancy.map(o => [o.day, o]));

  const gexEmployees = state.input.employees.filter(e => e.role === "GEX");

  for (const gex of gexEmployees) {
    for (let d = 1; d <= totalDays; d++) {
      const cell = state.grid[gex.id][d];
      if (cell.locked) continue;
      if (cell.code !== "D") continue; // already assigned rest is kept

      // Skip rest days (they were assigned in phase 2)
      if (cell.locked) continue;

      const occ = occMap.get(d);
      let shiftCode = "9x17"; // default
      if (occ) {
        // More check-outs in morning → 9x17; more check-ins in afternoon → 12x20
        shiftCode = occ.checkOuts >= occ.checkIns ? "9x17" : "12x20";
      }

      // Check feasibility
      const feasible = ALL_HARD_CONSTRAINTS.every(hc =>
        hc.isFeasible(state, gex.id, d, shiftCode)
      );
      if (feasible) {
        assignCell(state, gex.id, d, shiftCode, "engine");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 5: Ensure minimum coverage
// ---------------------------------------------------------------------------

function ensureCoverage(
  state: SolverState,
  hardConstraints: HardConstraint[],
  softConstraints: SoftConstraint[],
): void {
  const totalDays = state.input.period.totalDays;
  const minCov = state.input.constraints.minCoveragePerShift;

  for (let d = 1; d <= totalDays; d++) {
    for (const shift of ["M", "T", "N"] as const) {
      const needed = minCov[shift] ?? 1;
      const current = countShiftOnDay(state.grid as any, d, shift);

      if (current >= needed) continue;

      // Find employees who can fill this gap
      const gap = needed - current;
      const candidates = state.input.employees
        .filter(e => {
          if (e.role === "FOM" || e.role === "AFOM" || e.role === "NIGHT_SHIFT_AGENT" || e.role === "GEX") return false;
          const cell = state.grid[e.id][d];
          if (cell.locked) return false;
          if (isWorkingShift(cell.code)) return false; // already working another shift
          return hardConstraints.every(hc => hc.isFeasible(state, e.id, d, shift));
        })
        .map(e => ({
          id: e.id,
          score: softConstraints.reduce((s, sc) => s + sc.score(state, e.id, d, shift) * sc.weight, 0),
        }))
        .sort((a, b) => b.score - a.score);

      for (let i = 0; i < Math.min(gap, candidates.length); i++) {
        assignCell(state, candidates[i].id, d, shift, "coverage");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: Build initial solution
// ---------------------------------------------------------------------------

export function buildInitialSolution(
  input: EngineInput,
  hardConstraints: HardConstraint[] = ALL_HARD_CONSTRAINTS,
  softConstraints: SoftConstraint[] = ALL_SOFT_CONSTRAINTS,
): SolverState {
  const state = initState(input);

  // Phase 1: Anchor fixed roles + absences + hard petitions
  anchorFixed(state);

  // Phase 2: Assign rest days (2 consecutive per week)
  assignRestDays(state);

  // Phase 3a: GEX by occupancy
  assignGEX(state);

  // Phase 3b: Fill remaining with best feasible shift
  fillRemaining(state, hardConstraints, softConstraints);

  // Phase 4: Ensure minimum coverage
  ensureCoverage(state, hardConstraints, softConstraints);

  return state;
}
