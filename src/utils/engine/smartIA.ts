/**
 * TurnoSmart® — SMART+IA Module
 *
 * Detección proactiva de patrones y sugerencias inteligentes.
 * La herramienta piensa, va por delante, propone.
 *
 * Features:
 * 1. Auto-favoritos: si un turno ad-hoc se usa 3+ veces → proponer guardarlo
 * 2. Petición recurrente: si un empleado pide lo mismo 3+ meses → tipo D
 * 3. Config suggestions: si FOM cambia criterio puntualmente 3+ veces → proponer default
 * 4. Conflict resolution: priorizar por historial de satisfacción
 * 5. Reinforcement suggestions: sugerir movimientos cuando falta cobertura
 * 6. Accountability scoring: registrar qué alternativa eligió el FOM
 * 7. Viz preferences: recordar capas activas del FOM
 * 8. Absence auto-save: detectar códigos de ausencia repetidos → guardar
 * 9. Vacation 80% alert: avisar cuando un empleado lleva 80% vacaciones
 * 10. 11×19 auto-proposal: proponer transición cuando T→M inevitable
 */

import type { Petition, EquityBalance, DayAssignmentV2 } from "./types";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type SuggestionType =
  | "auto_favorite"         // SM-01: turno ad-hoc usado 3+ veces
  | "recurrent_petition"    // SM-02: misma petición 3+ meses
  | "config_suggestion"     // SM-03: criterio cambiado 3+ generaciones
  | "smart_conflict"        // SM-04: resolver conflicto por historial
  | "reinforcement"         // SM-05: sugerir refuerzo cuando falta cobertura
  | "accountability"        // SM-06: registrar decisión del FOM
  | "viz_preference"        // SM-07: recordar capas activas
  | "absence_save"          // SM-08: código ausencia repetido → guardar
  | "vacation_alert"        // SM-09: 80% vacaciones consumidas
  | "transition_proposal"   // SM-10: proponer 11×19
  | "vacation_suggestion"   // SM-11: sugerir vacaciones en baja operativa
  | "db_dg_enjoy";          // SM-12: sugerir disfrute de DB/DG acumulados

export interface SmartSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  /** Acción principal del FOM */
  actionLabel: string;
  /** Datos específicos de la sugerencia */
  data: Record<string, any>;
  /** Fecha de creación */
  createdAt: string;
  /** true si el FOM ya respondió */
  dismissed: boolean;
}

// ---------------------------------------------------------------------------
// DETECTORS
// ---------------------------------------------------------------------------

/**
 * SM-01: Detecta turnos ad-hoc usados 3+ veces sin guardar como favorito.
 */
export function detectFrequentAdHocShifts(
  schedules: Record<string, Record<number, DayAssignmentV2>>,
  savedShiftCodes: string[]
): SmartSuggestion[] {
  const adHocCounts = new Map<string, number>();

  for (const empSchedule of Object.values(schedules)) {
    for (const assignment of Object.values(empSchedule)) {
      const code = assignment.code;
      // Es ad-hoc si matchea patrón NxN y no está en los guardados
      if (/^\d{1,2}x\d{1,2}$/.test(code) && !savedShiftCodes.includes(code)) {
        adHocCounts.set(code, (adHocCounts.get(code) ?? 0) + 1);
      }
    }
  }

  const suggestions: SmartSuggestion[] = [];
  for (const [code, count] of adHocCounts) {
    if (count >= 3) {
      suggestions.push({
        id: `auto-fav-${code}-${Date.now()}`,
        type: "auto_favorite",
        title: `Turno ${code} usado ${count} veces`,
        description: `Has usado el turno ${code} en ${count} ocasiones. ¿Quieres añadirlo a tus favoritos?`,
        actionLabel: "Guardar como favorito",
        data: { shiftCode: code, count },
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  }

  return suggestions;
}

/**
 * SM-02: Detecta empleados que piden lo mismo 3+ períodos seguidos.
 */
export function detectRecurrentPetitions(
  petitionHistory: Array<{
    employeeId: string;
    employeeName: string;
    type: string;
    requestedShift: string | null;
    avoidShift: string | null;
    days: number[];
    period: string; // "YYYY-MM"
  }>
): SmartSuggestion[] {
  // Agrupar por empleado + patrón
  const patterns = new Map<string, { count: number; employeeName: string; detail: string }>();

  for (const pet of petitionHistory) {
    if (pet.type !== "B") continue;
    const key = `${pet.employeeId}-${pet.requestedShift ?? ""}-${pet.avoidShift ?? ""}-${pet.days.sort().join(",")}`;
    const existing = patterns.get(key);
    if (existing) {
      existing.count++;
    } else {
      const detail = pet.requestedShift
        ? `prefiere ${pet.requestedShift} los días ${pet.days.join(", ")}`
        : `evita ${pet.avoidShift} los días ${pet.days.join(", ")}`;
      patterns.set(key, { count: 1, employeeName: pet.employeeName, detail });
    }
  }

  const suggestions: SmartSuggestion[] = [];
  for (const [key, { count, employeeName, detail }] of patterns) {
    if (count >= 3) {
      suggestions.push({
        id: `recurrent-${key}-${Date.now()}`,
        type: "recurrent_petition",
        title: `Petición recurrente detectada`,
        description: `${employeeName} siempre ${detail} (${count} meses seguidos). ¿Convertir en restricción permanente?`,
        actionLabel: "Convertir en permanente",
        data: { employeeId: key.split("-")[0], count, detail },
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  }

  return suggestions;
}

/**
 * SM-09: Alerta cuando un empleado ha consumido 80%+ de sus vacaciones.
 */
export function detectVacationAlerts(
  employees: Array<{
    id: string;
    name: string;
    vacationDaysUsed: number;
    vacationDaysTotal: number;
  }>
): SmartSuggestion[] {
  return employees
    .filter((e) => e.vacationDaysTotal > 0 && e.vacationDaysUsed / e.vacationDaysTotal >= 0.8)
    .map((e) => ({
      id: `vac-alert-${e.id}-${Date.now()}`,
      type: "vacation_alert" as const,
      title: `${e.name}: vacaciones al ${Math.round((e.vacationDaysUsed / e.vacationDaysTotal) * 100)}%`,
      description: `Ha consumido ${e.vacationDaysUsed} de ${e.vacationDaysTotal} días. Quedan ${e.vacationDaysTotal - e.vacationDaysUsed} días para el resto del año.`,
      actionLabel: "Ver detalle",
      data: { employeeId: e.id, used: e.vacationDaysUsed, total: e.vacationDaysTotal },
      createdAt: new Date().toISOString(),
      dismissed: false,
    }));
}

/**
 * SM-10: Detecta transiciones T→M que necesitan 11×19 como puente.
 */
export function detectTransitionNeeds(
  schedules: Record<string, Record<number, DayAssignmentV2>>,
  totalDays: number
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const seen = new Set<string>();

  for (const [empId, schedule] of Object.entries(schedules)) {
    for (let d = 1; d < totalDays; d++) {
      const today = schedule[d]?.code;
      const tomorrow = schedule[d + 1]?.code;
      if (today === "T" && tomorrow === "M") {
        const key = `${empId}-${d}`;
        if (seen.has(key)) continue;
        seen.add(key);
        suggestions.push({
          id: `transition-${key}-${Date.now()}`,
          type: "transition_proposal",
          title: `Transición T→M detectada`,
          description: `Día ${d}→${d + 1}: el turno 11×19 evitaría la violación de 12h de descanso.`,
          actionLabel: "Aplicar 11×19",
          data: { employeeId: empId, day: d, proposedShift: "11x19" },
          createdAt: new Date().toISOString(),
          dismissed: false,
        });
      }
    }
  }

  return suggestions;
}

/**
 * SM-11: Sugerir vacaciones en períodos de baja operativa.
 *
 * Si estamos en Q4 (Oct-Dic) y el empleado tiene >50% de vacaciones pendientes
 * Y hay semanas con ocupación <50% promedio → sugerir.
 */
export function detectVacationOpportunities(
  employees: Array<{ id: string; name: string; vacationDaysUsed?: number; vacationDaysTotal?: number }>,
  occupancy: Array<{ day: number; totalMovements: number }>,
  currentMonth: number, // 1-12
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  if (currentMonth < 10) return suggestions; // Solo Q4

  const VACATION_TOTAL = 48; // Hostelería España
  const avgOccupancy = occupancy.length > 0
    ? occupancy.reduce((sum, o) => sum + o.totalMovements, 0) / occupancy.length
    : Infinity;

  // Encontrar semanas de baja operativa (< 50% del promedio)
  const lowOccWeeks: number[] = [];
  for (let w = 0; w < 4; w++) {
    const weekDays = occupancy.filter((o) => o.day >= w * 7 + 1 && o.day <= (w + 1) * 7);
    if (weekDays.length === 0) continue;
    const weekAvg = weekDays.reduce((s, o) => s + o.totalMovements, 0) / weekDays.length;
    if (weekAvg < avgOccupancy * 0.5) lowOccWeeks.push(w + 1);
  }

  if (lowOccWeeks.length === 0) return suggestions;

  for (const emp of employees) {
    const used = emp.vacationDaysUsed ?? 0;
    const total = emp.vacationDaysTotal ?? VACATION_TOTAL;
    const remaining = total - used;
    const ratio = used / total;

    if (ratio < 0.5 && remaining > 5) {
      suggestions.push({
        id: `sm11-${emp.id}-${currentMonth}`,
        type: "vacation_suggestion",
        title: `${emp.name} tiene ${remaining} días de vacaciones pendientes`,
        description: `La semana ${lowOccWeeks.join(", ")} tiene baja ocupación. Ideal para planificar ${Math.min(remaining, 10)} días de vacaciones.`,
        actionLabel: "Crear petición vacaciones",
        data: {
          employeeId: emp.id,
          remainingDays: remaining,
          suggestedWeeks: lowOccWeeks,
        },
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }
  }

  return suggestions;
}

/**
 * SM-12: Sugerir disfrute de dias debidos (DB) y debidos guardia (DG).
 *
 * Cuando un empleado tiene saldo DB > 0 o DG > 0, se genera una sugerencia
 * para que el FOM programe esos dias de descanso compensatorio.
 *
 * NOTA: Los campos dbBalance y dgBalance NO estan en EquityBalance del engine.
 * Se leen desde la tabla employee_equity (columnas db_balance, dg_balance)
 * y se pasan como parametro independiente a esta funcion.
 * TODO: En el futuro, considerar agregar dbBalance/dgBalance a EquityBalance
 * para que el engine tenga acceso directo sin query adicional.
 */
export function detectDbDgEnjoy(
  employees: Array<{
    id: string;
    name: string;
    /** Saldo de dias debidos (horas extra acumuladas, cada +8h = +1 DB) */
    dbBalance: number;
    /** Saldo de dias debidos por guardia (compensatorio por G trabajadas) */
    dgBalance: number;
  }>
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  for (const emp of employees) {
    const db = emp.dbBalance ?? 0;
    const dg = emp.dgBalance ?? 0;

    if (db <= 0 && dg <= 0) continue;

    const total = db + dg;
    const parts: string[] = [];
    if (dg > 0) parts.push(`${dg} por guardias`);
    if (db > 0) parts.push(`${db} por festivos/horas extra`);

    suggestions.push({
      id: `sm12-dbdg-${emp.id}-${Date.now()}`,
      type: "db_dg_enjoy",
      title: `${emp.name} tiene ${total} dia${total !== 1 ? "s" : ""} debido${total !== 1 ? "s" : ""} pendiente${total !== 1 ? "s" : ""}`,
      description: `El empleado ${emp.name} tiene ${total} dia${total !== 1 ? "s" : ""} debido${total !== 1 ? "s" : ""} (${parts.join(", ")}). Considere programarlos.`,
      actionLabel: "Ver balance",
      data: {
        employeeId: emp.id,
        dbBalance: db,
        dgBalance: dg,
        totalOwed: total,
      },
      createdAt: new Date().toISOString(),
      dismissed: false,
    });
  }

  return suggestions;
}
