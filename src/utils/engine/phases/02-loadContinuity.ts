/**
 * Phase 02 — loadContinuity
 *
 * Carga el historial del período anterior para:
 * 1. Continuidad de turnos: últimos 7 días → evitar transiciones bruscas
 * 2. Equidad acumulada: copiar balances del snapshot anterior al currentEquity
 * 3. FDS largo tracking: saber quién ya disfrutó su FDS largo recientemente
 *
 * Si no hay historial (primera generación), usa defaults (Phase 01 ya lo hizo).
 */

import type { PipelineContext, EquityBalance, DayAssignmentV2 } from "../types";
import { isWorkingShift } from "../helpers";

export function loadContinuity(ctx: PipelineContext): PipelineContext {
  const { input, currentEquity, grid } = ctx;
  const { continuity, employees } = input;

  if (!continuity) {
    // Primera generación — no hay historial, usar defaults de Phase 01
    return ctx;
  }

  // --- 1. Cargar equity snapshot del período anterior ---
  for (const emp of employees) {
    const prevEquity = continuity.equitySnapshot[emp.id];
    if (prevEquity) {
      // Sumar el historial anterior al equity actual
      currentEquity[emp.id] = {
        morningCount: prevEquity.morningCount,
        afternoonCount: prevEquity.afternoonCount,
        nightCount: prevEquity.nightCount,
        weekendWorkedCount: prevEquity.weekendWorkedCount,
        longWeekendCount: prevEquity.longWeekendCount,
        holidayWorkedCount: prevEquity.holidayWorkedCount,
        petitionSatisfactionRatio: prevEquity.petitionSatisfactionRatio,
        nightCoverageCount: prevEquity.nightCoverageCount,
      };
    }
  }

  // --- 2. Analizar últimos 7 días para continuidad de turnos ---
  // Los últimos días del período anterior influyen en:
  // - Qué turno puede hacer el empleado el día 1 (12h rest)
  // - La rotación ergonómica (no romper secuencia M→T→N)
  // - Contar si ya tenía libres asignados (para no dar libres extra)

  // Guardamos esta info en el contexto para que Phase 03 y 06 la lean
  const lastWeekData = continuity.lastWeek;

  // Verificar si el último día del período anterior crea restricción para día 1
  for (const emp of employees) {
    const prevDays = lastWeekData[emp.id];
    if (!prevDays || prevDays.length === 0) continue;

    const lastDay = prevDays[prevDays.length - 1];
    if (!lastDay) continue;

    // Si el último turno del período anterior es de trabajo,
    // el día 1 del nuevo período necesita respetar 12h rest.
    // Guardamos como "pseudo-assignment" en día 0 (virtual) para que
    // Phase 06 lo considere al asignar día 1.
    if (isWorkingShift(lastDay.code)) {
      // Crear un día virtual "0" con el último turno del período anterior
      if (grid[emp.id]) {
        grid[emp.id][0] = { ...lastDay };
      }
    }
  }

  return { ...ctx, currentEquity, grid };
}
