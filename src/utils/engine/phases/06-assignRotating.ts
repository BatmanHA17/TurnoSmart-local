/**
 * Phase 06 — assignRotating (CORE)
 *
 * Asignación día a día de turnos M/T/N para Front Desk Agents.
 * NO por bloques semanales — un empleado puede hacer M y T en la misma semana.
 *
 * Lógica:
 * - Para cada día, para cada slot sin cubrir (M, T, N)
 * - Evaluar candidatos disponibles con scoring ponderado
 * - Scoring: equidad M/T/N + rotación ergonómica + peticiones blandas + continuidad
 * - Usar 11×19 como transición cuando T→M violaría 12h
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
} from "../helpers";
import { ERGONOMIC_SEQUENCE, SHIFT_UNDESIRABILITY, TRANSITION_SHIFT } from "../constants";

/** Turnos a asignar en orden de prioridad (N primero porque es más restrictivo) */
const ROTATION_SHIFTS: ShiftCode[] = ["N", "M", "T"];

export function assignRotating(ctx: PipelineContext): PipelineContext {
  const { grid, input, roleGroups, currentEquity } = ctx;
  const { period, constraints } = input;
  const totalDays = period.totalDays;
  const weights = input.weights;

  // Solo Front Desk Agents (ROTA_COMPLETO) entran en rotación
  const rotatingEmployees = roleGroups.ROTA_COMPLETO;
  if (rotatingEmployees.length === 0) return ctx;

  // Día a día
  for (let day = 1; day <= totalDays; day++) {
    for (const shift of ROTATION_SHIFTS) {
      // ¿Cuántos ya cubren este turno hoy?
      const currentCount = countShiftOnDay(grid, day, shift);
      const minCoverage = constraints.minCoveragePerShift;
      if (currentCount >= minCoverage) continue;

      const needed = minCoverage - currentCount;
      for (let n = 0; n < needed; n++) {
        const candidate = pickBestCandidate(
          rotatingEmployees, grid, day, shift, currentEquity, weights, constraints.ergonomicRotation
        );
        if (!candidate) break;

        // Verificar 12h rest con el día anterior
        let finalShift: ShiftCode | string = shift;
        if (day > 1) {
          const prevCode = grid[candidate.id][day - 1]?.code;
          if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
            // Usar turno de transición 11×19 en vez de M si venimos de T
            if (shift === "M") {
              finalShift = TRANSITION_SHIFT;
            } else {
              continue; // no se puede asignar este turno sin violar 12h
            }
          }
        }

        grid[candidate.id][day] = makeAssignment(finalShift, "engine");

        // Actualizar equity
        updateEquity(currentEquity, candidate.id, shift);
      }
    }
  }

  return { ...ctx, grid, currentEquity };
}

// ---------------------------------------------------------------------------
// CANDIDATE SELECTION
// ---------------------------------------------------------------------------

function pickBestCandidate(
  employees: EngineEmployee[],
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  shift: ShiftCode,
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  weights: WeightProfile,
  ergonomic: boolean
): EngineEmployee | null {
  let bestEmp: EngineEmployee | null = null;
  let bestScore = -Infinity;

  for (const emp of employees) {
    // Skip si ya tiene asignación para hoy
    if (grid[emp.id][day] && grid[emp.id][day].code !== "D") continue;
    if (grid[emp.id][day]?.locked) continue;
    if (emp.isNewHire && emp.startDay && day < emp.startDay) continue;

    // Skip si es día de descanso asignado (locked) por Phase 04
    if (grid[emp.id][day]?.code === "D" && grid[emp.id][day]?.locked) {
      continue; // Libre obligatorio, no tocar
    }

    // Verificar 12h rest con día anterior
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
        if (shift !== "M") continue; // solo M se puede reemplazar por 11×19
      }
    }

    // Scoring
    let score = 0;

    // Equidad: priorizar al empleado con menos turnos de este tipo
    const eq = equity[emp.id];
    if (eq) {
      const shiftCount = shift === "M" ? eq.morningCount
        : shift === "T" ? eq.afternoonCount
        : eq.nightCount;
      // Menos turnos → mayor score (deuda = prioridad)
      score += (100 - shiftCount) * weights.equity;
    }

    // Rotación ergonómica: M→T→N (bonus si sigue la secuencia)
    if (ergonomic && day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode)) {
        const prevIdx = ERGONOMIC_SEQUENCE.indexOf(prevCode as ShiftCode);
        const currIdx = ERGONOMIC_SEQUENCE.indexOf(shift);
        if (prevIdx >= 0 && currIdx >= 0) {
          if (currIdx >= prevIdx) score += 10 * weights.ergonomics; // hacia adelante: bonus
          else score -= 10 * weights.ergonomics; // hacia atrás: penalización
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

    // Continuidad: si el empleado tenía este turno ayer, ligero bonus (menos cambios)
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode === shift) {
        score += 5 * weights.continuity;
      }
    }

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
  shift: ShiftCode
): void {
  const eq = equity[employeeId];
  if (!eq) return;
  if (shift === "M") eq.morningCount++;
  else if (shift === "T") eq.afternoonCount++;
  else if (shift === "N") eq.nightCount++;
}
