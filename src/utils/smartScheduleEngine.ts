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
// FASE 2 — ASIGNAR DÍAS LIBRES (D-D consecutivos, rotación equitativa)
// ---------------------------------------------------------------------------

/**
 * Para cada empleado, por cada semana del mes, asigna sus días libres
 * de forma consecutiva y rotando equitativamente por el calendario.
 *
 * Patrón de rotación (para fairWeekendDistribution):
 *   Semana 0: libra L-M  (índices 0-1)
 *   Semana 1: libra Mi-J (índices 2-3)
 *   Semana 2: libra V-S  (índices 4-5)
 *   Semana 3: libra D-L  (índices 6,0)
 *
 * Cada empleado tiene un offset inicial distinto → distribución justa.
 */
function assignRestDays(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  year: number,
  month: number,
  totalDays: number,
  constraints: OrganizationConstraints
): void {
  const rotationPatterns = [
    [0, 1], // L-M
    [2, 3], // Mi-J
    [4, 5], // V-S
    [6, 0], // D-L (domingo + lunes siguiente semana — se simplifica a D + primer día semana siguiente)
  ];

  employees.forEach((emp, empIndex) => {
    const freeDays = freeDaysPerWeek(emp.weeklyHours);
    // Iteramos semana a semana dentro del mes
    let day = 1;
    let weekNum = 0;

    while (day <= totalDays) {
      const weekStart = day;
      const weekEnd = Math.min(day + 6, totalDays);

      // Días de esta semana que no están ya asignados (vacaciones, bajas)
      const freeDaysThisWeek: number[] = [];
      for (let d = weekStart; d <= weekEnd; d++) {
        if (!schedules[emp.id][d]) {
          freeDaysThisWeek.push(d);
        }
      }

      // Elegir qué días de esta semana serán libres
      // Rotación: empIndex desplaza el patrón inicial
      const patternIndex = constraints.fairWeekendDistribution
        ? (weekNum + empIndex) % rotationPatterns.length
        : weekNum % rotationPatterns.length;

      const preferredDowPair = rotationPatterns[patternIndex]; // [dow1, dow2]

      // Buscar días del mes en esta semana que coincidan con esos DOW
      const candidateDays: number[] = [];
      for (let d = weekStart; d <= weekEnd; d++) {
        if (schedules[emp.id][d]) continue; // ya asignado
        const dow = dayOfWeek(year, month, d);
        if (preferredDowPair.includes(dow)) {
          candidateDays.push(d);
        }
      }

      // Si no hay suficientes candidatos con ese patrón, tomamos los últimos días libres de la semana
      let daysToFree =
        candidateDays.length >= freeDays
          ? candidateDays.slice(0, freeDays)
          : freeDaysThisWeek.slice(-freeDays);

      // Garantizar consecutividad: si tenemos candidatos no consecutivos, corregir
      if (daysToFree.length === 2 && daysToFree[1] - daysToFree[0] !== 1) {
        // Buscar par consecutivo en los días libres de la semana
        let found = false;
        for (let i = 0; i < freeDaysThisWeek.length - 1; i++) {
          if (freeDaysThisWeek[i + 1] - freeDaysThisWeek[i] === 1) {
            daysToFree = [freeDaysThisWeek[i], freeDaysThisWeek[i + 1]];
            found = true;
            break;
          }
        }
        if (!found) {
          // Tomar los últimos disponibles aunque no sean consecutivos (se marcará como warning)
          daysToFree = freeDaysThisWeek.slice(-freeDays);
        }
      }

      for (const d of daysToFree) {
        schedules[emp.id][d] = { code: "D" };
      }

      day = weekEnd + 1;
      weekNum++;
    }
  });
}

// ---------------------------------------------------------------------------
// FASE 3 — ASIGNAR TURNOS (M/T/N)
// ---------------------------------------------------------------------------

/**
 * Secuencia de rotación ergonómica: M→T→N→M (hacia adelante).
 * Nunca asignamos T si el anterior fue N (ya cubierto por FASE 4 audit).
 */
const ROTATION_SEQUENCE: ShiftCode[] = ["M", "T", "N"];

function nextRotationShift(lastCode: ShiftCode | undefined): ShiftCode {
  if (!lastCode || !ROTATION_SEQUENCE.includes(lastCode)) return "M";
  const idx = ROTATION_SEQUENCE.indexOf(lastCode as ShiftCode);
  return ROTATION_SEQUENCE[(idx + 1) % ROTATION_SEQUENCE.length];
}

function assignShifts(
  employees: ScheduleEmployee[],
  schedules: Record<string, EmployeeSchedule>,
  year: number,
  month: number,
  totalDays: number,
  constraints: OrganizationConstraints
): void {
  for (const emp of employees) {
    let lastWorkCode: ShiftCode | undefined;

    // Para preference=morning/afternoon/night_fixed asignamos siempre el mismo turno
    const fixedCode: ShiftCode | null =
      emp.preference === "morning" ? "M"
      : emp.preference === "afternoon" ? "T"
      : emp.preference === "night_fixed" ? "N"
      : null;

    for (let day = 1; day <= totalDays; day++) {
      if (schedules[emp.id][day]) {
        // Ya asignado (vacación, descanso, baja)
        const existing = schedules[emp.id][day].code;
        if (existing !== "D" && ROTATION_SEQUENCE.includes(existing as ShiftCode)) {
          lastWorkCode = existing as ShiftCode;
        }
        continue;
      }

      // Determinar el turno a asignar
      let code: ShiftCode;
      if (fixedCode) {
        code = fixedCode;
      } else if (constraints.ergonomicRotation && lastWorkCode) {
        code = nextRotationShift(lastWorkCode);
      } else {
        code = "M"; // default
      }

      const times = SHIFT_TIMES[code] ?? {};
      schedules[emp.id][day] = { code, ...times };
      lastWorkCode = code;
    }
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
