/**
 * Phase 06 — assignRotating (CORE)
 *
 * Asignación día a día de turnos M/T/N para Front Desk Agents.
 * NO por bloques semanales — un empleado puede hacer M y T en la misma semana.
 *
 * DOBLE PASADA:
 * 1. Coverage pass: asegurar minCoveragePerShift (1+ persona por turno M/T/N)
 * 2. Employee pass: cada ROTA_COMPLETO debe trabajar ~5 días/semana
 *    (rellenar los días no-locked-D con el turno que mejor score tenga)
 *
 * Scoring: equidad M/T/N + rotación ergonómica + peticiones blandas + continuidad
 * Usar 11×19 como transición cuando T→M violaría 12h
 */

import type {
  PipelineContext,
  EngineEmployee,
  DayAssignmentV2,
  ShiftCode,
  WeightProfile,
} from "../types";
import {
  makeAssignment,
  isWorkingShift,
  isRestOrAbsence,
  violates12hRest,
  countShiftOnDay,
  getWeeks,
  weeklyHours,
} from "../helpers";
import { ERGONOMIC_SEQUENCE, SHIFT_UNDESIRABILITY, TRANSITION_SHIFT, SPAIN_LABOR_LAW } from "../constants";

/** Turnos a asignar en orden de prioridad (N primero porque es más restrictivo) */
const ROTATION_SHIFTS: ShiftCode[] = ["N", "M", "T"];

export function assignRotating(ctx: PipelineContext): PipelineContext {
  const { grid, input, roleGroups, currentEquity } = ctx;
  const { period, constraints } = input;
  const totalDays = period.totalDays;
  const weights = input.weights;
  const weeks = getWeeks(totalDays);

  // Solo Front Desk Agents (ROTA_COMPLETO) entran en rotación
  const rotatingEmployees = roleGroups.ROTA_COMPLETO;
  if (rotatingEmployees.length === 0) return ctx;

  // ===================================================================
  // PASS 1 — COVERAGE: asegurar minCoveragePerShift por turno y día
  // ===================================================================
  for (let day = 1; day <= totalDays; day++) {
    for (const shift of ROTATION_SHIFTS) {
      const currentCount = countShiftOnDay(grid, day, shift);
      const minCoverage = constraints.minCoveragePerShift;
      if (currentCount >= minCoverage) continue;

      const needed = minCoverage - currentCount;
      for (let n = 0; n < needed; n++) {
        const candidate = pickBestCandidate(
          rotatingEmployees, grid, day, shift, currentEquity, weights,
          constraints.ergonomicRotation, period, weeks
        );
        if (!candidate) break;

        const finalShift = resolveFinalShift(grid, candidate, day, shift);
        if (!finalShift) continue;

        grid[candidate.id][day] = makeAssignment(finalShift, "engine");
        updateEquity(currentEquity, candidate.id, shift);
      }
    }
  }

  // ===================================================================
  // PASS 2 — EMPLOYEE-DRIVEN: cada empleado debe trabajar ~5 días/semana
  // Rellenar días no-locked-D con el turno de mejor score
  // ===================================================================
  for (const emp of rotatingEmployees) {
    for (let wi = 0; wi < weeks.length; wi++) {
      const weekDays = weeks[wi];

      // Contar cuántas horas ya tiene esta semana
      const currentHours = weeklyHours(grid[emp.id], weekDays);
      const targetHours = emp.weeklyHours ?? 40;

      // Si ya tiene suficientes horas, no asignar más
      if (currentHours >= targetHours) continue;

      // Recoger los días disponibles (no locked, código "D")
      const availableDays: number[] = [];
      for (const d of weekDays) {
        if (emp.isNewHire && emp.startDay && d < emp.startDay) continue;
        const cell = grid[emp.id][d];
        if (!cell) continue;
        if (cell.locked) continue; // descanso locked por Phase 04
        if (cell.code !== "D") continue; // ya tiene turno asignado
        availableDays.push(d);
      }

      if (availableDays.length === 0) continue;

      // Calcular cuántos turnos necesita para llegar a las horas semanales
      const hoursNeeded = targetHours - currentHours;
      const shiftsNeeded = Math.ceil(hoursNeeded / 8); // 8h por turno estándar

      // Asignar turnos a los días disponibles, hasta cubrir horas
      let assigned = 0;
      for (const day of availableDays) {
        if (assigned >= shiftsNeeded) break;

        // Elegir el mejor turno para este día (scoring)
        const bestShift = pickBestShiftForDay(
          emp, grid, day, currentEquity, weights,
          constraints.ergonomicRotation, period
        );
        if (!bestShift) continue;

        grid[emp.id][day] = makeAssignment(bestShift, "engine");
        updateEquity(currentEquity, emp.id, bestShift as ShiftCode);
        assigned++;
      }
    }
  }

  return { ...ctx, grid, currentEquity };
}

// ---------------------------------------------------------------------------
// RESOLVE FINAL SHIFT (12h rest check + transition)
// ---------------------------------------------------------------------------

function resolveFinalShift(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  candidate: EngineEmployee,
  day: number,
  shift: ShiftCode
): ShiftCode | string | null {
  if (day > 1) {
    const prevCode = grid[candidate.id][day - 1]?.code;
    if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
      if (shift === "M") {
        return TRANSITION_SHIFT; // 11×19 en vez de M
      }
      return null; // no se puede asignar
    }
  }
  return shift;
}

// ---------------------------------------------------------------------------
// PICK BEST SHIFT FOR A DAY (employee-driven)
// ---------------------------------------------------------------------------

/**
 * Para un empleado y un día concreto, elige el mejor turno (M/T/N)
 * considerando equidad, ergonomía, 12h rest, y necesidades de cobertura.
 */
function pickBestShiftForDay(
  emp: EngineEmployee,
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  weights: WeightProfile,
  ergonomic: boolean,
  period: { year: number; month: number }
): ShiftCode | string | null {
  let bestShift: ShiftCode | string | null = null;
  let bestScore = -Infinity;

  for (const shift of ROTATION_SHIFTS) {
    // Verificar 12h rest con día anterior
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
        if (shift === "M") {
          // Evaluar 11×19 como alternativa
          const transScore = scoreShift(
            emp, grid, day, TRANSITION_SHIFT as ShiftCode, equity, weights, ergonomic
          );
          if (transScore > bestScore) {
            bestScore = transScore;
            bestShift = TRANSITION_SHIFT;
          }
        }
        continue; // no se puede asignar este turno directamente
      }
    }

    // Verificar 12h rest con día siguiente (si ya tiene turno asignado)
    const totalDays = Object.keys(grid[emp.id]).length;
    if (day < totalDays) {
      const nextCode = grid[emp.id][day + 1]?.code;
      if (nextCode && isWorkingShift(nextCode) && violates12hRest(shift, nextCode)) {
        continue; // asignar este turno violaría 12h con el día siguiente
      }
    }

    const score = scoreShift(emp, grid, day, shift, equity, weights, ergonomic);

    // Bonus por cobertura: si este turno tiene poca gente hoy, priorizar
    const currentCount = countShiftOnDay(grid, day, shift);
    const coverageBonus = Math.max(0, 3 - currentCount) * 10 * weights.coverage;

    const totalScore = score + coverageBonus;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestShift = shift;
    }
  }

  return bestShift;
}

// ---------------------------------------------------------------------------
// SCORING (shared between coverage pass and employee pass)
// ---------------------------------------------------------------------------

function scoreShift(
  emp: EngineEmployee,
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  shift: ShiftCode | string,
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  weights: WeightProfile,
  ergonomic: boolean
): number {
  let score = 0;

  // Equidad: priorizar al empleado con menos turnos de este tipo
  const eq = equity[emp.id];
  if (eq) {
    const shiftCount = shift === "M" ? eq.morningCount
      : shift === "T" ? eq.afternoonCount
      : shift === "N" ? eq.nightCount
      : 0;
    // Menos turnos → mayor score (deuda = prioridad)
    score += (100 - shiftCount) * weights.equity;
  }

  // Rotación ergonómica: M→T→N (bonus si sigue la secuencia)
  if (ergonomic && day > 1) {
    const prevCode = grid[emp.id][day - 1]?.code;
    if (prevCode && isWorkingShift(prevCode)) {
      const prevIdx = ERGONOMIC_SEQUENCE.indexOf(prevCode as ShiftCode);
      const currIdx = ERGONOMIC_SEQUENCE.indexOf(shift as ShiftCode);
      if (prevIdx >= 0 && currIdx >= 0) {
        if (currIdx >= prevIdx) score += 10 * weights.ergonomics;
        else score -= 10 * weights.ergonomics;
      }
    }
  }

  // Peticiones blandas (tipo B): bonus si coincide con preferencia
  for (const petition of emp.petitions) {
    if (petition.type !== "B" || petition.status !== "approved") continue;
    if (!petition.days.includes(day)) continue;
    if (petition.requestedShift === shift) {
      score += 20 * weights.petitions;
    }
    if (petition.avoidShift === shift) {
      score -= 20 * weights.petitions;
    }
  }

  // Continuidad: si el empleado tenía este turno ayer, ligero bonus
  if (day > 1) {
    const prevCode = grid[emp.id][day - 1]?.code;
    if (prevCode === shift) {
      score += 5 * weights.continuity;
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// CANDIDATE SELECTION (for coverage pass)
// ---------------------------------------------------------------------------

function pickBestCandidate(
  employees: EngineEmployee[],
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  shift: ShiftCode,
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  weights: WeightProfile,
  ergonomic: boolean,
  period: { year: number; month: number },
  weeks: number[][]
): EngineEmployee | null {
  let bestEmp: EngineEmployee | null = null;
  let bestScore = -Infinity;

  for (const emp of employees) {
    // Skip si ya tiene turno de trabajo asignado hoy
    if (grid[emp.id][day] && grid[emp.id][day].code !== "D") continue;
    // Skip si es descanso locked (Phase 04)
    if (grid[emp.id][day]?.locked) continue;
    // Skip si aún no ha empezado
    if (emp.isNewHire && emp.startDay && day < emp.startDay) continue;

    // Verificar 12h rest con día anterior
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
        if (shift !== "M") continue;
      }
    }

    // Verificar que no excede horas semanales
    const weekIdx = Math.floor((day - 1) / 7);
    const weekDays = weeks[weekIdx] ?? [];
    const currentHours = weeklyHours(grid[emp.id], weekDays);
    if (currentHours >= (emp.weeklyHours ?? 40)) continue;

    const score = scoreShift(emp, grid, day, shift, equity, weights, ergonomic);

    if (score > bestScore) {
      bestScore = score;
      bestEmp = emp;
    }
  }

  return bestEmp;
}

// ---------------------------------------------------------------------------
// EQUITY UPDATE
// ---------------------------------------------------------------------------

function updateEquity(
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  employeeId: string,
  shift: ShiftCode | string
): void {
  const eq = equity[employeeId];
  if (!eq) return;
  if (shift === "M" || shift === "11x19") eq.morningCount++;
  else if (shift === "T") eq.afternoonCount++;
  else if (shift === "N") eq.nightCount++;
}
