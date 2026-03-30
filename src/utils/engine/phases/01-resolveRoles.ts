/**
 * Phase 01 — resolveRoles
 *
 * Clasifica empleados por tipo de rotación (FIJO_NO_ROTA, COBERTURA,
 * ROTA_PARCIAL, ROTA_COMPLETO) usando su rol y seniority_level.
 *
 * También inicializa el grid vacío y los contadores de equidad actuales.
 */

import type { PipelineContext, RotationType, EquityBalance, EngineEmployee } from "../types";
import { initGrid } from "../helpers";

/** Balance de equidad vacío (inicio de período) */
function emptyEquity(): EquityBalance {
  return {
    morningCount: 0,
    afternoonCount: 0,
    nightCount: 0,
    weekendWorkedCount: 0,
    longWeekendCount: 0,
    holidayWorkedCount: 0,
    petitionSatisfactionRatio: 0,
    nightCoverageCount: 0,
  };
}

export function resolveRoles(ctx: PipelineContext): PipelineContext {
  const { employees } = ctx.input;

  // Clasificar empleados por tipo de rotación
  const roleGroups: Record<RotationType, EngineEmployee[]> = {
    FIJO_NO_ROTA: [],
    COBERTURA: [],
    ROTA_PARCIAL: [],
    ROTA_COMPLETO: [],
  };

  for (const emp of employees) {
    roleGroups[emp.rotationType].push(emp);
  }

  // Inicializar grid vacío
  const employeeIds = employees.map((e) => e.id);
  const grid = initGrid(employeeIds, ctx.input.period.totalDays);

  // Inicializar contadores de equidad (copia del histórico o vacío)
  const currentEquity: Record<string, EquityBalance> = {};
  for (const emp of employees) {
    currentEquity[emp.id] = { ...emp.equityBalance } ?? emptyEquity();
  }

  return {
    ...ctx,
    grid,
    roleGroups,
    currentEquity,
  };
}
