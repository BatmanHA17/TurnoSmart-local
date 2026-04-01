/**
 * SMART Tags — Keywords estructurados para notas de turnos
 *
 * Phase 1: Tags predefinidos que el motor interpreta como hints.
 * El FOM puede escribir tags en las notas de cualquier turno (saved_shifts.notes)
 * o en las notas diarias del calendario.
 *
 * El motor lee los tags y los usa para:
 * - #transición  → priorizar 11×19 cuando se detecta violación 12h
 * - #refuerzo    → flag de día que necesita personal extra
 * - #alta-ocupación → solo asignar turno en días con >40 movimientos
 * - #evento      → día con evento especial (boda, grupo, congreso)
 * - #formación   → turno dedicado a formación interna
 */

// ─── Tag Definitions ─────────────────────────────────────────────────────────

export interface SmartTag {
  /** Tag keyword (sin #, lowercase) */
  key: string;
  /** Etiqueta visible en UI */
  label: string;
  /** Descripción de lo que hace el tag */
  description: string;
  /** Color del badge en UI */
  color: string;
  /** Categoría del tag */
  category: 'scheduling' | 'staffing' | 'info';
}

export const SMART_TAGS: SmartTag[] = [
  {
    key: 'transición',
    label: '#transición',
    description: 'Priorizar turno 11×19 cuando se detecta violación 12h',
    color: '#fb923c',
    category: 'scheduling',
  },
  {
    key: 'refuerzo',
    label: '#refuerzo',
    description: 'Este día necesita personal extra',
    color: '#f87171',
    category: 'staffing',
  },
  {
    key: 'alta-ocupación',
    label: '#alta-ocupación',
    description: 'Solo asignar en días con alta ocupación (>umbral)',
    color: '#fbbf24',
    category: 'staffing',
  },
  {
    key: 'evento',
    label: '#evento',
    description: 'Día con evento especial (boda, grupo, congreso)',
    color: '#a78bfa',
    category: 'info',
  },
  {
    key: 'formación',
    label: '#formación',
    description: 'Turno dedicado a formación interna',
    color: '#34d399',
    category: 'info',
  },
];

export const SMART_TAG_MAP = new Map(SMART_TAGS.map((t) => [t.key, t]));

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Extrae SMART tags de un string de notas.
 * Busca patrones #keyword (case-insensitive, con o sin acentos).
 *
 * @example parseTags("Usar solo #alta-ocupación y #refuerzo") → ["alta-ocupación", "refuerzo"]
 */
export function parseTags(notes: string | null | undefined): string[] {
  if (!notes) return [];
  const matches = notes.match(/#[\wáéíóúñü-]+/gi);
  if (!matches) return [];

  return matches
    .map((m) => m.slice(1).toLowerCase()) // remove # prefix
    .filter((key) => SMART_TAG_MAP.has(key));
}

/**
 * Verifica si un string de notas contiene un tag específico.
 */
export function hasTag(notes: string | null | undefined, tagKey: string): boolean {
  return parseTags(notes).includes(tagKey);
}

/**
 * Devuelve los SmartTag objects encontrados en un string de notas.
 */
export function getTagObjects(notes: string | null | undefined): SmartTag[] {
  return parseTags(notes)
    .map((key) => SMART_TAG_MAP.get(key))
    .filter(Boolean) as SmartTag[];
}
