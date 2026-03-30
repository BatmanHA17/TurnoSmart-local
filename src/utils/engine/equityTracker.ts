/**
 * TurnoSmart® — SMART Engine v2.0 — Equity Tracker
 *
 * Calcula el balance de equidad de un cuadrante generado.
 * Se usa para:
 * 1. Guardar snapshot tras publicar → input para el siguiente período
 * 2. Mostrar badges de equidad por empleado en la UI
 * 3. Detectar desequilibrios para alertas
 */

import type {
  EquityBalance,
  DayAssignmentV2,
  EngineEmployee,
} from "./types";
import { isWorkingShift, isWeekend } from "./helpers";

// ---------------------------------------------------------------------------
// SNAPSHOT: Calcular equity de un cuadrante generado
// ---------------------------------------------------------------------------

/**
 * Calcula el balance de equidad para todos los empleados
 * a partir de un cuadrante generado.
 *
 * @param schedules Grid generado: employeeId → day → assignment
 * @param employees Lista de empleados
 * @param totalDays Total de días en el período
 * @param year Año del período
 * @param month Mes del período
 * @param previousEquity Balance previo (se suma)
 */
export function calculateEquitySnapshot(
  schedules: Record<string, Record<number, DayAssignmentV2>>,
  employees: EngineEmployee[],
  totalDays: number,
  year: number,
  month: number,
  previousEquity?: Record<string, EquityBalance>
): Record<string, EquityBalance> {
  const result: Record<string, EquityBalance> = {};

  for (const emp of employees) {
    const schedule = schedules[emp.id];
    if (!schedule) continue;

    // Empezar desde el balance previo si existe
    const prev = previousEquity?.[emp.id];
    const balance: EquityBalance = {
      morningCount: prev?.morningCount ?? 0,
      afternoonCount: prev?.afternoonCount ?? 0,
      nightCount: prev?.nightCount ?? 0,
      weekendWorkedCount: prev?.weekendWorkedCount ?? 0,
      longWeekendCount: prev?.longWeekendCount ?? 0,
      holidayWorkedCount: prev?.holidayWorkedCount ?? 0,
      petitionSatisfactionRatio: prev?.petitionSatisfactionRatio ?? 0,
      nightCoverageCount: prev?.nightCoverageCount ?? 0,
    };

    // Contar por tipo de turno
    for (let d = 1; d <= totalDays; d++) {
      const assignment = schedule[d];
      if (!assignment) continue;

      const code = assignment.code;

      // Contadores M/T/N
      if (code === "M" || code === "11x19" || code === "9x17") balance.morningCount++;
      else if (code === "T" || code === "12x20" || code === "GT") balance.afternoonCount++;
      else if (code === "N") balance.nightCount++;

      // FDS trabajados
      if (isWorkingShift(code) && isWeekend(year, month, d)) {
        balance.weekendWorkedCount++;
      }

      // Festivos trabajados
      if (code === "F") balance.holidayWorkedCount++;
    }

    // Peticiones satisfechas
    const totalPetitions = emp.petitions.filter((p) => p.type === "B" && p.status === "approved").length;
    if (totalPetitions > 0) {
      let satisfied = 0;
      for (const pet of emp.petitions) {
        if (pet.type !== "B" || pet.status !== "approved") continue;
        for (const day of pet.days) {
          if (schedule[day]?.code === pet.requestedShift) satisfied++;
        }
      }
      balance.petitionSatisfactionRatio = satisfied / totalPetitions;
    }

    result[emp.id] = balance;
  }

  return result;
}

// ---------------------------------------------------------------------------
// DEVIATION: Calcular desviación de equidad entre empleados
// ---------------------------------------------------------------------------

export interface EquityDeviation {
  employeeId: string;
  employeeName: string;
  morningDev: number;    // desviación respecto a la media
  afternoonDev: number;
  nightDev: number;
  weekendDev: number;
  maxDeviation: number;  // la mayor de todas
  /** "balanced" si ±3 | "warning" si >3 | "critical" si >5 */
  status: "balanced" | "warning" | "critical";
}

/**
 * Calcula la desviación de equidad M/T/N/FDS para empleados ROTA_COMPLETO.
 * Solo compara entre empleados del mismo tipo de rotación.
 */
export function calculateEquityDeviations(
  equitySnapshot: Record<string, EquityBalance>,
  employees: EngineEmployee[]
): EquityDeviation[] {
  // Solo empleados con rotación completa
  const rotating = employees.filter((e) => e.rotationType === "ROTA_COMPLETO");
  if (rotating.length === 0) return [];

  // Calcular medias
  let sumM = 0, sumT = 0, sumN = 0, sumW = 0;
  for (const emp of rotating) {
    const eq = equitySnapshot[emp.id];
    if (!eq) continue;
    sumM += eq.morningCount;
    sumT += eq.afternoonCount;
    sumN += eq.nightCount;
    sumW += eq.weekendWorkedCount;
  }
  const count = rotating.length;
  const avgM = sumM / count;
  const avgT = sumT / count;
  const avgN = sumN / count;
  const avgW = sumW / count;

  // Calcular desviación por empleado
  return rotating.map((emp) => {
    const eq = equitySnapshot[emp.id];
    if (!eq) {
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        morningDev: 0,
        afternoonDev: 0,
        nightDev: 0,
        weekendDev: 0,
        maxDeviation: 0,
        status: "balanced" as const,
      };
    }

    const morningDev = eq.morningCount - avgM;
    const afternoonDev = eq.afternoonCount - avgT;
    const nightDev = eq.nightCount - avgN;
    const weekendDev = eq.weekendWorkedCount - avgW;
    const maxDeviation = Math.max(
      Math.abs(morningDev),
      Math.abs(afternoonDev),
      Math.abs(nightDev),
      Math.abs(weekendDev)
    );

    const status: EquityDeviation["status"] =
      maxDeviation > 5 ? "critical" :
      maxDeviation > 3 ? "warning" :
      "balanced";

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      morningDev: Math.round(morningDev * 10) / 10,
      afternoonDev: Math.round(afternoonDev * 10) / 10,
      nightDev: Math.round(nightDev * 10) / 10,
      weekendDev: Math.round(weekendDev * 10) / 10,
      maxDeviation: Math.round(maxDeviation * 10) / 10,
      status,
    };
  });
}

// ---------------------------------------------------------------------------
// LAST WEEK: Extraer últimos 7 días para continuidad
// ---------------------------------------------------------------------------

/**
 * Extrae los últimos 7 días del cuadrante generado para usar como
 * historial en la siguiente generación.
 */
export function extractLastWeek(
  schedules: Record<string, Record<number, DayAssignmentV2>>,
  totalDays: number
): Record<string, DayAssignmentV2[]> {
  const result: Record<string, DayAssignmentV2[]> = {};
  const startDay = Math.max(1, totalDays - 6);

  for (const [empId, schedule] of Object.entries(schedules)) {
    result[empId] = [];
    for (let d = startDay; d <= totalDays; d++) {
      if (schedule[d]) {
        result[empId].push(schedule[d]);
      }
    }
  }

  return result;
}
