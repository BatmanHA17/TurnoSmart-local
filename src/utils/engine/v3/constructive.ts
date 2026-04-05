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
  const shifts = state.input.shiftConfig ?? SHIFT_TIMES;
  const shift = shifts[code] ?? SHIFT_TIMES[code];
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

  // Track which employees have been assigned FDS Largo and in which week pair
  // FDS Largo = 4 consecutive days off bridging 2 weeks (e.g., S-D of week N + L-M of week N+1)
  // Each non-FOM employee gets 1 FDS Largo per month, staggered across employees
  const nonFomEmps = state.input.employees.filter(e => e.role !== "FOM");

  // Assign FDS Largo first (only for months with 3+ weeks, and if enabled)
  if (weeks.length >= 3 && state.input.constraints.fdsLargo) {
    assignFdsLargo(state, nonFomEmps, weeks);
  }

  // Then assign remaining weekly rest (rotative for weeks without FDS Largo)
  for (const emp of state.input.employees) {
    if (emp.role === "FOM") continue;

    for (let wi = 0; wi < weeks.length; wi++) {
      assignWeeklyRest(state, emp, weeks[wi], wi);
    }
  }
}

/**
 * FDS Largo (Fin de Semana Largo) — 4 consecutive days off bridging 2 weeks.
 * Each employee gets 1 per month. The bridge is: S-D of week N + L-M of week N+1.
 * Employees are staggered so not everyone has FDS Largo the same weeks.
 */
function assignFdsLargo(
  state: SolverState,
  employees: EngineEmployee[],
  weeks: number[][],
): void {
  // Available bridge positions: between week i and week i+1
  // Bridge = last 2 days of week[i] (S-D) + first 2 days of week[i+1] (L-M)
  const bridgeSlots: number[] = []; // week indices where bridge starts
  for (let i = 0; i < weeks.length - 1; i++) {
    bridgeSlots.push(i);
  }

  // Distribute employees across bridge slots (round-robin)
  for (let ei = 0; ei < employees.length; ei++) {
    const emp = employees[ei];
    const slotIdx = ei % bridgeSlots.length;
    const bridgeWeek = bridgeSlots[slotIdx];

    const weekA = weeks[bridgeWeek];
    const weekB = weeks[bridgeWeek + 1];

    // FDS Largo days: last 2 of weekA + first 2 of weekB
    const fdsLargoDays = [
      weekA[weekA.length - 2], // Saturday (or 6th day)
      weekA[weekA.length - 1], // Sunday (or 7th day)
      weekB[0],                // Monday (or 1st day)
      weekB[1],                // Tuesday (or 2nd day)
    ].filter(d => d != null && d >= 1 && d <= state.input.period.totalDays);

    // Check feasibility: none of the 4 days should be locked with non-rest
    const canAssign = fdsLargoDays.every(d => {
      const cell = state.grid[emp.id][d];
      if (!cell) return false;
      if (cell.locked && cell.code !== "D") return false; // locked absence/shift blocks it
      return true;
    });

    if (!canAssign) continue;

    // Assign the 4 FDS Largo rest days
    for (const d of fdsLargoDays) {
      if (!state.grid[emp.id][d].locked) {
        assignCell(state, emp.id, d, "D", "engine", true);
      }
    }
  }
}

function assignWeeklyRest(state: SolverState, emp: EngineEmployee, weekDays: number[], weekIndex = 0): void {
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
  // Use ROTATIVE offset so rest days advance each week (e.g., week0: M-X, week1: J-V, week2: S-D, week3: L-M)
  const pairCandidates: Array<{ days: number[]; score: number }> = [];

  for (let i = 0; i < weekDays.length - 1; i++) {
    const d1 = weekDays[i];
    const d2 = weekDays[i + 1];
    if (schedule[d1].locked && schedule[d1].code !== "D") continue;
    if (schedule[d2].locked && schedule[d2].code !== "D") continue;

    let score = 0;
    // Penalize days where others rest (coverage staggering)
    for (const [id, grid] of Object.entries(state.grid)) {
      if (id === emp.id) continue;
      if (grid[d1]?.code === "D" && grid[d1]?.locked) score -= 10;
      if (grid[d2]?.code === "D" && grid[d2]?.locked) score -= 10;
    }

    // ROTATIVE REST: strongly prefer the pair at position (weekIndex * 2) % 7
    // This makes rest days advance by 2 days each week:
    // Week 0: pair starting at index 0 (Mon-Tue)
    // Week 1: pair starting at index 2 (Wed-Thu)
    // Week 2: pair starting at index 4 (Fri-Sat)
    // Week 3: pair starting at index 6→0 (Sun-Mon wrap)
    const targetPairStart = (weekIndex * 2) % weekDays.length;
    const distFromTarget = Math.min(
      Math.abs(i - targetPairStart),
      weekDays.length - Math.abs(i - targetPairStart)
    );
    score += (weekDays.length - distFromTarget) * 20; // strong rotation bonus

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
// PHASE 2b: Night coverage rotation (strict round-robin by seniority)
// When Night Agent rests, assign those nights to ROTA_COMPLETO employees.
// RULES:
// - Strict round-robin: Week 1→FDA#1, Week 2→FDA#2, Week 3→FDA#3, etc.
//   Sorted by seniority descending. Wraps around.
// - After covering nights, employee gets 2 CONSECUTIVE rest days (N,N,D,D).
// - If a candidate can't cover (locked days, petitions), skip to next in rotation.
// ---------------------------------------------------------------------------

function assignNightCoverage(state: SolverState): void {
  const weeks = getWeeks(state.input.period.totalDays);

  // Find Night Agent
  const nightAgent = state.input.employees.find(e => e.role === "NIGHT_SHIFT_AGENT");
  if (!nightAgent) return;

  // Get ROTA_COMPLETO employees that can cover nights, sorted by seniority descending
  // canCoverNights defaults to true for ROTA_COMPLETO unless explicitly set to false
  const rotaEmps = state.input.employees
    .filter(e => e.rotationType === "ROTA_COMPLETO" && e.canCoverNights !== false)
    .sort((a, b) => b.seniorityLevel - a.seniorityLevel);

  if (rotaEmps.length === 0) return;

  // Strict round-robin index: advances by 1 each week regardless of success
  let roundRobinIdx = 0;

  for (const week of weeks) {
    // Find days where Night Agent rests in this week
    const nightAgentRestDays = week.filter(d => {
      const code = state.grid[nightAgent.id][d]?.code;
      return code === "D" || code === "V" || code === "E";
    });

    if (nightAgentRestDays.length === 0) continue;

    // Try candidates starting from the round-robin position
    let assigned = false;
    for (let attempt = 0; attempt < rotaEmps.length; attempt++) {
      const empIdx = (roundRobinIdx + attempt) % rotaEmps.length;
      const emp = rotaEmps[empIdx];

      // Pre-check: no locked cells on coverage nights
      if (nightAgentRestDays.some(d => state.grid[emp.id][d].locked)) continue;

      // Pre-check: need room for 2 rest days after last N
      const lastNight = nightAgentRestDays[nightAgentRestDays.length - 1];
      const restDay1 = lastNight + 1;
      const restDay2 = lastNight + 2;
      // Check rest day 1 is available
      if (restDay1 <= state.input.period.totalDays && state.grid[emp.id][restDay1].locked) {
        // If locked with absence (V, E, etc.) that's OK for rest
        const r1Code = state.grid[emp.id][restDay1].code;
        if (isWorkingShift(r1Code)) continue; // locked with work shift → can't rest
      }

      // Try assigning N on each Night Agent rest day
      const assignedDays: number[] = [];
      let allFeasible = true;
      for (const d of nightAgentRestDays) {
        const feasible = ALL_HARD_CONSTRAINTS.every(hc => hc.isFeasible(state, emp.id, d, "N"));
        if (!feasible) { allFeasible = false; break; }
        assignCell(state, emp.id, d, "N", "engine", true);
        assignedDays.push(d);
      }

      if (!allFeasible) {
        // Rollback partial assignments
        for (const d of assignedDays) {
          state.grid[emp.id][d] = {
            code: "D", startTime: "00:00", endTime: "00:00",
            hours: 0, locked: false, source: "engine",
          };
        }
        continue;
      }

      // === Assign 2 CONSECUTIVE rest days after the last night ===
      // Day after last N = rest day 1 (mandatory: N→D)
      if (restDay1 <= state.input.period.totalDays && !state.grid[emp.id][restDay1].locked) {
        assignCell(state, emp.id, restDay1, "D", "engine", true);
      }
      // Day after rest day 1 = rest day 2 (to guarantee 2 consecutive)
      if (restDay2 <= state.input.period.totalDays && !state.grid[emp.id][restDay2].locked) {
        assignCell(state, emp.id, restDay2, "D", "engine", true);
      }

      // Clear any Phase 2 pre-assigned rest in this week that's now redundant
      // (the employee already has their 2 rest days post-N)
      const weekIdx = Math.floor((lastNight - 1) / 7);
      const thisWeek = weeks[weekIdx];
      if (thisWeek) {
        const postNightRestDays = new Set([restDay1, restDay2]);
        for (const d of thisWeek) {
          if (postNightRestDays.has(d)) continue; // keep the post-N rests
          if (nightAgentRestDays.includes(d)) continue; // keep the N assignments
          if (state.grid[emp.id][d].code === "D" && state.grid[emp.id][d].locked) {
            // This is a Phase 2 rest that's now redundant — unlock it for work
            state.grid[emp.id][d] = {
              code: "D", startTime: "00:00", endTime: "00:00",
              hours: 0, locked: false, source: "engine",
            };
          }
        }
      }
      // Also check if rest days spill into next week — clear redundant Phase 2 rests there
      if (restDay2 > 0) {
        const restWeekIdx = Math.floor((restDay2 - 1) / 7);
        if (restWeekIdx !== weekIdx && restWeekIdx < weeks.length) {
          const nextWeek = weeks[restWeekIdx];
          if (nextWeek) {
            const postNightRestDays = new Set([restDay1, restDay2]);
            let clearedCount = 0;
            for (const d of nextWeek) {
              if (postNightRestDays.has(d)) continue;
              if (state.grid[emp.id][d].code === "D" && state.grid[emp.id][d].locked && clearedCount < 1) {
                // Clear at most 1 redundant rest in next week (keep at least 1)
                const totalRestsInNextWeek = nextWeek.filter(nd =>
                  state.grid[emp.id][nd].code === "D" && state.grid[emp.id][nd].locked
                ).length;
                // Only clear if we have post-N rests spilling into this week
                const spilledRests = [restDay1, restDay2].filter(rd => nextWeek.includes(rd)).length;
                if (spilledRests > 0 && totalRestsInNextWeek > (2 - spilledRests)) {
                  state.grid[emp.id][d] = {
                    code: "D", startTime: "00:00", endTime: "00:00",
                    hours: 0, locked: false, source: "engine",
                  };
                  clearedCount++;
                }
              }
            }
          }
        }
      }

      // Update night coverage equity
      const eq = state.equity.get(emp.id);
      if (eq) eq.nightCoverage += nightAgentRestDays.length;

      assigned = true;
      break;
    }

    // Advance round-robin regardless of success (ensures strict rotation)
    roundRobinIdx = (roundRobinIdx + 1) % rotaEmps.length;

    // Fallback: if no single employee can cover all nights, split across employees
    if (!assigned) {
      for (const d of nightAgentRestDays) {
        for (let attempt = 0; attempt < rotaEmps.length; attempt++) {
          const empIdx = (roundRobinIdx + attempt) % rotaEmps.length;
          const emp = rotaEmps[empIdx];
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

  // Simple day-by-day fill. ensureCoverage will fix remaining gaps via swaps.
  for (let d = 1; d <= totalDays; d++) {
    const nCoverage = countCoverageOnDay(state.grid, d, "N");
    const nNeeded = state.input.constraints.minCoveragePerShift.N ?? 1;

    for (const emp of fillableEmps) {
      const cell = state.grid[emp.id][d];
      if (cell.locked) continue;
      if (isWorkingShift(cell.code)) continue;

      let candidates = getCandidateShifts(emp, state);
      if (nCoverage >= nNeeded) {
        candidates = candidates.filter(c => c !== "N");
      }
      const best = pickBestShift(state, emp.id, d, candidates, hardConstraints, softConstraints);
      if (best) {
        assignCell(state, emp.id, d, best, "engine");
      }
    }
  }
}

function getCandidateShifts(emp: EngineEmployee, state: SolverState): string[] {
  const roleOverride = state.input.roleConfig?.find(r => r.role === emp.role);
  const config = roleOverride ?? ROLE_CONFIGS[emp.role];
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

  // Pass 3: Rest-day swaps — for remaining gaps, move an FDA's rest from the gap day
  // to a different day in the same week where there's excess coverage.
  // This preserves weekly hours while fixing coverage distribution.
  const weeks = getWeeks(state.input.period.totalDays);
  const absenceCodes2 = new Set(["V", "E", "PM", "PC", "DB", "DG", "F"]);

  for (let d = 1; d <= totalDays; d++) {
    for (const shift of ["M", "T", "N"] as const) {
      const needed = minCov[shift] ?? 1;
      const current = countCoverageOnDay(state.grid, d, shift);
      if (current >= needed) continue;

      const gap = needed - current;
      let filled = 0;

      // Find which week this day belongs to
      const weekIdx = Math.floor((d - 1) / 7);
      const week = weeks[weekIdx];
      if (!week) continue;

      // Find FDAs resting on gap day whose rest can be moved
      const swapCandidates = state.input.employees.filter(e => {
        if (e.role === "FOM" || e.role === "AFOM" || e.role === "NIGHT_SHIFT_AGENT" || e.role === "GEX") return false;
        const cell = state.grid[e.id][d];
        if (cell.code !== "D") return false; // must be resting
        if (absenceCodes2.has(cell.code)) return false;
        if (cell.source === "petition_a") return false;
        // Check if assigning the needed shift is HC-feasible (ignoring weekly hours
        // since we'll swap, keeping total hours the same)
        const feasible = hardConstraints.filter(hc => hc.id !== "HC_MAX_WEEKLY_HOURS" && hc.id !== "HC_LOCKED").every(hc =>
          hc.isFeasible(state, e.id, d, shift)
        );
        return feasible;
      });

      for (const emp of swapCandidates) {
        if (filled >= gap) break;

        // Find a day in the same week where this employee works and coverage
        // on that shift type exceeds minimum (so we can safely remove them)
        let swapDay: number | null = null;
        let bestExcess = 0;

        for (const wd of week) {
          if (wd === d) continue;
          const wdCell = state.grid[emp.id][wd];
          if (!isWorkingShift(wdCell.code)) continue;
          if (wdCell.locked) continue;

          // What shift type does this cell contribute to?
          const wdShift = wdCell.code;
          const wdCat: "M" | "T" | "N" | null =
            (wdShift === "N") ? "N" :
            (wdShift === "T" || wdShift === "12x20") ? "T" :
            (wdShift === "M" || wdShift === "9x17" || wdShift === "11x19") ? "M" : null;

          if (!wdCat) continue;
          const wdCoverage = countCoverageOnDay(state.grid, wd, wdCat);
          const wdNeeded = minCov[wdCat] ?? 1;
          const excess = wdCoverage - wdNeeded;
          if (excess <= 0) continue; // can't remove without creating a new gap

          // Verify HC feasibility of the rest day at swap position
          // (12h rest rule etc.)
          const origCode = wdCell.code;
          const origHours = wdCell.hours;
          const origStart = wdCell.startTime;
          const origEnd = wdCell.endTime;
          const origSource = wdCell.source;
          // Temporarily set to D to check feasibility of adjacent days
          wdCell.code = "D";
          wdCell.hours = 0;
          wdCell.startTime = "00:00";
          wdCell.endTime = "00:00";

          // Check that making this day rest doesn't violate 12h for adjacent days
          let restFeasible = true;
          // No specific 12h check needed for rest days — they don't have end times
          // But we should ensure the target gap day assignment is still feasible
          const gapFeasible = hardConstraints.filter(hc => hc.id !== "HC_MAX_WEEKLY_HOURS" && hc.id !== "HC_LOCKED").every(hc =>
            hc.isFeasible(state, emp.id, d, shift)
          );

          // Restore
          wdCell.code = origCode;
          wdCell.hours = origHours;
          wdCell.startTime = origStart;
          wdCell.endTime = origEnd;
          wdCell.source = origSource;

          if (!gapFeasible) continue;

          if (excess > bestExcess) {
            bestExcess = excess;
            swapDay = wd;
          }
        }

        if (swapDay !== null) {
          // Execute the swap: employee rests on swapDay, works shift on gap day d
          assignCell(state, emp.id, swapDay, "D", "engine", false);
          state.grid[emp.id][d].locked = false;
          assignCell(state, emp.id, d, shift, "coverage");
          filled++;
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
