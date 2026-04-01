/**
 * TurnoSmart® — SMART Engine v2.0 — Constants
 *
 * Horarios de turnos, ley laboral, secuencias de rotación.
 * Pure TypeScript — sin dependencias externas.
 */

import type {
  ShiftCode,
  LaborLaw,
  WeightProfile,
  RoleConfig,
  EmployeeRoleV2,
} from "./types";

// ---------------------------------------------------------------------------
// HORARIOS DE TURNO (hora inicio, hora fin, duración en horas)
// ---------------------------------------------------------------------------

export interface ShiftTime {
  code: ShiftCode | string;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  hours: number;
  label: string;
}

export const SHIFT_TIMES: Record<string, ShiftTime> = {
  M:      { code: "M",      startTime: "07:00", endTime: "15:00", hours: 8, label: "Mañana" },
  T:      { code: "T",      startTime: "15:00", endTime: "23:00", hours: 8, label: "Tarde" },
  N:      { code: "N",      startTime: "23:00", endTime: "07:00", hours: 8, label: "Noche" },
  G:      { code: "G",      startTime: "09:00", endTime: "21:00", hours: 12, label: "Guardia" },
  GT:     { code: "GT",     startTime: "11:00", endTime: "23:00", hours: 12, label: "Guardia Tarde" },
  "11x19": { code: "11x19", startTime: "11:00", endTime: "19:00", hours: 8, label: "Transición" },
  "9x17":  { code: "9x17",  startTime: "09:00", endTime: "17:00", hours: 8, label: "GEX Mañana" },
  "12x20": { code: "12x20", startTime: "12:00", endTime: "20:00", hours: 8, label: "GEX Tarde" },
  D:      { code: "D",      startTime: "00:00", endTime: "00:00", hours: 0, label: "Descanso" },
  V:      { code: "V",      startTime: "00:00", endTime: "00:00", hours: 0, label: "Vacaciones" },
  E:      { code: "E",      startTime: "00:00", endTime: "00:00", hours: 0, label: "Enfermedad" },
  F:      { code: "F",      startTime: "00:00", endTime: "00:00", hours: 0, label: "Festivo" },
  DB:     { code: "DB",     startTime: "00:00", endTime: "00:00", hours: 0, label: "Día Debido" },
  DG:     { code: "DG",     startTime: "00:00", endTime: "00:00", hours: 0, label: "Debido Guardia" },
  PM:     { code: "PM",     startTime: "00:00", endTime: "00:00", hours: 0, label: "Permiso Mudanza" },
  PC:     { code: "PC",     startTime: "00:00", endTime: "00:00", hours: 0, label: "Permiso Curso" },
} as const;

/** Turnos que cuentan como trabajo (para cómputo de horas) */
export const WORKING_SHIFTS: Set<string> = new Set(["M", "T", "N", "G", "GT", "11x19", "9x17", "12x20"]);

/** Turnos que son ausencia (no cuentan horas, no se asignan por motor) */
export const ABSENCE_CODES: Set<string> = new Set(["D", "V", "E", "DB", "DG", "PM", "PC", "F"]);

// ---------------------------------------------------------------------------
// LEY LABORAL ESPAÑA (siempre activo, no configurable)
// ---------------------------------------------------------------------------

export const SPAIN_LABOR_LAW: LaborLaw = {
  minRestBetweenShiftsHours: 12,
  minFreeDaysPerWeek: 2,
  freeDaysMustBeConsecutive: true,
  maxWeeklyHours: 40,
  futureMaxWeeklyHours: 37.5,
  nightShiftNextDayFree: true,
  prohibitAfternoonToMorning: true,
};

/** Hostelería Cádiz: 48 días vacaciones/año (30 naturales + 18 festivos) */
export const VACATION_DAYS_PER_YEAR = 48;
export const VACATION_NATURAL_DAYS = 30;
export const VACATION_HOLIDAY_DAYS = 18;

/** Horas extra acumuladas para generar 1 DB (Día Debido) */
export const HOURS_PER_DB = 8;

// ---------------------------------------------------------------------------
// ROLES — Mapeo rol → tipo rotación + nivel + turnos permitidos
// ---------------------------------------------------------------------------

export const ROLE_CONFIGS: Record<EmployeeRoleV2, RoleConfig> = {
  FOM: {
    role: "FOM",
    rotationType: "FIJO_NO_ROTA",
    seniorityLevel: 3,
    allowedShifts: ["M", "T", "G", "GT", "D", "V", "E", "DB", "DG"],
  },
  AFOM: {
    role: "AFOM",
    rotationType: "COBERTURA",
    seniorityLevel: 2,
    allowedShifts: ["M", "T", "N", "D", "V", "E", "DB", "DG"],
  },
  NIGHT_SHIFT_AGENT: {
    role: "NIGHT_SHIFT_AGENT",
    rotationType: "FIJO_NO_ROTA",
    seniorityLevel: 1,
    allowedShifts: ["N", "D", "V", "E", "DB"],
  },
  GEX: {
    role: "GEX",
    rotationType: "ROTA_PARCIAL",
    seniorityLevel: 1,
    allowedShifts: ["9x17", "12x20", "11x19", "D", "V", "E", "DB"],
  },
  FRONT_DESK_AGENT: {
    role: "FRONT_DESK_AGENT",
    rotationType: "ROTA_COMPLETO",
    seniorityLevel: 1,
    allowedShifts: ["M", "T", "N", "11x19", "D", "V", "E", "DB"],
  },
};

// ---------------------------------------------------------------------------
// ROTACIÓN — Secuencia ergonómica hacia adelante
// ---------------------------------------------------------------------------

/** Secuencia de rotación ergonómica: M→T→N (nunca al revés) */
export const ERGONOMIC_SEQUENCE: ShiftCode[] = ["M", "T", "N"];

/** Turno de transición para evitar violación 12h en T→M */
export const TRANSITION_SHIFT = "11x19" as const;

// ---------------------------------------------------------------------------
// FOM ↔ AFOM ESPEJO
// ---------------------------------------------------------------------------

/**
 * Lógica espejo: el turno del AFOM se calcula DESPUÉS del FOM.
 * FOM=M → AFOM=T | FOM=T → AFOM=M | FOM=G → AFOM=D(trabaja) | FOM=D → AFOM=trabaja
 * Solo el FOM realiza G/GT (Guardias / Duty).
 */
export const FOM_AFOM_MIRROR: Record<string, ShiftCode> = {
  M:  "T",    // FOM mañana → AFOM tarde
  T:  "M",    // FOM tarde → AFOM mañana
  G:  "M",    // FOM guardia (S o D) → AFOM cubre mañana
  D:  "M",    // FOM libre → AFOM trabaja (M o T según cobertura)
  V:  "M",    // FOM vacaciones → AFOM cubre
  E:  "M",    // FOM baja → AFOM cubre
};

// ---------------------------------------------------------------------------
// WEIGHT PROFILES — 3 alternativas
// ---------------------------------------------------------------------------

export const WEIGHT_PROFILES: WeightProfile[] = [
  {
    name: "balanced",
    label: "Equilibrio",
    legal: 0.10,
    equity: 0.25,
    coverage: 0.25,
    petitions: 0.20,
    ergonomics: 0.10,
    continuity: 0.10,
  },
  {
    name: "petitions",
    label: "Peticiones",
    legal: 0.10,
    equity: 0.10,
    coverage: 0.15,
    petitions: 0.45,
    ergonomics: 0.10,
    continuity: 0.10,
  },
  {
    name: "coverage",
    label: "Cobertura",
    legal: 0.10,
    equity: 0.15,
    coverage: 0.45,
    petitions: 0.10,
    ergonomics: 0.10,
    continuity: 0.10,
  },
];

// ---------------------------------------------------------------------------
// PESO DE INDESEABILIDAD (para equidad ponderada)
// ---------------------------------------------------------------------------

/** Peso de carga por turno — turnos más duros pesan más en equidad */
export const SHIFT_UNDESIRABILITY: Record<string, number> = {
  N: 3,
  T: 2,
  M: 1,
  G: 4,
  GT: 4,
  "11x19": 1.5,
  "9x17": 1,
  "12x20": 1.5,
};

// ---------------------------------------------------------------------------
// DEFAULTS
// ---------------------------------------------------------------------------

/** Cobertura mínima por defecto (fallback si no hay criterios en DB) */
export const DEFAULT_MIN_COVERAGE = 1;

/** Cobertura mínima por turno por defecto: M:2, T:2, N:1 */
export const DEFAULT_MIN_COVERAGE_PER_SHIFT = { M: 2, T: 2, N: 1 } as const;

/** Umbral de refuerzo por defecto (40 movimientos check-in + check-out) */
export const DEFAULT_REINFORCEMENT_THRESHOLD = 40;

/** Días de FDS largo por empleado al mes */
export const LONG_WEEKEND_PER_MONTH = 1;

/** Noches consecutivas máximas para FDA antes de alerta (configurable, no aplica a Night Agent) */
export const MAX_CONSECUTIVE_NIGHTS = 4;

/** Versión del motor */
export const ENGINE_VERSION = "2.0";
