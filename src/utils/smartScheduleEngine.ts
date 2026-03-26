/**
 * TurnoSmart® — SMART Schedule Engine v1.0
 *
 * Motor de generación de cuadrantes. Pure TypeScript, sin dependencias
 * de React ni Supabase. Testeable en aislamiento.
 *
 * Principio: "Turno en 90 segundos"
 * Con solo nombre + horas/semana + rol, genera un cuadrante legal completo.
 */

// ---------------------------------------------------------------------------
// TIPOS PÚBLICOS
// ---------------------------------------------------------------------------

export type ShiftCode =
  | "M"   // Mañana    07:00–15:00
  | "T"   // Tarde     15:00–23:00
  | "N"   // Noche     23:00–07:00
  | "D"   // Descanso (día libre)
  | "V"   // Vacaciones
  | "G"   // Guardia   09:00–21:00  (solo jefes)
  | "GT"  // Guardia tarde 11:00–23:00 (solo jefes)
  | "E"   // Enfermedad / Baja
  | "F"   // Festivo trabajado
  | "DB"  // Día Debido (horas extra acumuladas)
  | "DG"; // Día Debido Guardia

export type EmployeeRole = "employee" | "manager" | "gex";

/** Shift preference del empleado para el generador */
export type ShiftPreference = "rotating" | "morning" | "afternoon" | "night_fixed";

/** Datos mínimos necesarios para generar un turno (el resto es HR opcional) */
export interface ScheduleEmployee {
  id: string;
  name: string;
  weeklyHours: 40 | 30 | 20 | 16 | number; // horas contrato/semana
  role: EmployeeRole;
  preference: ShiftPreference;
  /** Días (1-based, día del mes) con vacaciones ya aprobadas */
  vacationDays?: number[];
  /** Días (1-based) bloqueados por otras razones (baja, permiso, etc.) */
  blockedDays?: Array<{ day: number; code: ShiftCode }>;
}

export interface ScheduleInput {
  employees: ScheduleEmployee[];
  year: number;
  month: number; // 1-12
  constraints?: Partial<OrganizationConstraints>;
  /** Ocupación prevista por día (índice 0 = día 1). Opcional. */
  occupancyForecast?: number[];
}

export interface DayAssignment {
  code: ShiftCode;
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  /** true si fue forzado por cobertura mínima (puede necesitar revisión) */
  forced?: boolean;
}

export type EmployeeSchedule = Record<number, DayAssignment>; // day (1-based) → assignment

export interface ScheduleOutput {
  /** employeeId → schedule del mes */
  schedules: Record<string, EmployeeSchedule>;
  violations: ScheduleViolation[];
  warnings: ScheduleWarning[];
  /** 0–100: calidad del cuadrante generado */
  score: number;
  meta: {
    daysInMonth: number;
    generatedAt: string;
  };
}

export interface ScheduleViolation {
  employeeId: string;
  day: number;
  rule: string;
  description: string;
}

export interface ScheduleWarning {
  employeeId: string;
  day?: number;
  rule: string;
  description: string;
}

// ---------------------------------------------------------------------------
// CONSTRAINTS — 3 NIVELES
// ---------------------------------------------------------------------------

/** Nivel 1: Ley — hardcoded, siempre activos */
const SPAIN_LABOR_LAW = {
  minRestBetweenShiftsHours: 12,
  minFreeDaysPerWeek: 2,
  freeDaysMustBeConsecutive: true,
  maxWeeklyHours: 40,
  /** Reforma en tramitación — activar cuando entre en vigor */
  futureMaxWeeklyHours: 37.5,
  nightShiftNextDayFree: true,
  /** T→M siempre ilegal: turno tarde acaba 23:00, mañana empieza 07:00 = 8h < 12h */
  prohibitTafternooonToMorning: true,
} as const;

/** Nivel 2: Convenio / Organización — configurable por usuario */
export interface OrganizationConstraints {
  /** Rotación ergonómica hacia adelante: M→T→N (nunca N→M directo) */
  ergonomicRotation: boolean;
  /** Equidad de fines de semana: rotar quién libra sábado/domingo */
  fairWeekendDistribution: boolean;
  /** Usar forecasting de ocupación para decidir refuerzos */
  occupancyBasedStaffing: boolean;
  /** Cobertura mínima garantizada: al menos N personas por turno */
  minCoveragePerShift: number;
  /** Códigos de turno especiales de la organización */
  customShiftCodes?: string[];
}

const DEFAULT_CONSTRAINTS: OrganizationConstraints = {
  ergonomicRotation: true,
  fairWeekendDistribution: true,
  occupancyBasedStaffing: false,
  minCoveragePerShift: 1,
};

// ---------------------------------------------------------------------------
// HORARIOS ESTÁNDAR POR CÓDIGO
// ---------------------------------------------------------------------------

const SHIFT_TIMES: Record<string, { startTime: string; endTime: string }> = {
  M:  { startTime: "07:00", endTime: "15:00" },
  T:  { startTime: "15:00", endTime: "23:00" },
  N:  { startTime: "23:00", endTime: "07:00" },
  G:  { startTime: "09:00", endTime: "21:00" },
  GT: { startTime: "11:00", endTime: "23:00" },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Devuelve el día de la semana (0=lunes … 6=domingo) para un día del mes */
function dayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 ? 6 : d - 1; // Convertir domingo=0 a domingo=6
}

/** Semana ISO dentro del mes (0-based) */
function weekIndex(year: number, month: number, day: number): number {
  // Semana del mes: cada 7 días desde el 1
  return Math.floor((day - 1) / 7);
}

/**
 * Días trabajados por semana según horas contrato.
 * Asume jornada de 8h/día para contratos completos,
 * y proporcional para parciales.
 */
function workDaysPerWeek(weeklyHours: number): number {
  const hoursPerDay = 8;
  const days = Math.round(weeklyHours / hoursPerDay);
  return Math.max(1, Math.min(days, 6)); // entre 1 y 6 días/semana
}

/** Días libres por semana (complemento a 7) */
function freeDaysPerWeek(weeklyHours: number): number {
  return 7 - workDaysPerWeek(weeklyHours);
}

// ---------------------------------------------------------------------------
// FASE 1 — ANCLAR turnos ya conocidos
// ---------------------------------------------------------------------------

function anchorPhase(
  employees: ScheduleEmployee[],
  totalDays: number
): Record<string, EmployeeSchedule> {
  const schedules: Record<string, EmployeeSchedule> = {};

  for (const emp of employees) {
    schedules[emp.id] = {};

    // Vacaciones
    for (const day of emp.vacationDays ?? []) {
      if (day >= 1 && day <= totalDays) {
        schedules[emp.id][day] = { code: "V" };
      }
    }

    // Otros bloqueos (bajas, permisos, etc.)
    for (const block of emp.blockedDays ?? []) {
      if (block.day >= 1 && block.day <= totalDays) {
        schedules[emp.id][block.day] = { code: block.code };
      }
    }
  }

  return schedules;
}

// ---------------------------------------------------------------------------
// FASE 2 — ASIGNAR DÍAS LIBRES (D-D consecutivos, semanas reales Lun-Dom)
// ---------------------------------------------------------------------------

/**
 * Obtiene las semanas reales (Lun-Dom) que caen dentro del mes.
 * Devuelve un array de { start: day, end: day } con días del mes (1-based).
 */
function getCalendarWeeks(year: number, month: number, totalDays: number): Array<{ start: number; end: number }> {
  const weeks: Array<{ start: number; end: number }> = [];
  let day = 1;

  while (day <= totalDays) {
    const dow = dayOfWeek(year, month, day); // 0=Lun, 6=Dom
    // Esta semana acaba en Domingo o fin del mes
    const daysUntilSunday = 6 - dow;
    const weekEnd = Math.min(day + daysUntilSunday, totalDays);
    weeks.push({ start: day, end: weekEnd });
    day = weekEnd + 1;
  }

  return weeks;
}

/**
 * Patrones de descanso consecutivo por DOW (0=Lun ... 6=Dom).
 * 4 patrones rotativos que dan equidad de fines de semana.
 */
const REST_PATTERNS: number[][] = [
  [0, 1], // Lun-Mar
  [2, 3], // Mié-Jue
  [4, 5], // Vie-Sáb
  [5, 6], // Sáb-Dom
];

function assignRestDays(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  year: number,
  month: number,
  totalDays: number,
  constraints: OrganizationConstraints
): void {
  const weeks = getCalendarWeeks(year, month, totalDays);

  employees.forEach((emp, empIndex) => {
    const freeDaysNeeded = freeDaysPerWeek(emp.weeklyHours);

    weeks.forEach((week, weekIdx) => {
      const weekLength = week.end - week.start + 1;

      // Recoger días disponibles (no vacaciones/bajas)
      const available: number[] = [];
      for (let d = week.start; d <= week.end; d++) {
        if (!schedules[emp.id][d]) available.push(d);
      }

      // Para semanas parciales (inicio/fin de mes < 7 días), ajustar
      if (weekLength < 4 || available.length < freeDaysNeeded) {
        // Semana parcial: poner máximo 1 descanso si hay espacio
        if (available.length > 1) {
          schedules[emp.id][available[available.length - 1]] = { code: "D" };
        }
        return;
      }

      // Elegir patrón de descanso con rotación equitativa
      const patternIdx = constraints.fairWeekendDistribution
        ? (weekIdx + empIndex) % REST_PATTERNS.length
        : weekIdx % REST_PATTERNS.length;

      const preferredDows = REST_PATTERNS[patternIdx];

      // Buscar días de esta semana cuyo DOW coincida con el patrón
      const candidates: number[] = [];
      for (let d = week.start; d <= week.end; d++) {
        if (schedules[emp.id][d]) continue;
        const dow = dayOfWeek(year, month, d);
        if (preferredDows.includes(dow)) {
          candidates.push(d);
        }
      }

      // Si encontramos el par exacto, usarlo
      let chosen: number[];
      if (candidates.length >= freeDaysNeeded) {
        chosen = candidates.slice(0, freeDaysNeeded);
      } else {
        // Fallback: buscar cualquier par consecutivo en los disponibles
        chosen = [];
        for (let i = 0; i < available.length - 1; i++) {
          if (available[i + 1] - available[i] === 1) {
            chosen = available.slice(i, i + freeDaysNeeded);
            break;
          }
        }
        if (chosen.length < freeDaysNeeded) {
          // Último recurso: últimos días disponibles de la semana
          chosen = available.slice(-freeDaysNeeded);
        }
      }

      // Verificar y forzar consecutividad
      if (chosen.length === 2 && chosen[1] - chosen[0] !== 1) {
        // Buscar par consecutivo
        for (let i = 0; i < available.length - 1; i++) {
          if (available[i + 1] - available[i] === 1) {
            chosen = [available[i], available[i + 1]];
            break;
          }
        }
      }

      for (const d of chosen) {
        schedules[emp.id][d] = { code: "D" };
      }
    });
  });
}

// ---------------------------------------------------------------------------
// FASE 3 — ASIGNAR TURNOS (bloques semanales, no rotación diaria)
// ---------------------------------------------------------------------------

/**
 * En hostelería real, cada empleado trabaja el MISMO turno toda la semana.
 * La rotación es semanal: Semana 1=M, Semana 2=T, Semana 3=N, Semana 4=M...
 *
 * Esto evita violaciones de descanso entre jornadas (T→M = solo 8h)
 * y es más ergonómico para los trabajadores.
 */
const ROTATION_SEQUENCE: ShiftCode[] = ["M", "T", "N"];

function assignShifts(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  year: number,
  month: number,
  totalDays: number,
  constraints: OrganizationConstraints
): void {
  const weeks = getCalendarWeeks(year, month, totalDays);

  for (const [empIdx, emp] of employees.entries()) {
    // Turno fijo: siempre el mismo, todas las semanas
    const fixedCode: ShiftCode | null =
      emp.preference === "morning" ? "M"
      : emp.preference === "afternoon" ? "T"
      : emp.preference === "night_fixed" ? "N"
      : null;

    // Offset inicial por empleado para que no todos empiecen en M
    // Con 16 empleados: ~5 empiezan en M, ~5 en T, ~5 en N
    const startRotation = empIdx % ROTATION_SEQUENCE.length;

    weeks.forEach((week, weekIdx) => {
      // Turno de esta semana
      const weekShift: ShiftCode = fixedCode
        ? fixedCode
        : constraints.ergonomicRotation
          ? ROTATION_SEQUENCE[(startRotation + weekIdx) % ROTATION_SEQUENCE.length]
          : "M";

      const times = SHIFT_TIMES[weekShift] ?? {};

      for (let day = week.start; day <= week.end; day++) {
        if (schedules[emp.id][day]) continue; // Ya asignado (D, V, E)
        schedules[emp.id][day] = { code: weekShift, ...times };
      }
    });
  }
}

// ---------------------------------------------------------------------------
// FASE 4 — GARANTIZAR COBERTURA MÍNIMA
// ---------------------------------------------------------------------------

/**
 * Para cada día, asegurar que haya al menos minCoverage personas trabajando.
 * Si un día tiene 0 presenciales, convierte el primer "D" (descanso) en "M" (forzado).
 * Esto se marca como `forced: true` para que el usuario lo sepa.
 */
function ensureMinCoverage(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  totalDays: number,
  minCoverage: number
): void {
  const workCodes = new Set<ShiftCode>(["M", "T", "N", "G", "GT"]);
  const restCodes = new Set<ShiftCode>(["D", "V", "E"]);

  for (let day = 1; day <= totalDays; day++) {
    const presential = employees.filter((emp) => {
      const a = schedules[emp.id][day];
      return a && workCodes.has(a.code as ShiftCode);
    }).length;

    if (presential >= minCoverage) continue;

    // Buscar un empleado cuyo día D podamos convertir sin violar su mínimo de descansos
    for (const emp of employees) {
      const a = schedules[emp.id][day];
      if (a?.code !== "D") continue;

      // Calcular días libres que le quedan en su semana si convertimos este D
      const weekStart = day - ((day - 1) % 7);
      const weekEnd = Math.min(weekStart + 6, totalDays);
      const restInWeek = Array.from(
        { length: weekEnd - weekStart + 1 },
        (_, i) => weekStart + i
      ).filter((d) => d !== day && restCodes.has(schedules[emp.id][d]?.code as ShiftCode)).length;

      const required = freeDaysPerWeek(emp.weeklyHours);
      if (restInWeek < required) continue; // No podemos quitarle este descanso

      const forcedCode: ShiftCode =
        emp.preference === "night_fixed" ? "N"
        : emp.preference === "afternoon" ? "T"
        : "M";
      schedules[emp.id][day] = {
        ...SHIFT_TIMES[forcedCode],
        code: forcedCode,
        forced: true,
      };
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// FASE 5 — AUDITORÍA LEGAL
// ---------------------------------------------------------------------------

function auditSchedule(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  year: number,
  month: number,
  totalDays: number
): { violations: ScheduleViolation[]; warnings: ScheduleWarning[] } {
  const violations: ScheduleViolation[] = [];
  const warnings: ScheduleWarning[] = [];

  for (const emp of employees) {
    const sched = schedules[emp.id];

    // --- Regla: 12h mínimo entre jornadas ---
    for (let day = 1; day < totalDays; day++) {
      const curr = sched[day]?.code;
      const next = sched[day + 1]?.code;

      // T (acaba 23:00) → M (empieza 07:00) = solo 8h de descanso — ILEGAL
      if (curr === "T" && next === "M") {
        violations.push({
          employeeId: emp.id,
          day: day + 1,
          rule: "MIN_REST_12H",
          description: `${emp.name}: Turno Tarde día ${day} → Turno Mañana día ${day + 1}. Solo 8h de descanso (mínimo legal 12h).`,
        });
      }

      // N (empieza 23:00 día X, acaba 07:00 día X+1) → siguiente día debe ser D
      if (curr === "N" && next !== "D" && next !== "V" && next !== "E") {
        violations.push({
          employeeId: emp.id,
          day: day + 1,
          rule: "NIGHT_SHIFT_NEXT_FREE",
          description: `${emp.name}: Tras turno Noche (día ${day}), el día ${day + 1} debe ser libre.`,
        });
      }
    }

    // --- Regla: 2 días libres consecutivos por semana ---
    let day = 1;
    let weekNum = 0;
    while (day <= totalDays) {
      const weekEnd = Math.min(day + 6, totalDays);
      const freeDaysInWeek: number[] = [];

      for (let d = day; d <= weekEnd; d++) {
        const code = sched[d]?.code;
        if (code === "D" || code === "V" || code === "E") {
          freeDaysInWeek.push(d);
        }
      }

      const freeRequired = freeDaysPerWeek(emp.weeklyHours);

      if (freeDaysInWeek.length < freeRequired) {
        // Si hay vacaciones cubren la semana entera, no es violación
        const hasFullVacation = Array.from(
          { length: weekEnd - day + 1 },
          (_, i) => day + i
        ).every((d) => sched[d]?.code === "V");

        if (!hasFullVacation) {
          violations.push({
            employeeId: emp.id,
            day,
            rule: "MIN_FREE_DAYS",
            description: `${emp.name}: Semana ${weekNum + 1} — solo ${freeDaysInWeek.length} día(s) libre(s), se requieren ${freeRequired}.`,
          });
        }
      } else if (freeRequired >= 2) {
        // Verificar consecutividad
        let hasConsecutive = false;
        for (let i = 0; i < freeDaysInWeek.length - 1; i++) {
          if (freeDaysInWeek[i + 1] - freeDaysInWeek[i] === 1) {
            hasConsecutive = true;
            break;
          }
        }
        if (!hasConsecutive) {
          violations.push({
            employeeId: emp.id,
            day,
            rule: "FREE_DAYS_CONSECUTIVE",
            description: `${emp.name}: Semana ${weekNum + 1} — días libres no consecutivos (D-D requeridos por ley).`,
          });
        }
      }

      day = weekEnd + 1;
      weekNum++;
    }

    // --- Warning: turnos forzados por cobertura mínima ---
    for (let d = 1; d <= totalDays; d++) {
      if (sched[d]?.forced) {
        warnings.push({
          employeeId: emp.id,
          day: d,
          rule: "FORCED_COVERAGE",
          description: `${emp.name}: Día ${d} asignado por cobertura mínima (era día libre). Revisar y validar.`,
        });
      }
    }
  }

  return { violations, warnings };
}

// ---------------------------------------------------------------------------
// SCORE — Calidad del cuadrante (0–100)
// ---------------------------------------------------------------------------

function scoreSchedule(
  totalAssignments: number,
  violations: ScheduleViolation[],
  warnings: ScheduleWarning[]
): number {
  if (totalAssignments === 0) return 0;
  const penaltyViolation = 5; // -5 puntos por violación legal
  const penaltyWarning = 1;   // -1 punto por warning
  const raw =
    100 -
    violations.length * penaltyViolation -
    warnings.length * penaltyWarning;
  return Math.max(0, Math.round(raw));
}

// ---------------------------------------------------------------------------
// ENTRADA PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Genera un cuadrante mensual legal para los empleados dados.
 *
 * @example
 * const result = generateSchedule({
 *   employees: [
 *     { id: "1", name: "Ana", weeklyHours: 40, role: "employee", preference: "rotating" },
 *     { id: "2", name: "Eva", weeklyHours: 40, role: "manager", preference: "rotating" },
 *   ],
 *   year: 2026,
 *   month: 4,
 * });
 */
export function generateSchedule(input: ScheduleInput): ScheduleOutput {
  const { employees, year, month } = input;
  const constraints: OrganizationConstraints = {
    ...DEFAULT_CONSTRAINTS,
    ...input.constraints,
  };
  const totalDays = daysInMonth(year, month);

  // Fase 1: Anclar conocidos
  const schedules = anchorPhase(employees, totalDays);

  // Fase 2: Asignar descansos
  assignRestDays(employees, schedules, year, month, totalDays, constraints);

  // Fase 3: Asignar turnos de trabajo
  assignShifts(employees, schedules, year, month, totalDays, constraints);

  // Fase 4: Cobertura mínima
  ensureMinCoverage(employees, schedules, totalDays, constraints.minCoveragePerShift);

  // Fase 5: Auditoría legal
  const { violations, warnings } = auditSchedule(
    employees,
    schedules,
    year,
    month,
    totalDays
  );

  const totalAssignments = employees.length * totalDays;
  const score = scoreSchedule(totalAssignments, violations, warnings);

  return {
    schedules,
    violations,
    warnings,
    score,
    meta: {
      daysInMonth: totalDays,
      generatedAt: new Date().toISOString(),
    },
  };
}
