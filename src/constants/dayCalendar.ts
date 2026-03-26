// Day Calendar Constants
export const SLOT_MINUTES = 30; // Granularidad base (30 minutos)
export const TOTAL_SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES; // 48 slots
export const DAYS_IN_WEEK = 7; // Días de la semana
export const TOTAL_SLOTS_PER_WEEK = TOTAL_SLOTS_PER_DAY * DAYS_IN_WEEK; // 672 slots
export const ZOOM_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' }
] as const;

export const ENABLE_DAY_VIEW = true; // Feature flag
