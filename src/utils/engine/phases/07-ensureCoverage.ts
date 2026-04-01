/**
 * Phase 07 — ensureCoverage
 *
 * Dos pasadas:
 * 1. Cobertura mínima: cada turno (M, T, N) debe tener al menos minCoveragePerShift por día
 * 2. Refuerzo por ocupación: si el día supera el umbral de ocupación,
 *    asigna un turno extra GEX (9x17/12x20) o roba un D de un FDA
 */

import type { PipelineContext, ShiftCode, DayAssignmentV2, DailyOccupancy } from "../types";
import { ROLE_CONFIGS } from "../constants";
import {
  countShiftOnDayExcluding,
  isRestOrAbsence,
  isWorkingShift,
  makeAssignment,
  violates12hRest,
  periodDayOfWeekISO,
} from "../helpers";

const COVERAGE_SHIFTS: ShiftCode[] = ["M", "T", "N"];

export function ensureCoverage(ctx: PipelineContext): PipelineContext {
  const { grid, input, currentEquity } = ctx;
  const { period, constraints, employees, occupancy } = input;
  const totalDays = period.totalDays;
  const minCoveragePerShift = constraints.minCoveragePerShift;
  const coverageGaps: PipelineContext["coverageGaps"] = [];

  // FOM no cuenta para cobertura mínima — su turno fijo es adicional
  const fomIds = new Set(employees.filter((e) => e.role === "FOM").map((e) => e.id));

  // ── PASADA 1: Cobertura mínima M/T/N ──────────────────────────────
  // 11x19 cuenta como cobertura M (cubre franja mañana 11:00-19:00)
  // Supports per-day-of-week overrides via constraints.coverageByDay
  const coverageByDay = constraints.coverageByDay;
  for (let day = 1; day <= totalDays; day++) {
    // Determine day-of-week for per-day overrides (1=Mon..7=Sun)
    const dow = periodDayOfWeekISO(period.startDate, day) + 1; // ISO 0=Mon → 1=Mon for override keys
    for (const shift of COVERAGE_SHIFTS) {
      const shiftKey = shift as "M" | "T" | "N";
      // Per-day override takes precedence over global minimum
      const dayOverride = coverageByDay?.[dow]?.[shiftKey];
      const minCoverage = dayOverride ?? minCoveragePerShift[shiftKey] ?? 1;
      let count = countShiftOnDayExcluding(grid, day, shift, fomIds);
      if (shift === "M") {
        count += countShiftOnDayExcluding(grid, day, "11x19", fomIds);
      }
      if (count >= minCoverage) continue;

      const deficit = minCoverage - count;

      for (let n = 0; n < deficit; n++) {
        const bestId = findBestCoverageCandidate(grid, employees, day, shift, fomIds, currentEquity, totalDays);

        if (bestId) {
          grid[bestId][day] = makeAssignment(shift, "coverage");
          grid[bestId][day].forced = true;

          // Actualizar equity
          const eq = currentEquity[bestId];
          if (eq) {
            if (shift === "M") eq.morningCount++;
            else if (shift === "T") eq.afternoonCount++;
            else if (shift === "N") eq.nightCount++;
          }
        } else {
          coverageGaps.push({
            day,
            shift,
            needed: minCoverage,
            assigned: count + n,
          });
        }
      }
    }
  }

  // ── PASADA 2: Refuerzo por ocupación (GEX extra) ──────────────────
  if (constraints.occupancyBasedStaffing && occupancy.length > 0) {
    const occupancyByDay = new Map<number, DailyOccupancy>();
    for (const occ of occupancy) {
      occupancyByDay.set(occ.day, occ);
    }

    // GEX employees disponibles para refuerzo
    const gexEmployees = employees.filter((e) => e.role === "GEX");

    for (let day = 1; day <= totalDays; day++) {
      const occ = occupancyByDay.get(day);
      if (!occ || !occ.needsReinforcement) continue;

      // ¿Ya hay algún GEX asignado hoy con turno de trabajo?
      const gexAlreadyWorking = gexEmployees.some((e) => {
        const a = grid[e.id]?.[day];
        return a && isWorkingShift(a.code);
      });

      // Si ya tiene GEX trabajando, no necesita más refuerzo
      if (gexAlreadyWorking) continue;

      // Decidir turno GEX: si más check-ins → 9x17 (mañana), si más check-outs → 12x20 (tarde)
      const gexShift: ShiftCode = occ.checkIns >= occ.checkOuts ? "9x17" : "12x20";

      // 1. Intentar con GEX que tenga D
      let assigned = false;
      for (const gex of gexEmployees) {
        const a = grid[gex.id]?.[day];
        if (!a || a.locked) continue;
        if (a.code !== "D") continue;

        // Verificar 12h rest
        if (day > 1) {
          const prev = grid[gex.id][day - 1]?.code;
          if (prev && isWorkingShift(prev) && violates12hRest(prev, gexShift)) continue;
        }
        if (day < totalDays) {
          const next = grid[gex.id][day + 1]?.code;
          if (next && isWorkingShift(next) && violates12hRest(gexShift, next)) continue;
        }

        grid[gex.id][day] = makeAssignment(gexShift, "coverage");
        grid[gex.id][day].forced = true;
        assigned = true;
        break;
      }

      // 2. Si no hay GEX, buscar un ROTA_COMPLETO con D
      if (!assigned) {
        const fdaEmployees = employees.filter(
          (e) => e.role === "FRONT_DESK_AGENT" && !fomIds.has(e.id)
        );
        for (const fda of fdaEmployees) {
          const a = grid[fda.id]?.[day];
          if (!a || a.locked) continue;
          if (a.code !== "D") continue;

          // Verificar 12h rest para 9x17/12x20
          if (day > 1) {
            const prev = grid[fda.id][day - 1]?.code;
            if (prev && isWorkingShift(prev) && violates12hRest(prev, gexShift)) continue;
          }
          if (day < totalDays) {
            const next = grid[fda.id][day + 1]?.code;
            if (next && isWorkingShift(next) && violates12hRest(gexShift, next)) continue;
          }

          grid[fda.id][day] = makeAssignment(gexShift, "coverage");
          grid[fda.id][day].forced = true;
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        coverageGaps.push({
          day,
          shift: gexShift,
          needed: 1,
          assigned: 0,
        });
      }
    }
  }

  return { ...ctx, grid, coverageGaps };
}

/** Encuentra el mejor candidato para cubrir un déficit de cobertura */
function findBestCoverageCandidate(
  grid: PipelineContext["grid"],
  employees: PipelineContext["input"]["employees"],
  day: number,
  shift: ShiftCode,
  fomIds: Set<string>,
  currentEquity: PipelineContext["currentEquity"],
  totalDays: number,
): string | null {
  let bestId: string | null = null;
  let bestDebt = -Infinity;

  for (const emp of employees) {
    if (fomIds.has(emp.id)) continue;

    const assignment = grid[emp.id][day];
    if (!assignment) continue;
    if (assignment.locked) continue;
    if (emp.isNewHire && emp.startDay && day < emp.startDay) continue;

    // Solo podemos "robar" un descanso no-obligatorio
    if (assignment.code !== "D") continue;

    // Skip GEX/parciales — no pueden cubrir M/T/N
    const roleConfig = ROLE_CONFIGS[emp.role];
    if (roleConfig && !roleConfig.allowedShifts.includes(shift as ShiftCode)) continue;

    // Verificar 12h rest con día anterior y siguiente
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) continue;
    }
    if (day < totalDays) {
      const nextCode = grid[emp.id][day + 1]?.code;
      if (nextCode && isWorkingShift(nextCode) && violates12hRest(shift, nextCode)) continue;
    }

    // Priorizar por deuda de equidad (menos turnos → más deuda)
    const eq = currentEquity[emp.id];
    const shiftCount = shift === "M" ? eq?.morningCount ?? 0
      : shift === "T" ? eq?.afternoonCount ?? 0
      : eq?.nightCount ?? 0;
    const debt = 100 - shiftCount;

    if (debt > bestDebt) {
      bestDebt = debt;
      bestId = emp.id;
    }
  }

  return bestId;
}
