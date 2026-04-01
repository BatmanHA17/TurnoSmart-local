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
  countShiftOnDayExcluding,
  getWeeks,
  weeklyHours,
} from "../helpers";
import { ERGONOMIC_SEQUENCE, SHIFT_UNDESIRABILITY, TRANSITION_SHIFT, SPAIN_LABOR_LAW } from "../constants";

/** Turnos que rotan los FDA — solo M y T.
 *  N lo cubre el Night Agent (FIJO_NOCHE).
 *  Refuerzo nocturno solo si occupancy lo exige o FOM lo fuerza. */
const ROTATION_SHIFTS: ShiftCode[] = ["M", "T"];

export function assignRotating(ctx: PipelineContext): PipelineContext {
  const { grid, input, roleGroups, currentEquity } = ctx;
  const { period, constraints } = input;
  const totalDays = period.totalDays;
  const weights = input.weights;
  const weeks = getWeeks(totalDays);

  // Solo Front Desk Agents (ROTA_COMPLETO) entran en rotación
  const rotatingEmployees = roleGroups.ROTA_COMPLETO;
  if (rotatingEmployees.length === 0) return ctx;

  // FOM no cuenta para cobertura mínima — su turno fijo es adicional
  const fomIds = new Set(
    (roleGroups.FIJO_NO_ROTA ?? []).filter((e) => e.role === "FOM").map((e) => e.id)
  );

  // Determinar qué turnos necesitan cobertura FDA
  // N ya cubierto por Night Agent (FIJO_NO_ROTA con fixedShift=N) → solo refuerzo si occupancy lo pide
  const hasNightAgent = roleGroups.FIJO_NO_ROTA?.some(
    (e) => e.fixedShift === "N" || e.role === "NIGHT_SHIFT_AGENT"
  ) ?? false;
  const coverageShifts: ShiftCode[] = hasNightAgent ? ["M", "T"] : ["M", "T", "N"];

  // ===================================================================
  // PASS 0 — NIGHT AGENT REST COVERAGE
  // When Night Agent rests, FDAs cover N equitably. This runs FIRST so
  // the FDA assigned to N is excluded from M/T rotation that day.
  // N→N consecutive is VALID (16h rest: N ends 07:00, next N starts 23:00).
  // Only lock post-N rest when next day is NOT another Night Agent rest day.
  // This allows the same FDA to cover consecutive N shifts (e.g., Sat+Sun).
  // ===================================================================
  if (hasNightAgent) {
    const nightAgentRestDays = findNightAgentRestDays(grid, roleGroups, totalDays);
    const nightRestSet = new Set(nightAgentRestDays);
    for (const restDay of nightAgentRestDays) {
      const candidate = pickBestNightCandidate(
        rotatingEmployees, grid, restDay, currentEquity, weeks, totalDays
      );
      if (candidate) {
        grid[candidate.id][restDay] = makeAssignment("N", "engine");
        updateEquity(currentEquity, candidate.id, "N");
        // Post-N rest: NO lockear. La regla 12h en resolveFinalShift/pickBestShiftForDay
        // ya bloquea M (07:00) tras N (termina 07:00), pero permite T (15:00).
        // Lockear un D extra aquí causaba 3 rest/semana = solo 32h para el FDA.
      }
    }
  }

  // ===================================================================
  // PASS 1 — COVERAGE: asegurar minCoveragePerShift por turno y día
  // (sin contar FOM — su turno fijo es adicional)
  // ===================================================================
  for (let day = 1; day <= totalDays; day++) {
    for (const shift of coverageShifts) {
      const currentCount = countShiftOnDayExcluding(grid, day, shift, fomIds);
      const minCoverage = constraints.minCoveragePerShift[shift as "M" | "T" | "N"] ?? 1;
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
        // FDAs solo rotan M/T; N solo si no hay Night Agent
        const bestShift = pickBestShiftForDay(
          emp, grid, day, currentEquity, weights,
          constraints.ergonomicRotation, period, coverageShifts, fomIds
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
      if (shift === "M" && !violates12hRest(prevCode, TRANSITION_SHIFT)) {
        return TRANSITION_SHIFT; // 11×19 en vez de M — solo si respeta 12h
      }
      return null; // no se puede asignar (viola 12h incluso con transición)
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
  period: { year: number; month: number },
  allowedShifts: ShiftCode[] = ROTATION_SHIFTS,
  fomIds: Set<string> = new Set()
): ShiftCode | string | null {
  let bestShift: ShiftCode | string | null = null;
  let bestScore = -Infinity;

  for (const shift of allowedShifts) {
    // Verificar 12h rest con día anterior
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, shift)) {
        if (shift === "M" && !violates12hRest(prevCode, TRANSITION_SHIFT)) {
          // Evaluar 11×19 como alternativa — solo si no viola 12h tampoco
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

    // Bonus por cobertura: si este turno tiene poca gente hoy (sin contar FOM), priorizar
    const currentCount = countShiftOnDayExcluding(grid, day, shift, fomIds);
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

// ---------------------------------------------------------------------------
// NIGHT AGENT REST COVERAGE HELPERS
// ---------------------------------------------------------------------------

/** Finds days where Night Agent has locked D (rest from Phase 04) */
function findNightAgentRestDays(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  roleGroups: PipelineContext["roleGroups"],
  totalDays: number
): number[] {
  const restDays: number[] = [];
  for (const na of roleGroups.FIJO_NO_ROTA.filter(e => e.role === "NIGHT_SHIFT_AGENT")) {
    for (let d = 1; d <= totalDays; d++) {
      const cell = grid[na.id][d];
      if (cell && cell.code === "D" && cell.locked) {
        restDays.push(d);
      }
    }
  }
  return restDays;
}

/** Picks the best FDA to cover N on a Night Agent rest day (equity-based) */
function pickBestNightCandidate(
  employees: EngineEmployee[],
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  equity: Record<string, { morningCount: number; afternoonCount: number; nightCount: number }>,
  weeks: number[][],
  totalDays: number
): EngineEmployee | null {
  let bestEmp: EngineEmployee | null = null;
  let bestScore = Infinity; // lower nightCount = better candidate

  for (const emp of employees) {
    const cell = grid[emp.id][day];
    if (!cell || cell.locked) continue;
    if (cell.code !== "D") continue; // already has a shift assigned
    if (emp.isNewHire && emp.startDay && day < emp.startDay) continue;

    // Check 12h rest with previous day
    if (day > 1) {
      const prevCode = grid[emp.id][day - 1]?.code;
      if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, "N")) continue;
    }

    // Check 12h rest with next day — FDA needs D after N
    if (day < totalDays) {
      const nextCell = grid[emp.id][day + 1];
      if (nextCell && nextCell.locked && isWorkingShift(nextCell.code)) continue;
      if (nextCell && !nextCell.locked && nextCell.code !== "D") continue;
    }

    // Check weekly hours
    const weekIdx = Math.floor((day - 1) / 7);
    const weekDays = weeks[weekIdx] ?? [];
    const currentHours = weeklyHours(grid[emp.id], weekDays);
    if (currentHours >= (emp.weeklyHours ?? 40)) continue;

    // Equity: prefer FDA with fewest night shifts
    const nightCount = equity[emp.id]?.nightCount ?? 0;
    if (nightCount < bestScore) {
      bestScore = nightCount;
      bestEmp = emp;
    }
  }

  return bestEmp;
}
