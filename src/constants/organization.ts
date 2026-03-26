// ============= Organization Constants =============
// Constantes centralizadas para evitar datos hardcodeados

// Default organization data
export const DEFAULT_ORGANIZATION = {
  id: 'default-org',
  name: 'GOTHAM',
  type: 'establishment' as const
};

// Equipos predeterminados (anteriormente teams/planning)
export const DEFAULT_TEAMS = [
  { id: "cocina", name: "Cocina" },
  { id: "bares", name: "Bares" },
  { id: "recepcion", name: "Recepción" },
  { id: "limpieza", name: "Limpieza" },
  { id: "mantenimiento", name: "Mantenimiento" },
  { id: "administracion", name: "Administración" }
];

// Filter options that appear across the app
export const ORGANIZATION_FILTER_OPTIONS = {
  ALL: 'all',
  GOTHAM: 'gotham',
  DEFAULT: 'default'
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