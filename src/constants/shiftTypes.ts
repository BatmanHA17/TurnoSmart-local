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
  D: {
    code: 'D',
    name: 'Descanso',
    description: 'Día de descanso',
    color: '#cbd5e1', // slate-300 pastel
    isWorkingDay: false,
    requiresTime: false,
    category: 'rest'
  },
  X: {
    code: 'X',
    name: 'Presencial',
    description: 'Turno de trabajo presencial',
    color: '#86efac', // green-300 pastel
    isWorkingDay: true,
    requiresTime: true,
    category: 'work'
  },
  XB: {
    code: 'XB',
    name: 'Banquetes',
    description: 'Turno presencial en banquetes',
    color: '#fcd34d', // amber-300 pastel
    isWorkingDay: true,
    requiresTime: true,
    category: 'work'
  },
  V: {
    code: 'V',
    name: 'Vacaciones',
    description: 'De vacaciones',
    color: '#93c5fd', // blue-300 pastel
    isWorkingDay: false,
    requiresTime: false,
    category: 'rest'
  },
  C: {
    code: 'C',
    name: 'Curso',
    description: 'Realizando curso de formación',
    color: '#c4b5fd', // violet-300 pastel
    isWorkingDay: true,
    requiresTime: false,
    category: 'training'
  },
  E: {
    code: 'E',
    name: 'Enfermo',
    description: 'Baja por enfermedad o accidente',
    color: '#fca5a5', // red-300 pastel
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  F: {
    code: 'F',
    name: 'Falta',
    description: 'Falta injustificada',
    color: '#f87171', // red-400 (slightly stronger for severity)
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  P: {
    code: 'P',
    name: 'Permiso',
    description: 'Permiso autorizado',
    color: '#67e8f9', // cyan-300 pastel
    isWorkingDay: false,
    requiresTime: false,
    category: 'absence'
  },
  H: {
    code: 'H',
    name: 'Horas Sindicales',
    description: 'Horas sindicales',
    color: '#f9a8d4', // pink-300 pastel
    isWorkingDay: true,
    requiresTime: false,
    category: 'absence'
  },
  S: {
    code: 'S',
    name: 'Sanción',
    description: 'Sancionado',
    color: '#d6d3d1', // stone-300 pastel
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
