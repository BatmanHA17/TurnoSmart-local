/**
 * Recepción Department - Role-Specific Shift Constraints
 * Defines which shifts each role can work and preferences
 *
 * ROLE HIERARCHY (by seniority_level):
 * - Level 3: Jefe/a de Recepción (manager)
 * - Level 2: 2ndo/a Jefe/a de Recepción (assistant manager)
 * - Level 1: GEX, Recepcionista #1-4, and future roles (Ayudantes Recepción, Camareros, etc.)
 */

export interface RoleConstraints {
  allowedShifts: string[];
  minDaysPerWeek?: number;
  maxConsecutiveDays?: number;
  preferredShifts?: string[];
  requiresFullCoverage?: boolean;
}

export const RECEPTION_ROLE_CONSTRAINTS: Record<string, RoleConstraints> = {
  'Jefe/a de Recepción': {
    allowedShifts: ['M', 'T', 'N', 'G', 'D'],
    minDaysPerWeek: 4,
    maxConsecutiveDays: 5,
    preferredShifts: ['M', 'T'],
    requiresFullCoverage: true
  },

  '2ndo/a Jefe/a de Recepción': {
    allowedShifts: ['M', 'T', 'N', 'G', 'D'],
    minDaysPerWeek: 4,
    maxConsecutiveDays: 5,
    preferredShifts: ['M', 'T']
  },

  'Recepcionista #1': {
    allowedShifts: ['M', 'T', 'N', 'D'],
    minDaysPerWeek: 3,
    preferredShifts: ['M', 'T']
  },

  'Recepcionista #2': {
    allowedShifts: ['M', 'T', 'N', 'D'],
    minDaysPerWeek: 3,
    preferredShifts: ['M', 'T']
  },

  'Recepcionista #3': {
    allowedShifts: ['M', 'T', 'N', 'D'],
    minDaysPerWeek: 3,
    preferredShifts: ['M', 'T']
  },

  'Recepcionista #4': {
    allowedShifts: ['M', 'T', 'N', 'D'],
    minDaysPerWeek: 3,
    preferredShifts: ['M', 'T']
  },

  'GEX - Guest Experience Agent': {
    allowedShifts: ['GEX_9-17', 'GEX_11-19', 'GEX_12-20', 'D'],
    minDaysPerWeek: 3,
    preferredShifts: ['GEX_9-17']
  }
};

/**
 * Get constraints for a specific Reception role
 */
export function getConstraintsForRole(role: string): RoleConstraints | undefined {
  return RECEPTION_ROLE_CONSTRAINTS[role];
}

/**
 * Validate if a shift is allowed for a specific role
 */
export function isShiftAllowedForRole(role: string, shiftCode: string): boolean {
  const constraints = getConstraintsForRole(role);
  if (!constraints) return false;
  return constraints.allowedShifts.includes(shiftCode);
}

/**
 * Get all Reception roles
 */
export function getReceptionRoles(): string[] {
  return Object.keys(RECEPTION_ROLE_CONSTRAINTS);
}
