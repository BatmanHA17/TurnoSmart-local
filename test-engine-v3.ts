/**
 * Smoke test: SMART Engine v3 solver
 * Run: npx tsx test-engine-v3.ts
 */

import { runSolverV3 } from "./src/utils/engine/v3/solver";
import { WEIGHT_PROFILES, SPAIN_LABOR_LAW } from "./src/utils/engine/constants";
import { buildGenerationPeriod } from "./src/utils/engine/helpers";
import type { EngineInput, EngineEmployee, EquityBalance } from "./src/utils/engine/types";

// --- Setup test data (mirrors seed: 7 employees by role) ---

const emptyEquity: EquityBalance = {
  morningCount: 0, afternoonCount: 0, nightCount: 0,
  weekendWorkedCount: 0, longWeekendCount: 0, holidayWorkedCount: 0,
  petitionSatisfactionRatio: 0, nightCoverageCount: 0,
};

const employees: EngineEmployee[] = [
  {
    id: "fom-1", name: "FOM", role: "FOM", rotationType: "FIJO_NO_ROTA",
    seniorityLevel: 3, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
  {
    id: "afom-1", name: "AFOM", role: "AFOM", rotationType: "COBERTURA",
    seniorityLevel: 2, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
  {
    id: "night-1", name: "Night Agent", role: "NIGHT_SHIFT_AGENT", rotationType: "FIJO_NO_ROTA",
    seniorityLevel: 1, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
  {
    id: "gex-1", name: "GEX", role: "GEX", rotationType: "ROTA_PARCIAL",
    seniorityLevel: 1, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
  {
    id: "fda-1", name: "FDA 1", role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO",
    seniorityLevel: 3, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [
      { id: "p1", employeeId: "fda-1", type: "B", days: [5], requestedShift: "M", status: "approved", priority: 2 },
    ],
    equityBalance: { ...emptyEquity },
  },
  {
    id: "fda-2", name: "FDA 2", role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO",
    seniorityLevel: 2, weeklyHours: 40, contractUnits: 1,
    absences: [{ day: 10, code: "V" }, { day: 11, code: "V" }],
    petitions: [],
    equityBalance: { ...emptyEquity },
  },
  {
    id: "fda-3", name: "FDA 3", role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO",
    seniorityLevel: 1, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
  {
    id: "fda-4", name: "FDA 4", role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO",
    seniorityLevel: 0, weeklyHours: 40, contractUnits: 1,
    absences: [], petitions: [], equityBalance: { ...emptyEquity },
  },
];

const period = buildGenerationPeriod(2026, 4); // April 2026

const input: EngineInput = {
  period,
  employees,
  constraints: {
    law: SPAIN_LABOR_LAW,
    ergonomicRotation: true,
    fairWeekendDistribution: true,
    occupancyBasedStaffing: true,
    minCoveragePerShift: { M: 2, T: 2, N: 1 },
    reinforcementThreshold: 40,
    fomAfomMirror: true,
    optionalCriteria: [],
    allowForceMajeureOverride: false,
    existingShiftsPolicy: "overwrite",
  },
  occupancy: [],
  weights: WEIGHT_PROFILES[0], // Balanced
  fomGuardiaDays: [6, 13], // FOM has guard duty on Saturdays (day 6 and 13)
};

// --- Run solver 3x ---
console.log("=== SMART Engine v3.0 Smoke Test ===\n");
console.log(`Period: ${period.startDate} → ${period.endDate} (${period.totalDays} days, ${period.totalWeeks} weeks)`);
console.log(`Employees: ${employees.length}`);
console.log(`Guard days: ${input.fomGuardiaDays?.join(", ")} (Saturdays)\n`);

for (const profile of WEIGHT_PROFILES) {
  const testInput = { ...input, weights: profile };
  const t0 = performance.now();
  const output = runSolverV3(testInput);
  const elapsed = Math.round(performance.now() - t0);

  console.log(`--- ${profile.label} (${profile.name}) — ${elapsed}ms ---`);
  console.log(`  Score: ${output.score.overall}/100 [${output.score.trafficLight}]`);
  console.log(`  Legal: ${output.score.legal} | Coverage: ${output.score.coverage} | Equity: ${output.score.equity}`);
  console.log(`  Petitions: ${output.score.petitions} | Ergonomics: ${output.score.ergonomics} | Continuity: ${output.score.continuity}`);
  console.log(`  Violations: ${output.violations.length} (${output.violations.filter(v => v.severity === "critical").length} critical)`);

  // Print grid summary per employee
  for (const emp of employees) {
    const schedule = output.schedules[emp.id];
    if (!schedule) continue;
    const codes: string[] = [];
    let workDays = 0;
    let restDays = 0;
    for (let d = 1; d <= period.totalDays; d++) {
      const code = schedule[d]?.code ?? "?";
      codes.push(code.padEnd(5));
      if (["M", "T", "N", "G", "GT", "9x17", "12x20", "11x19"].includes(code)) workDays++;
      else restDays++;
    }
    console.log(`  ${emp.name.padEnd(14)} ${workDays}W/${restDays}R | ${codes.join(" ")}`);
  }

  // Print violations if any
  if (output.violations.length > 0) {
    console.log(`  Violations:`);
    for (const v of output.violations.slice(0, 10)) {
      console.log(`    [${v.severity}] ${v.rule}: ${v.description} (emp: ${v.employeeId || "all"}, day: ${v.day ?? "-"})`);
    }
    if (output.violations.length > 10) {
      console.log(`    ... and ${output.violations.length - 10} more`);
    }
  }

  // Verify key rules
  const checks: string[] = [];

  // Check 1: FOM has M on weekdays, D or G on weekends
  const fomSchedule = output.schedules["fom-1"];
  let fomOK = true;
  for (let d = 1; d <= period.totalDays; d++) {
    const code = fomSchedule[d]?.code;
    const isGuardDay = input.fomGuardiaDays?.includes(d);
    // We just check it's a valid assignment, not deeply
    if (!code) { fomOK = false; break; }
  }
  checks.push(fomOK ? "✅ FOM schedule valid" : "❌ FOM schedule invalid");

  // Check 2: Night Agent has N (or D for rest)
  const naSchedule = output.schedules["night-1"];
  let naCodes = new Set<string>();
  for (let d = 1; d <= period.totalDays; d++) {
    naCodes.add(naSchedule[d]?.code ?? "?");
  }
  const naOK = Array.from(naCodes).every(c => c === "N" || c === "D");
  checks.push(naOK ? "✅ Night Agent: only N/D" : `❌ Night Agent has: ${Array.from(naCodes).join(",")}`);

  // Check 3: FDA vacation respected
  const fda2D10 = output.schedules["fda-2"]?.[10]?.code;
  const fda2D11 = output.schedules["fda-2"]?.[11]?.code;
  checks.push(fda2D10 === "V" && fda2D11 === "V"
    ? "✅ FDA2 vacation days 10-11 respected"
    : `❌ FDA2 day10=${fda2D10} day11=${fda2D11}`);

  // Check 4: No 12h violations in critical
  const crit12h = output.violations.filter(v => v.rule === "12H_REST" && v.severity === "critical");
  checks.push(crit12h.length === 0
    ? "✅ No 12h rest violations"
    : `❌ ${crit12h.length} 12h rest violations`);

  // Check 5: Coverage
  const covViolations = output.violations.filter(v => v.rule === "MIN_COVERAGE");
  checks.push(covViolations.length === 0
    ? "✅ All coverage met"
    : `⚠️  ${covViolations.length} coverage gaps`);

  // Check 6: FDA work ~5 days per week
  for (const fdaId of ["fda-1", "fda-2", "fda-3"]) {
    const sched = output.schedules[fdaId];
    let work = 0;
    for (let d = 1; d <= period.totalDays; d++) {
      const c = sched[d]?.code;
      if (c && ["M", "T", "N", "11x19"].includes(c)) work++;
    }
    const expected = Math.round(period.totalWeeks * 5);
    const fdaName = employees.find(e => e.id === fdaId)?.name ?? fdaId;
    checks.push(Math.abs(work - expected) <= 3
      ? `✅ ${fdaName}: ${work} work days (expected ~${expected})`
      : `⚠️  ${fdaName}: ${work} work days (expected ~${expected})`);
  }

  console.log(`  Checks:`);
  for (const c of checks) console.log(`    ${c}`);

  // Show staffing recommendation (only once, for first profile)
  if (output.staffingRecommendation && profile === WEIGHT_PROFILES[0]) {
    const rec = output.staffingRecommendation;
    console.log(`\n  📊 Staffing Recommendation:`);
    console.log(`    ${rec.message}`);
    console.log(`    Min ROTA_COMPLETO: ${rec.minRotaCompleto} | Current: ${rec.currentRotaCompleto} | Sufficient: ${rec.isSufficient ? "✅" : "❌"}`);
  }
  console.log();
}

console.log("=== Test complete ===");
