/**
 * TurnoSmart® — SMART Engine v2.0 — Unit Tests
 *
 * Tests puros del motor, sin React ni Supabase.
 * Cubren: helpers, pipeline, roles, rest days, rotation, audit, score, alternatives.
 */

import { describe, it, expect } from "vitest";
import {
  // Helpers
  daysInMonth,
  dayOfWeekISO,
  isWeekend,
  buildGenerationPeriod,
  getWeeks,
  hoursBetween,
  shiftHours,
  isWorkingShift,
  isAbsence,
  violates12hRest,
  restHoursBetween,
  makeAssignment,
  initGrid,
  countShiftOnDay,
  // Constants
  SPAIN_LABOR_LAW,
  ROLE_CONFIGS,
  SHIFT_TIMES,
  WEIGHT_PROFILES,
  FOM_AFOM_MIRROR,
  ENGINE_VERSION,
  // Pipeline
  runPipeline,
  generateAlternatives,
  // Equity
  calculateEquitySnapshot,
  calculateEquityDeviations,
  extractLastWeek,
} from "@/utils/engine";
import type {
  EngineEmployee,
  EngineConstraints,
  EngineInput,
  GenerationPeriod,
  WeightProfile,
  EquityBalance,
} from "@/utils/engine";

// ---------------------------------------------------------------------------
// TEST HELPERS
// ---------------------------------------------------------------------------

function emptyEquity(): EquityBalance {
  return {
    morningCount: 0, afternoonCount: 0, nightCount: 0,
    weekendWorkedCount: 0, longWeekendCount: 0, holidayWorkedCount: 0,
    petitionSatisfactionRatio: 0, nightCoverageCount: 0,
  };
}

function makeTestEmployee(id: string, role: EngineEmployee["role"] = "FRONT_DESK_AGENT"): EngineEmployee {
  const config = ROLE_CONFIGS[role];
  return {
    id,
    name: `Employee ${id}`,
    role,
    rotationType: config.rotationType,
    seniorityLevel: config.seniorityLevel,
    weeklyHours: 40,
    contractUnits: 5,
    absences: [],
    petitions: [],
    equityBalance: emptyEquity(),
  };
}

function defaultConstraints(): EngineConstraints {
  return {
    law: { ...SPAIN_LABOR_LAW },
    ergonomicRotation: true,
    fairWeekendDistribution: true,
    occupancyBasedStaffing: false,
    minCoveragePerShift: 1,
    reinforcementThreshold: 40,
    fomAfomMirror: true,
    optionalCriteria: [],
    allowForceMajeureOverride: false,
    existingShiftsPolicy: "overwrite",
  };
}

function makeInput(employees: EngineEmployee[], weeks: 1 | 2 | 3 | 4 = 4): EngineInput {
  return {
    period: buildGenerationPeriod(2026, 4, weeks),
    employees,
    constraints: defaultConstraints(),
    occupancy: [],
    weights: WEIGHT_PROFILES[0], // balanced
  };
}

// ---------------------------------------------------------------------------
// HELPERS TESTS
// ---------------------------------------------------------------------------

describe("engine helpers", () => {
  it("daysInMonth returns correct values", () => {
    expect(daysInMonth(2026, 4)).toBe(30); // abril
    expect(daysInMonth(2026, 2)).toBe(28); // febrero no bisiesto
    expect(daysInMonth(2024, 2)).toBe(29); // febrero bisiesto
  });

  it("dayOfWeekISO: monday=0, sunday=6", () => {
    // 2026-04-06 es lunes
    expect(dayOfWeekISO(2026, 4, 6)).toBe(0);
    // 2026-04-12 es domingo
    expect(dayOfWeekISO(2026, 4, 12)).toBe(6);
  });

  it("isWeekend detects Saturday and Sunday", () => {
    expect(isWeekend(2026, 4, 11)).toBe(true);  // sábado
    expect(isWeekend(2026, 4, 12)).toBe(true);  // domingo
    expect(isWeekend(2026, 4, 13)).toBe(false);  // lunes
  });

  it("buildGenerationPeriod creates correct period", () => {
    const period = buildGenerationPeriod(2026, 4, 4);
    expect(period.totalWeeks).toBe(4);
    expect(period.totalDays).toBe(28);
    expect(period.year).toBe(2026);
    expect(period.month).toBe(4);
  });

  it("getWeeks splits days into 7-day groups", () => {
    const weeks = getWeeks(28);
    expect(weeks).toHaveLength(4);
    expect(weeks[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(weeks[3]).toEqual([22, 23, 24, 25, 26, 27, 28]);
  });

  it("hoursBetween calculates correctly", () => {
    expect(hoursBetween("07:00", "15:00")).toBe(8);
    expect(hoursBetween("15:00", "23:00")).toBe(8);
    expect(hoursBetween("23:00", "07:00")).toBe(8); // noche cruza medianoche
  });

  it("shiftHours returns correct hours", () => {
    expect(shiftHours("M")).toBe(8);
    expect(shiftHours("T")).toBe(8);
    expect(shiftHours("N")).toBe(8);
    expect(shiftHours("G")).toBe(12);
    expect(shiftHours("D")).toBe(0);
    expect(shiftHours("14x22")).toBe(8); // ad-hoc
  });

  it("isWorkingShift identifies work vs rest", () => {
    expect(isWorkingShift("M")).toBe(true);
    expect(isWorkingShift("T")).toBe(true);
    expect(isWorkingShift("N")).toBe(true);
    expect(isWorkingShift("D")).toBe(false);
    expect(isWorkingShift("V")).toBe(false);
    expect(isWorkingShift("14x22")).toBe(true); // ad-hoc is work
  });

  it("isAbsence identifies absence codes", () => {
    expect(isAbsence("D")).toBe(true);
    expect(isAbsence("V")).toBe(true);
    expect(isAbsence("E")).toBe(true);
    expect(isAbsence("PM")).toBe(true);
    expect(isAbsence("M")).toBe(false);
  });
});

describe("12h rest validation", () => {
  it("T→M violates 12h rest", () => {
    expect(violates12hRest("T", "M")).toBe(true); // 23:00→07:00 = 8h < 12h
  });

  it("M→T does NOT violate 12h rest", () => {
    expect(violates12hRest("M", "T")).toBe(false); // 15:00→15:00 = 24h
  });

  it("T→T does NOT violate", () => {
    expect(violates12hRest("T", "T")).toBe(false);
  });

  it("M→M does NOT violate", () => {
    expect(violates12hRest("M", "M")).toBe(false);
  });

  it("rest day → any shift does NOT violate", () => {
    expect(violates12hRest("D", "M")).toBe(false);
    expect(violates12hRest("V", "T")).toBe(false);
  });

  it("restHoursBetween T→M = 8h", () => {
    expect(restHoursBetween("T", "M")).toBe(8);
  });

  it("restHoursBetween M→T = 24h", () => {
    expect(restHoursBetween("M", "T")).toBe(24);
  });
});

describe("grid helpers", () => {
  it("initGrid creates grid with D for all days", () => {
    const grid = initGrid(["emp1", "emp2"], 7);
    expect(Object.keys(grid)).toHaveLength(2);
    expect(grid["emp1"][1].code).toBe("D");
    expect(grid["emp1"][7].code).toBe("D");
  });

  it("makeAssignment creates correct assignment for M", () => {
    const a = makeAssignment("M");
    expect(a.code).toBe("M");
    expect(a.startTime).toBe("07:00");
    expect(a.endTime).toBe("15:00");
    expect(a.hours).toBe(8);
    expect(a.source).toBe("engine");
    expect(a.forced).toBe(false);
    expect(a.locked).toBe(false);
  });

  it("countShiftOnDay counts correctly", () => {
    const grid = initGrid(["a", "b", "c"], 7);
    grid["a"][1] = makeAssignment("M");
    grid["b"][1] = makeAssignment("M");
    grid["c"][1] = makeAssignment("T");
    expect(countShiftOnDay(grid, 1, "M")).toBe(2);
    expect(countShiftOnDay(grid, 1, "T")).toBe(1);
    expect(countShiftOnDay(grid, 1, "N")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CONSTANTS TESTS
// ---------------------------------------------------------------------------

describe("engine constants", () => {
  it("SPAIN_LABOR_LAW has correct values", () => {
    expect(SPAIN_LABOR_LAW.minRestBetweenShiftsHours).toBe(12);
    expect(SPAIN_LABOR_LAW.minFreeDaysPerWeek).toBe(2);
    expect(SPAIN_LABOR_LAW.maxWeeklyHours).toBe(40);
    expect(SPAIN_LABOR_LAW.prohibitAfternoonToMorning).toBe(true);
  });

  it("ROLE_CONFIGS has all 5 roles", () => {
    expect(Object.keys(ROLE_CONFIGS)).toHaveLength(5);
    expect(ROLE_CONFIGS.FOM.rotationType).toBe("FIJO_NO_ROTA");
    expect(ROLE_CONFIGS.AFOM.rotationType).toBe("COBERTURA");
    expect(ROLE_CONFIGS.NIGHT_SHIFT_AGENT.rotationType).toBe("FIJO_NO_ROTA");
    expect(ROLE_CONFIGS.GEX.rotationType).toBe("ROTA_PARCIAL");
    expect(ROLE_CONFIGS.FRONT_DESK_AGENT.rotationType).toBe("ROTA_COMPLETO");
  });

  it("FOM_AFOM_MIRROR maps correctly", () => {
    expect(FOM_AFOM_MIRROR["M"]).toBe("T");  // FOM mañana → AFOM tarde
    expect(FOM_AFOM_MIRROR["T"]).toBe("M");  // FOM tarde → AFOM mañana
    expect(FOM_AFOM_MIRROR["G"]).toBe("M");  // FOM guardia → AFOM cubre
  });

  it("WEIGHT_PROFILES has 3 profiles", () => {
    expect(WEIGHT_PROFILES).toHaveLength(3);
    expect(WEIGHT_PROFILES[0].name).toBe("balanced");
    expect(WEIGHT_PROFILES[1].name).toBe("petitions");
    expect(WEIGHT_PROFILES[2].name).toBe("coverage");
  });

  it("SHIFT_TIMES has all expected codes", () => {
    expect(SHIFT_TIMES["M"].hours).toBe(8);
    expect(SHIFT_TIMES["N"].hours).toBe(8);
    expect(SHIFT_TIMES["G"].hours).toBe(12);
    expect(SHIFT_TIMES["11x19"].hours).toBe(8);
  });

  it("ENGINE_VERSION is 2.0", () => {
    expect(ENGINE_VERSION).toBe("2.0");
  });
});

// ---------------------------------------------------------------------------
// PIPELINE TESTS
// ---------------------------------------------------------------------------

describe("runPipeline — basic", () => {
  it("generates schedules for all employees", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("afom", "AFOM"),
      makeTestEmployee("night", "NIGHT_SHIFT_AGENT"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);
    const output = runPipeline(input);

    expect(Object.keys(output.schedules)).toHaveLength(5);
    expect(output.meta.engineVersion).toBe("2.0");
    expect(output.meta.totalEmployees).toBe(5);
    expect(output.score.overall).toBeGreaterThanOrEqual(0);
    expect(output.score.overall).toBeLessThanOrEqual(100);
    expect(["green", "orange", "red"]).toContain(output.score.trafficLight);
  });

  it("FOM gets fixed shift every working day", () => {
    const fom = makeTestEmployee("fom", "FOM");
    const input = makeInput([fom, makeTestEmployee("fd1")]);
    const output = runPipeline(input);
    const fomSchedule = output.schedules["fom"];

    // FOM should have M (default fixed) on most days
    const mDays = Object.values(fomSchedule).filter((a) => a.code === "M").length;
    expect(mDays).toBeGreaterThan(0);
  });

  it("AFOM mirrors FOM (when FOM=M, AFOM=T)", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("afom", "AFOM"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);
    const output = runPipeline(input);

    // Check a few days where FOM=M → AFOM should be T
    const fomSched = output.schedules["fom"];
    const afomSched = output.schedules["afom"];
    let mirrorCount = 0;
    for (let d = 1; d <= input.period.totalDays; d++) {
      if (fomSched[d]?.code === "M" && afomSched[d]?.code === "T") mirrorCount++;
    }
    expect(mirrorCount).toBeGreaterThan(0);
  });

  it("Night Shift Agent gets N on working days", () => {
    const employees = [
      makeTestEmployee("night", "NIGHT_SHIFT_AGENT"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);
    const output = runPipeline(input);
    const nightSched = output.schedules["night"];

    const nDays = Object.values(nightSched).filter((a) => a.code === "N").length;
    expect(nDays).toBeGreaterThan(0);
  });

  it("Front Desk Agents have at least 2 rest days per week", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);
    const output = runPipeline(input);
    const weeks = getWeeks(input.period.totalDays);

    // Only check ROTA_COMPLETO (FOM has fixed shifts, rest handled differently)
    for (const emp of employees.filter(e => e.rotationType === "ROTA_COMPLETO")) {
      const sched = output.schedules[emp.id];
      for (const week of weeks) {
        const restDays = week.filter((d) => {
          const code = sched[d]?.code;
          return code === "D" || code === "V" || code === "E";
        }).length;
        expect(restDays).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("no T→M violations in output", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("afom", "AFOM"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);
    const output = runPipeline(input);

    // Check no employee has T one day and M the next
    for (const emp of employees) {
      const sched = output.schedules[emp.id];
      for (let d = 1; d < input.period.totalDays; d++) {
        const today = sched[d]?.code;
        const tomorrow = sched[d + 1]?.code;
        if (today === "T" && tomorrow === "M") {
          // This should show up as a violation but shouldn't happen
          // unless forced by coverage
          const hasPijama = output.violations.some(
            (v) => v.rule === "AFTERNOON_TO_MORNING" && v.employeeId === emp.id && v.day === d
          );
          // If it happened, it should be flagged
          if (!hasPijama) {
            expect(today).not.toBe("T"); // will fail with useful message
          }
        }
      }
    }
  });

  it("score breakdown has all 6 categories", () => {
    const input = makeInput([makeTestEmployee("fd1"), makeTestEmployee("fd2")]);
    const output = runPipeline(input);

    expect(output.score).toHaveProperty("legal");
    expect(output.score).toHaveProperty("coverage");
    expect(output.score).toHaveProperty("equity");
    expect(output.score).toHaveProperty("petitions");
    expect(output.score).toHaveProperty("ergonomics");
    expect(output.score).toHaveProperty("continuity");
    expect(output.score).toHaveProperty("overall");
    expect(output.score).toHaveProperty("trafficLight");
  });

  it("completes in less than 2 seconds for 7 employees", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("afom", "AFOM"),
      makeTestEmployee("night", "NIGHT_SHIFT_AGENT"),
      makeTestEmployee("gex", "GEX"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd3", "FRONT_DESK_AGENT"),
    ];
    const input = makeInput(employees);

    const start = performance.now();
    runPipeline(input);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// ALTERNATIVES TESTS
// ---------------------------------------------------------------------------

describe("generateAlternatives", () => {
  it("generates 3 alternatives with different labels", () => {
    const employees = [
      makeTestEmployee("fom", "FOM"),
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
    ];
    const result = generateAlternatives({
      period: buildGenerationPeriod(2026, 4, 4),
      employees,
      constraints: defaultConstraints(),
      occupancy: [],
    });

    expect(result.alternatives).toHaveLength(3);
    const labels = result.alternatives.map((a) => a.label);
    expect(labels).toContain("Equilibrio");
    expect(labels).toContain("Peticiones");
    expect(labels).toContain("Cobertura");
  });

  it("alternatives are sorted by score descending", () => {
    const employees = [
      makeTestEmployee("fd1", "FRONT_DESK_AGENT"),
      makeTestEmployee("fd2", "FRONT_DESK_AGENT"),
    ];
    const result = generateAlternatives({
      period: buildGenerationPeriod(2026, 4, 4),
      employees,
      constraints: defaultConstraints(),
      occupancy: [],
    });

    for (let i = 0; i < result.alternatives.length - 1; i++) {
      expect(result.alternatives[i].output.score.overall)
        .toBeGreaterThanOrEqual(result.alternatives[i + 1].output.score.overall);
    }
  });

  it("recommendedIndex is 0 (highest score)", () => {
    const result = generateAlternatives({
      period: buildGenerationPeriod(2026, 4, 2),
      employees: [makeTestEmployee("fd1"), makeTestEmployee("fd2")],
      constraints: defaultConstraints(),
      occupancy: [],
    });
    expect(result.recommendedIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// EQUITY TRACKER TESTS
// ---------------------------------------------------------------------------

describe("equityTracker", () => {
  it("calculateEquitySnapshot counts M/T/N correctly", () => {
    const employees = [makeTestEmployee("fd1"), makeTestEmployee("fd2")];
    const input = makeInput(employees, 1);
    const output = runPipeline(input);

    const snapshot = calculateEquitySnapshot(
      output.schedules, employees, input.period.totalDays,
      input.period.year, input.period.month
    );

    expect(snapshot["fd1"]).toBeDefined();
    const eq = snapshot["fd1"];
    expect(eq.morningCount + eq.afternoonCount + eq.nightCount).toBeGreaterThan(0);
  });

  it("extractLastWeek returns up to 7 days", () => {
    const employees = [makeTestEmployee("fd1")];
    const input = makeInput(employees, 2);
    const output = runPipeline(input);

    const lastWeek = extractLastWeek(output.schedules, input.period.totalDays);
    expect(lastWeek["fd1"].length).toBeLessThanOrEqual(7);
    expect(lastWeek["fd1"].length).toBeGreaterThan(0);
  });

  it("calculateEquityDeviations returns deviations for rotating employees", () => {
    const employees = [makeTestEmployee("fd1"), makeTestEmployee("fd2"), makeTestEmployee("fd3")];
    const input = makeInput(employees, 4);
    const output = runPipeline(input);
    const snapshot = calculateEquitySnapshot(
      output.schedules, employees, input.period.totalDays,
      input.period.year, input.period.month
    );
    const deviations = calculateEquityDeviations(snapshot, employees);

    expect(deviations).toHaveLength(3);
    for (const dev of deviations) {
      expect(["balanced", "warning", "critical"]).toContain(dev.status);
    }
  });
});

// ---------------------------------------------------------------------------
// ABSENCES & PETITIONS
// ---------------------------------------------------------------------------

describe("absences and petitions", () => {
  it("vacation days are locked and respected", () => {
    const emp = makeTestEmployee("fd1");
    emp.absences = [
      { day: 5, code: "V" },
      { day: 6, code: "V" },
      { day: 7, code: "V" },
    ];
    const input = makeInput([emp, makeTestEmployee("fd2")]);
    const output = runPipeline(input);

    expect(output.schedules["fd1"][5].code).toBe("V");
    expect(output.schedules["fd1"][6].code).toBe("V");
    expect(output.schedules["fd1"][7].code).toBe("V");
    expect(output.schedules["fd1"][5].locked).toBe(true);
  });

  it("petition type A is locked", () => {
    const emp = makeTestEmployee("fd1");
    emp.petitions = [{
      id: "pet1",
      employeeId: "fd1",
      type: "A",
      days: [10, 11],
      requestedShift: "D",
      status: "approved",
      priority: 1,
    }];
    const input = makeInput([emp, makeTestEmployee("fd2")]);
    const output = runPipeline(input);

    expect(output.schedules["fd1"][10].code).toBe("D");
    expect(output.schedules["fd1"][10].locked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// GEX
// ---------------------------------------------------------------------------

describe("GEX assignment", () => {
  it("GEX gets 9x17 or 12x20, not M/T/N", () => {
    const gex = makeTestEmployee("gex", "GEX");
    const input = makeInput([gex, makeTestEmployee("fd1")]);
    const output = runPipeline(input);

    for (let d = 1; d <= input.period.totalDays; d++) {
      const code = output.schedules["gex"][d]?.code;
      if (code && code !== "D" && code !== "V" && code !== "E") {
        expect(["9x17", "12x20", "11x19"]).toContain(code);
      }
    }
  });
});
