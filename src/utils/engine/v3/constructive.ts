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
import { countCoverageOnDay } from "./coverageHelper";
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
  const weeks = getWeeks(totalDays);

  // First pass: assign weekends (G or D) and weekday M
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
      assignCell(state, fom.id, d, "M", "engine", false);
    }
  }

  // No compensatory weekday rest for guardia weeks.
  // G days (12h each) accumulate DG (Día Debido Guardia) in the output.
  // The FOM uses DG at their discretion — the engine does NOT auto-assign rest.
  // DG accumulation is handled by stateToOutput in solver.ts.
}

function anchorAFOM(state: SolverState, fom: EngineEmployee, afom: EngineEmployee): void {
  const totalDays = state.input.period.totalDays;

  for (let d = 1; d <= totalDays; d++) {
    if (state.grid[afom.id][d].locked) continue;

    const fomCode = state.grid[fom.id][d]?.code ?? "D";
    let mirrorCode = FOM_AFOM_MIRROR[fomCode] ?? "M";

    // Check 12h rest: if previous day AFOM had T and mirror says M → use 11x19 transition
    if (d > 1 && mirrorCode === "M") {
      const prevCode = state.grid[afom.id][d - 1]?.code;
      if (prevCode === "T" || prevCode === "N") {
        mirrorCode = "11x19"; // Transition to avoid T→M violation
      }
    }

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
    // FOM already has rest days from anchoring (S+D locked)
    if (emp.role === "FOM") continue;

    for (const week of weeks) {
      assignWeeklyRest(state, emp, week);
    }
  }
}

function assignWeeklyRest(state: SolverState, emp: EngineEmployee, weekDays: number[]): void {
  const schedule = state.grid[emp.id];
  const isRotaCompleto = emp.rotationType === "ROTA_COMPLETO";

  // Count existing rest/absence days in this week
  const existingLockedRests = weekDays.filter(d => {
    const c = schedule[d]?.code;
    if (!c) return false;
    const isRest = c === "D" || c === "V" || c === "E" || c === "PM" || c === "PC" || c === "DB" || c === "DG";
    return isRest && schedule[d]?.locked;
  });

  // ROTA_COMPLETO: only pre-assign 1 rest (N→D provides the 2nd)
  // Others: assign 2 consecutive rest days as before
  const target = isRotaCompleto ? 1 : 2;

  if (existingLockedRests.length >= target) return;
  const needed = target - existingLockedRests.length;
  if (needed <= 0) return;

  if (isRotaCompleto) {
    // Assign 1 staggered rest day (N→D will provide the 2nd)
    const candidates: Array<{ day: number; score: number }> = [];
    for (const d of weekDays) {
      if (schedule[d].locked) continue;
      let score = 0;
      // Stagger: penalize days where others have LOCKED rest (not init D)
      for (const [id, grid] of Object.entries(state.grid)) {
        if (id === emp.id) continue;
        if (grid[d]?.code === "D" && grid[d]?.locked) score -= 10;
      }
      // Avoid days with soft petitions (type B)
      const hasPetition = emp.petitions.some(p =>
        p.type === "B" && p.status !== "rejected" && p.days.includes(d)
      );
      if (hasPetition) score -= 50;
      // Slight weekend variety preference
      const dow = periodDayOfWeekISO(state.input.period.startDate, d);
      if (dow === 5 || dow === 6) score += 3;
      candidates.push({ day: d, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length > 0) {
      assignCell(state, emp.id, candidates[0].day, "D", "engine", true);
    }
    return;
  }

  // Non-ROTA_COMPLETO: assign 2 consecutive rest days
  const pairCandidates: Array<{ days: number[]; score: number }> = [];

  for (let i = 0; i < weekDays.length - 1; i++) {
    const d1 = weekDays[i];
    const d2 = weekDays[i + 1];
    if (schedule[d1].locked && schedule[d1].code !== "D") continue;
    if (schedule[d2].locked && schedule[d2].code !== "D") continue;

    let score = 0;
    for (const [id, grid] of Object.entries(state.grid)) {
      if (id === emp.id) continue;
      if (grid[d1]?.code === "D" && grid[d1]?.locked) score -= 10;
      if (grid[d2]?.code === "D" && grid[d2]?.locked) score -= 10;
    }
    const dow1 = periodDayOfWeekISO(state.input.period.startDate, d1);
    if (dow1 === 5 || dow1 === 6) score += 3;
    pairCandidates.push({ days: [d1, d2], score });
  }

  if (pairCandidates.length === 0) {
    for (const d of weekDays) {
      if (!schedule[d].locked || schedule[d].code === "D") {
        pairCandidates.push({ days: [d], score: -50 });
      }
    }
  }

  pairCandidates.sort((a, b) => b.score - a.score);
  if (pairCandidates.length > 0) {
    for (const d of pairCandidates[0].days) {
      if (!schedule[d].locked) {
        assignCell(state, emp.id, d, "D", "engine", true);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 2b: Night coverage rotation (seniority-based)
// When Night Agent rests, assign those nights to ROTA_COMPLETO by seniority.
// After 2 nights, the covering employee gets rest days (N→D hard constraint).
// Rotates each week to the next employee by seniority for equity.
// ---------------------------------------------------------------------------

function assignNightCoverage(state: SolverState): void {
  const weeks = getWeeks(state.input.period.totalDays);

  // Find Night Agent
  const nightAgent = state.input.employees.find(e => e.role === "NIGHT_SHIFT_AGENT");
  if (!nightAgent) return;

  // Get ROTA_COMPLETO employees sorted by seniority descending (highest first)
  // Exclude FOM (never covers nights)
  const rotaEmps = state.input.employees
    .filter(e => e.rotationType === "ROTA_COMPLETO")
    .sort((a, b) => b.seniorityLevel - a.seniorityLevel);

  if (rotaEmps.length === 0) return;

  // Track night coverage equity across the period
  const nightCoverageCount = new Map<string, number>();
  for (const emp of rotaEmps) nightCoverageCount.set(emp.id, 0);

  for (const week of weeks) {
    // Find days where Night Agent rests in this week
    const nightAgentRestDays = week.filter(d => {
      const code = state.grid[nightAgent.id][d]?.code;
      return code === "D" || code === "V" || code === "E";
    });

    if (nightAgentRestDays.length === 0) continue;

    // Pick the covering employee: round-robin by seniority, prefer who has
    // done the fewest night coverages so far (breaks ties by seniority)
    const sorted = [...rotaEmps].sort((a, b) => {
      const aCov = nightCoverageCount.get(a.id) ?? 0;
      const bCov = nightCoverageCount.get(b.id) ?? 0;
      if (aCov !== bCov) return aCov - bCov; // fewer coverages first
      return b.seniorityLevel - a.seniorityLevel; // higher seniority first
    });

    // Find an employee who can work these nights.
    // Check sequentially (each N is checked after previous ones are assigned).
    let assigned = false;
    for (const emp of sorted) {
      // Pre-check: no locked cells on coverage days
      const daysBlocked = nightAgentRestDays.some(d => state.grid[emp.id][d].locked);
      if (daysBlocked) continue;

      // Pre-check: don't assign if forced rest after last N would override a petition
      const lastCoverageNight = nightAgentRestDays[nightAgentRestDays.length - 1];
      const restAfterDay = lastCoverageNight + 1;
      if (restAfterDay <= state.input.period.totalDays) {
        const hasPetitionOnRestDay = emp.petitions.some(p =>
          p.status !== "rejected" && p.days.includes(restAfterDay) &&
          p.requestedShift && p.requestedShift !== "D"
        );
        if (hasPetitionOnRestDay) continue;
      }

      // Try assigning N on each Night Agent rest day sequentially
      const assignedDays: number[] = [];
      let allFeasible = true;
      for (const d of nightAgentRestDays) {
        const feasible = ALL_HARD_CONSTRAINTS.every(hc => hc.isFeasible(state, emp.id, d, "N"));
        if (!feasible) { allFeasible = false; break; }
        assignCell(state, emp.id, d, "N", "engine", true);
        assignedDays.push(d);
      }

      if (!allFeasible) {
        // Rollback: undo partial assignments
        for (const d of assignedDays) {
          state.grid[emp.id][d] = {
            code: "D", startTime: "00:00", endTime: "00:00",
            hours: 0, locked: false, source: "engine",
          };
        }
        continue;
      }

      // Assign rest day after the LAST night (N→non-N must be rest)
      // N→N is allowed, so only the day after the last N needs forced rest
      const lastNight = nightAgentRestDays[nightAgentRestDays.length - 1];
      const restDay = lastNight + 1;
      if (restDay <= state.input.period.totalDays && !state.grid[emp.id][restDay].locked) {
        assignCell(state, emp.id, restDay, "D", "engine", true);
      }

      // Update night coverage equity
      nightCoverageCount.set(emp.id, (nightCoverageCount.get(emp.id) ?? 0) + nightAgentRestDays.length);
      const eq = state.equity.get(emp.id);
      if (eq) eq.nightCoverage += nightAgentRestDays.length;

      assigned = true;
      break;
    }

    // If no single employee can cover all nights, split across employees
    if (!assigned) {
      for (const d of nightAgentRestDays) {
        for (const emp of sorted) {
          const cell = state.grid[emp.id][d];
          if (cell.locked) continue;
          const feasible = ALL_HARD_CONSTRAINTS.every(hc => hc.isFeasible(state, emp.id, d, "N"));
          if (!feasible) continue;

          assignCell(state, emp.id, d, "N", "engine", true);
          // Rest after this single N
          const nextDay = d + 1;
          if (nextDay <= state.input.period.totalDays && !state.grid[emp.id][nextDay].locked) {
            assignCell(state, emp.id, nextDay, "D", "engine", true);
          }
          nightCoverageCount.set(emp.id, (nightCoverageCount.get(emp.id) ?? 0) + 1);
          const eq = state.equity.get(emp.id);
          if (eq) eq.nightCoverage++;
          break;
        }
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

  // Filter to employees that need filling (skip fixed roles)
  const fillableEmps = state.input.employees.filter(emp =>
    emp.role !== "FOM" && emp.role !== "AFOM" && emp.role !== "NIGHT_SHIFT_AGENT"
  );

  // Day-first loop: ensures coverage state is up-to-date when scoring each employee
  for (let d = 1; d <= totalDays; d++) {
    // Pre-compute N coverage for this day — don't pile extra Ns when already met
    const nCoverage = countCoverageOnDay(state.grid, d, "N");
    const nNeeded = state.input.constraints.minCoveragePerShift.N ?? 1;

    for (const emp of fillableEmps) {
      const cell = state.grid[emp.id][d];
      if (cell.locked) continue;
      if (isWorkingShift(cell.code)) continue; // already assigned a working shift

      // Get candidate shifts for this role
      let candidates = getCandidateShifts(emp);

      // Filter out N when night coverage is already met (night rotation handles N assignments)
      if (nCoverage >= nNeeded) {
        candidates = candidates.filter(c => c !== "N");
      }

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
  const absenceCodes = new Set(["V", "E", "PM", "PC", "DB", "DG", "F"]);

  for (let d = 1; d <= totalDays; d++) {
    for (const shift of ["M", "T", "N"] as const) {
      const needed = minCov[shift] ?? 1;
      let current = countCoverageOnDay(state.grid, d, shift);

      if (current >= needed) continue;

      const gap = needed - current;

      // Pass 1: try unlocked rest cells
      const candidates = state.input.employees
        .filter(e => {
          if (e.role === "FOM" || e.role === "AFOM" || e.role === "NIGHT_SHIFT_AGENT" || e.role === "GEX") return false;
          const cell = state.grid[e.id][d];
          if (cell.locked) return false;
          if (isWorkingShift(cell.code)) return false;
          return hardConstraints.every(hc => hc.isFeasible(state, e.id, d, shift));
        })
        .map(e => ({
          id: e.id,
          score: softConstraints.reduce((s, sc) => s + sc.score(state, e.id, d, shift) * sc.weight, 0),
        }))
        .sort((a, b) => b.score - a.score);

      let filled = 0;
      for (let i = 0; i < Math.min(gap, candidates.length); i++) {
        assignCell(state, candidates[i].id, d, shift, "coverage");
        filled++;
      }

      // Pass 2: if still short, try locked REST days (not absences/night coverage)
      if (filled < gap) {
        const remaining = gap - filled;
        const lockedCandidates = state.input.employees
          .filter(e => {
            if (e.role === "FOM" || e.role === "AFOM" || e.role === "NIGHT_SHIFT_AGENT" || e.role === "GEX") return false;
            const cell = state.grid[e.id][d];
            if (!cell.locked) return false; // already tried unlocked
            if (absenceCodes.has(cell.code)) return false; // don't override absences
            if (cell.code !== "D") return false; // only override rest days
            if (cell.source === "petition_a") return false; // don't override hard petitions
            // Temporarily unlock for feasibility check
            cell.locked = false;
            const feasible = hardConstraints.every(hc => hc.isFeasible(state, e.id, d, shift));
            cell.locked = true;
            return feasible;
          })
          .map(e => ({
            id: e.id,
            score: softConstraints.reduce((s, sc) => s + sc.score(state, e.id, d, shift) * sc.weight, 0),
          }))
          .sort((a, b) => b.score - a.score);

        for (let i = 0; i < Math.min(remaining, lockedCandidates.length); i++) {
          state.grid[lockedCandidates[i].id][d].locked = false;
          assignCell(state, lockedCandidates[i].id, d, shift, "coverage");
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// PHASE 6: Consolidate rest days (make consecutive for ROTA_COMPLETO)
// ---------------------------------------------------------------------------

/**
 * After fillRemaining, ROTA_COMPLETO employees may have non-consecutive rest:
 * - 1 pre-assigned rest (from phase 2)
 * - 1+ forced rest from N→D pattern
 *
 * This phase:
 * 1. Ensures ≥2 rest days per week (adds if N→D didn't create enough)
 * 2. Tries to make rest days consecutive by swapping shifts within the week
 */
function consolidateRest(
  state: SolverState,
  hardConstraints: HardConstraint[],
): void {
  const weeks = getWeeks(state.input.period.totalDays);
  const rotaEmps = state.input.employees.filter(e => e.rotationType === "ROTA_COMPLETO");

  for (const emp of rotaEmps) {
    for (const week of weeks) {
      // Step 1: Ensure at least 2 rest days
      ensureMinimumRest(state, emp.id, week);
      // Step 2: Try to make them consecutive
      makeRestConsecutive(state, emp.id, week, hardConstraints);
    }
  }
}

function isRestCode(code: string): boolean {
  return !isWorkingShift(code);
}

function ensureMinimumRest(state: SolverState, empId: string, weekDays: number[]): void {
  const schedule = state.grid[empId];
  const restDays = weekDays.filter(d => isRestCode(schedule[d]?.code));

  if (restDays.length >= 2) return;

  const minCov = state.input.constraints.minCoveragePerShift;

  // Need to add rest days — pick unlocked work days with lowest coverage impact
  const workDays = weekDays
    .filter(d => isWorkingShift(schedule[d]?.code) && !schedule[d]?.locked)
    .map(d => {
      let score = 0;
      // Heavy penalty for days where removing this employee drops below minimum coverage
      const shiftCat = schedule[d]?.code === "M" || schedule[d]?.code === "9x17" || schedule[d]?.code === "11x19" ? "M"
        : schedule[d]?.code === "T" || schedule[d]?.code === "12x20" ? "T"
        : schedule[d]?.code === "N" ? "N" : null;
      if (shiftCat) {
        const current = countCoverageOnDay(state.grid, d, shiftCat as "M" | "T" | "N");
        const needed = minCov[shiftCat as "M" | "T" | "N"] ?? 1;
        if (current <= needed) score -= 50; // at or below minimum → very bad to remove
      }
      // Prefer days where others are working (not resting)
      for (const [id, grid] of Object.entries(state.grid)) {
        if (id === empId) continue;
        if (isRestCode(grid[d]?.code)) score -= 10;
      }
      // Bonus for adjacency to existing rest
      for (const r of restDays) {
        if (Math.abs(d - r) === 1) score += 25;
      }
      return { day: d, score };
    })
    .sort((a, b) => b.score - a.score);

  const needed = 2 - restDays.length;
  for (let i = 0; i < Math.min(needed, workDays.length); i++) {
    assignCell(state, empId, workDays[i].day, "D", "engine", false);
  }
}

function makeRestConsecutive(
  state: SolverState,
  empId: string,
  weekDays: number[],
  hardConstraints: HardConstraint[],
): void {
  const schedule = state.grid[empId];
  const restDays = weekDays.filter(d => isRestCode(schedule[d]?.code));

  if (restDays.length < 2) return;

  // Already consecutive?
  for (let i = 0; i < restDays.length - 1; i++) {
    if (restDays[i + 1] - restDays[i] === 1) return;
  }

  // Strategy: pick a rest day (preferring movable ones), find a work day
  // adjacent to another rest day, and swap them.
  //
  // Example: rest on days [4, 7], work on day 5
  // Swap: day 5 → D, day 7 → day5's old shift
  // Result: rest on [4, 5] consecutive!

  const minCov = state.input.constraints.minCoveragePerShift;

  for (const anchorRest of restDays) {
    // Find work days adjacent to this rest (potential new rest positions)
    const adjacentWork = [anchorRest - 1, anchorRest + 1].filter(d =>
      weekDays.includes(d) &&
      isWorkingShift(schedule[d]?.code) &&
      !schedule[d]?.locked
    );

    for (const newRestDay of adjacentWork) {
      const shiftToMove = schedule[newRestDay].code;

      // Don't remove this shift if coverage would drop below minimum
      const shiftCat = shiftToMove === "M" || shiftToMove === "9x17" || shiftToMove === "11x19" ? "M"
        : shiftToMove === "T" || shiftToMove === "12x20" ? "T"
        : shiftToMove === "N" ? "N" : null;
      if (shiftCat) {
        const current = countCoverageOnDay(state.grid, newRestDay, shiftCat as "M" | "T" | "N");
        const needed = minCov[shiftCat as "M" | "T" | "N"] ?? 1;
        if (current <= needed) continue; // would create coverage gap
      }

      // Find a non-adjacent rest day to receive this shift
      const otherRests = restDays.filter(r =>
        r !== anchorRest &&
        Math.abs(r - anchorRest) > 1 && // not already adjacent
        !schedule[r]?.locked
      );

      for (const targetDay of otherRests) {
        // Check if shiftToMove is feasible at targetDay
        const wasLocked = schedule[targetDay].locked;
        schedule[targetDay].locked = false;

        const feasible = hardConstraints.every(hc =>
          hc.isFeasible(state, empId, targetDay, shiftToMove)
        );

        if (!feasible) {
          schedule[targetDay].locked = wasLocked;
          continue;
        }

        // Do the swap: move shift from newRestDay → targetDay, make newRestDay rest
        assignCell(state, empId, targetDay, shiftToMove, "engine");
        assignCell(state, empId, newRestDay, "D", "engine", false);
        return; // done for this week
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

  // Phase 2: Assign rest days (1 staggered for ROTA_COMPLETO, 2 consecutive for others)
  assignRestDays(state);

  // Phase 2b: Night coverage rotation (seniority-based)
  assignNightCoverage(state);

  // Phase 3a: GEX by occupancy
  assignGEX(state);

  // Phase 3b: Fill remaining with best feasible shift
  fillRemaining(state, hardConstraints, softConstraints);

  // Phase 4: Consolidate rest (make consecutive for ROTA_COMPLETO)
  consolidateRest(state, hardConstraints);

  // Phase 5: Ensure minimum coverage
  ensureCoverage(state, hardConstraints, softConstraints);

  return state;
}
