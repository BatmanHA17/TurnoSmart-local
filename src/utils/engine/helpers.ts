/**
 * TurnoSmart® — SMART Engine v2.0 — Helpers
 *
 * Utilidades de fecha, cálculo de horas, y funciones auxiliares.
 * Pure TypeScript — sin dependencias externas (no date-fns aquí).
 */

import type { ShiftCode, DayAssignmentV2, GenerationPeriod } from "./types";
import { SHIFT_TIMES, WORKING_SHIFTS, ABSENCE_CODES } from "./constants";

// ---------------------------------------------------------------------------
// FECHAS
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// PERIOD-DAY DATE HELPERS
// Period day indices (d=1,2,3...) are offsets from startDate, NOT month day numbers.
// Always use these functions when converting period days to calendar dates.
// ---------------------------------------------------------------------------

/**
 * Returns the actual calendar Date for a period day index (1-based).
 * d=1 → startDate, d=2 → startDate+1, etc.
 */
export function periodDayDate(startDate: string, d: number): Date {
  const base = new Date(startDate + "T00:00:00");
  base.setDate(base.getDate() + d - 1);
  return base;
}

/** ISO day of week (0=Mon…6=Sun) for a period day index */
export function periodDayOfWeekISO(startDate: string, d: number): number {
  const date = periodDayDate(startDate, d);
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

export function isPeriodWeekend(startDate: string, d: number): boolean {
  const dow = periodDayOfWeekISO(startDate, d);
  return dow === 5 || dow === 6;
}

export function isPeriodSaturday(startDate: string, d: number): boolean {
  return periodDayOfWeekISO(startDate, d) === 5;
}

export function isPeriodSunday(startDate: string, d: number): boolean {
  return periodDayOfWeekISO(startDate, d) === 6;
}

export function isPeriodMonday(startDate: string, d: number): boolean {
  return periodDayOfWeekISO(startDate, d) === 0;
}

/** Obtiene el número de días en un mes (1-indexed) */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Día de la semana: 0=lunes … 6=domingo (ISO) */
export function dayOfWeekISO(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day);
  return d.getDay() === 0 ? 6 : d.getDay() - 1; // JS: 0=dom → ISO: 0=lun
}

/** true si el día es sábado (5) o domingo (6) en ISO */
export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = dayOfWeekISO(year, month, day);
  return dow === 5 || dow === 6;
}

/** true si es sábado */
export function isSaturday(year: number, month: number, day: number): boolean {
  return dayOfWeekISO(year, month, day) === 5;
}

/** true si es domingo */
export function isSunday(year: number, month: number, day: number): boolean {
  return dayOfWeekISO(year, month, day) === 6;
}

/** true si es lunes */
export function isMonday(year: number, month: number, day: number): boolean {
  return dayOfWeekISO(year, month, day) === 0;
}

/** Obtiene la fecha ISO "YYYY-MM-DD" */
export function toISO(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Construye un GenerationPeriod de semanas completas L-D que cubra todo el mes.
 *
 * Regla: el período empieza en el primer lunes >= día 1 del mes.
 * Si el día 1 no es lunes, los días previos pertenecen a la generación
 * del mes anterior (su última semana se extiende al domingo siguiente).
 *
 * El período termina en el domingo >= último día del mes, para no dejar
 * días sueltos al final.
 *
 * Ejemplo marzo 2026 (1 = domingo):
 *   start = lunes 2 mar, end = domingo 5 abr → 5 semanas (35 días)
 * Ejemplo abril 2026 (1 = miércoles):
 *   start = lunes 6 abr, end = domingo 3 may → 4 semanas (28 días)
 *
 * @param weeks — si se pasa, se usa ese número fijo; si no, se auto-calcula.
 */
export function buildGenerationPeriod(
  year: number,
  month: number,
  weeks?: number
): GenerationPeriod {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // último día del mes

  // Start: primer lunes >= día 1 del mes
  const firstDow = firstDay.getDay(); // 0=dom, 1=lun, ..., 6=sáb
  let startDate: Date;
  if (firstDow === 1) {
    // Ya es lunes
    startDate = new Date(firstDay);
  } else {
    // Avanzar al próximo lunes
    const daysUntilMonday = firstDow === 0 ? 1 : 8 - firstDow;
    startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() + daysUntilMonday);
  }

  if (weeks) {
    // Semanas fijas: endDate = startDate + weeks*7 - 1
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7 - 1);
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      totalDays: weeks * 7,
      totalWeeks: weeks,
      year,
      month,
    };
  }

  // Auto-calcular: End = domingo >= último día del mes
  const lastDow = lastDay.getDay(); // 0=dom
  let endDate: Date;
  if (lastDow === 0) {
    // Ya es domingo
    endDate = new Date(lastDay);
  } else {
    const daysToSunday = 7 - lastDow;
    endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + daysToSunday);
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = totalDays / 7;

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    totalDays,
    totalWeeks,
    year,
    month,
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// SEMANAS
// ---------------------------------------------------------------------------

/** Dado un rango de días (1-based), devuelve las semanas como arrays de días */
export function getWeeks(totalDays: number): number[][] {
  const weeks: number[][] = [];
  for (let start = 1; start <= totalDays; start += 7) {
    const week: number[] = [];
    for (let d = start; d < start + 7 && d <= totalDays; d++) {
      week.push(d);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Obtiene el número de semana (0-based) para un día (1-based) dentro del período */
export function weekIndexForDay(day: number): number {
  return Math.floor((day - 1) / 7);
}

// ---------------------------------------------------------------------------
// HORAS
// ---------------------------------------------------------------------------

/** Calcula horas entre dos tiempos "HH:MM" (maneja cruce de medianoche) */
export function hoursBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // cruce medianoche (N: 23:00→07:00)
  return (endMin - startMin) / 60;
}

/** Obtiene las horas de un código de turno conocido */
export function shiftHours(code: string): number {
  const shift = SHIFT_TIMES[code];
  if (shift) return shift.hours;
  // Ad-hoc: "14x22" → parse
  return parseAdHocHours(code);
}

/** Parsea un código ad-hoc tipo "14x22" → horas */
export function parseAdHocHours(code: string): number {
  const match = code.match(/^(\d{1,2})x(\d{1,2})$/);
  if (!match) return 0;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  return hoursBetween(`${start}:00`, `${end}:00`);
}

/** Parsea un código ad-hoc tipo "14x22" → { startTime, endTime } */
export function parseAdHocTimes(code: string): { startTime: string; endTime: string } | null {
  const match = code.match(/^(\d{1,2})x(\d{1,2})$/);
  if (!match) return null;
  return {
    startTime: `${match[1].padStart(2, "0")}:00`,
    endTime: `${match[2].padStart(2, "0")}:00`,
  };
}

/** Calcula horas totales trabajadas en una semana (array de días) */
export function weeklyHours(
  schedule: Record<number, DayAssignmentV2>,
  weekDays: number[]
): number {
  let total = 0;
  for (const day of weekDays) {
    const assignment = schedule[day];
    if (assignment && isWorkingShift(assignment.code)) {
      total += assignment.hours;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// SHIFT CLASSIFICATION
// ---------------------------------------------------------------------------

/** true si el turno cuenta como trabajo (horas computables) */
export function isWorkingShift(code: string): boolean {
  if (WORKING_SHIFTS.has(code)) return true;
  // Ad-hoc shifts (ej: "14x22") son trabajo
  return /^\d{1,2}x\d{1,2}$/.test(code);
}

/** true si el código es una ausencia */
export function isAbsence(code: string): boolean {
  return ABSENCE_CODES.has(code);
}

/** true si es un turno de descanso (D, V, DB, DG, PM, PC, E, F) */
export function isRestOrAbsence(code: string): boolean {
  return !isWorkingShift(code);
}

// ---------------------------------------------------------------------------
// REST VALIDATION (12h entre jornadas)
// ---------------------------------------------------------------------------

/** Hora de fin de un turno (en minutos desde 00:00, puede ser >1440 si cruza medianoche) */
function endTimeMinutes(code: string): number {
  const shift = SHIFT_TIMES[code];
  if (shift) {
    const [h, m] = shift.endTime.split(":").map(Number);
    let min = h * 60 + m;
    // N acaba a las 07:00 del día siguiente → 07:00 + 1440
    if (code === "N") min += 24 * 60;
    return min;
  }
  const parsed = parseAdHocTimes(code);
  if (parsed) {
    const [h, m] = parsed.endTime.split(":").map(Number);
    return h * 60 + m;
  }
  return 0;
}

/** Hora de inicio de un turno (en minutos desde 00:00) */
function startTimeMinutes(code: string): number {
  const shift = SHIFT_TIMES[code];
  if (shift) {
    const [h, m] = shift.startTime.split(":").map(Number);
    return h * 60 + m;
  }
  const parsed = parseAdHocTimes(code);
  if (parsed) {
    const [h, m] = parsed.startTime.split(":").map(Number);
    return h * 60 + m;
  }
  return 0;
}

/**
 * Calcula las horas de descanso entre el turno de hoy y el de mañana.
 * Tiene en cuenta cruces de medianoche (ej: N acaba a las 07:00 del día siguiente).
 */
export function restHoursBetween(todayCode: string, tomorrowCode: string): number {
  if (!isWorkingShift(todayCode) || !isWorkingShift(tomorrowCode)) {
    return 24; // si uno de los dos es descanso/ausencia → no hay conflicto
  }

  const endMin = endTimeMinutes(todayCode);
  let startMin = startTimeMinutes(tomorrowCode);

  // Si el turno de hoy cruza medianoche (ej: N), el fin es al día siguiente
  // y el inicio del turno de mañana también es al día siguiente
  if (todayCode === "N" || endMin > 24 * 60) {
    // N acaba a las 07:00 del día siguiente, turno de mañana empieza en el día siguiente
    startMin += 24 * 60; // mañana = +24h respecto al "hoy"
  } else {
    startMin += 24 * 60; // el día siguiente siempre es +24h
  }

  const restMinutes = startMin - endMin;
  return restMinutes / 60;
}

/** true si la transición todayCode → tomorrowCode viola las 12h de descanso */
export function violates12hRest(todayCode: string, tomorrowCode: string): boolean {
  return restHoursBetween(todayCode, tomorrowCode) < 12;
}

// ---------------------------------------------------------------------------
// GRID HELPERS
// ---------------------------------------------------------------------------

/** Crea una asignación de día vacía (descanso) */
export function makeRestDay(day: number): DayAssignmentV2 {
  return {
    code: "D",
    startTime: "00:00",
    endTime: "00:00",
    hours: 0,
    source: "engine",
    forced: false,
    locked: false,
    conflicts: [],
  };
}

/** Crea una asignación de día para un código de turno conocido */
export function makeAssignment(
  code: ShiftCode | string,
  source: DayAssignmentV2["source"] = "engine"
): DayAssignmentV2 {
  const shift = SHIFT_TIMES[code];
  if (shift) {
    return {
      code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hours: shift.hours,
      source,
      forced: false,
      locked: false,
      conflicts: [],
    };
  }
  // Ad-hoc
  const parsed = parseAdHocTimes(code);
  return {
    code,
    startTime: parsed?.startTime ?? "00:00",
    endTime: parsed?.endTime ?? "00:00",
    hours: parseAdHocHours(code),
    source,
    forced: false,
    locked: false,
    conflicts: [],
  };
}

/** Inicializa un grid vacío para todos los empleados × todos los días */
export function initGrid(
  employeeIds: string[],
  totalDays: number
): Record<string, Record<number, DayAssignmentV2>> {
  const grid: Record<string, Record<number, DayAssignmentV2>> = {};
  for (const id of employeeIds) {
    grid[id] = {};
    for (let d = 1; d <= totalDays; d++) {
      grid[id][d] = makeRestDay(d);
    }
  }
  return grid;
}

/** true si un día ya tiene asignación que no sea descanso por defecto */
export function isAssigned(grid: Record<number, DayAssignmentV2>, day: number): boolean {
  const a = grid[day];
  if (!a) return false;
  return a.code !== "D" || a.source !== "engine" || a.locked;
}

/** Cuenta cuántos empleados tienen un turno específico en un día */
export function countShiftOnDay(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  shiftCode: string
): number {
  let count = 0;
  for (const empId of Object.keys(grid)) {
    if (grid[empId][day]?.code === shiftCode) count++;
  }
  return count;
}

/** Cuenta turnos en un día excluyendo ciertos empleados (ej: FOM no cuenta para cobertura) */
export function countShiftOnDayExcluding(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number,
  shiftCode: string,
  excludeIds: Set<string>
): number {
  let count = 0;
  for (const empId of Object.keys(grid)) {
    if (excludeIds.has(empId)) continue;
    if (grid[empId][day]?.code === shiftCode) count++;
  }
  return count;
}

/** Cuenta cuántos empleados trabajan (cualquier turno de trabajo) en un día */
export function countWorkingOnDay(
  grid: Record<string, Record<number, DayAssignmentV2>>,
  day: number
): number {
  let count = 0;
  for (const empId of Object.keys(grid)) {
    const code = grid[empId][day]?.code;
    if (code && isWorkingShift(code)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// DISPLAY HELPERS
// ---------------------------------------------------------------------------

/** Converts an engine shift code to a human-readable display name.
 *  "11x19" → "11h a 19h", "9x17" → "9h a 17h", "M" → "Mañana", etc. */
export function formatShiftDisplay(code: string): string {
  const shift = SHIFT_TIMES[code];
  if (shift) return shift.label;
  // Ad-hoc: "14x22" → "14h a 22h"
  const match = code.match(/^(\d{1,2})x(\d{1,2})$/);
  if (match) return `${match[1]}h a ${match[2]}h`;
  return code;
}
