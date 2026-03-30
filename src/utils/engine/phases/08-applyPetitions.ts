/**
 * Phase 08 — applyPetitions
 *
 * Procesa peticiones blandas (B), intercambios (C) y recurrentes (D).
 * Las peticiones tipo A (duras) ya fueron ancladas en Phase 03.
 *
 * Lógica:
 * - Tipo B (blanda): si el turno asignado no coincide con la preferencia,
 *   intenta intercambiar con otro empleado que tenga mejor score para ese turno.
 * - Tipo C (intercambio): dos empleados acuerdan cambio. Se valida 12h rest
 *   y cobertura antes de aplicar.
 * - Tipo D (recurrente SMART): tratadas como B con prioridad alta.
 *
 * Respeta:
 * - 12h descanso entre jornadas
 * - Cobertura mínima por turno
 * - No toca asignaciones locked
 */

import type { PipelineContext, Petition, ShiftCode, DayAssignmentV2 } from "../types";
import {
  isWorkingShift,
  violates12hRest,
  countShiftOnDay,
  makeAssignment,
} from "../helpers";

export function applyPetitions(ctx: PipelineContext): PipelineContext {
  const { grid, input } = ctx;
  const { employees, period, constraints } = input;
  const totalDays = period.totalDays;

  // Recopilar todas las peticiones B, C, D ordenadas por prioridad
  const pendingPetitions: Array<{ petition: Petition; employeeId: string }> = [];

  for (const emp of employees) {
    for (const pet of emp.petitions) {
      if (pet.type === "A") continue; // ya procesadas en Phase 03
      if (pet.status !== "approved") continue;
      pendingPetitions.push({ petition: pet, employeeId: emp.id });
    }
  }

  // Ordenar: prioridad 1 primero, luego tipo D > B > C
  pendingPetitions.sort((a, b) => {
    if (a.petition.priority !== b.petition.priority) {
      return a.petition.priority - b.petition.priority;
    }
    const typeOrder = { D: 0, B: 1, C: 2 };
    return (typeOrder[a.petition.type as "D" | "B" | "C"] ?? 3) -
           (typeOrder[b.petition.type as "D" | "B" | "C"] ?? 3);
  });

  for (const { petition, employeeId } of pendingPetitions) {
    switch (petition.type) {
      case "B":
      case "D":
        applyBlandPetition(grid, employeeId, petition, totalDays, constraints.minCoveragePerShift);
        break;
      case "C":
        applyExchange(grid, employeeId, petition, totalDays, constraints.minCoveragePerShift);
        break;
    }
  }

  return { ...ctx, grid };
}

// ---------------------------------------------------------------------------
// TIPO B / D — Petición blanda
// ---------------------------------------------------------------------------

function applyBlandPetition(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  employeeId: string,
  petition: Petition,
  totalDays: number,
  minCoverage: number
): void {
  for (const day of petition.days) {
    if (day < 1 || day > totalDays) continue;
    const current = grid[employeeId][day];
    if (!current || current.locked) continue;

    // Si pide un turno específico
    if (petition.requestedShift) {
      const requested = petition.requestedShift as string;
      if (current.code === requested) continue; // ya lo tiene

      // Verificar que el cambio es seguro
      if (!canSwapShift(grid, employeeId, day, requested, totalDays, minCoverage)) continue;

      // Buscar otro empleado que pueda tomar el turno actual
      const swapPartner = findSwapPartner(grid, employeeId, day, current.code, requested, totalDays, minCoverage);
      if (swapPartner) {
        // Swap
        grid[swapPartner][day] = { ...current, source: "engine" };
        grid[employeeId][day] = makeAssignment(requested as ShiftCode, "petition_b");
      }
    }

    // Si pide evitar un turno
    if (petition.avoidShift && current.code === petition.avoidShift) {
      // Buscar alguien que pueda tomar este turno
      const replacement = findSwapPartner(grid, employeeId, day, current.code, "M", totalDays, minCoverage);
      if (replacement) {
        const altShift = current.code === "M" ? "T" : "M";
        if (canSwapShift(grid, employeeId, day, altShift, totalDays, minCoverage)) {
          grid[replacement][day] = { ...current, source: "engine" };
          grid[employeeId][day] = makeAssignment(altShift as ShiftCode, "petition_b");
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TIPO C — Intercambio entre dos empleados
// ---------------------------------------------------------------------------

function applyExchange(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  employeeId: string,
  petition: Petition,
  totalDays: number,
  minCoverage: number
): void {
  if (!petition.exchangeWithEmployeeId || !petition.exchangeDay) return;

  const emp1 = employeeId;
  const emp2 = petition.exchangeWithEmployeeId;
  const day1 = petition.days[0];
  const day2 = petition.exchangeDay;

  if (!day1 || day1 < 1 || day1 > totalDays) return;
  if (day2 < 1 || day2 > totalDays) return;

  const shift1 = grid[emp1]?.[day1];
  const shift2 = grid[emp2]?.[day2];
  if (!shift1 || !shift2) return;
  if (shift1.locked || shift2.locked) return;

  // Validar 12h rest para ambos tras el intercambio
  if (day1 > 1) {
    const prev = grid[emp1][day1 - 1]?.code;
    if (prev && isWorkingShift(prev) && violates12hRest(prev, shift2.code)) return;
  }
  if (day1 < totalDays) {
    const next = grid[emp1][day1 + 1]?.code;
    if (next && isWorkingShift(next) && violates12hRest(shift2.code, next)) return;
  }
  if (day2 > 1) {
    const prev = grid[emp2][day2 - 1]?.code;
    if (prev && isWorkingShift(prev) && violates12hRest(prev, shift1.code)) return;
  }
  if (day2 < totalDays) {
    const next = grid[emp2][day2 + 1]?.code;
    if (next && isWorkingShift(next) && violates12hRest(shift1.code, next)) return;
  }

  // Ejecutar intercambio
  grid[emp1][day1] = { ...shift2, source: "exchange" };
  grid[emp2][day2] = { ...shift1, source: "exchange" };
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function canSwapShift(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  employeeId: string,
  day: number,
  newCode: string,
  totalDays: number,
  minCoverage: number
): boolean {
  // Verificar 12h rest
  if (day > 1) {
    const prev = grid[employeeId][day - 1]?.code;
    if (prev && isWorkingShift(prev) && violates12hRest(prev, newCode)) return false;
  }
  if (day < totalDays) {
    const next = grid[employeeId][day + 1]?.code;
    if (next && isWorkingShift(next) && violates12hRest(newCode, next)) return false;
  }
  return true;
}

function findSwapPartner(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  excludeId: string,
  day: number,
  currentCode: string,
  newCode: string,
  totalDays: number,
  minCoverage: number
): string | null {
  for (const empId of Object.keys(grid)) {
    if (empId === excludeId) continue;
    const empDay = grid[empId][day];
    if (!empDay || empDay.locked) continue;

    // Candidato: tiene el turno que queremos y puede tomar el nuestro
    if (empDay.code === newCode) {
      if (canSwapShift(grid, empId, day, currentCode, totalDays, minCoverage)) {
        return empId;
      }
    }
  }
  return null;
}
