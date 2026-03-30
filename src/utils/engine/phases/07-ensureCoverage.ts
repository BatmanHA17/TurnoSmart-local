/**
 * Phase 07 — ensureCoverage
 *
 * Verifica que cada turno (M, T, N) tenga al menos la cobertura mínima
 * cada día. Si hay huecos, los rellena:
 * 1. Buscar empleados disponibles (con D asignado) que puedan cubrir
 * 2. Priorizar por equidad (menos turnos de ese tipo)
 * 3. Marcar como forced=true para revisión del FOM
 * 4. Si no hay nadie disponible → registrar en coverageGaps
 */

import type { PipelineContext, ShiftCode, DayAssignmentV2 } from "../types";
import { ROLE_CONFIGS } from "../constants";
import {
  countShiftOnDay,
  isRestOrAbsence,
  isWorkingShift,
  makeAssignment,
  violates12hRest,
} from "../helpers";

const COVERAGE_SHIFTS: ShiftCode[] = ["M", "T", "N"];

export function ensureCoverage(ctx: PipelineContext): PipelineContext {
  const { grid, input, currentEquity } = ctx;
  const { period, constraints, employees } = input;
  const totalDays = period.totalDays;
  const minCoverage = constraints.minCoveragePerShift;
  const coverageGaps: PipelineContext["coverageGaps"] = [];

  for (let day = 1; day <= totalDays; day++) {
    for (const shift of COVERAGE_SHIFTS) {
      const count = countShiftOnDay(grid, day, shift);
      if (count >= minCoverage) continue;

      const deficit = minCoverage - count;

      for (let n = 0; n < deficit; n++) {
        // Buscar candidato disponible (que tenga D y no sea locked)
        let bestId: string | null = null;
        let bestDebt = -Infinity;

        for (const emp of employees) {
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
          // No hay nadie disponible → gap
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

  return { ...ctx, grid, coverageGaps };
}
