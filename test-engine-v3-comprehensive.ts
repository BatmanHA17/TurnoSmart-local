/**
 * TurnoSmart® — SMART Engine v3.0 — Comprehensive Test Suite
 *
 * Tests individual hard constraints, soft constraints, and validation checks.
 * Run: npx tsx test-engine-v3-comprehensive.ts
 */

import { runPipeline } from "./src/utils/engine/pipeline";
import { runSolverV3 } from "./src/utils/engine/v3";
import {
  hc12hRest, hcNightThenRest, hcMaxWeeklyHours, hcLockedCells,
  hcRoleAllowedShifts, hcAbsenceImmovable, hcHardPetitions, hcGuardOnlyChief,
} from "./src/utils/engine/v3/hardConstraints";
import {
  scErgonomicRotation, scShiftEquity, scCoverageBonus, scWeekendEquity,
  scSoftPetitions, scFomAfomMirror, scNightCoverageEquity,
} from "./src/utils/engine/v3/softConstraints";
import {
  ck12hRest, ckConsecutiveRest, ckMinCoverage, ckWeeklyHours,
  ckNightRest, ckEquityDeviation, ckFomAfomMirror,
} from "./src/utils/engine/v3/validationChecks";
import type {
  EngineInput, EngineEmployee, EngineConstraints, GenerationPeriod,
  WeightProfile, DailyOccupancy, EquityBalance,
} from "./src/utils/engine/types";
import type { SolverState, SolverCell, MutableEquity } from "./src/utils/engine/v3/solverTypes";
import { SPAIN_LABOR_LAW, WEIGHT_PROFILES, SHIFT_TIMES } from "./src/utils/engine/constants";
import { isWorkingShift } from "./src/utils/engine/helpers";

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.log(`  ✗ ${testName}`);
  }
}

function makeEquity(): EquityBalance {
  return {
    morningCount: 0, afternoonCount: 0, nightCount: 0,
    weekendWorkedCount: 0, longWeekendCount: 0, holidayWorkedCount: 0,
    petitionSatisfactionRatio: 0, nightCoverageCount: 0,
  };
}

function makeEmployee(
  id: string, name: string, role: EngineEmployee["role"],
  rotationType: EngineEmployee["rotationType"], seniorityLevel: number,
  opts: Partial<EngineEmployee> = {}
): EngineEmployee {
  return {
    id, name, role, rotationType,
    seniorityLevel: seniorityLevel as EngineEmployee["seniorityLevel"],
    weeklyHours: 40, contractUnits: 1.0,
    absences: [], petitions: [], equityBalance: makeEquity(),
    ...opts,
  };
}

function makeCell(code: string, locked = false): SolverCell {
  const shift = SHIFT_TIMES[code];
  return {
    code,
    startTime: shift?.startTime ?? "00:00",
    endTime: shift?.endTime ?? "00:00",
    hours: shift?.hours ?? 0,
    locked,
    source: "engine",
  };
}

function makeMutableEquity(): MutableEquity {
  return { M: 0, T: 0, N: 0, weekendWorked: 0, nightCoverage: 0, petitionsSatisfied: 0, petitionsTotal: 0 };
}

// Build a minimal SolverState for unit testing individual constraints
function buildTestState(overrides: {
  employees?: EngineEmployee[];
  grid?: Record<string, Record<number, SolverCell>>;
  totalDays?: number;
  startDate?: string;
  minCoverage?: { M: number; T: number; N: number };
  equity?: Map<string, MutableEquity>;
}): SolverState {
  const employees = overrides.employees ?? [
    makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
  ];
  const totalDays = overrides.totalDays ?? 7;

  const input: EngineInput = {
    period: {
      startDate: overrides.startDate ?? "2026-04-06", // Monday
      endDate: "2026-04-12",
      totalDays,
      totalWeeks: Math.ceil(totalDays / 7),
      year: 2026, month: 4,
    },
    employees,
    constraints: {
      law: SPAIN_LABOR_LAW,
      ergonomicRotation: true,
      fairWeekendDistribution: true,
      occupancyBasedStaffing: false,
      minCoveragePerShift: overrides.minCoverage ?? { M: 2, T: 2, N: 1 },
      reinforcementThreshold: 40,
      fomAfomMirror: true,
      optionalCriteria: [],
      allowForceMajeureOverride: false,
      existingShiftsPolicy: "overwrite",
    },
    occupancy: [],
    weights: WEIGHT_PROFILES[0],
  };

  // Default grid: all rest days
  const grid: Record<string, Record<number, SolverCell>> = {};
  for (const emp of employees) {
    grid[emp.id] = {};
    for (let d = 1; d <= totalDays; d++) {
      grid[emp.id][d] = makeCell("D");
    }
  }
  // Apply overrides
  if (overrides.grid) {
    for (const [empId, days] of Object.entries(overrides.grid)) {
      if (!grid[empId]) grid[empId] = {};
      for (const [dayStr, cell] of Object.entries(days)) {
        grid[empId][Number(dayStr)] = cell;
      }
    }
  }

  const empMap = new Map(employees.map(e => [e.id, e]));
  const equity = overrides.equity ?? new Map(employees.map(e => [e.id, makeMutableEquity()]));

  return { input, grid, employees: empMap, equity, violations: [] };
}

// ═══════════════════════════════════════════════════════════════════════════
// HARD CONSTRAINT TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(70));
console.log("HARD CONSTRAINT TESTS");
console.log("=".repeat(70));

// --- HC-01: 12h rest ---
console.log("\n--- HC-01: 12h Rest Between Shifts ---");
{
  const state = buildTestState({
    grid: {
      "fda-1": {
        1: makeCell("T"),  // T ends 23:00
        // Day 2: trying M (starts 07:00) → only 8h gap → violation
      },
    },
  });
  assert(!hc12hRest.isFeasible(state, "fda-1", 2, "M"), "T→M violates 12h rest");
  assert(hc12hRest.isFeasible(state, "fda-1", 2, "T"), "T→T is OK (16h gap)");
  assert(hc12hRest.isFeasible(state, "fda-1", 2, "N"), "T→N is OK (24h gap)");
  assert(hc12hRest.isFeasible(state, "fda-1", 2, "D"), "T→D always OK");

  // N→M: N ends 07:00, M starts 07:00 → 0h gap
  state.grid["fda-1"][1] = makeCell("N");
  assert(!hc12hRest.isFeasible(state, "fda-1", 2, "M"), "N→M violates 12h rest");

  // M→T: M ends 15:00, T starts 15:00 → 0h gap, but same-day not applicable (next day T = 24h gap)
  state.grid["fda-1"][1] = makeCell("M");
  assert(hc12hRest.isFeasible(state, "fda-1", 2, "T"), "M→T is OK (next day, 24h gap)");
  assert(hc12hRest.isFeasible(state, "fda-1", 2, "M"), "M→M is OK (24h gap)");
}

// --- HC-02: Night → rest (ROTA_COMPLETO only) ---
console.log("\n--- HC-02: Night → Rest for ROTA_COMPLETO ---");
{
  const fda = makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const nightAgent = makeEmployee("na-1", "Night Agent", "NIGHT_SHIFT_AGENT", "FIJO_NO_ROTA", 1);

  // FDA: N on day 1 → day 2 must be rest or N
  const state = buildTestState({
    employees: [fda, nightAgent],
    grid: {
      "fda-1": { 1: makeCell("N") },
      "na-1": {},
    },
  });
  assert(!hcNightThenRest.isFeasible(state, "fda-1", 2, "M"), "FDA: N→M blocked");
  assert(!hcNightThenRest.isFeasible(state, "fda-1", 2, "T"), "FDA: N→T blocked");
  assert(hcNightThenRest.isFeasible(state, "fda-1", 2, "D"), "FDA: N→D allowed");
  assert(hcNightThenRest.isFeasible(state, "fda-1", 2, "N"), "FDA: N→N allowed (16h gap)");

  // Night Agent: exempt from this constraint
  state.grid["na-1"][1] = makeCell("N");
  assert(hcNightThenRest.isFeasible(state, "na-1", 2, "N"), "Night Agent: N→N always OK");

  // Max 2 consecutive Ns for ROTA_COMPLETO
  state.grid["fda-1"][1] = makeCell("N");
  state.grid["fda-1"][2] = makeCell("N");
  assert(!hcNightThenRest.isFeasible(state, "fda-1", 3, "N"), "FDA: 3 consecutive Ns blocked");
}

// --- HC-03: Max weekly hours ---
console.log("\n--- HC-03: Max Weekly Hours (40h) ---");
{
  const state = buildTestState({
    grid: {
      "fda-1": {
        1: makeCell("M"), // 8h
        2: makeCell("M"), // 8h
        3: makeCell("M"), // 8h
        4: makeCell("M"), // 8h
        5: makeCell("M"), // 8h = 40h total
      },
    },
  });
  // Already at 40h, can't add another 8h shift
  assert(!hcMaxWeeklyHours.isFeasible(state, "fda-1", 6, "M"), "40h + 8h shift blocked");
  assert(hcMaxWeeklyHours.isFeasible(state, "fda-1", 6, "D"), "Rest day always OK at 40h");

  // At 32h, can add one more 8h
  state.grid["fda-1"][5] = makeCell("D");
  assert(hcMaxWeeklyHours.isFeasible(state, "fda-1", 6, "M"), "32h + 8h = 40h allowed");
}

// --- HC-04: Locked cells ---
console.log("\n--- HC-04: Locked Cells ---");
{
  const state = buildTestState({
    grid: {
      "fda-1": {
        1: makeCell("M", true), // locked
        2: makeCell("D", false),
      },
    },
  });
  assert(!hcLockedCells.isFeasible(state, "fda-1", 1, "T"), "Cannot change locked cell");
  assert(hcLockedCells.isFeasible(state, "fda-1", 2, "T"), "Can change unlocked cell");
}

// --- HC-05: Role-allowed shifts ---
console.log("\n--- HC-05: Role-Allowed Shifts ---");
{
  const fom = makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3);
  const gex = makeEmployee("gex-1", "GEX", "GEX", "ROTA_PARCIAL", 1);
  const night = makeEmployee("na-1", "Night Agent", "NIGHT_SHIFT_AGENT", "FIJO_NO_ROTA", 1);
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  const state = buildTestState({ employees: [fom, gex, night, fda] });

  // FOM: M, T, G allowed; N not allowed
  assert(hcRoleAllowedShifts.isFeasible(state, "fom-1", 1, "M"), "FOM can do M");
  assert(hcRoleAllowedShifts.isFeasible(state, "fom-1", 1, "G"), "FOM can do G");
  assert(!hcRoleAllowedShifts.isFeasible(state, "fom-1", 1, "N"), "FOM cannot do N");
  assert(hcRoleAllowedShifts.isFeasible(state, "fom-1", 1, "D"), "D always allowed for any role");

  // GEX: 9x17, 12x20 allowed; M, T, N not allowed
  assert(hcRoleAllowedShifts.isFeasible(state, "gex-1", 1, "9x17"), "GEX can do 9x17");
  assert(hcRoleAllowedShifts.isFeasible(state, "gex-1", 1, "12x20"), "GEX can do 12x20");
  assert(!hcRoleAllowedShifts.isFeasible(state, "gex-1", 1, "M"), "GEX cannot do M");
  assert(!hcRoleAllowedShifts.isFeasible(state, "gex-1", 1, "N"), "GEX cannot do N");

  // Night Agent: only N
  assert(hcRoleAllowedShifts.isFeasible(state, "na-1", 1, "N"), "Night Agent can do N");
  assert(!hcRoleAllowedShifts.isFeasible(state, "na-1", 1, "M"), "Night Agent cannot do M");

  // FDA: M, T, N, 11x19
  assert(hcRoleAllowedShifts.isFeasible(state, "fda-1", 1, "M"), "FDA can do M");
  assert(hcRoleAllowedShifts.isFeasible(state, "fda-1", 1, "T"), "FDA can do T");
  assert(hcRoleAllowedShifts.isFeasible(state, "fda-1", 1, "N"), "FDA can do N");
  assert(hcRoleAllowedShifts.isFeasible(state, "fda-1", 1, "11x19"), "FDA can do 11x19");
  assert(!hcRoleAllowedShifts.isFeasible(state, "fda-1", 1, "G"), "FDA cannot do G");
}

// --- HC-06: Absence immovable ---
console.log("\n--- HC-06: Absence Immovable ---");
{
  const state = buildTestState({
    grid: {
      "fda-1": {
        1: { ...makeCell("V"), locked: true }, // locked vacation
        2: makeCell("D"),
      },
    },
  });
  assert(!hcAbsenceImmovable.isFeasible(state, "fda-1", 1, "M"), "Cannot overwrite locked V with M");
  assert(hcAbsenceImmovable.isFeasible(state, "fda-1", 1, "V"), "V→V same code allowed");
  assert(hcAbsenceImmovable.isFeasible(state, "fda-1", 2, "M"), "Unlocked D can be changed");
}

// --- HC-07: Hard petitions ---
console.log("\n--- HC-07: Hard Petitions (Type A) ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1, {
    petitions: [
      { id: "p1", type: "A", status: "approved", days: [3], requestedShift: "D", priority: 1 },
      { id: "p2", type: "A", status: "approved", days: [5], avoidShift: "N", priority: 1 },
    ],
  });
  const state = buildTestState({ employees: [fda] });

  assert(!hcHardPetitions.isFeasible(state, "fda-1", 3, "M"), "Hard petition day 3: M blocked (wants D)");
  assert(hcHardPetitions.isFeasible(state, "fda-1", 3, "D"), "Hard petition day 3: D allowed");
  assert(!hcHardPetitions.isFeasible(state, "fda-1", 5, "N"), "Hard petition day 5: N blocked (avoids N)");
  assert(hcHardPetitions.isFeasible(state, "fda-1", 5, "M"), "Hard petition day 5: M allowed");
  assert(hcHardPetitions.isFeasible(state, "fda-1", 1, "M"), "No petition on day 1: anything OK");
}

// --- HC-08: Guard only FOM ---
console.log("\n--- HC-08: Guard Only FOM ---");
{
  const fom = makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3);
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const state = buildTestState({ employees: [fom, fda] });

  assert(hcGuardOnlyChief.isFeasible(state, "fom-1", 1, "G"), "FOM can do G");
  assert(!hcGuardOnlyChief.isFeasible(state, "fda-1", 1, "G"), "FDA cannot do G");
  assert(!hcGuardOnlyChief.isFeasible(state, "fda-1", 1, "GT"), "FDA cannot do GT");
  assert(hcGuardOnlyChief.isFeasible(state, "fda-1", 1, "M"), "Non-G shifts always OK");
}

// ═══════════════════════════════════════════════════════════════════════════
// SOFT CONSTRAINT TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(70));
console.log("SOFT CONSTRAINT TESTS");
console.log("=".repeat(70));

// --- SC-01: Ergonomic rotation ---
console.log("\n--- SC-01: Ergonomic Rotation ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const state = buildTestState({
    employees: [fda],
    grid: { "fda-1": { 1: makeCell("M") } },
  });

  const forwardScore = scErgonomicRotation.score(state, "fda-1", 2, "T"); // M→T forward
  const sameScore = scErgonomicRotation.score(state, "fda-1", 2, "M"); // M→M same
  const backwardScore = scErgonomicRotation.score(state, "fda-1", 2, "N"); // M→N (2 forward steps, but actually it's evaluated differently)

  assert(forwardScore > 0, `M→T (forward) has positive score (${forwardScore})`);
  assert(sameScore > 0, `M→M (same) has positive score (${sameScore})`);
  assert(forwardScore > sameScore, "Forward rotation scores higher than same-shift");

  // T→N forward
  state.grid["fda-1"][1] = makeCell("T");
  const tnScore = scErgonomicRotation.score(state, "fda-1", 2, "N");
  assert(tnScore > 0, `T→N (forward) has positive score (${tnScore})`);

  // N→M: in ergonomic sequence [M,T,N], N→M is (idx 2 +1) %3 = 0 = forward wrap
  state.grid["fda-1"][1] = makeCell("N");
  const nmScore = scErgonomicRotation.score(state, "fda-1", 2, "M");
  assert(nmScore > 0, `N→M (forward wrap in ergonomic sequence) has positive score (${nmScore})`);
}

// --- SC-02: Shift equity ---
console.log("\n--- SC-02: Shift Equity M/T/N ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const eq = makeMutableEquity();
  eq.M = 5; eq.T = 2; eq.N = 2; // More M → should prefer T or N

  const state = buildTestState({
    employees: [fda],
    equity: new Map([["fda-1", eq]]),
  });

  const mScore = scShiftEquity.score(state, "fda-1", 1, "M");
  const tScore = scShiftEquity.score(state, "fda-1", 1, "T");
  const nScore = scShiftEquity.score(state, "fda-1", 1, "N");

  assert(tScore > mScore, `T score (${tScore}) > M score (${mScore}) when M is overrepresented`);
  assert(nScore > mScore, `N score (${nScore}) > M score (${mScore}) when M is overrepresented`);
  assert(tScore === nScore, `T and N scores equal (${tScore}) when both are underrepresented`);
}

// --- SC-04: Weekend equity ---
console.log("\n--- SC-04: Weekend Equity ---");
{
  // Day 6 = Saturday (startDate 2026-04-06 is Monday → day 6 = Saturday)
  const fda1 = makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const fda2 = makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  const eq1 = makeMutableEquity();
  eq1.weekendWorked = 3;
  const eq2 = makeMutableEquity();
  eq2.weekendWorked = 1;

  const state = buildTestState({
    employees: [fda1, fda2],
    equity: new Map([["fda-1", eq1], ["fda-2", eq2]]),
  });

  const score1 = scWeekendEquity.score(state, "fda-1", 6, "M"); // worked more weekends
  const score2 = scWeekendEquity.score(state, "fda-2", 6, "M"); // worked fewer weekends

  assert(score2 > score1, `FDA with fewer weekends gets higher score (${score2} > ${score1})`);
}

// --- SC-05: Soft petitions ---
console.log("\n--- SC-05: Soft Petitions ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1, {
    petitions: [
      { id: "p1", type: "B", status: "approved", days: [3], requestedShift: "M", priority: 1 },
      { id: "p2", type: "B", status: "approved", days: [5], avoidShift: "N", priority: 2 },
    ],
  });
  const state = buildTestState({ employees: [fda] });

  const matchScore = scSoftPetitions.score(state, "fda-1", 3, "M"); // matches petition
  const noMatchScore = scSoftPetitions.score(state, "fda-1", 3, "T"); // doesn't match
  assert(matchScore > 0, `Matching soft petition gives positive score (${matchScore})`);
  assert(matchScore > noMatchScore, "Matching petition scores higher than non-match");

  const avoidScore = scSoftPetitions.score(state, "fda-1", 5, "N"); // avoids this
  const okScore = scSoftPetitions.score(state, "fda-1", 5, "M"); // not avoided
  assert(avoidScore < 0, `Avoid-shift petition gives negative score (${avoidScore})`);
  assert(okScore > avoidScore, "Non-avoided shift scores higher");
}

// --- SC-06: FOM-AFOM mirror ---
console.log("\n--- SC-06: FOM-AFOM Mirror ---");
{
  const fom = makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3);
  const afom = makeEmployee("afom-1", "AFOM", "AFOM", "COBERTURA", 2);

  const state = buildTestState({
    employees: [fom, afom],
    grid: {
      "fom-1": { 1: makeCell("M") }, // FOM=M → AFOM should be T
      "afom-1": {},
    },
  });

  const correctScore = scFomAfomMirror.score(state, "afom-1", 1, "T"); // correct mirror
  const wrongScore = scFomAfomMirror.score(state, "afom-1", 1, "M"); // wrong mirror

  assert(correctScore > 0, `Correct mirror (FOM=M→AFOM=T) positive score (${correctScore})`);
  assert(wrongScore < 0, `Wrong mirror (FOM=M→AFOM=M) negative score (${wrongScore})`);

  // FOM=G → AFOM should be M
  state.grid["fom-1"][2] = makeCell("G");
  const guardMirror = scFomAfomMirror.score(state, "afom-1", 2, "M");
  assert(guardMirror > 0, `FOM=G → AFOM=M gives positive score (${guardMirror})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION CHECK TESTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(70));
console.log("VALIDATION CHECK TESTS");
console.log("=".repeat(70));

// --- CK-01: 12h rest validation ---
console.log("\n--- CK-01: 12h Rest Validation ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const state = buildTestState({
    employees: [fda],
    grid: {
      "fda-1": {
        1: makeCell("T"), 2: makeCell("M"), // T→M violation
        3: makeCell("M"), 4: makeCell("T"), // M→T OK
        5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
      },
    },
  });

  const violations = ck12hRest.validate(state);
  // T→M on day 1→2, and potentially N→M from Night Agent excluded, but other transitions may trigger
  assert(violations.length >= 1, `Finds at least 1 violation: T→M (got ${violations.length})`);
  assert(violations[0]?.day === 1, "First violation on day 1 (T→M)");
  assert(violations[0]?.severity === "critical", "12h rest violation is critical");
}

// --- CK-02: Consecutive rest ---
console.log("\n--- CK-02: Consecutive Rest Days ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  // Good: 2 consecutive rest days (days 6-7)
  const stateGood = buildTestState({
    employees: [fda],
    grid: {
      "fda-1": {
        1: makeCell("M"), 2: makeCell("T"), 3: makeCell("M"),
        4: makeCell("T"), 5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
      },
    },
  });
  const goodV = ckConsecutiveRest.validate(stateGood);
  assert(goodV.length === 0, "No violation with 2 consecutive rest days");

  // Bad: rest on days 1 and 4 (not consecutive)
  const stateBad = buildTestState({
    employees: [fda],
    grid: {
      "fda-1": {
        1: makeCell("D"), 2: makeCell("M"), 3: makeCell("T"),
        4: makeCell("D"), 5: makeCell("M"), 6: makeCell("T"), 7: makeCell("M"),
      },
    },
  });
  const badV = ckConsecutiveRest.validate(stateBad);
  assert(badV.length >= 1, `Non-consecutive rest generates violation (got ${badV.length})`);
}

// --- CK-03: Minimum coverage ---
console.log("\n--- CK-03: Minimum Coverage ---");
{
  const fda1 = makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const fda2 = makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  // Only 1 person on M when 2 needed
  const state = buildTestState({
    employees: [fda1, fda2],
    minCoverage: { M: 2, T: 2, N: 1 },
    grid: {
      "fda-1": {
        1: makeCell("M"), 2: makeCell("M"), 3: makeCell("M"),
        4: makeCell("M"), 5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
      },
      "fda-2": {
        1: makeCell("T"), 2: makeCell("T"), 3: makeCell("T"),
        4: makeCell("T"), 5: makeCell("T"), 6: makeCell("D"), 7: makeCell("D"),
      },
    },
  });

  const violations = ckMinCoverage.validate(state);
  // M needs 2, only has 1 per day → 5 M violations (days 1-5) + N needs 1, has 0 → 7 violations etc.
  assert(violations.length > 0, `Coverage violations found (${violations.length})`);
  const mViolations = violations.filter(v => v.description.startsWith("M"));
  assert(mViolations.length > 0, "M coverage violations detected");
}

// --- CK-04: Weekly hours validation ---
console.log("\n--- CK-04: Weekly Hours ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  // 6 work days × 8h = 48h > 40h
  const state = buildTestState({
    employees: [fda],
    grid: {
      "fda-1": {
        1: makeCell("M"), 2: makeCell("T"), 3: makeCell("N"),
        4: makeCell("M"), 5: makeCell("T"), 6: makeCell("M"), 7: makeCell("D"),
      },
    },
  });

  const violations = ckWeeklyHours.validate(state);
  assert(violations.length === 1, `48h/week generates 1 violation (got ${violations.length})`);
  assert(violations[0]?.description.includes("48h"), "Description mentions 48h");
}

// --- CK-05: Night → rest (ROTA_COMPLETO) ---
console.log("\n--- CK-05: Night → Rest Validation ---");
{
  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const night = makeEmployee("na-1", "Night Agent", "NIGHT_SHIFT_AGENT", "FIJO_NO_ROTA", 1);

  const state = buildTestState({
    employees: [fda, night],
    grid: {
      "fda-1": {
        1: makeCell("N"), 2: makeCell("M"), // N→M violation
        3: makeCell("M"), 4: makeCell("D"),
        5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
      },
      "na-1": {
        1: makeCell("N"), 2: makeCell("N"), // Night Agent: N→N is fine (exempt)
        3: makeCell("N"), 4: makeCell("N"),
        5: makeCell("N"), 6: makeCell("D"), 7: makeCell("D"),
      },
    },
  });

  const violations = ckNightRest.validate(state);
  assert(violations.length === 1, `1 violation: FDA N→M (got ${violations.length})`);
  assert(violations[0]?.employeeId === "fda-1", "Violation is for FDA, not Night Agent");
}

// --- CK-06: Equity deviation ---
console.log("\n--- CK-06: Equity Deviation ---");
{
  const fda1 = makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const fda2 = makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  // FDA 1: all M, FDA 2: all T → deviation > 3
  const state = buildTestState({
    employees: [fda1, fda2],
    totalDays: 14,
    grid: {
      "fda-1": {
        1: makeCell("M"), 2: makeCell("M"), 3: makeCell("M"),
        4: makeCell("M"), 5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
        8: makeCell("M"), 9: makeCell("M"), 10: makeCell("M"),
        11: makeCell("M"), 12: makeCell("M"), 13: makeCell("D"), 14: makeCell("D"),
      },
      "fda-2": {
        1: makeCell("T"), 2: makeCell("T"), 3: makeCell("T"),
        4: makeCell("T"), 5: makeCell("T"), 6: makeCell("D"), 7: makeCell("D"),
        8: makeCell("T"), 9: makeCell("T"), 10: makeCell("T"),
        11: makeCell("T"), 12: makeCell("T"), 13: makeCell("D"), 14: makeCell("D"),
      },
    },
  });

  const violations = ckEquityDeviation.validate(state);
  assert(violations.length > 0, `Equity deviation detected (${violations.length} violations)`);
}

// --- CK-09: FOM-AFOM mirror validation ---
console.log("\n--- CK-09: FOM-AFOM Mirror Validation ---");
{
  const fom = makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3);
  const afom = makeEmployee("afom-1", "AFOM", "AFOM", "COBERTURA", 2);

  const state = buildTestState({
    employees: [fom, afom],
    grid: {
      "fom-1": {
        1: makeCell("M"), 2: makeCell("M"), 3: makeCell("M"),
        4: makeCell("M"), 5: makeCell("M"), 6: makeCell("D"), 7: makeCell("D"),
      },
      "afom-1": {
        1: makeCell("T"), 2: makeCell("M"), // Day 2: FOM=M, AFOM=M → should be T
        3: makeCell("T"), 4: makeCell("T"),
        5: makeCell("T"), 6: makeCell("D"), 7: makeCell("D"),
      },
    },
  });

  const violations = ckFomAfomMirror.validate(state);
  // Day 2: FOM=M→AFOM=M (should be T). Days 6-7: FOM=D→AFOM=D (should be M each)
  assert(violations.length >= 1, `Mirror violations found (got ${violations.length})`);
  const day2V = violations.find(v => v.day === 2);
  assert(!!day2V, "Violation on day 2 where AFOM doesn't mirror FOM");
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST: Full v3 solver run
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(70));
console.log("INTEGRATION TESTS");
console.log("=".repeat(70));

console.log("\n--- Full v3 solver: 2-week schedule, 7 employees ---");
{
  const period: GenerationPeriod = {
    startDate: "2026-04-06",
    endDate: "2026-04-19",
    totalDays: 14,
    totalWeeks: 2,
    year: 2026, month: 4,
  };

  const employees: EngineEmployee[] = [
    makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3, { fixedShift: "M" }),
    makeEmployee("afom-1", "AFOM", "AFOM", "COBERTURA", 2),
    makeEmployee("na-1", "Night Agent", "NIGHT_SHIFT_AGENT", "FIJO_NO_ROTA", 1, { fixedShift: "N" }),
    makeEmployee("gex-1", "GEX", "GEX", "ROTA_PARCIAL", 1),
    makeEmployee("fda-1", "FDA 1", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
    makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
    makeEmployee("fda-3", "FDA 3", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
  ];

  const input: EngineInput = {
    period,
    employees,
    constraints: {
      law: SPAIN_LABOR_LAW,
      ergonomicRotation: true,
      fairWeekendDistribution: true,
      occupancyBasedStaffing: false,
      minCoveragePerShift: { M: 2, T: 2, N: 1 },
      reinforcementThreshold: 40,
      fomAfomMirror: true,
      optionalCriteria: [],
      allowForceMajeureOverride: false,
      existingShiftsPolicy: "overwrite",
    },
    occupancy: [],
    weights: WEIGHT_PROFILES[0],
  };

  const output = runSolverV3(input);

  assert(output.meta.engineVersion === "3.0", "Engine version is 3.0");
  assert(output.score.overall >= 50, `Score >= 50 (got ${output.score.overall})`);
  assert(output.score.overall <= 100, `Score <= 100 (got ${output.score.overall})`);
  assert(output.score.coverage >= 80, `Coverage >= 80% (got ${output.score.coverage})`);

  // Check all employees have schedules
  for (const emp of employees) {
    assert(!!output.schedules[emp.id], `Schedule exists for ${emp.name}`);
    let workDays = 0;
    for (let d = 1; d <= period.totalDays; d++) {
      if (isWorkingShift(output.schedules[emp.id][d]?.code)) workDays++;
    }
    // FDAs should work ~10 days in 2 weeks
    if (emp.rotationType === "ROTA_COMPLETO") {
      assert(workDays >= 8 && workDays <= 12, `${emp.name}: ${workDays} work days in 2 weeks (expected 8-12)`);
    }
  }

  // Check no critical legal violations (12h rest, night→rest)
  const criticals = output.violations.filter(v => v.severity === "critical" && v.category === "legal");
  assert(criticals.length === 0, `No critical legal violations (got ${criticals.length})`);

  console.log(`  Score: ${output.score.overall}/100 (${output.score.trafficLight})`);
  console.log(`  Duration: ${output.meta.durationMs}ms`);
  console.log(`  Violations: ${output.violations.length} total, ${criticals.length} critical`);
}

// --- v2→v3 fallback test ---
console.log("\n--- v2→v3 Fallback: pipeline defaults to v3 ---");
{
  const period: GenerationPeriod = {
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    totalDays: 7,
    totalWeeks: 1,
    year: 2026, month: 4,
  };

  const employees: EngineEmployee[] = [
    makeEmployee("fom-1", "FOM", "FOM", "FIJO_NO_ROTA", 3, { fixedShift: "M" }),
    makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
    makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1),
  ];

  const input: EngineInput = {
    period,
    employees,
    constraints: {
      law: SPAIN_LABOR_LAW,
      ergonomicRotation: true,
      fairWeekendDistribution: true,
      occupancyBasedStaffing: false,
      minCoveragePerShift: { M: 1, T: 1, N: 1 },
      reinforcementThreshold: 40,
      fomAfomMirror: true,
      optionalCriteria: [],
      allowForceMajeureOverride: false,
      existingShiftsPolicy: "overwrite",
    },
    occupancy: [],
    weights: WEIGHT_PROFILES[0],
  };

  // Default (v3)
  const v3Output = runPipeline(input);
  assert(v3Output.meta.engineVersion === "3.0", "Default pipeline uses v3");

  // Explicit v2 fallback
  const v2Output = runPipeline(input, false);
  assert(v2Output.meta.engineVersion === "2.0", "Explicit v2 fallback works");

  // Both should produce valid output
  assert(v3Output.score.overall >= 0, "v3 output has valid score");
  assert(v2Output.score.overall >= 0, "v2 output has valid score");
}

// --- Configurable shifts test ---
console.log("\n--- Configurable Shifts: Sector override ---");
{
  const period: GenerationPeriod = {
    startDate: "2026-04-06",
    endDate: "2026-04-12",
    totalDays: 7,
    totalWeeks: 1,
    year: 2026, month: 4,
  };

  const fda = makeEmployee("fda-1", "FDA", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);
  const fda2 = makeEmployee("fda-2", "FDA 2", "FRONT_DESK_AGENT", "ROTA_COMPLETO", 1);

  // Retail: 6h shifts instead of 8h
  const retailShifts = {
    M: { code: "M", startTime: "09:00", endTime: "15:00", hours: 6, label: "Mañana" },
    T: { code: "T", startTime: "15:00", endTime: "21:00", hours: 6, label: "Tarde" },
  };

  const input: EngineInput = {
    period,
    employees: [fda, fda2],
    constraints: {
      law: { ...SPAIN_LABOR_LAW, maxWeeklyHours: 36 }, // 6h × 6 days
      ergonomicRotation: true,
      fairWeekendDistribution: true,
      occupancyBasedStaffing: false,
      minCoveragePerShift: { M: 1, T: 1, N: 0 },
      reinforcementThreshold: 40,
      fomAfomMirror: false,
      optionalCriteria: [],
      allowForceMajeureOverride: false,
      existingShiftsPolicy: "overwrite",
    },
    occupancy: [],
    weights: WEIGHT_PROFILES[0],
    shiftConfig: retailShifts,
  };

  const output = runSolverV3(input);
  assert(output.meta.engineVersion === "3.0", "Sector-specific config uses v3");
  assert(output.score.overall >= 0, `Score valid with custom shifts (${output.score.overall})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n" + "=".repeat(70));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(`  ✗ ${f}`);
  }
}
console.log("=".repeat(70));

process.exit(failed > 0 ? 1 : 0);
