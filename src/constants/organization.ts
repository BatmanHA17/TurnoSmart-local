// ============= Organization Constants =============
// Constantes centralizadas para evitar datos hardcodeados

// Default organization data - NOW LOADED FROM DATABASE
// DO NOT HARDCODE - Load from useCurrentOrganization() hook
export const DEFAULT_ORGANIZATION = null;

// Teams/Departments - NOW LOADED FROM job_titles TABLE IN DATABASE
// DO NOT HARDCODE - Load from useJobTitles() hook
export const DEFAULT_TEAMS = [];

// Filter options that appear across the app
export const ORGANIZATION_FILTER_OPTIONS = {
  ALL: 'all',
  RECEPTION: 'recepcion'
} as const;

// Organization roles hierarchy
export const ORGANIZATION_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN', 
  MANAGER: 'MANAGER',
  DIRECTOR: 'DIRECTOR',
  EMPLOYEE: 'EMPLOYEE'
} as const;

// Legacy field mapping for migration
export const FIELD_MAPPING = {
  // Old field -> New field
  // 'establecimiento_por_defecto': 'primary_org_id', // ELIMINADO en Fase 5C
  'organization': 'org_name',
  'establishment': 'org_name'
} as const;

// Common filter states
export const FILTER_STATES = {
  ALL: 'all',
  ACTIVE: 'activos',
  INACTIVE: 'inactivos'
} as const;