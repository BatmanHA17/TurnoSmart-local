/**
 * TurnoSmart® — SMART Schedule Engine v2.0
 *
 * Tipos del motor de generación de cuadrantes.
 * Pure TypeScript — sin React, sin Supabase.
 *
 * Fuente de verdad: memory/project_turnosmart_smart_algorithm.md
 */

// ---------------------------------------------------------------------------
// SHIFT CODES
// ---------------------------------------------------------------------------

/** Códigos de turno reconocidos por el motor */
export type ShiftCode =
  | "M"    // Mañana       07:00–15:00
  | "T"    // Tarde        15:00–23:00
  | "N"    // Noche        23:00–07:00
  | "D"    // Descanso     (día libre)
  | "V"    // Vacaciones
  | "G"    // Guardia      09:00–21:00  (solo FOM)
  | "GT"   // Guardia Tarde 11:00–23:00 (solo FOM)
  | "E"    // Enfermedad / Baja
  | "F"    // Festivo trabajado
  | "DB"   // Día Debido   (compensación horas extra, cada +8h = +1 DB)
  | "DG"   // Debido Guardia (compensación por G/GT)
  | "PM"   // Permiso Mudanza
  | "PC"   // Permiso Curso / Formación
  | "11x19" // Transición  11:00–19:00  (puente T→M / GEX)
  | "9x17"  // GEX especial 09:00–17:00
  | "12x20"; // GEX especial 12:00–20:00

/** Turno ad-hoc: cualquier horario libre (ej: "14x22", "13x21") */
export interface AdHocShift {
  code: string;       // ej: "14x22"
  startTime: string;  // "14:00"
  endTime: string;    // "22:00"
  reason?: string;    // motivo opcional (trazabilidad)
}

// ---------------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------------

/** Tipo de rotación en el motor — determina cómo se asignan turnos */
export type RotationType =
  | "FIJO_NO_ROTA"    // FOM (turno fijo gestión), Night Shift Agent (noche fija)
  | "COBERTURA"       // AFOM (rellena huecos, espejo del FOM)
  | "ROTA_PARCIAL"    // GEX (solo 9x17 / 12x20, no entra en M/T/N)
  | "ROTA_COMPLETO";  // Front Desk Agent (rotación completa M/T/N)

/** Nivel de seniority — determina prioridad y permisos */
export type SeniorityLevel = 1 | 2 | 3;

/** Rol funcional del empleado */
export type EmployeeRoleV2 =
  | "FOM"                // Front Office Manager — nivel 3, FIJO_NO_ROTA
  | "AFOM"               // Assistant FOM — nivel 2, COBERTURA
  | "NIGHT_SHIFT_AGENT"  // Noche fija — nivel 1, FIJO_NO_ROTA
  | "GEX"                // Guest Experience — nivel 1, ROTA_PARCIAL
  | "FRONT_DESK_AGENT";  // Recepcionista — nivel 1, ROTA_COMPLETO

/** Mapeo rol → tipo de rotación + nivel (constante, no configuración) */
export interface RoleConfig {
  role: EmployeeRoleV2;
  rotationType: RotationType;
  seniorityLevel: SeniorityLevel;
  allowedShifts: ShiftCode[];
}

// ---------------------------------------------------------------------------
// EMPLOYEES
// ---------------------------------------------------------------------------

/** Empleado tal como entra al motor */
export interface EngineEmployee {
  id: string;
  name: string;
  role: EmployeeRoleV2;
  rotationType: RotationType;
  seniorityLevel: SeniorityLevel;

  /** Horas semanales de contrato (40, 30, 20, etc.) */
  weeklyHours: number;
  /** Unidades de contrato: 8h=1.0, 6h=0.75, 5h=0.625, 4h=0.5 */
  contractUnits: number;

  /** Días con ausencia pre-aprobada (vacaciones, baja, permisos) */
  absences: EmployeeAbsence[];

  /** Peticiones del empleado para este período */
  petitions: Petition[];

  /** Balance de equidad acumulado de períodos anteriores */
  equityBalance: EquityBalance;

  /** Turno fijo del FOM para este período (si aplica) */
  fixedShift?: ShiftCode;

  /** true si es nueva incorporación a mitad de período */
  isNewHire?: boolean;
  /** Primer día efectivo (1-based, día del mes) — si es incorporación tardía */
  startDay?: number;
}

/** Ausencia pre-aprobada */
export interface EmployeeAbsence {
  day: number;       // día del mes (1-based)
  code: ShiftCode | string;  // V, E, PM, PC, DB, DG, etc.
}

// ---------------------------------------------------------------------------
// PETITIONS
// ---------------------------------------------------------------------------

/** Tipo de petición */
export type PetitionType =
  | "A"  // Dura (obligatoria) — vacaciones aprobadas, baja médica. Respeta al 100%.
  | "B"  // Blanda (preferencia) — "prefiero M el viernes". Intenta respetar, puede saltar.
  | "C"  // Intercambio — dos empleados acuerdan cambio. FOM valida.
  | "D"; // Recurrente (SMART+IA) — detectada por patrón repetido 3+ meses.

/** Estado de la petición */
export type PetitionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "auto_detected"; // tipo D detectado por IA

/** Petición de un empleado */
export interface Petition {
  id: string;
  employeeId: string;
  type: PetitionType;
  /** Día(s) afectado(s) — 1-based, día del mes */
  days: number[];
  /** Turno solicitado (ej: "M", "D") o null si es "no quiero X" */
  requestedShift?: ShiftCode | string | null;
  /** Turno que NO quiere (ej: "N") */
  avoidShift?: ShiftCode | null;
  /** Para tipo C: ID del otro empleado en el intercambio */
  exchangeWithEmployeeId?: string;
  /** Para tipo C: día del otro empleado */
  exchangeDay?: number;
  status: PetitionStatus;
  /** Prioridad: 1 (alta) a 5 (baja). Peticiones post-deadline = prioridad baja */
  priority: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// EQUITY
// ---------------------------------------------------------------------------

/** Balance de equidad acumulado — persiste entre generaciones */
export interface EquityBalance {
  /** Total de turnos M asignados (histórico) */
  morningCount: number;
  /** Total de turnos T asignados (histórico) */
  afternoonCount: number;
  /** Total de turnos N asignados (histórico) */
  nightCount: number;
  /** Total de FDS trabajados (histórico) */
  weekendWorkedCount: number;
  /** Total de FDS largos disfrutados (histórico) */
  longWeekendCount: number;
  /** Total de festivos trabajados (histórico) */
  holidayWorkedCount: number;
  /** Total de peticiones satisfechas / total peticiones (ratio 0-1) */
  petitionSatisfactionRatio: number;
  /** Noches del nocturno cubiertas por este agente (equidad cobertura N) */
  nightCoverageCount: number;
}

// ---------------------------------------------------------------------------
// OCCUPANCY
// ---------------------------------------------------------------------------

/** Datos de ocupación diaria (check-in / check-out) */
export interface DailyOccupancy {
  day: number;        // día del mes (1-based)
  checkIns: number;   // llegadas del día
  checkOuts: number;  // salidas del día
  /** Total de movimientos = checkIns + checkOuts */
  totalMovements: number;
  /** true si supera el umbral de refuerzo (configurable, default 40) */
  needsReinforcement: boolean;
}

// ---------------------------------------------------------------------------
// DAY ASSIGNMENT (output del motor por día)
// ---------------------------------------------------------------------------

/** Asignación de un día para un empleado */
export interface DayAssignmentV2 {
  code: ShiftCode | string;  // string para ad-hoc ("14x22")
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  hours: number;      // horas trabajadas ese día

  /** Cómo se asignó este turno */
  source: AssignmentSource;
  /** true si fue forzado (override del FOM o cobertura) */
  forced: boolean;
  /** true si el FOM lo bloqueó manualmente (no se sobreescribe) */
  locked: boolean;
  /** Conflictos detectados en este día */
  conflicts: DayConflict[];
}

/** Origen de la asignación */
export type AssignmentSource =
  | "engine"       // generado por el motor
  | "petition_a"   // petición dura (tipo A)
  | "petition_b"   // petición blanda (tipo B) respetada
  | "exchange"     // intercambio (tipo C)
  | "manual"       // asignado manualmente por el FOM
  | "continuity"   // mantenido del período anterior
  | "coverage";    // forzado por cobertura mínima

/** Conflicto en un día */
export interface DayConflict {
  rule: string;         // código del check (ej: "12H_REST", "COVERAGE_MIN")
  severity: "error" | "warning";
  description: string;
  /** true si el FOM puede hacer override */
  overridable: boolean;
}

// ---------------------------------------------------------------------------
// GENERATION PERIOD
// ---------------------------------------------------------------------------

/** Período de generación: siempre semanas completas L-D */
export interface GenerationPeriod {
  startDate: string;   // ISO "YYYY-MM-DD" (siempre lunes)
  endDate: string;     // ISO "YYYY-MM-DD" (siempre domingo)
  totalDays: number;
  totalWeeks: number;  // típicamente 4 o 5
  year: number;
  month: number;       // mes principal (1-12)
}

// ---------------------------------------------------------------------------
// EXISTING SHIFTS HANDLING
// ---------------------------------------------------------------------------

/** Qué hacer con turnos ya asignados al generar */
export type ExistingShiftsPolicy =
  | "overwrite"        // Sobreescribir todo
  | "keep_locked"      // Sobreescribir solo los no-bloqueados
  | "fill_gaps";       // Solo rellenar huecos (días sin asignar)

// ---------------------------------------------------------------------------
// CONSTRAINTS
// ---------------------------------------------------------------------------

/** Ley laboral — siempre activo, no configurable */
export interface LaborLaw {
  minRestBetweenShiftsHours: 12;
  minFreeDaysPerWeek: 2;
  freeDaysMustBeConsecutive: true;
  maxWeeklyHours: 40;
  /** Reforma en tramitación */
  futureMaxWeeklyHours: 37.5;
  nightShiftNextDayFree: true;
  /** T→M prohibido: 23:00→07:00 = 8h < 12h */
  prohibitAfternoonToMorning: true;
}

/** Criterios opcionales — toggle ON/OFF + BOOST por organización */
export interface OptionalCriteria {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** Peso extra (1-5). 1 = normal, 5 = máximo énfasis */
  boost: number;
  /** Texto libre del FOM para contextualizar el boost */
  boostNote?: string;
}

/** Configuración de constraints del motor */
export interface EngineConstraints {
  /** Ley laboral (siempre activa) */
  law: LaborLaw;

  /** Rotación ergonómica M→T→N (nunca N→M directo) */
  ergonomicRotation: boolean;
  /** Equidad FDS: rotar quién libra sábado/domingo */
  fairWeekendDistribution: boolean;
  /** Usar datos de ocupación para refuerzos */
  occupancyBasedStaffing: boolean;
  /** Cobertura mínima por turno (M, T, N) — configurable por organización */
  minCoveragePerShift: { M: number; T: number; N: number };
  /** Override cobertura por día de semana (1=Lun..7=Dom). Solo los días con override. */
  coverageByDay?: Record<number, Partial<{ M: number; T: number; N: number }>>;
  /** Umbral de movimientos para proponer refuerzo (default 40) */
  reinforcementThreshold: number;
  /** FOM↔AFOM espejo activo */
  fomAfomMirror: boolean;

  /** Criterios opcionales configurados por la organización */
  optionalCriteria: OptionalCriteria[];

  /** Override de fuerza mayor: el FOM puede forzar violaciones de 12h
   *  con consentimiento del empleado */
  allowForceMajeureOverride: boolean;

  /** Política para turnos ya existentes */
  existingShiftsPolicy: ExistingShiftsPolicy;

  /** FDS Largo: 1 fin de semana largo (4 días) por empleado por mes.
   *  Criterio personalizado, desactivado por defecto. */
  fdsLargo?: boolean;
}

// ---------------------------------------------------------------------------
// WEIGHT PROFILES (para generar 3 alternativas)
// ---------------------------------------------------------------------------

/** Pesos por categoría para calcular score ponderado */
export interface WeightProfile {
  name: string;
  label: string;          // nombre para UI: "Equilibrio", "Peticiones", "Cobertura"
  legal: number;          // peso cumplimiento legal (12h, 40h, T→M)
  equity: number;         // peso equidad M/T/N/FDS
  coverage: number;       // peso cobertura mínima
  petitions: number;      // peso peticiones satisfechas
  ergonomics: number;     // peso rotación ergonómica
  continuity: number;     // peso continuidad con período anterior
}

// ---------------------------------------------------------------------------
// SCORE (output)
// ---------------------------------------------------------------------------

/** Nivel de semáforo */
export type TrafficLight = "green" | "orange" | "red";

/** Desglose del score por categoría */
export interface ScoreBreakdown {
  legal: number;        // 100 - (violaciones_críticas × 25) - (warnings × 5)
  coverage: number;     // 100 × (slots_cubiertos / total_slots)
  equity: number;       // 100 - (max_desviación_media × 10)
  petitions: number;    // 100 × (peticiones_honradas / total_peticiones)
  ergonomics: number;   // 100 - (rotaciones_inversas × 5) - (libres_no_consecutivos × 3)
  continuity: number;   // 100 - (transiciones_bruscas × 10)

  /** Score ponderado (0-100) según weight profile */
  overall: number;
  /** Semáforo: ≥80 verde | ≥50 naranja | <50 rojo */
  trafficLight: TrafficLight;
}

/** Detalle de una violación detectada por audit */
export interface AuditViolation {
  employeeId: string;
  day?: number;
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
  overridable: boolean;
  /** Categoría del score afectada */
  category: keyof Omit<ScoreBreakdown, "overall" | "trafficLight">;
  /** true if this violation requires FOM + employee double approval */
  requiresApproval?: boolean;
}

// ---------------------------------------------------------------------------
// CONTINUITY (historial cross-período)
// ---------------------------------------------------------------------------

/** Historial del período anterior para continuidad */
export interface ContinuityHistory {
  /** Últimos 7 días del período anterior por empleado */
  lastWeek: Record<string, DayAssignmentV2[]>;
  /** Balance de equidad al cierre del período anterior */
  equitySnapshot: Record<string, EquityBalance>;
  /** ID de la generación anterior (para trazabilidad) */
  previousGenerationId?: string;
}

// ---------------------------------------------------------------------------
// ENGINE INPUT / OUTPUT
// ---------------------------------------------------------------------------

/** Configuración de turno personalizable por organización/sector */
export interface ShiftTimeConfig {
  code: string;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  hours: number;
  label: string;
}

/** Configuración de rol personalizable por organización/sector */
export interface RoleConfigOverride {
  role: string;
  rotationType: RotationType;
  seniorityLevel: number;
  allowedShifts: string[];
  label: string;
}

/** Template de sector preconfigurado */
export interface SectorTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  shifts: Record<string, ShiftTimeConfig>;
  roles: RoleConfigOverride[];
  defaultCoverage: { M: number; T: number; N: number };
  defaultWeeklyHours: number;
  laborLawPreset: string; // "spain_hospitality" | "spain_generic" | etc.
}

/** Input completo al motor */
export interface EngineInput {
  period: GenerationPeriod;
  employees: EngineEmployee[];
  constraints: EngineConstraints;
  occupancy: DailyOccupancy[];
  continuity?: ContinuityHistory;
  /** Weight profile para esta ejecución */
  weights: WeightProfile;
  /** Días del período (1-based) donde FOM tiene Guardia (G/GT) — solo S/D */
  fomGuardiaDays?: number[];
  /** Shift times override (if not set, uses SHIFT_TIMES from constants) */
  shiftConfig?: Record<string, ShiftTimeConfig>;
  /** Role config override (if not set, uses ROLE_CONFIGS from constants) */
  roleConfig?: RoleConfigOverride[];
}

/** Output de una ejecución del motor */
export interface EngineOutput {
  /** employeeId → día (1-based) → asignación */
  schedules: Record<string, Record<number, DayAssignmentV2>>;
  violations: AuditViolation[];
  score: ScoreBreakdown;
  meta: EngineMeta;
  /** DG acumulados en este período: employeeId → días de guardia trabajados */
  dgAccumulated?: Record<string, number>;
  /** Recomendación de plantilla mínima para 100% cobertura */
  staffingRecommendation?: StaffingRecommendation;
}

/** Recomendación de plantilla mínima calculada por el engine */
export interface StaffingRecommendation {
  /** Mínimo de empleados ROTA_COMPLETO necesarios */
  minRotaCompleto: number;
  /** Empleados ROTA_COMPLETO actuales */
  currentRotaCompleto: number;
  /** ¿La plantilla actual cubre 100% matemáticamente? */
  isSufficient: boolean;
  /** Mensaje para el manager */
  message: string;
}

/** Metadata de la generación */
export interface EngineMeta {
  generatedAt: string;  // ISO timestamp
  durationMs: number;   // tiempo de ejecución
  period: GenerationPeriod;
  weightProfile: string; // nombre del profile usado
  engineVersion: string; // "2.0"
  totalEmployees: number;
  totalDays: number;
}

// ---------------------------------------------------------------------------
// ALTERNATIVES (3 versiones con distintos pesos)
// ---------------------------------------------------------------------------

/** Una alternativa generada */
export interface ScheduleAlternative {
  id: string;
  label: string;        // "Equilibrio", "Peticiones", "Cobertura"
  weights: WeightProfile;
  output: EngineOutput;
}

/** Resultado final: 3 alternativas para que el FOM elija */
export interface GenerationResult {
  alternatives: ScheduleAlternative[];
  /** La alternativa recomendada (mayor overall score) */
  recommendedIndex: number;
  generationId: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// PIPELINE PHASE CONTEXT
// ---------------------------------------------------------------------------

/** Contexto mutable que pasa entre las 10 fases del pipeline */
export interface PipelineContext {
  input: EngineInput;
  /** Cuadrante en construcción: employeeId → día → asignación */
  grid: Record<string, Record<number, DayAssignmentV2>>;
  /** Empleados clasificados por rol (Phase 01) */
  roleGroups: Record<RotationType, EngineEmployee[]>;
  /** Violaciones acumuladas durante la generación */
  violations: AuditViolation[];
  /** Contadores de equidad del período actual (se actualiza en cada asignación) */
  currentEquity: Record<string, EquityBalance>;
  /** Días que necesitan cobertura extra (Phase 07) */
  coverageGaps: Array<{ day: number; shift: ShiftCode; needed: number; assigned: number }>;
  /** Acumulador DG por empleado: +1 por cada día de guardia trabajado (S o D) */
  dgAccumulated: Record<string, number>;
  /** Metadata temporal */
  _startTime: number;
  /** Score calculado por Phase 10 — tipado para evitar (ctx as any)._score */
  _score?: ScoreBreakdown;
}

/** Firma de una fase del pipeline */
export type PipelinePhase = (ctx: PipelineContext) => PipelineContext;
