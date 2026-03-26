/**
 * Tipos de turno según el sistema Cantaclaro
 * Basado en el convenio colectivo de hostelería de Las Palmas
 */

export interface ShiftType {
  code: string;
  name: string;
  description: string;
  color: string;
  isWorkingDay: boolean;
  requiresTime: boolean;
  category: 'work' | 'rest' | 'absence' | 'training';
}

export const SHIFT_TYPES: Record<string, ShiftType> = {
  L: {
    code: 'L',
    name: 'Libre',
    description: 'Día libre',
    color: '#94a3b8', // slate-400
    isWorkingDay: false,
    requiresTime: false,
    category: 'rest'
  },
  X: {
    code: 'X',
    name: 'Presencial',
    description: 'Turno de trabajo presencial',
    color: '#10b981', // green-500
    isWorkingDay: true,
    requiresTime: true,
    category: 'work'
  },
  XB: {
    code: 'XB',
    name: 'Banquetes',
    description: 'Turno presencial en banquetes',
    color: '#f59e0b', // amber-500
    isWorkingDay: true,
    requiresTime: true,
    category: 'work'
  },
  V: {
    code: 'V',
    name: 'Vacaciones',
    description: 'De vacaciones',
    color: '#3b82f6', // blue-500
    isWorkingDay: false,
    requiresTime: false,
    category: 'rest'
  },
  C: {
    code: 'C',
    name: 'Curso',
    description: 'Realizando curso de formación',
    color: '#8b5cf6', // violet-500
    isWorkingDay: true,
    requiresTime: false,
    category: 'training'
  },
  E: {
    code: 'E',
    name: 'Enfermo',
    description: 'Baja por enfermedad o accidente',
    color: '#ef4444', // red-500
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  F: {
    code: 'F',
    name: 'Falta',
    description: 'Falta injustificada',
    color: '#dc2626', // red-600
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  P: {
    code: 'P',
    name: 'Permiso',
    description: 'Permiso autorizado',
    color: '#06b6d4', // cyan-500
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  H: {
    code: 'H',
    name: 'Horas Sindicales',
    description: 'Horas sindicales',
    color: '#ec4899', // pink-500
    isWorkingDay: true,
    requiresTime: false,
    category: 'absence'
  },
  S: {
    code: 'S',
    name: 'Sanción',
    description: 'Sancionado',
    color: '#78716c', // stone-500
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  }
};

// Array de códigos ordenados por categoría
export const SHIFT_TYPE_CODES = Object.keys(SHIFT_TYPES);

// Códigos de turnos que requieren horario
export const SHIFT_TYPES_WITH_TIME = SHIFT_TYPE_CODES.filter(
  code => SHIFT_TYPES[code].requiresTime
);

// Códigos de turnos de trabajo (cuentan como presenciales)
export const WORKING_SHIFT_CODES = SHIFT_TYPE_CODES.filter(
  code => SHIFT_TYPES[code].isWorkingDay
);

// Códigos de días libres
export const REST_DAY_CODES = SHIFT_TYPE_CODES.filter(
  code => SHIFT_TYPES[code].category === 'rest'
);

// Códigos de ausencias
export const ABSENCE_CODES = SHIFT_TYPE_CODES.filter(
  code => SHIFT_TYPES[code].category === 'absence'
);

/**
 * Obtiene el tipo de turno por código
 */
export function getShiftType(code: string): ShiftType | undefined {
  return SHIFT_TYPES[code.toUpperCase()];
}

/**
 * Verifica si un código de turno es válido
 */
export function isValidShiftCode(code: string): boolean {
  return SHIFT_TYPE_CODES.includes(code.toUpperCase());
}

/**
 * Obtiene el color para un tipo de turno
 */
export function getShiftColor(code: string): string {
  const shiftType = getShiftType(code);
  return shiftType ? shiftType.color : '#6b7280'; // gray-500 como default
}

/**
 * Verifica si un turno requiere hora de inicio y fin
 */
export function shiftRequiresTime(code: string): boolean {
  const shiftType = getShiftType(code);
  return shiftType ? shiftType.requiresTime : false;
}

/**
 * Verifica si un turno cuenta como día de trabajo
 */
export function isWorkingShift(code: string): boolean {
  const shiftType = getShiftType(code);
  return shiftType ? shiftType.isWorkingDay : false;
}
