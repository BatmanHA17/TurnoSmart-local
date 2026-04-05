/**
 * TurnoSmart® — Sector Engine Templates
 *
 * Shift time presets, role configs, and coverage defaults per sector.
 * Used by the engine when org has a sector-specific configuration.
 * Falls back to constants.ts defaults (hotel reception) when not set.
 */

import type { ShiftTimeConfig, RoleConfigOverride, SectorTemplate } from "@/utils/engine/types";

// ---------------------------------------------------------------------------
// SHIFT PRESETS per sector
// ---------------------------------------------------------------------------

const HOTEL_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "07:00", endTime: "15:00", hours: 8, label: "Mañana" },
  T:      { code: "T",      startTime: "15:00", endTime: "23:00", hours: 8, label: "Tarde" },
  N:      { code: "N",      startTime: "23:00", endTime: "07:00", hours: 8, label: "Noche" },
  G:      { code: "G",      startTime: "09:00", endTime: "21:00", hours: 12, label: "Guardia" },
  "11x19": { code: "11x19", startTime: "11:00", endTime: "19:00", hours: 8, label: "Transición" },
  "9x17":  { code: "9x17",  startTime: "09:00", endTime: "17:00", hours: 8, label: "GEX Mañana" },
  "12x20": { code: "12x20", startTime: "12:00", endTime: "20:00", hours: 8, label: "GEX Tarde" },
};

const RESTAURANT_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "08:00", endTime: "16:00", hours: 8, label: "Mañana" },
  T:      { code: "T",      startTime: "16:00", endTime: "00:00", hours: 8, label: "Tarde" },
  "11x19": { code: "11x19", startTime: "11:00", endTime: "19:00", hours: 8, label: "Transición" },
  "10x14": { code: "10x14", startTime: "10:00", endTime: "14:00", hours: 4, label: "Mediodía" },
  "18x22": { code: "18x22", startTime: "18:00", endTime: "22:00", hours: 4, label: "Servicio cena" },
};

const RETAIL_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "09:00", endTime: "15:00", hours: 6, label: "Mañana" },
  T:      { code: "T",      startTime: "15:00", endTime: "21:00", hours: 6, label: "Tarde" },
  "10x18": { code: "10x18", startTime: "10:00", endTime: "18:00", hours: 8, label: "Jornada completa" },
};

const HEALTHCARE_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "07:00", endTime: "15:00", hours: 8, label: "Mañana" },
  T:      { code: "T",      startTime: "15:00", endTime: "23:00", hours: 8, label: "Tarde" },
  N:      { code: "N",      startTime: "23:00", endTime: "07:00", hours: 8, label: "Noche" },
  "12H_D": { code: "12H_D", startTime: "08:00", endTime: "20:00", hours: 12, label: "Guardia día" },
  "12H_N": { code: "12H_N", startTime: "20:00", endTime: "08:00", hours: 12, label: "Guardia noche" },
};

const MANUFACTURING_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "06:00", endTime: "14:00", hours: 8, label: "Turno 1" },
  T:      { code: "T",      startTime: "14:00", endTime: "22:00", hours: 8, label: "Turno 2" },
  N:      { code: "N",      startTime: "22:00", endTime: "06:00", hours: 8, label: "Turno 3" },
};

const GENERIC_SHIFTS: Record<string, ShiftTimeConfig> = {
  M:      { code: "M",      startTime: "08:00", endTime: "16:00", hours: 8, label: "Mañana" },
  T:      { code: "T",      startTime: "16:00", endTime: "00:00", hours: 8, label: "Tarde" },
  N:      { code: "N",      startTime: "00:00", endTime: "08:00", hours: 8, label: "Noche" },
};

// ---------------------------------------------------------------------------
// SECTOR TEMPLATES
// ---------------------------------------------------------------------------

export const SECTOR_ENGINE_TEMPLATES: Record<string, SectorTemplate> = {
  hospitality: {
    id: "hospitality",
    name: "Hostelería (Hotel)",
    description: "Recepción 24h: M(07-15) + T(15-23) + N(23-07). Guardias FOM. GEX con turnos propios.",
    icon: "Hotel",
    shifts: HOTEL_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "G", "D", "V", "E", "DB", "DG"], label: "Jefe/a de Recepción" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "11x19", "D", "V", "E"], label: "Asistente Recepción" },
      { role: "NIGHT_SHIFT_AGENT", rotationType: "FIJO_NO_ROTA", seniorityLevel: 1, allowedShifts: ["N", "D", "V", "E"], label: "Agente Nocturno" },
      { role: "GEX", rotationType: "ROTA_PARCIAL", seniorityLevel: 1, allowedShifts: ["9x17", "12x20", "D", "V", "E"], label: "Guest Experience" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "N", "11x19", "D", "V", "E"], label: "Recepcionista" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 1 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_hospitality",
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurante",
    description: "Operativa 16h: M(08-16) + T(16-00). Sin turno nocturno. Posibilidad de split shifts.",
    icon: "UtensilsCrossed",
    shifts: RESTAURANT_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "D", "V", "E"], label: "Jefe/a" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "11x19", "D", "V", "E"], label: "2ndo/a de Sala" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "11x19", "D", "V", "E"], label: "Camarero/Cocinero" },
      { role: "GEX", rotationType: "ROTA_PARCIAL", seniorityLevel: 1, allowedShifts: ["10x14", "18x22", "D", "V", "E"], label: "Apoyo media jornada" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 0 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_hospitality",
  },
  retail: {
    id: "retail",
    name: "Comercio / Retail",
    description: "Operativa 12h: M(09-15) + T(15-21). Sin noche. Turnos de 6h habituales.",
    icon: "ShoppingBag",
    shifts: RETAIL_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "10x18", "D", "V", "E"], label: "Gerente" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "10x18", "D", "V", "E"], label: "Encargado/a" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "10x18", "D", "V", "E"], label: "Vendedor/a" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 0 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_generic",
  },
  healthcare: {
    id: "healthcare",
    name: "Sanidad / Clínica",
    description: "Operativa 24h: M(07-15) + T(15-23) + N(23-07). Guardias 12h opcionales.",
    icon: "HeartPulse",
    shifts: HEALTHCARE_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "D", "V", "E"], label: "Supervisor/a" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "N", "D", "V", "E"], label: "Coordinador/a" },
      { role: "NIGHT_SHIFT_AGENT", rotationType: "FIJO_NO_ROTA", seniorityLevel: 1, allowedShifts: ["N", "12H_N", "D", "V", "E"], label: "Nocturno fijo" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "N", "12H_D", "12H_N", "D", "V", "E"], label: "Enfermero/Auxiliar" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 1 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_generic",
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufactura / Industria",
    description: "3 turnos rotativos de 8h: T1(06-14) + T2(14-22) + T3(22-06).",
    icon: "Factory",
    shifts: MANUFACTURING_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "D", "V", "E"], label: "Jefe/a de Producción" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "N", "D", "V", "E"], label: "Supervisor/a" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "N", "D", "V", "E"], label: "Operario/a" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 2 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_generic",
  },
  services: {
    id: "services",
    name: "Servicios",
    description: "Operativa flexible: M(08-16) + T(16-00). Noche opcional.",
    icon: "Headphones",
    shifts: GENERIC_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "D", "V", "E"], label: "Responsable" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "D", "V", "E"], label: "Coordinador/a" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "N", "D", "V", "E"], label: "Técnico/Agente" },
    ],
    defaultCoverage: { M: 2, T: 2, N: 0 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_generic",
  },
  generic: {
    id: "generic",
    name: "Genérico",
    description: "Configuración estándar 24h adaptable a cualquier sector.",
    icon: "Building2",
    shifts: GENERIC_SHIFTS,
    roles: [
      { role: "FOM", rotationType: "FIJO_NO_ROTA", seniorityLevel: 3, allowedShifts: ["M", "T", "D", "V", "E"], label: "Jefe/a" },
      { role: "AFOM", rotationType: "COBERTURA", seniorityLevel: 2, allowedShifts: ["M", "T", "D", "V", "E"], label: "Supervisor/a" },
      { role: "FRONT_DESK_AGENT", rotationType: "ROTA_COMPLETO", seniorityLevel: 1, allowedShifts: ["M", "T", "N", "D", "V", "E"], label: "Empleado/a" },
    ],
    defaultCoverage: { M: 1, T: 1, N: 1 },
    defaultWeeklyHours: 40,
    laborLawPreset: "spain_generic",
  },
};

/** Get sector template by id, with fallback to generic */
export function getSectorTemplate(sectorId: string): SectorTemplate {
  return SECTOR_ENGINE_TEMPLATES[sectorId] ?? SECTOR_ENGINE_TEMPLATES.generic;
}
