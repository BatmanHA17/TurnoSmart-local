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
  // PASS 0 — NIGHT AGENT REST COVERAGE (Seniority-Rotation Model)
  //
  // Per operational rules: ONE FDA covers ALL Night Agent rest days in a
  // given week. The assignment rotates weekly by seniority (most senior
  // FDA covers week 1, next week 2, etc.). This ensures:
  //   - Equitable night coverage rotation across periods
  //   - Consecutive N shifts are legal (N→N = 16h rest ✅)
  //   - Only 1 post-N forced rest (after the LAST N), not 1 per N
  //
  // CRITICAL: After N, ALL shifts next day violate 12h rest:
  //   N ends 07:00 → M(07:00)=0h, T(15:00)=8h, 11x19(11:00)=4h — all < 12h
  // So the post-N day is FORCED rest. To keep 5 work days (40h), we
  // compensate by unlocking one Phase04 rest day when needed.
  // ===================================================================
  if (hasNightAgent) {
    const nightAgentRestDays = findNightAgentRestDays(grid, roleGroups, totalDays);

    // Group Night Agent rest days by week
    const nightRestByWeek: Map<number, number[]> = new Map();
    for (const restDay of nightAgentRestDays) {
      const weekIdx = Math.floor((restDay - 1) / 7);
      if (!nightRestByWeek.has(weekIdx)) nightRestByWeek.set(weekIdx, []);
      nightRestByWeek.get(weekIdx)!.push(restDay);
    }

    // Sort FDAs by name (proxy for seniority/order) for rotation
    const sortedFDAs = [...rotatingEmployees].sort((a, b) => a.name.localeCompare(b.name));

    let rotationIdx = 0; // rotates through FDAs across weeks
    for (const [weekIdx, restDaysInWeek] of nightRestByWeek) {
      // Sort rest days within the week for consecutive assignment
      restDaysInWeek.sort((a, b) => a - b);

      // Try to assign ALL rest days in this week to one FDA (rotation model)
      let assigned = false;
      for (let attempt = 0; attempt < sortedFDAs.length; attempt++) {
        const candidateIdx = (rotationIdx + attempt) % sortedFDAs.length;
        const candidate = sortedFDAs[candidateIdx];

        // Check if this candidate can cover ALL N days in this week
        const canCoverAll = restDaysInWeek.every(day => {
          const cell = grid[candidate.id][day];
          if (!cell || cell.locked) return false;
          if (cell.code !== "D") return false;
          if (candidate.isNewHire && candidate.startDay && day < candidate.startDay) return false;
          // Check 12h rest with previous day (only for the first N in the group)
          if (day === restDaysInWeek[0] && day > 1) {
            const prevCode = grid[candidate.id][day - 1]?.code;
            if (prevCode && isWorkingShift(prevCode) && violates12hRest(prevCode, "N")) return false;
          }
          return true;
        });

        // Also check weekly hours
        const weekDays = weeks[weekIdx] ?? [];
        const currentHours = weeklyHours(grid[candidate.id], weekDays);
        const nightHours = restDaysInWeek.length * 8;
        if (currentHours + nightHours > (candidate.weeklyHours ?? 40)) continue;

        if (canCoverAll) {
          // Assign ALL N shifts in this week to this one FDA
          for (const day of restDaysInWeek) {
            grid[candidate.id][day] = makeAssignment("N", "engine");
            updateEquity(currentEquity, candidate.id, "N");
          }

          // Post-N mandatory rest: lock day after LAST N as D so PASS 2
          // can't assign a shift there (N ends 07:00, ALL shifts violate 12h).
          const lastNDay = restDaysInWeek[restDaysInWeek.length - 1];
          const postNDay = lastNDay + 1;
          if (postNDay <= totalDays) {
            const postNCell = grid[candidate.id][postNDay];
            const isPostNAlreadyLockedRest = postNCell?.locked && postNCell?.code === "D";

            if (!isPostNAlreadyLockedRest) {
              // Lock post-N day as mandatory rest
              grid[candidate.id][postNDay] = {
                ...grid[candidate.id][postNDay],
                code: "D",
                locked: true,
                hours: 0,
              };

              // Now we may have 3+ rest days. Count total locked rests this week
              // (including the new post-N lock) and unlock one Phase04 rest if needed.
              const postNWeekIdx = Math.floor((postNDay - 1) / 7);
              const postNWeekDays = weeks[postNWeekIdx] ?? weekDays;
              const allLockedRests = postNWeekDays.filter(d => {
                const cell = grid[candidate.id][d];
                return cell?.locked && cell?.code === "D";
              });
              // Also count locked rests in the N-week if different
              const nWeekLockedRests = weekDays.filter(d => {
                const cell = grid[candidate.id][d];
                return cell?.locked && cell?.code === "D";
              });
              const totalLockedRests = new Set([...allLockedRests, ...nWeekLockedRests]).size;

              if (totalLockedRests > 2) {
                // Unlock one Phase04 rest (NOT the post-N one) to compensate
                const phase04Rests = weekDays.filter(d => {
                  const cell = grid[candidate.id][d];
                  return cell?.locked && cell?.code === "D" && d !== postNDay;
                });
                if (phase04Rests.length > 0) {
                  const dayToUnlock = phase04Rests[phase04Rests.length - 1];
                  grid[candidate.id][dayToUnlock] = {
                    ...grid[candidate.id][dayToUnlock],
                    locked: false,
                  };
                }
              }
            }
          }

          rotationIdx = (candidateIdx + 1) % sortedFDAs.length;
          assigned = true;
          break;
        }
      }

      // Fallback: if no single FDA can cover all, assign individually
      if (!assigned) {
        for (const day of restDaysInWeek) {
          const candidate = pickBestNightCandidate(
            rotatingEmployees, grid, day, currentEquity, weeks, totalDays
          );
          if (candidate) {
            grid[candidate.id][day] = makeAssignment("N", "engine");
            updateEquity(currentEquity, candidate.id, "N");

            // Lock post-N day as mandatory rest if this is the last N
            const isLastNInWeek = day === restDaysInWeek[restDaysInWeek.length - 1];
            const nextDayIsAlsoN = restDaysInWeek.includes(day + 1);
            if (isLastNInWeek || !nextDayIsAlsoN) {
              const postNDay = day + 1;
              if (postNDay <= totalDays) {
                const postNCell = grid[candidate.id][postNDay];
                const isPostNAlreadyLockedRest = postNCell?.locked && postNCell?.code === "D";
                if (!isPostNAlreadyLockedRest) {
                  // Lock post-N as mandatory rest
                  grid[candidate.id][postNDay] = {
                    ...grid[candidate.id][postNDay],
                    code: "D",
                    locked: true,
                    hours: 0,
                  };
                  // Unlock one Phase04 rest to compensate if 3+ rests
                  const wkDays = weeks[weekIdx] ?? [];
                  const lockedRestDays = wkDays.filter(d => {
                    const cell = grid[candidate.id][d];
                    return cell?.locked && cell?.code === "D" && d !== postNDay;
                  });
                  if (lockedRestDays.length >= 2) {
                    const dayToUnlock = lockedRestDays[lockedRestDays.length - 1];
                    grid[candidate.id][dayToUnlock] = {
                      ...grid[candidate.id][dayToUnlock],
                      locked: false,
                    };
                  }
                }
              }
            }
          }
        }
        rotationIdx = (rotationIdx + 1) % sortedFDAs.length;
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
  let bestScore = -Infinity; // higher score = better (overlapBonus - nightCount)

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

    // Score: equity (fewer nights = better) + overlap bonus if Phase04
    // locked rest includes day+1 (post-N rest overlaps → no compensation needed)
    const nightCount = equity[emp.id]?.nightCount ?? 0;
    let overlapBonus = 0;
    if (day < totalDays) {
      const nextCell = grid[emp.id][day + 1];
      if (nextCell?.locked && nextCell?.code === "D") {
        overlapBonus = 100; // strong preference for overlap
      }
    }
    const score = overlapBonus - nightCount;
    if (score > bestScore) {
      bestScore = score;
      bestEmp = emp;
    }
  }

  return bestEmp;
}
