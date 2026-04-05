/**
 * TurnoSmart® — SMART Engine v3.0 — Validation Checks
 *
 * Post-generation audit. Maps to CK criteria.
 * Each check scans the final grid and returns violations.
 */

import type { ValidationCheck, SolverState } from "./solverTypes";
import type { AuditViolation } from "../types";
import {
  isWorkingShift, violates12hRest, weeklyHours, getWeeks,
  periodDayOfWeekISO,
} from "../helpers";
import { FOM_AFOM_MIRROR } from "../constants";
import { countCoverageOnDay } from "./coverageHelper";

// ---------------------------------------------------------------------------
// CK-01: 12h rest
// ---------------------------------------------------------------------------
export const ck12hRest: ValidationCheck = {
  id: "CK_12H_REST",
  name: "Descanso 12h",
  severity: "blocker",
  validate(state) {
    const violations: AuditViolation[] = [];
    const total = state.input.period.totalDays;
    for (const emp of state.input.employees) {
      if (emp.role === "NIGHT_SHIFT_AGENT") continue;
      for (let d = 1; d < total; d++) {
        const today = state.grid[emp.id][d]?.code;
        const tomorrow = state.grid[emp.id][d + 1]?.code;
        if (today && tomorrow && isWorkingShift(today) && isWorkingShift(tomorrow)) {
          if (violates12hRest(today, tomorrow)) {
            violations.push({
              employeeId: emp.id,
              day: d,
              rule: "12H_REST",
              severity: "critical",
              description: `${today}→${tomorrow}: menos de 12h de descanso`,
              overridable: true,
              category: "legal",
            });
          }
        }
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-02: Consecutive rest days
// ---------------------------------------------------------------------------
export const ckConsecutiveRest: ValidationCheck = {
  id: "CK_CONSECUTIVE_REST",
  name: "Libres consecutivos",
  severity: "error",
  validate(state) {
    const violations: AuditViolation[] = [];
    const weeks = getWeeks(state.input.period.totalDays);

    for (const emp of state.input.employees) {
      for (const week of weeks) {
        const restDays = week.filter(d => {
          const c = state.grid[emp.id][d]?.code;
          return c === "D" || c === "V" || c === "E" || c === "PM" || c === "PC" || c === "DB" || c === "DG";
        });

        if (restDays.length < 2) {
          // FOM in guardia weeks gets G + D = 2 "non-work" days but only 1 is rest
          const hasGuardia = week.some(d => state.grid[emp.id][d]?.code === "G" || state.grid[emp.id][d]?.code === "GT");
          if (hasGuardia && restDays.length >= 1) {
            // Guardia counts as a special duty day, not a violation
          } else {
            violations.push({
              employeeId: emp.id,
              day: week[0],
              rule: "MIN_FREE_DAYS",
              severity: "critical",
              description: `Solo ${restDays.length} día(s) libre en semana ${week[0]}-${week[week.length - 1]}`,
              overridable: true,
              category: "legal",
            });
          }
          continue;
        }

        // Check consecutiveness (including cross-week boundary)
        let hasConsecutive = false;
        for (let i = 0; i < restDays.length - 1; i++) {
          if (restDays[i + 1] - restDays[i] === 1) {
            hasConsecutive = true;
            break;
          }
        }
        if (!hasConsecutive) {
          const firstDay = week[0];
          const lastDay = week[week.length - 1];
          const isRestCode = (c: string | undefined) =>
            c === "D" || c === "V" || c === "E" || c === "PM" || c === "PC" || c === "DB" || c === "DG";
          if (firstDay > 1 && restDays.includes(firstDay) && isRestCode(state.grid[emp.id][firstDay - 1]?.code)) {
            hasConsecutive = true;
          }
          if (!hasConsecutive && lastDay < state.input.period.totalDays && restDays.includes(lastDay) && isRestCode(state.grid[emp.id][lastDay + 1]?.code)) {
            hasConsecutive = true;
          }
        }
        if (!hasConsecutive && restDays.length >= 2) {
          // FOM guardia weeks: non-consecutive rest is expected (G sits between)
          const hasGuardia = week.some(d => state.grid[emp.id][d]?.code === "G" || state.grid[emp.id][d]?.code === "GT");
          if (!hasGuardia) {
            violations.push({
              employeeId: emp.id,
              day: restDays[0],
              rule: "CONSECUTIVE_REST",
              severity: "warning",
              description: `Libres no consecutivos en semana ${week[0]}-${week[week.length - 1]}`,
              overridable: true,
              category: "legal",
            });
          }
        }
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-03: Minimum coverage
// ---------------------------------------------------------------------------
export const ckMinCoverage: ValidationCheck = {
  id: "CK_MIN_COVERAGE",
  name: "Cobertura mínima",
  severity: "blocker",
  validate(state) {
    const violations: AuditViolation[] = [];
    const total = state.input.period.totalDays;
    const minCov = state.input.constraints.minCoveragePerShift;

    for (let d = 1; d <= total; d++) {
      for (const shift of ["M", "T", "N"] as const) {
        const needed = minCov[shift] ?? 1;
        const actual = countCoverageOnDay(state.grid, d, shift);
        if (actual < needed) {
          violations.push({
            employeeId: "",
            day: d,
            rule: "MIN_COVERAGE",
            severity: "critical",
            description: `${shift} día ${d}: ${actual}/${needed} personas`,
            overridable: false,
            category: "coverage",
          });
        }
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-04: Weekly hours
// ---------------------------------------------------------------------------
export const ckWeeklyHours: ValidationCheck = {
  id: "CK_WEEKLY_HOURS",
  name: "Horas semanales",
  severity: "error",
  validate(state) {
    const violations: AuditViolation[] = [];
    const weeks = getWeeks(state.input.period.totalDays);
    const maxH = state.input.constraints.law.maxWeeklyHours;

    for (const emp of state.input.employees) {
      for (const week of weeks) {
        const hours = weeklyHours(state.grid[emp.id] as any, week);
        if (hours > maxH) {
          violations.push({
            employeeId: emp.id,
            day: week[0],
            rule: "MAX_WEEKLY_HOURS",
            severity: "warning",
            description: `${hours}h en semana ${week[0]}-${week[week.length - 1]} (máx ${maxH}h)`,
            overridable: true,
            category: "legal",
          });
        }
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-05: Night → rest (ROTA_COMPLETO only)
// ---------------------------------------------------------------------------
export const ckNightRest: ValidationCheck = {
  id: "CK_NIGHT_REST",
  name: "Noche → libre",
  severity: "blocker",
  validate(state) {
    const violations: AuditViolation[] = [];
    const total = state.input.period.totalDays;

    for (const emp of state.input.employees) {
      if (emp.role === "NIGHT_SHIFT_AGENT") continue;
      for (let d = 1; d < total; d++) {
        if (state.grid[emp.id][d]?.code === "N") {
          const next = state.grid[emp.id][d + 1]?.code;
          // N→N is allowed (16h gap), only N→M/T/etc is a violation
          if (next && isWorkingShift(next) && next !== "N") {
            violations.push({
              employeeId: emp.id,
              day: d,
              rule: "NIGHT_THEN_REST",
              severity: "critical",
              description: `N→${next}: día siguiente a noche debe ser libre`,
              overridable: true,
              category: "legal",
            });
          }
        }
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-06: Equity deviation
// ---------------------------------------------------------------------------
export const ckEquityDeviation: ValidationCheck = {
  id: "CK_EQUITY",
  name: "Equidad M/T/N",
  severity: "warning",
  validate(state) {
    const violations: AuditViolation[] = [];
    const rotaEmps = state.input.employees.filter(e => e.rotationType === "ROTA_COMPLETO");
    if (rotaEmps.length < 2) return violations;

    // Count shifts per employee in this period
    const counts = new Map<string, { M: number; T: number; N: number }>();
    for (const emp of rotaEmps) {
      const c = { M: 0, T: 0, N: 0 };
      for (let d = 1; d <= state.input.period.totalDays; d++) {
        const code = state.grid[emp.id][d]?.code;
        if (code === "M") c.M++;
        else if (code === "T") c.T++;
        else if (code === "N") c.N++;
      }
      counts.set(emp.id, c);
    }

    // Check deviation for each shift type
    for (const shift of ["M", "T", "N"] as const) {
      const vals = Array.from(counts.values()).map(c => c[shift]);
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      if (max - min > 3) {
        violations.push({
          employeeId: "",
          rule: "EQUITY_DEVIATION",
          severity: "warning",
          description: `Desequilibrio ${shift}: ±${max - min} (tolerancia ±3)`,
          overridable: true,
          category: "equity",
        });
      }
    }

    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-09: FOM-AFOM mirror consistency
// ---------------------------------------------------------------------------
export const ckFomAfomMirror: ValidationCheck = {
  id: "CK_MIRROR",
  name: "Espejo FOM-AFOM",
  severity: "error",
  validate(state) {
    const violations: AuditViolation[] = [];
    const fom = state.input.employees.find(e => e.role === "FOM");
    const afom = state.input.employees.find(e => e.role === "AFOM");
    if (!fom || !afom) return violations;

    for (let d = 1; d <= state.input.period.totalDays; d++) {
      const fomCode = state.grid[fom.id][d]?.code;
      const afomCode = state.grid[afom.id][d]?.code;
      if (!fomCode || !afomCode) continue;

      const expected = FOM_AFOM_MIRROR[fomCode];
      if (expected && afomCode !== expected) {
        violations.push({
          employeeId: afom.id,
          day: d,
          rule: "FOM_AFOM_MIRROR",
          severity: "warning",
          description: `FOM=${fomCode} → AFOM debería ser ${expected}, tiene ${afomCode}`,
          overridable: true,
          category: "ergonomics",
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-10: Max consecutive working days (max 6, Spain hospitality law)
// ---------------------------------------------------------------------------
const MAX_CONSECUTIVE_WORK_DAYS = 6;

export const ckMaxConsecutiveWork: ValidationCheck = {
  id: "CK_MAX_CONSECUTIVE_WORK",
  name: "Máximo días laborables consecutivos",
  severity: "error",
  validate(state) {
    const violations: AuditViolation[] = [];
    const total = state.input.period.totalDays;

    for (const emp of state.input.employees) {
      let runStart = 0;
      let runLength = 0;

      for (let d = 1; d <= total; d++) {
        const code = state.grid[emp.id][d]?.code;
        if (code && isWorkingShift(code)) {
          if (runLength === 0) runStart = d;
          runLength++;
        } else {
          if (runLength > MAX_CONSECUTIVE_WORK_DAYS) {
            violations.push({
              employeeId: emp.id,
              day: runStart,
              rule: "MAX_CONSECUTIVE_WORK",
              severity: "error",
              description: `${runLength} días laborables consecutivos (días ${runStart}-${runStart + runLength - 1}, máx ${MAX_CONSECUTIVE_WORK_DAYS})`,
              overridable: true,
              category: "legal",
            });
          }
          runLength = 0;
        }
      }
      // Check tail run
      if (runLength > MAX_CONSECUTIVE_WORK_DAYS) {
        violations.push({
          employeeId: emp.id,
          day: runStart,
          rule: "MAX_CONSECUTIVE_WORK",
          severity: "error",
          description: `${runLength} días laborables consecutivos (días ${runStart}-${total}, máx ${MAX_CONSECUTIVE_WORK_DAYS})`,
          overridable: true,
          category: "legal",
        });
      }
    }

    return violations;
  },
};

// ---------------------------------------------------------------------------
// CK-11: FDS Largo (long weekend) — at least one block of 4+ consecutive
//        rest days per month for every non-FOM employee (OP-01 perk)
// ---------------------------------------------------------------------------
export const ckFdsLargo: ValidationCheck = {
  id: "CK_FDS_LARGO",
  name: "FDS Largo mensual",
  severity: "warning",
  validate(state) {
    // Only check when the fdsLargo criterion is enabled
    if (!state.input.constraints.fdsLargo) return [];

    const violations: AuditViolation[] = [];
    const total = state.input.period.totalDays;

    for (const emp of state.input.employees) {
      if (emp.role === "FOM") continue;

      // Scan for any block of 4+ consecutive rest days
      let maxConsecutiveRest = 0;
      let currentRun = 0;

      for (let d = 1; d <= total; d++) {
        const code = state.grid[emp.id][d]?.code;
        const isRest =
          code === "D" || code === "V" || code === "E" ||
          code === "PM" || code === "PC" || code === "DB" || code === "DG";

        if (isRest) {
          currentRun++;
          if (currentRun > maxConsecutiveRest) {
            maxConsecutiveRest = currentRun;
          }
        } else {
          currentRun = 0;
        }
      }

      if (maxConsecutiveRest < 4) {
        violations.push({
          employeeId: emp.id,
          rule: "FDS_LARGO_MISSING",
          severity: "warning",
          description: `${emp.name}: sin FDS Largo (máx ${maxConsecutiveRest} días libres consecutivos, se requieren 4+)`,
          overridable: true,
          category: "ergonomics",
        });
      }
    }

    return violations;
  },
};

// ---------------------------------------------------------------------------
// ALL VALIDATION CHECKS
// ---------------------------------------------------------------------------
export const ALL_VALIDATION_CHECKS: ValidationCheck[] = [
  ck12hRest,
  ckConsecutiveRest,
  ckMinCoverage,
  ckWeeklyHours,
  ckNightRest,
  ckEquityDeviation,
  ckFomAfomMirror,
  ckMaxConsecutiveWork,
  ckFdsLargo,
];
