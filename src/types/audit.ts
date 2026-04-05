// Tipos para el sistema de auditoría de turnos

export type ViolationType =
  | 'INSUFFICIENT_REST'      // < 12h entre turnos
  | 'MISSING_FREE_DAYS'      // < 2 días libres/semana
  | 'MISSING_COVERAGE'       // Sin cobertura mínima
  | 'VACATION_NO_FREE_DAYS'  // Vacaciones sin días libres concatenados
  | 'NON_CONSECUTIVE_FREE_DAYS' // Días libres no consecutivos
  | 'EMPLOYEE_RESTRICTION'   // Viola restricción especial del empleado
  | 'EXCESSIVE_CONSECUTIVE_WORK' // > 6 días laborables consecutivos
  | 'VACATION_RATIO_LOW';        // Proyección anual vacaciones < 90%

export type ViolationSeverity = 'error' | 'warning' | 'info';

export type SuggestedFixAction =
  | 'CHANGE_SHIFT'      // Cambiar turno de un empleado en un día
  | 'SWAP_SHIFTS'       // Intercambiar turnos entre 2 empleados
  | 'ADD_REST_DAY'      // Añadir día de descanso
  | 'MOVE_REST_DAY';    // Mover día de descanso a otra posición

export interface SuggestedFix {
  action: SuggestedFixAction;
  label: string;              // "Cambiar T→11×19 para FDA#2 el día 15"
  employeeId: string;
  date: string;               // YYYY-MM-DD del cambio principal
  /** Para CHANGE_SHIFT */
  fromShift?: string;         // Turno actual (ej: "M")
  toShift?: string;           // Turno propuesto (ej: "11×19")
  toShiftStartTime?: string;  // HH:mm
  toShiftEndTime?: string;    // HH:mm
  toShiftColor?: string;      // Hex color
  /** Para SWAP_SHIFTS */
  swapWithEmployeeId?: string;
  swapWithDate?: string;
  /** Para MOVE_REST_DAY / ADD_REST_DAY */
  targetDate?: string;
}

export interface AuditViolation {
  id: string;
  type: ViolationType;
  severity: ViolationSeverity;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // Para violaciones que abarcan varios días
  message: string;
  details: string;
  suggestion?: string;
  suggestedFix?: SuggestedFix;
  relatedShiftIds?: string[];
}

export interface AuditPolicy {
  id: string;
  orgId: string;
  policyType: ViolationType;
  isEnabled: boolean;
  config: AuditPolicyConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AuditPolicyConfig {
  // Para INSUFFICIENT_REST
  minRestHours?: number; // Default: 12
  
  // Para MISSING_FREE_DAYS
  minFreeDaysFullTime?: number; // Default: 2
  minFreeDaysPartTime?: number; // Default: alternando 2/3
  requireConsecutive?: boolean; // Default: true
  
  // Para VACATION_NO_FREE_DAYS
  freeDaysAroundVacation?: number; // Default: 2
  allowBeforeOrAfter?: boolean; // Default: true (antes O después)
}

export interface CoveragePolicy {
  id: string;
  orgId: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  minEmployees: number;
  appliesToDays?: string[]; // ['monday', 'tuesday', ...] o undefined = todos
  isEnabled: boolean;
  createdAt: string;
}

export interface EmployeeRestriction {
  id: string;
  colaboradorId: string;
  orgId: string;
  restrictionType: EmployeeRestrictionType;
  config: EmployeeRestrictionConfig;
  reason?: string;
  approvedBy?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}

export type EmployeeRestrictionType = 
  | 'NO_DAY'           // No puede trabajar cierto día
  | 'PREFERRED_SHIFT'  // Prefiere cierto turno
  | 'MAX_CONSECUTIVE_NIGHTS' // Máximo noches consecutivas
  | 'MAX_HOURS_DAY'    // Máximo horas por día
  | 'NO_TIME_RANGE'    // No puede trabajar en cierta franja
  | 'CUSTOM';          // Restricción personalizada

export interface EmployeeRestrictionConfig {
  // Para NO_DAY
  dayOfWeek?: number; // 0-6 (domingo-sábado)
  
  // Para PREFERRED_SHIFT
  preferredShiftType?: 'morning' | 'afternoon' | 'night';
  
  // Para MAX_CONSECUTIVE_NIGHTS
  maxNights?: number;
  
  // Para MAX_HOURS_DAY
  maxHours?: number;
  
  // Para NO_TIME_RANGE
  startTime?: string;
  endTime?: string;
  
  // Para CUSTOM
  customRule?: string;
}

export interface AuditResult {
  violations: AuditViolation[];
  summary: {
    total: number;
    byType: Record<ViolationType, number>;
    bySeverity: Record<ViolationSeverity, number>;
    byEmployee: Record<string, number>;
  };
  auditedPeriod: {
    startDate: string;
    endDate: string;
  };
  timestamp: string;
}

// Para agrupar violaciones por empleado y fecha
export interface ViolationsByEmployeeDate {
  [employeeId: string]: {
    [date: string]: AuditViolation[];
  };
}

// Configuración de visualización
export interface AuditDisplayConfig {
  showBadges: boolean;
  showTooltips: boolean;
  highlightCells: boolean;
  badgePosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  severityColors: {
    error: string;
    warning: string;
    info: string;
  };
}

// Default display config
export const DEFAULT_AUDIT_DISPLAY_CONFIG: AuditDisplayConfig = {
  showBadges: true,
  showTooltips: true,
  highlightCells: true,
  badgePosition: 'top-right',
  severityColors: {
    error: 'hsl(var(--destructive))',
    warning: 'hsl(45 93% 47%)', // Amber
    info: 'hsl(var(--primary))'
  }
};

// Nombres legibles para tipos de violación
export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  INSUFFICIENT_REST: 'Descanso insuficiente',
  MISSING_FREE_DAYS: 'Faltan días libres',
  MISSING_COVERAGE: 'Cobertura insuficiente',
  VACATION_NO_FREE_DAYS: 'Vacaciones sin días libres',
  NON_CONSECUTIVE_FREE_DAYS: 'Días libres no consecutivos',
  EMPLOYEE_RESTRICTION: 'Restricción de empleado',
  EXCESSIVE_CONSECUTIVE_WORK: 'Exceso días consecutivos trabajados',
  VACATION_RATIO_LOW: 'Ratio vacaciones anual bajo',
};

// Iconos para tipos de violación
export const VIOLATION_TYPE_ICONS: Record<ViolationType, string> = {
  INSUFFICIENT_REST: '⏰',
  MISSING_FREE_DAYS: '📅',
  MISSING_COVERAGE: '👥',
  VACATION_NO_FREE_DAYS: '🏖️',
  NON_CONSECUTIVE_FREE_DAYS: '📆',
  EMPLOYEE_RESTRICTION: '⚠️',
  EXCESSIVE_CONSECUTIVE_WORK: '🔥',
  VACATION_RATIO_LOW: '🏖️',
};
