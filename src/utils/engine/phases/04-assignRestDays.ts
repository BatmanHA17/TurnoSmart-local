/**
 * Phase 04 — assignRestDays
 *
 * Asigna 2 días libres consecutivos por semana para cada empleado.
 * Lógica clave:
 * - 2 libres consecutivos por semana (ley)
 * - 1 FDS largo al mes por empleado (S+D semana X + L+M semana X+1)
 * - Pre-vacaciones: libres ANTES de vacaciones (no salir del trabajo directo)
 * - Equidad: rotar quién libra en FDS
 * - Night Shift Agent: sus libres siempre cubiertos por Front Desk Agents
 */

import type { PipelineContext, EngineEmployee, DayAssignmentV2 } from "../types";
import { LONG_WEEKEND_PER_MONTH } from "../constants";
import {
  getWeeks,
  isWeekend,
  isSaturday,
  isSunday,
  isMonday,
  makeAssignment,
  isAssigned,
  isRestOrAbsence,
  dayOfWeekISO,
} from "../helpers";

/** Crea un día libre marcado como locked (no sobreescribible por Phase 06) */
function makeLockedRest(): DayAssignmentV2 {
  const a = makeAssignment("D", "engine");
  a.locked = true;
  return a;
}

export function assignRestDays(ctx: PipelineContext): PipelineContext {
  const { grid, input, roleGroups, currentEquity } = ctx;
  const { employees, period, constraints } = input;
  const totalDays = period.totalDays;
  const weeks = getWeeks(totalDays);

  // --- 1. Planificar FDS largos (1 por empleado al mes) ---
  const longWeekendPlan = planLongWeekends(employees, weeks, grid, period, currentEquity);

  // --- 2. Asignar libres semana a semana ---
  for (const emp of employees) {
    if (emp.isNewHire && emp.startDay && emp.startDay > totalDays) continue;

    for (let wi = 0; wi < weeks.length; wi++) {
      const weekDays = weeks[wi];
      const effectiveDays = weekDays.filter(
        (d) => !(emp.isNewHire && emp.startDay && d < emp.startDay)
      );
      if (effectiveDays.length === 0) continue;

      // Contar cuántos libres REALES ya tiene (locked por Phase 03: ausencias, peticiones A)
      // No contar los D del initGrid (son placeholders, no libres asignados)
      const existingRest = effectiveDays.filter(
        (d) => grid[emp.id][d]?.locked && isRestOrAbsence(grid[emp.id][d]?.code)
      ).length;

      if (existingRest >= 2) continue; // ya tiene 2+ libres reales

      const needed = 2 - existingRest;

      // Verificar si esta semana es parte del FDS largo
      const lwPlan = longWeekendPlan.get(emp.id);
      if (lwPlan && lwPlan.weekIndex === wi) {
        // FDS largo: S+D de esta semana
        assignLongWeekendDays(grid, emp, weekDays, period, needed);
      } else if (lwPlan && lwPlan.weekIndex + 1 === wi) {
        // Semana siguiente al FDS largo: L+M libres
        assignPostLongWeekendDays(grid, emp, weekDays, period, needed);
      } else {
        // Semana normal: elegir 2 días consecutivos
        assignNormalRestDays(grid, emp, effectiveDays, period, needed, constraints.fairWeekendDistribution, currentEquity);
      }
    }
  }

  // --- 3. Pre-vacaciones: mover libres antes de vacaciones ---
  applyPreVacationRest(grid, employees, totalDays);

  return { ...ctx, grid };
}

// ---------------------------------------------------------------------------
// FDS LARGO
// ---------------------------------------------------------------------------

interface LongWeekendAssignment {
  employeeId: string;
  weekIndex: number; // semana donde cae el S+D
}

function planLongWeekends(
  employees: EngineEmployee[],
  weeks: number[][],
  grid: Record<string, Record<number, DayAssignmentV2>>,
  period: { year: number; month: number },
  equity: Record<string, { longWeekendCount: number; weekendWorkedCount: number }>
): Map<string, LongWeekendAssignment> {
  const plan = new Map<string, LongWeekendAssignment>();

  // Ordenar empleados por menos FDS largos disfrutados (equidad)
  const sorted = [...employees]
    .filter((e) => e.rotationType === "ROTA_COMPLETO" || e.rotationType === "COBERTURA")
    .sort((a, b) => {
      const ea = equity[a.id]?.longWeekendCount ?? 0;
      const eb = equity[b.id]?.longWeekendCount ?? 0;
      return ea - eb;
    });

  // Distribuir 1 FDS largo por empleado, escalonado en semanas distintas
  const usedWeeks = new Set<number>();
  for (const emp of sorted) {
    // Buscar una semana con S+D disponible
    for (let wi = 0; wi < weeks.length - 1; wi++) {
      if (usedWeeks.has(wi)) continue; // ya asignado a otro empleado

      const weekDays = weeks[wi];
      const hasSat = weekDays.some((d) => isSaturday(period.year, period.month, d));
      const hasSun = weekDays.some((d) => isSunday(period.year, period.month, d));
      if (!hasSat || !hasSun) continue;

      // Verificar que no tiene ausencias que bloqueen el FDS
      const satDay = weekDays.find((d) => isSaturday(period.year, period.month, d))!;
      const sunDay = weekDays.find((d) => isSunday(period.year, period.month, d))!;
      if (grid[emp.id][satDay]?.locked || grid[emp.id][sunDay]?.locked) continue;

      // Verificar que la semana siguiente tiene L+M disponible
      const nextWeek = weeks[wi + 1];
      const monDay = nextWeek?.find((d) => isMonday(period.year, period.month, d));
      if (!monDay || grid[emp.id][monDay]?.locked) continue;
      const tueDay = monDay + 1;
      if (tueDay > nextWeek[nextWeek.length - 1] || grid[emp.id][tueDay]?.locked) continue;

      plan.set(emp.id, { employeeId: emp.id, weekIndex: wi });
      usedWeeks.add(wi);
      break;
    }
  }

  return plan;
}

function assignLongWeekendDays(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  emp: EngineEmployee,
  weekDays: number[],
  period: { year: number; month: number },
  needed: number
): void {
  // S+D de esta semana como libres
  for (const d of weekDays) {
    if (needed <= 0) break;
    if (grid[emp.id][d]?.locked) continue;
    if (isSaturday(period.year, period.month, d) || isSunday(period.year, period.month, d)) {
      grid[emp.id][d] = makeLockedRest();
      needed--;
    }
  }
}

function assignPostLongWeekendDays(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  emp: EngineEmployee,
  weekDays: number[],
  period: { year: number; month: number },
  needed: number
): void {
  // L+M de esta semana como libres (continuación del FDS largo)
  for (const d of weekDays) {
    if (needed <= 0) break;
    if (grid[emp.id][d]?.locked) continue;
    const dow = dayOfWeekISO(period.year, period.month, d);
    if (dow === 0 || dow === 1) { // lunes o martes
      grid[emp.id][d] = makeLockedRest();
      needed--;
    }
  }
}

// ---------------------------------------------------------------------------
// LIBRES NORMALES (semana sin FDS largo)
// ---------------------------------------------------------------------------

function assignNormalRestDays(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  emp: EngineEmployee,
  weekDays: number[],
  period: { year: number; month: number },
  needed: number,
  fairWeekend: boolean,
  equity: Record<string, { weekendWorkedCount: number }>
): void {
  // Intentar asignar 2 días consecutivos
  // Priorizar entre semana si el empleado ya ha librado muchos FDS (equidad)
  const candidates: Array<{ startDay: number; score: number }> = [];

  for (let i = 0; i < weekDays.length - 1; i++) {
    const d1 = weekDays[i];
    const d2 = weekDays[i + 1];
    if (grid[emp.id][d1]?.locked || grid[emp.id][d2]?.locked) continue;

    let score = 0;
    const d1Weekend = isWeekend(period.year, period.month, d1);
    const d2Weekend = isWeekend(period.year, period.month, d2);

    if (fairWeekend) {
      // Empleados con más FDS trabajados → más probabilidad de librar FDS
      const wkCount = equity[emp.id]?.weekendWorkedCount ?? 0;
      if (d1Weekend || d2Weekend) score += wkCount * 2;
    }

    // Ligera preferencia por días a mitad de semana (mejor distribución)
    const dow1 = dayOfWeekISO(period.year, period.month, d1);
    if (dow1 >= 1 && dow1 <= 3) score += 1; // mar-jue

    candidates.push({ startDay: d1, score });
  }

  if (candidates.length === 0) {
    // Fallback: asignar días no consecutivos si no hay opción
    assignNonConsecutiveRest(grid, emp, weekDays, needed);
    return;
  }

  // Elegir el par con mejor score
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  let assigned = 0;
  for (const d of [best.startDay, best.startDay + 1]) {
    if (assigned >= needed) break;
    if (d > weekDays[weekDays.length - 1]) break;
    if (grid[emp.id][d]?.locked) continue;
    grid[emp.id][d] = makeLockedRest();
    assigned++;
  }
}

function assignNonConsecutiveRest(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  emp: EngineEmployee,
  weekDays: number[],
  needed: number
): void {
  let assigned = 0;
  for (const d of weekDays) {
    if (assigned >= needed) break;
    if (grid[emp.id][d]?.locked) continue;
    grid[emp.id][d] = makeLockedRest();
    assigned++;
  }
}

// ---------------------------------------------------------------------------
// PRE-VACACIONES
// ---------------------------------------------------------------------------

/**
 * Si un empleado tiene vacaciones, sus 2 libres deben caer ANTES
 * de las vacaciones (no sale del trabajo directo a vacaciones).
 */
function applyPreVacationRest(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  employees: EngineEmployee[],
  totalDays: number
): void {
  for (const emp of employees) {
    // Buscar primer día de vacaciones
    let firstVacation = -1;
    for (let d = 1; d <= totalDays; d++) {
      if (grid[emp.id][d]?.code === "V") {
        firstVacation = d;
        break;
      }
    }
    if (firstVacation <= 2) continue; // no hay espacio para reposicionar

    // Verificar si ya tiene libres justo antes de las vacaciones
    const dayBefore1 = firstVacation - 1;
    const dayBefore2 = firstVacation - 2;
    const has1 = isRestOrAbsence(grid[emp.id][dayBefore1]?.code);
    const has2 = dayBefore2 >= 1 && isRestOrAbsence(grid[emp.id][dayBefore2]?.code);

    if (has1 && has2) continue; // ya tiene libres antes de vacaciones

    // Buscar libres de esa semana y moverlos antes de las vacaciones
    // Encontrar la semana que contiene el día antes de vacaciones
    const weekStart = Math.max(1, firstVacation - 6);
    for (let d = weekStart; d < firstVacation; d++) {
      if (grid[emp.id][d]?.code === "D" && !grid[emp.id][d]?.locked) {
        // Hay un libre en la semana pero no está justo antes de vacaciones
        // Intercambiar con un día laboral más cercano a las vacaciones
        const target = !has1 ? dayBefore1 : dayBefore2;
        if (target >= 1 && !grid[emp.id][target]?.locked && d !== target) {
          // Swap
          const temp = grid[emp.id][target];
          grid[emp.id][target] = grid[emp.id][d];
          grid[emp.id][d] = temp;
        }
      }
    }
  }
}
