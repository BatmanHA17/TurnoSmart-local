/**
 * TurnoSmart® — Catálogo completo de 92 criterios SMART
 *
 * Fuente: TurnoSmart_Criterios_SMART.xlsx (4 hojas)
 * 18 Obligatorios (OB) + 39 Opcionales (OP) + 25 Checks (CK) + 10 SMART+IA (SM)
 */

export type CriteriaCategory = "mandatory" | "optional" | "custom" | "check" | "smart_ia";
export type CriteriaSeverity = "info" | "warning" | "error" | "blocker";

export interface CriteriaDefault {
  code: string;
  key: string;
  name: string;
  description: string;
  category: CriteriaCategory;
  subcategory: string;
  severity: CriteriaSeverity;
  defaultEnabled: boolean;
  defaultBoost: number; // 1-5
  configJson?: Record<string, unknown>;
}

// ============================================================================
// OB — Criterios Obligatorios (18)
// ============================================================================
export const OBLIGATORIOS: CriteriaDefault[] = [
  {
    code: "OB-01", key: "12H_REST",
    name: "Descanso mínimo 12h entre jornadas",
    description: "Prohibido T→M (turno pijama). Mínimo 12 horas entre fin de un turno e inicio del siguiente",
    category: "mandatory", subcategory: "Legal", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OB-02", key: "CONSECUTIVE_REST_DAYS",
    name: "2 días libres consecutivos por semana",
    description: "Los descansos semanales deben ser consecutivos. Solo excepción con validación del jefe + aceptación del empleado",
    category: "mandatory", subcategory: "Legal", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OB-03", key: "NIGHT_THEN_REST",
    name: "Salida de noche → día siguiente libre",
    description: "Después de turno N (23:00-07:00), el día siguiente es obligatoriamente libre/descanso. Solo ROTA_COMPLETO, no Night Agent fijo",
    category: "mandatory", subcategory: "Legal", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OB-04", key: "MAX_WEEKLY_HOURS",
    name: "Máximo 40h semanales",
    description: "Jornada máxima semanal 40h (futura reforma 37.5h). Toggle configurable",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 5,
    configJson: { maxHours: 40, futureMaxHours: 37.5 },
  },
  {
    code: "OB-05", key: "VACATION_48_DAYS",
    name: "48 días vacaciones/año (hostelería)",
    description: "30 días naturales + 18 festivos trabajados compensados",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
    configJson: { naturalDays: 30, holidayDays: 18 },
  },
  {
    code: "OB-06", key: "HOLIDAY_COMPENSATION",
    name: "Festivos trabajados = compensación",
    description: "Si festivo cae en día laboral y se trabaja, genera F y día compensatorio",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-07", key: "MAX_ANNUAL_HOURS",
    name: "Jornada máxima anual 1.792h",
    description: "Control de horas acumuladas anuales según convenio hostelería",
    category: "mandatory", subcategory: "Legal", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { maxAnnualHours: 1792 },
  },
  {
    code: "OB-08", key: "MIN_COVERAGE",
    name: "Cobertura mínima por turno",
    description: "Siempre al menos 1 persona por turno activo (M/T/N). Servicio nunca desatendido",
    category: "mandatory", subcategory: "Operacional", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
    configJson: { M: 2, T: 2, N: 1 },
  },
  {
    code: "OB-09", key: "PRE_VACATION_REST",
    name: "Salir librando antes de vacaciones",
    description: "La semana antes de vacaciones, el empleado debe tener sus 2 libres ANTES de inicio de vacaciones",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-10", key: "GUARD_ONLY_CHIEF",
    name: "Guardia solo para jefes",
    description: "Turnos G (Guardia 9-21) solo asignables a FOM. Guardias siempre en S/D, seleccionadas en wizard",
    category: "mandatory", subcategory: "Organización", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OB-11", key: "GEX_OWN_SHIFTS",
    name: "GEX turnos propios",
    description: "Guest Experience Agent solo tiene turnos 9×17 y 12×20, no entra en rotación M/T/N",
    category: "mandatory", subcategory: "Organización", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-12", key: "WEEKLY_REST_36H",
    name: "Descanso semanal mínimo 36h consecutivas",
    description: "El convenio hostelería establece 36h consecutivas mínimas de descanso semanal",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-13", key: "FORCE_MAJEURE_12H",
    name: "Override 12h por fuerza mayor con trazabilidad",
    description: "FOM puede forzar violación 12h en casos excepcionales. Requiere doble confirmación + registro",
    category: "mandatory", subcategory: "Legal", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OB-14", key: "SPLIT_REST_CONFLICT",
    name: "Separación libres con conflicto + doble confirmación",
    description: "Si cobertura obliga separar los 2 libres, marca como conflicto y requiere doble confirmación (jefe + empleado)",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-15", key: "DUAL_VACATION_COUNTER",
    name: "Dos contadores vacaciones separados (30 nat + 18 fest)",
    description: "Contador 1: Vacaciones naturales (30/año). Contador 2: Festivos (18/año). Reset 1 enero",
    category: "mandatory", subcategory: "Legal", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
    configJson: { naturalDays: 30, holidayDays: 18, alertThreshold: 0.8, alertBeforeMonth: 10 },
  },
  {
    code: "OB-16", key: "FOM_AFOM_MIRROR",
    name: "Espejo FOM ↔ AFOM",
    description: "FOM en M → AFOM en T. FOM libra → AFOM cubre. FOM en G → AFOM libra. Cálculo secuencial",
    category: "mandatory", subcategory: "Organización", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-17", key: "NIGHT_COVERAGE_EQUITY",
    name: "Cobertura noches Night Shift Agent por equidad",
    description: "Cuando Night Agent libra, la noche la cubre el FDA con menos noches acumuladas. Sin compensación DB",
    category: "mandatory", subcategory: "Equidad", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OB-18", key: "GEX_BY_OCCUPANCY",
    name: "GEX turno por ocupación (check-ins/check-outs)",
    description: "Algoritmo decide 9x17 o 12x20 según volumen: más check-outs → 9x17; más check-ins → 12x20. Override manual",
    category: "mandatory", subcategory: "Operacional", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
];

// ============================================================================
// OP — Criterios Opcionales/Personalizados (39)
// ============================================================================
export const OPCIONALES: CriteriaDefault[] = [
  {
    code: "OP-01", key: "LONG_WEEKEND_MONTHLY",
    name: "Fin de semana largo mensual",
    description: "Cada empleado tiene 1 FDS largo al mes: S+D (sem X) + L+M (sem X+1) = 4 días consecutivos",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-02", key: "ERGONOMIC_ROTATION",
    name: "Rotación ergonómica M→T→N",
    description: "Rotación hacia adelante (nunca N→M directo). Secuencia ideal: M→T→N→Libre",
    category: "optional", subcategory: "Ergonomía", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-03", key: "NIGHT_EQUITY",
    name: "Equidad de noches",
    description: "Mismo número de noches (±1 tolerancia) para todos los rotativos en un ciclo",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-04", key: "WEEKEND_EQUITY",
    name: "Equidad de fines de semana",
    description: "Equilibrar sábados y domingos trabajados entre todos a lo largo del ciclo",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-05", key: "SHIFT_EQUITY_MTN",
    name: "Equidad M/T/N",
    description: "Cantidad de mañanas, tardes y noches equitativa entre personas (excepto nocturno fijo)",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-06", key: "ROTATING_REST_DAYS",
    name: "Libres rotativos",
    description: "Los días libres rotan de posición semana a semana: nadie libra siempre lunes ni siempre viernes",
    category: "optional", subcategory: "Equidad", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-07", key: "OCCUPANCY_STAFFING",
    name: "Dimensionamiento por ocupación",
    description: "Reforzar turnos según check-in/check-out/eventos. Si hay mucho trabajo, 2+ personas por turno",
    category: "optional", subcategory: "Operacional", severity: "warning",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-08", key: "NIGHT_COVER_EQUITY",
    name: "Cobertura equitativa del nocturno",
    description: "Cuando nocturno fijo libra, sus noches se reparten equitativamente entre rotativos",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-09", key: "UNDESIRABILITY_WEIGHT",
    name: "Peso de indeseabilidad por turno",
    description: "Cada turno tiene peso configurable (N=3, T=2, M=1). Motor equilibra carga ponderada total",
    category: "optional", subcategory: "Equidad", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { N: 3, T: 2, M: 1 },
  },
  {
    code: "OP-10", key: "ROTATION_CYCLE_LENGTH",
    name: "Duración ciclo rotación",
    description: "Configurable: 4 semanas (default), 6 u 8 semanas",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
    configJson: { weeks: 4 },
  },
  {
    code: "OP-11", key: "IMBALANCE_TOLERANCE",
    name: "Tolerancia de desequilibrio",
    description: "Margen permitido de diferencia en horas o nº turnos entre empleados antes de alertar",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
    configJson: { toleranceShifts: 3, toleranceHours: 3 },
  },
  {
    code: "OP-12", key: "SMART_IA_FAVORITES",
    name: "Propuesta automática favoritos (SMART+IA)",
    description: "Detecta turnos usados frecuentemente y propone añadirlos a favoritos proactivamente",
    category: "optional", subcategory: "IA proactiva", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-13", key: "CUSTOM_COLLECTIVE_AGREEMENT",
    name: "Convenio personalizado por provincia",
    description: "Cargar convenio colectivo específico (PDF/JSON) que sobreescribe reglas genéricas",
    category: "optional", subcategory: "Legal", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-14", key: "SOFT_PETITIONS",
    name: "Peticiones blandas de empleados",
    description: "Preferencias tipo 'prefiero librar miércoles'. Peso configurable por el jefe (1=deseo, 2=importante, 3=crítico)",
    category: "optional", subcategory: "Preferencias", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-15", key: "EMPLOYEE_SWAPS",
    name: "Intercambios entre empleados",
    description: "Empleados proponen intercambio de turnos entre ellos, sistema valida que no viole reglas",
    category: "optional", subcategory: "Flexibilidad", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-16", key: "MAX_CONSECUTIVE_NIGHTS",
    name: "Máximo noches consecutivas",
    description: "Límite configurable de noches seguidas para rotativos. No aplica a Night Agent fijo",
    category: "optional", subcategory: "Ergonomía", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { maxNights: 4, minNights: 1, maxConfigurable: 7 },
  },
  {
    code: "OP-17", key: "PRE_PUBLISH_SIMULATOR",
    name: "Simulador pre-publicación",
    description: "Proyección de horas, impacto de peticiones, comparativa cuadrantes antes de publicar",
    category: "optional", subcategory: "Herramienta", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-18", key: "TRANSITION_11X19",
    name: "Turno de transición 11×19",
    description: "Turno especial (11:00-19:00) para transiciones legales N→M, evitando violación de 12h",
    category: "optional", subcategory: "Ergonomía", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-19", key: "DB_ACCUMULATOR",
    name: "Acumulador DB (Día Debido)",
    description: "Horas extra > 8h acumuladas = +1 día debido. Contador persistente por empleado",
    category: "optional", subcategory: "Compensación", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-20", key: "DG_ACCUMULATOR",
    name: "Acumulador DG (Debido Guardia)",
    description: "Cada guardia G genera +1 DG (día libre debido) para el jefe que la realizó",
    category: "optional", subcategory: "Compensación", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-21", key: "HOUR_BANK",
    name: "Bolsa de horas",
    description: "Acumulador de horas extras por coberturas de ausencias. Compensable en tiempo o dinero",
    category: "optional", subcategory: "Compensación", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-22", key: "SPLIT_SHIFTS",
    name: "Split shifts (turno partido)",
    description: "Permite turnos partidos (ej. 10-14 + 18-22). Configurable si cuenta como 1 o 2 turnos",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: false, defaultBoost: 2,
  },
  {
    code: "OP-23", key: "AD_HOC_SHIFTS",
    name: "Turnos ad-hoc desde celda (SMART+IA)",
    description: "FOM escribe horario libre en celda (ej: 14x22). Si lo usa 3+ veces, propone añadir a favoritos",
    category: "optional", subcategory: "IA proactiva", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-24", key: "EXTENSIBLE_ABSENCE_TYPES",
    name: "Tipos de ausencia/permiso extensibles",
    description: "Códigos base: D, V, E, F, DB, DG, PM, PC, G. FOM puede crear nuevos tipos manualmente",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-25", key: "DIGITAL_PETITIONS",
    name: "Sistema peticiones digital",
    description: "Flujo: empleado pide → FOM valida/rechaza → resultado. Tipos: A (dura), B (blanda), C (intercambio), D (recurrente)",
    category: "optional", subcategory: "Operacional", severity: "info",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-26", key: "RECURRING_PETITION_DETECT",
    name: "Petición recurrente auto-detectada (Tipo D)",
    description: "Si empleado pide lo mismo 3+ meses seguidos, propone al FOM convertirlo en restricción permanente",
    category: "optional", subcategory: "IA proactiva", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-27", key: "PETITION_DEADLINE",
    name: "Deadline peticiones configurable",
    description: "FOM configura fecha límite para recibir peticiones. Pasada la fecha, entran como blandas con prioridad baja",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-28", key: "SWAP_AUTO_VALIDATION",
    name: "Intercambios con validación automática",
    description: "Dos empleados proponen intercambio → sistema valida (12h, cobertura, horas) → FOM aprueba/rechaza",
    category: "optional", subcategory: "Operacional", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-29", key: "VACATION_CONFLICT_PANEL",
    name: "Conflicto vacaciones con panel comparativo",
    description: "Si 2+ empleados piden mismas fechas: panel con antigüedad, historial, % satisfacción. FOM decide",
    category: "optional", subcategory: "Equidad", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-30", key: "OCCUPANCY_IMPORT",
    name: "Import ocupación PDF/CSV/Excel + manual",
    description: "Input manual de llegadas/salidas por día + import de archivo del PMS. Futura integración API",
    category: "optional", subcategory: "Operacional", severity: "info",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-31", key: "REINFORCEMENT_THRESHOLD",
    name: "Umbral refuerzo por ocupación",
    description: "A partir de X llegadas/día → refuerzo extra si hay RRHH. Umbral configurable. Si no hay personal, alerta",
    category: "optional", subcategory: "Operacional", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { threshold: 40 },
  },
  {
    code: "OP-32", key: "NO_STAFF_ALERT",
    name: "Alerta sin personal + sugerencias",
    description: "Cuando no hay personal para refuerzo: marca día naranja/rojo + envía sugerencias al FOM",
    category: "optional", subcategory: "Operacional", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-33", key: "MULTI_ALTERNATIVE",
    name: "2-3 alternativas de cuadrante con score",
    description: "Algoritmo genera 2-3 versiones con trade-offs: Equidad vs Peticiones vs Cobertura. Score 0-100",
    category: "optional", subcategory: "Core SMART", severity: "info",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "OP-34", key: "POST_PUB_BLUE_CHANGES",
    name: "Cambios post-publicación en azul + notificación",
    description: "FOM edita post-pub → validación → cambios en azul → notificación al empleado → historial",
    category: "optional", subcategory: "Operacional", severity: "info",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "OP-35", key: "CRITERIA_GLOBAL_PUNCTUAL",
    name: "Config criterios global + puntual por generación",
    description: "Settings para config por defecto. En el wizard: ajustar solo para esa generación sin afectar global",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-36", key: "VISUAL_LAYERS",
    name: "Capas visualización toggleables",
    description: "Heatmap de carga, indicadores equidad, alertas inline, comparador lado a lado. Toggle desde toolbar",
    category: "optional", subcategory: "UI/UX", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "OP-37", key: "NEW_HIRE_PROGRESSIVE",
    name: "Nueva incorporación: manual → auto",
    description: "Fase 1: jefe asigna manualmente. Fase 2: entra en rotación con historial en cero",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
  },
  {
    code: "OP-38", key: "CONSECUTIVE_NIGHTS_ALERT",
    name: "Noches consecutivas: alerta suave configurable",
    description: "Umbral default: 4 noches. Al superarlo: aviso visible, NO bloqueo. Configurable 1-7. No aplica a Night Agent",
    category: "optional", subcategory: "Ergonomía", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { threshold: 4, min: 1, max: 7 },
  },
  {
    code: "OP-39", key: "AUTO_DETECT_EMPLOYEE_TYPE",
    name: "Tipo empleado auto-detectado + override manual",
    description: "Sistema detecta tipo (FIJO/ROTA/PARCIAL/COBERTURA) por contrato, rol e historial. FOM puede override",
    category: "optional", subcategory: "Configuración", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
];

// ============================================================================
// CK — Checks de Validación (25)
// ============================================================================
export const CHECKS: CriteriaDefault[] = [
  {
    code: "CK-01", key: "CHECK_12H_REST",
    name: "Descanso 12h",
    description: "Verificar que entre fin de turno e inicio del siguiente hay ≥12h",
    category: "check", subcategory: "Post-gen + Tiempo real", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-02", key: "CHECK_CONSECUTIVE_REST",
    name: "Libres consecutivos",
    description: "Verificar que los 2 días libres de cada semana son consecutivos",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-03", key: "CHECK_MIN_COVERAGE",
    name: "Cobertura mínima",
    description: "Verificar que cada turno activo tiene ≥ personas mínimas configuradas",
    category: "check", subcategory: "Post-gen", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-04", key: "CHECK_WEEKLY_HOURS",
    name: "Horas semanales",
    description: "Verificar que ningún empleado supera 40h (o 37.5h) semanales",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-05", key: "CHECK_PAJAMA_SHIFT",
    name: "Turno pijama",
    description: "Detectar secuencia T→M (tarde seguida de mañana)",
    category: "check", subcategory: "Post-gen + Tiempo real", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-06", key: "CHECK_NIGHT_THEN_FREE",
    name: "Noche → libre",
    description: "Verificar que después de turno N el día siguiente es libre. Solo ROTA_COMPLETO",
    category: "check", subcategory: "Post-gen", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-07", key: "CHECK_NIGHT_BALANCE",
    name: "Equilibrio noches",
    description: "Verificar desequilibrio de noches no supera tolerancia configurada entre empleados",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-08", key: "CHECK_WEEKEND_BALANCE",
    name: "Equilibrio FDS",
    description: "Verificar desequilibrio de fines de semana trabajados",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-09", key: "CHECK_LONG_WEEKEND",
    name: "FDS largo mensual",
    description: "Verificar que cada empleado tiene bloque S+D+L+M al menos 1 vez al mes",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-10", key: "CHECK_PRE_VACATION",
    name: "Pre-vacaciones librando",
    description: "Verificar que antes de vacaciones el empleado tiene sus 2 libres semanales",
    category: "check", subcategory: "Pre-gen + Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-11", key: "CHECK_HOLIDAY_COMPENSATED",
    name: "Festivos compensados",
    description: "Verificar que festivos trabajados tienen compensatorio programado en el mes",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-12", key: "CHECK_GUARD_ROLE",
    name: "Guardia = solo jefe",
    description: "Verificar que G solo asignado a roles Jefe",
    category: "check", subcategory: "Tiempo real", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-13", key: "CHECK_GEX_EXCLUSION",
    name: "GEX exclusión rotación",
    description: "Verificar que GEX no entra en rotación M/T/N general",
    category: "check", subcategory: "Pre-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-14", key: "CHECK_HARD_RESTRICTIONS",
    name: "Restricciones duras empleado",
    description: "Verificar que ninguna restricción dura (Tipo A) ha sido violada",
    category: "check", subcategory: "Post-gen", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-15", key: "CHECK_ANNUAL_HOURS",
    name: "Horas acumuladas anuales",
    description: "Proyección horas anuales no supera 1.792h (convenio hostelería)",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-16", key: "CHECK_36H_WEEKLY_REST",
    name: "Descanso semanal 36h",
    description: "Verificar bloque de 36h consecutivas de descanso semanal",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-17", key: "CHECK_SHIFT_PROGRESSION",
    name: "Progresión natural turnos",
    description: "Verificar que no hay saltos bruscos (ej. M directo a N sin pasar por T)",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-18", key: "CHECK_STAFFING_VS_OCCUPANCY",
    name: "Dimensionamiento vs ocupación",
    description: "Verificar que personal presencial coincide con forecast de ocupación del día",
    category: "check", subcategory: "Post-gen", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "CK-19", key: "CHECK_SWAP_VALIDATION",
    name: "Validación intercambios (12h + cobertura + horas)",
    description: "Antes de aprobar intercambio Tipo C, validar: no pijama, no viola 12h, cobertura OK, horas OK",
    category: "check", subcategory: "Pre-aprobación", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-20", key: "CHECK_ALL_LONG_WEEKENDS",
    name: "FDS largo para todos en el mes",
    description: "Verificar que al finalizar generación mensual, TODOS los empleados tienen FDS largo asignado",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-21", key: "CHECK_FOM_AFOM_MIRROR",
    name: "Espejo FOM-AFOM consistente",
    description: "Verificar lógica espejo: FOM en M → AFOM en T; FOM libra → AFOM trabaja; FOM en G → AFOM libra",
    category: "check", subcategory: "Post-gen", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "CK-22", key: "CHECK_MIN_SCORE",
    name: "Score mínimo para publicar",
    description: "El cuadrante debe tener score mínimo (configurable, default 70) para ser publicable sin override",
    category: "check", subcategory: "Pre-publicación", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
    configJson: { minScore: 70 },
  },
  {
    code: "CK-23", key: "CHECK_CROSS_PERIOD",
    name: "Continuidad con período anterior",
    description: "Verificar que día 1 no genera pijama respecto al último turno del período anterior",
    category: "check", subcategory: "Pre-gen", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-24", key: "CHECK_HARD_PETITIONS",
    name: "Peticiones duras respetadas al 100%",
    description: "Verificar que NINGUNA petición Tipo A ha sido violada. Bloquea publicación",
    category: "check", subcategory: "Post-gen", severity: "blocker",
    defaultEnabled: true, defaultBoost: 5,
  },
  {
    code: "CK-25", key: "CHECK_AD_HOC_12H",
    name: "Turnos ad-hoc validados (12h)",
    description: "Cuando FOM escribe turno ad-hoc en celda, verificar que no viola 12h con turno anterior ni siguiente",
    category: "check", subcategory: "Tiempo real", severity: "error",
    defaultEnabled: true, defaultBoost: 4,
  },
];

// ============================================================================
// SM — Features SMART+IA (10)
// ============================================================================
export const SMART_IA: CriteriaDefault[] = [
  {
    code: "SM-01", key: "SMARTIA_AUTO_FAVORITES",
    name: "Auto-proponer turnos a favoritos",
    description: "Detecta turnos usados frecuentemente y propone añadirlos a favoritos",
    category: "smart_ia", subcategory: "Proactivo", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { usageThreshold: 3 },
  },
  {
    code: "SM-02", key: "SMARTIA_RECURRING_PETITION",
    name: "Petición recurrente → restricción permanente",
    description: "Detecta cuando un empleado pide lo mismo 3+ meses seguidos y propone convertirlo en restricción",
    category: "smart_ia", subcategory: "Proactivo", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { monthsThreshold: 3 },
  },
  {
    code: "SM-03", key: "SMARTIA_PUNCTUAL_TO_GLOBAL",
    name: "Config puntual → config global",
    description: "Detecta cuando el FOM activa el mismo criterio puntualmente en 3+ generaciones seguidas",
    category: "smart_ia", subcategory: "Proactivo", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
    configJson: { generationsThreshold: 3 },
  },
  {
    code: "SM-04", key: "SMARTIA_SOFT_CONFLICT",
    name: "Conflicto inteligente de peticiones blandas",
    description: "Cuando dos peticiones blandas chocan, prioriza al empleado con menor ratio de satisfacción histórica",
    category: "smart_ia", subcategory: "Resolución", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "SM-05", key: "SMARTIA_REINFORCEMENT_SUGGEST",
    name: "Sugerencias de refuerzo por ocupación",
    description: "Cuando un día necesita refuerzo pero no hay personal, sugiere opciones concretas al FOM",
    category: "smart_ia", subcategory: "Proactivo", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
  },
  {
    code: "SM-06", key: "SMARTIA_SCORE_ACCOUNTABILITY",
    name: "Score como accountability documental",
    description: "Cada cuadrante publicado queda registrado con score, versión elegida y quién la eligió",
    category: "smart_ia", subcategory: "Trazabilidad", severity: "info",
    defaultEnabled: true, defaultBoost: 4,
  },
  {
    code: "SM-07", key: "SMARTIA_VISUAL_PREFS",
    name: "Recordar preferencia de capas visuales",
    description: "El sistema recuerda qué capas de visualización tiene activas el FOM entre sesiones",
    category: "smart_ia", subcategory: "UX", severity: "info",
    defaultEnabled: true, defaultBoost: 1,
  },
  {
    code: "SM-08", key: "SMARTIA_ABSENCE_AUTO_SAVE",
    name: "Código ausencia auto-guardado",
    description: "Cuando FOM crea un código de ausencia personalizado varias veces, propone guardarlo permanentemente",
    category: "smart_ia", subcategory: "Proactivo", severity: "info",
    defaultEnabled: true, defaultBoost: 2,
    configJson: { usageThreshold: 3 },
  },
  {
    code: "SM-09", key: "SMARTIA_VACATION_80_ALERT",
    name: "Alerta preventiva vacaciones 80%",
    description: "Avisa al FOM cuando un empleado ha consumido más del 80% de sus vacaciones antes de octubre",
    category: "smart_ia", subcategory: "Proactivo", severity: "warning",
    defaultEnabled: true, defaultBoost: 3,
    configJson: { alertThreshold: 0.8, beforeMonth: 10 },
  },
  {
    code: "SM-10", key: "SMARTIA_TRANSITION_11X19",
    name: "Transición 11x19 propuesta automática",
    description: "Cuando detecta transición que violaría 12h, propone 11x19 como solución",
    category: "smart_ia", subcategory: "Resolución", severity: "info",
    defaultEnabled: true, defaultBoost: 3,
  },
];

// ============================================================================
// Catálogo completo (92 criterios)
// ============================================================================
export const ALL_CRITERIA: CriteriaDefault[] = [
  ...OBLIGATORIOS,
  ...OPCIONALES,
  ...CHECKS,
  ...SMART_IA,
];

/** Mapa rápido code → criterio */
export const CRITERIA_BY_CODE = new Map(ALL_CRITERIA.map((c) => [c.code, c]));

/** Mapa rápido key → criterio */
export const CRITERIA_BY_KEY = new Map(ALL_CRITERIA.map((c) => [c.key, c]));

/**
 * Mapeo de las 16 claves legacy (useCriteria v1) a las nuevas claves del catálogo v3.
 * Se usa en la migración para no perder configuración existente.
 */
export const LEGACY_KEY_MAP: Record<string, string> = {
  "12H_REST": "12H_REST",
  "AFTERNOON_TO_MORNING": "12H_REST", // fusionado con OB-01
  "MIN_FREE_DAYS": "CONSECUTIVE_REST_DAYS",
  "MAX_WEEKLY_HOURS": "MAX_WEEKLY_HOURS",
  "NIGHT_THEN_REST": "NIGHT_THEN_REST",
  "CONTRACT_HOURS_MATCH": "MAX_WEEKLY_HOURS", // subsumido por OB-04
  "ERGONOMIC_ROTATION": "ERGONOMIC_ROTATION",
  "CONSECUTIVE_REST": "CONSECUTIVE_REST_DAYS", // fusionado con OB-02
  "MIN_COVERAGE_M": "MIN_COVERAGE", // fusionado en OB-08
  "MIN_COVERAGE_T": "MIN_COVERAGE",
  "MIN_COVERAGE_N": "MIN_COVERAGE",
  "FOM_AFOM_SAME_SHIFT": "FOM_AFOM_MIRROR",
  "EQUITY_DEVIATION": "SHIFT_EQUITY_MTN",
  "MAX_CONSECUTIVE_NIGHTS": "MAX_CONSECUTIVE_NIGHTS",
  "WEEKEND_EQUITY": "WEEKEND_EQUITY",
  "OCCUPANCY_UNDERSTAFFING": "OCCUPANCY_STAFFING",
  "PETITION_NOT_SATISFIED": "SOFT_PETITIONS",
};
