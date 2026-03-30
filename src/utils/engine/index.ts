/**
 * TurnoSmart® — SMART Engine v2.0
 *
 * Barrel export — punto de entrada público del motor.
 */

// Types
export type {
  ShiftCode,
  AdHocShift,
  RotationType,
  SeniorityLevel,
  EmployeeRoleV2,
  RoleConfig,
  EngineEmployee,
  EmployeeAbsence,
  PetitionType,
  PetitionStatus,
  Petition,
  EquityBalance,
  DailyOccupancy,
  DayAssignmentV2,
  AssignmentSource,
  DayConflict,
  GenerationPeriod,
  ExistingShiftsPolicy,
  LaborLaw,
  OptionalCriteria,
  EngineConstraints,
  WeightProfile,
  TrafficLight,
  ScoreBreakdown,
  AuditViolation,
  ContinuityHistory,
  EngineInput,
  EngineOutput,
  EngineMeta,
  ScheduleAlternative,
  GenerationResult,
  PipelineContext,
  PipelinePhase,
} from "./types";

// Constants
export {
  SHIFT_TIMES,
  WORKING_SHIFTS,
  ABSENCE_CODES,
  SPAIN_LABOR_LAW,
  VACATION_DAYS_PER_YEAR,
  ROLE_CONFIGS,
  ERGONOMIC_SEQUENCE,
  TRANSITION_SHIFT,
  FOM_AFOM_MIRROR,
  WEIGHT_PROFILES,
  SHIFT_UNDESIRABILITY,
  DEFAULT_MIN_COVERAGE,
  DEFAULT_REINFORCEMENT_THRESHOLD,
  LONG_WEEKEND_PER_MONTH,
  ENGINE_VERSION,
} from "./constants";

// Pipeline
export { runPipeline } from "./pipeline";
export { generateAlternatives } from "./alternatives";

// Equity Tracker
export {
  calculateEquitySnapshot,
  calculateEquityDeviations,
  extractLastWeek,
} from "./equityTracker";
export type { EquityDeviation } from "./equityTracker";

// SMART+IA
export {
  detectFrequentAdHocShifts,
  detectRecurrentPetitions,
  detectVacationAlerts,
  detectTransitionNeeds,
} from "./smartIA";
export type { SmartSuggestion, SuggestionType } from "./smartIA";

// Helpers (para uso en tests y hooks)
export {
  daysInMonth,
  dayOfWeekISO,
  isWeekend,
  buildGenerationPeriod,
  getWeeks,
  hoursBetween,
  shiftHours,
  isWorkingShift,
  isAbsence,
  violates12hRest,
  restHoursBetween,
  makeAssignment,
  makeRestDay,
  initGrid,
  countShiftOnDay,
  countWorkingOnDay,
} from "./helpers";
