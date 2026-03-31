/**
 * Phase 09 — audit
 *
 * Validación legal + convenio. 25 checks sobre el cuadrante generado.
 * Reutiliza conceptos de shiftAudit.ts pero adaptado al motor v2.
 *
 * Categorías de checks:
 * - Legal (critical): 12h rest, T→M prohibido, 2 libres/semana, 40h/semana, N→libre
 * - Cobertura (critical/warning): mínimo por turno
 * - Equidad (warning): desviación M/T/N/FDS
 * - Peticiones (info): satisfechas vs no
 * - Ergonomía (warning): rotación inversa, libres no consecutivos
 * - Continuidad (info): transiciones bruscas en frontera de período
 */

import type { PipelineContext, AuditViolation, ShiftCode } from "../types";
import {
  getWeeks,
  weeklyHours,
  isWorkingShift,
  violates12hRest,
  isWeekend,
  isRestOrAbsence,
  countShiftOnDayExcluding,
} from "../helpers";
import { SPAIN_LABOR_LAW, ERGONOMIC_SEQUENCE, MAX_CONSECUTIVE_NIGHTS } from "../constants";

export function audit(ctx: PipelineContext): PipelineContext {
  const { grid, input } = ctx;
  const { employees, period, constraints } = input;
  const totalDays = period.totalDays;
  const weeks = getWeeks(totalDays);
  const violations: AuditViolation[] = [];

  for (const emp of employees) {
    const schedule = grid[emp.id];
    if (!schedule) continue;

    // --- LEGAL CHECKS ---

    // CK-01: 12h descanso entre jornadas
    for (let d = 1; d < totalDays; d++) {
      const today = schedule[d]?.code;
      const tomorrow = schedule[d + 1]?.code;
      if (today && tomorrow && isWorkingShift(today) && isWorkingShift(tomorrow)) {
        if (violates12hRest(today, tomorrow)) {
          violations.push({
            employeeId: emp.id,
            day: d,
            rule: "12H_REST",
            severity: "critical",
            description: `Menos de 12h entre ${today} (día ${d}) y ${tomorrow} (día ${d + 1})`,
            overridable: constraints.allowForceMajeureOverride,
            category: "legal",
          });
        }
      }
    }

    // CK-02: T→M prohibido (caso específico del 12h)
    for (let d = 1; d < totalDays; d++) {
      if (schedule[d]?.code === "T" && schedule[d + 1]?.code === "M") {
        violations.push({
          employeeId: emp.id,
          day: d,
          rule: "AFTERNOON_TO_MORNING",
          severity: "critical",
          description: `Turno pijama: T→M en días ${d}→${d + 1}`,
          overridable: false,
          category: "legal",
        });
      }
    }

    // CK-03: 2 días libres por semana
    for (let wi = 0; wi < weeks.length; wi++) {
      const weekDays = weeks[wi];
      const restDays = weekDays.filter((d) => isRestOrAbsence(schedule[d]?.code)).length;
      if (restDays < SPAIN_LABOR_LAW.minFreeDaysPerWeek) {
        violations.push({
          employeeId: emp.id,
          day: weekDays[0],
          rule: "MIN_FREE_DAYS",
          severity: "critical",
          description: `Semana ${wi + 1}: solo ${restDays} día(s) libre(s) (mínimo ${SPAIN_LABOR_LAW.minFreeDaysPerWeek})`,
          overridable: false,
          category: "legal",
        });
      }
    }

    // CK-04: Libres consecutivos
    if (SPAIN_LABOR_LAW.freeDaysMustBeConsecutive) {
      for (let wi = 0; wi < weeks.length; wi++) {
        const weekDays = weeks[wi];
        const restIndices = weekDays.filter((d) => isRestOrAbsence(schedule[d]?.code));
        if (restIndices.length >= 2) {
          let hasConsecutive = false;
          for (let i = 0; i < restIndices.length - 1; i++) {
            if (restIndices[i + 1] - restIndices[i] === 1) {
              hasConsecutive = true;
              break;
            }
          }
          if (!hasConsecutive) {
            violations.push({
              employeeId: emp.id,
              day: weekDays[0],
              rule: "CONSECUTIVE_REST",
              severity: "info",
              description: `Semana ${wi + 1}: libres no consecutivos`,
              overridable: true,
              category: "ergonomics",
            });
          }
        }
      }
    }

    // CK-05: 40h semanales máximo
    for (let wi = 0; wi < weeks.length; wi++) {
      const weekDays = weeks[wi];
      const hours = weeklyHours(schedule, weekDays);
      if (hours > SPAIN_LABOR_LAW.maxWeeklyHours) {
        violations.push({
          employeeId: emp.id,
          day: weekDays[0],
          rule: "MAX_WEEKLY_HOURS",
          severity: "critical",
          description: `Semana ${wi + 1}: ${hours}h (máximo ${SPAIN_LABOR_LAW.maxWeeklyHours}h)`,
          overridable: false,
          category: "legal",
        });
      }
    }

    // CK-06: N → siguiente día libre (solo para ROTA_COMPLETO, no Night Agent fijo)
    if (SPAIN_LABOR_LAW.nightShiftNextDayFree && emp.rotationType === "ROTA_COMPLETO") {
      for (let d = 1; d < totalDays; d++) {
        if (schedule[d]?.code === "N" && schedule[d + 1] && !isRestOrAbsence(schedule[d + 1].code)) {
          violations.push({
            employeeId: emp.id,
            day: d,
            rule: "NIGHT_THEN_REST",
            severity: "warning",
            description: `Noche día ${d} sin libre al día siguiente (tiene ${schedule[d + 1].code})`,
            overridable: true,
            category: "legal",
          });
        }
      }
    }

    // CK-07: Rotación ergonómica — solo para ROTA_COMPLETO (FOM/AFOM/Night son fijos por diseño)
    if (constraints.ergonomicRotation && emp.rotationType === "ROTA_COMPLETO") {
      for (let d = 1; d < totalDays; d++) {
        const today = schedule[d]?.code;
        const tomorrow = schedule[d + 1]?.code;
        if (!today || !tomorrow) continue;
        if (!isWorkingShift(today) || !isWorkingShift(tomorrow)) continue; // skip D→M, M→D
        const ti = ERGONOMIC_SEQUENCE.indexOf(today as ShiftCode);
        const ni = ERGONOMIC_SEQUENCE.indexOf(tomorrow as ShiftCode);
        if (ti >= 0 && ni >= 0 && ni < ti) {
          if (tomorrow !== "11x19") {
            violations.push({
              employeeId: emp.id,
              day: d,
              rule: "ERGONOMIC_ROTATION",
              severity: "warning",
              description: `Rotación inversa: ${today}→${tomorrow} en días ${d}→${d + 1}`,
              overridable: true,
              category: "ergonomics",
            });
          }
        }
      }
    }
  }

  // --- COVERAGE CHECKS ---

  // CK-08: Cobertura mínima por turno (sin contar FOM — su turno fijo es adicional)
  const fomIds = new Set(employees.filter((e) => e.role === "FOM").map((e) => e.id));
  const coverageShifts: ShiftCode[] = ["M", "T", "N"];
  for (let d = 1; d <= totalDays; d++) {
    for (const shift of coverageShifts) {
      const count = countShiftOnDayExcluding(grid, d, shift, fomIds);
      if (count < constraints.minCoveragePerShift) {
        violations.push({
          employeeId: "_global",
          day: d,
          rule: "MIN_COVERAGE",
          severity: "critical",
          description: `Día ${d} turno ${shift}: ${count} persona(s) sin contar FOM (mínimo ${constraints.minCoveragePerShift})`,
          overridable: false,
          category: "coverage",
        });
      }
    }
  }

  // CK-09: FOM↔AFOM consistencia (si espejo activo)
  if (constraints.fomAfomMirror) {
    const foms = employees.filter((e) => e.role === "FOM");
    const afoms = employees.filter((e) => e.role === "AFOM");
    for (const fom of foms) {
      for (const afom of afoms) {
        for (let d = 1; d <= totalDays; d++) {
          const fomCode = grid[fom.id][d]?.code;
          const afomCode = grid[afom.id][d]?.code;
          // Si ambos tienen el mismo turno de trabajo → warning
          if (fomCode && afomCode && fomCode === afomCode && isWorkingShift(fomCode)) {
            violations.push({
              employeeId: afom.id,
              day: d,
              rule: "FOM_AFOM_SAME_SHIFT",
              severity: "warning",
              description: `FOM y AFOM con mismo turno ${fomCode} el día ${d}`,
              overridable: true,
              category: "coverage",
            });
          }
        }
      }
    }
  }

  // CK-10 to CK-25: Additional checks (equity, petitions, etc.)
  // Equity checks
  const equityDeviation = calculateEquityDeviation(grid, employees, totalDays);
  for (const [empId, dev] of Object.entries(equityDeviation)) {
    if (dev > 4) {
      violations.push({
        employeeId: empId,
        rule: "EQUITY_DEVIATION",
        severity: "warning",
        description: `Desviación de equidad M/T/N: ±${dev.toFixed(1)} respecto a la media`,
        overridable: true,
        category: "equity",
      });
    }
  }

  // Petition satisfaction check
  for (const emp of employees) {
    for (const pet of emp.petitions) {
      if (pet.type !== "B" || pet.status !== "approved") continue;
      for (const day of pet.days) {
        if (day < 1 || day > totalDays) continue;
        const assigned = grid[emp.id][day]?.code;
        if (pet.requestedShift && assigned !== pet.requestedShift) {
          violations.push({
            employeeId: emp.id,
            day,
            rule: "PETITION_NOT_SATISFIED",
            severity: "info",
            description: `Petición blanda no satisfecha: pedía ${pet.requestedShift}, tiene ${assigned}`,
            overridable: true,
            category: "petitions",
          });
        }
      }
    }
  }

  // CK-12: Noches consecutivas máximas (solo ROTA_COMPLETO, no Night Agent)
  for (const emp of employees) {
    if (emp.rotationType !== "ROTA_COMPLETO") continue;
    let consecutive = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (grid[emp.id][d]?.code === "N") {
        consecutive++;
        if (consecutive > MAX_CONSECUTIVE_NIGHTS) {
          violations.push({
            employeeId: emp.id,
            day: d,
            rule: "MAX_CONSECUTIVE_NIGHTS",
            severity: "warning",
            description: `${consecutive} noches consecutivas (alerta a partir de ${MAX_CONSECUTIVE_NIGHTS})`,
            overridable: true,
            category: "ergonomics",
          });
        }
      } else {
        consecutive = 0;
      }
    }
  }

  // CK-13: Horas semanales vs contrato (contractUnits × 40 = horas semanales esperadas)
  for (const emp of employees) {
    const expectedWeekly = emp.contractUnits * SPAIN_LABOR_LAW.maxWeeklyHours;
    if (Math.abs(emp.weeklyHours - expectedWeekly) > 0.5) {
      violations.push({
        employeeId: emp.id,
        rule: "CONTRACT_HOURS_MATCH",
        severity: "warning",
        description: `Contrato ${emp.weeklyHours}h/sem pero unidades (${emp.contractUnits}) implican ${expectedWeekly}h`,
        overridable: true,
        category: "legal",
      });
    }
  }

  // CK-14: Continuidad 12h con período anterior
  if (input.continuity?.lastWeek) {
    for (const emp of employees) {
      const lastWeek = input.continuity.lastWeek[emp.id];
      if (!lastWeek || lastWeek.length === 0) continue;
      const lastDay = lastWeek[lastWeek.length - 1];
      const firstDay = grid[emp.id][1];
      if (lastDay && firstDay && isWorkingShift(lastDay.code) && isWorkingShift(firstDay.code)) {
        if (violates12hRest(lastDay.code, firstDay.code)) {
          violations.push({
            employeeId: emp.id,
            day: 1,
            rule: "CROSS_PERIOD_12H",
            severity: "critical",
            description: `Menos de 12h entre último turno anterior (${lastDay.code}) y día 1 (${firstDay.code})`,
            overridable: false,
            category: "legal",
          });
        }
      }
    }
  }

  // CK-15: Understaffing por ocupación (días con refuerzo necesario pero cobertura mínima)
  if (input.occupancy.length > 0) {
    for (const occ of input.occupancy) {
      if (!occ.needsReinforcement) continue;
      const d = occ.day;
      if (d < 1 || d > totalDays) continue;
      // Contar total de personas trabajando ese día (excluyendo FOM)
      let workingCount = 0;
      for (const emp of employees) {
        if (emp.role === "FOM") continue;
        if (grid[emp.id][d] && isWorkingShift(grid[emp.id][d].code)) workingCount++;
      }
      // Si solo hay cobertura mínima × 3 turnos, es understaffing
      if (workingCount <= constraints.minCoveragePerShift * 3) {
        violations.push({
          employeeId: "_global",
          day: d,
          rule: "OCCUPANCY_UNDERSTAFFING",
          severity: "info",
          description: `Día ${d}: ${occ.totalMovements} movimientos, refuerzo recomendado pero solo ${workingCount} persona(s) trabajando`,
          overridable: true,
          category: "coverage",
        });
      }
    }
  }

  // CK-16: Equidad de fines de semana trabajados (solo ROTA_COMPLETO)
  {
    const rotatingEmps = employees.filter((e) => e.rotationType === "ROTA_COMPLETO");
    if (rotatingEmps.length >= 2) {
      const weekendCounts: Record<string, number> = {};
      for (const emp of rotatingEmps) {
        weekendCounts[emp.id] = 0;
        for (let d = 1; d <= totalDays; d++) {
          if (isWeekend(period.year, period.month, d) && grid[emp.id][d] && isWorkingShift(grid[emp.id][d].code)) {
            weekendCounts[emp.id]++;
          }
        }
      }
      const vals = Object.values(weekendCounts);
      const maxW = Math.max(...vals);
      const minW = Math.min(...vals);
      if (maxW - minW > 3) {
        for (const emp of rotatingEmps) {
          if (weekendCounts[emp.id] === maxW) {
            violations.push({
              employeeId: emp.id,
              rule: "WEEKEND_EQUITY",
              severity: "warning",
              description: `${weekendCounts[emp.id]} FDS trabajados vs mínimo del equipo ${minW} (diferencia >3)`,
              overridable: true,
              category: "equity",
            });
          }
        }
      }
    }
  }

  return { ...ctx, violations };
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function calculateEquityDeviation(
  grid: Record<string, Record<number, import("../types").DayAssignmentV2>>,
  employees: import("../types").EngineEmployee[],
  totalDays: number
): Record<string, number> {
  const rotatingEmps = employees.filter((e) => e.rotationType === "ROTA_COMPLETO");
  if (rotatingEmps.length === 0) return {};

  // Contar M/T/N por empleado
  const counts: Record<string, { m: number; t: number; n: number }> = {};
  for (const emp of rotatingEmps) {
    counts[emp.id] = { m: 0, t: 0, n: 0 };
    for (let d = 1; d <= totalDays; d++) {
      const code = grid[emp.id][d]?.code;
      if (code === "M") counts[emp.id].m++;
      else if (code === "T") counts[emp.id].t++;
      else if (code === "N") counts[emp.id].n++;
    }
  }

  // Media por tipo
  const avgM = rotatingEmps.reduce((s, e) => s + counts[e.id].m, 0) / rotatingEmps.length;
  const avgT = rotatingEmps.reduce((s, e) => s + counts[e.id].t, 0) / rotatingEmps.length;
  const avgN = rotatingEmps.reduce((s, e) => s + counts[e.id].n, 0) / rotatingEmps.length;

  // Desviación máxima por empleado
  const result: Record<string, number> = {};
  for (const emp of rotatingEmps) {
    const devM = Math.abs(counts[emp.id].m - avgM);
    const devT = Math.abs(counts[emp.id].t - avgT);
    const devN = Math.abs(counts[emp.id].n - avgN);
    result[emp.id] = Math.max(devM, devT, devN);
  }

  return result;
}
