/**
 * B7 — Analítica de comportamiento de peticiones
 *
 * Genera reportes de:
 * - Ranking por volumen de peticiones
 * - Tasa de satisfacción por empleado
 * - Patrones detectados (misma petición recurrente)
 * - Tipos de intercambio (tipo C)
 */

import type { PetitionRecord } from "@/hooks/usePetitions";

export interface PetitionAnalyticsReport {
  /** Total peticiones en el período */
  totalPetitions: number;
  /** Por tipo: A, B, C, D */
  byType: Record<string, number>;
  /** Tasa global de aprobación */
  approvalRate: number;
  /** Ranking de empleados por volumen */
  employeeRanking: Array<{
    employeeId: string;
    employeeName: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    satisfactionRate: number; // 0-100
  }>;
  /** Patrones detectados */
  patterns: Array<{
    employeeId: string;
    employeeName: string;
    pattern: string; // e.g. "Siempre pide viernes libre"
    frequency: number; // veces detectado
  }>;
}

export function analyzePetitions(petitions: PetitionRecord[]): PetitionAnalyticsReport {
  const totalPetitions = petitions.length;

  // By type
  const byType: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const p of petitions) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
  }

  // Approval rate
  const decided = petitions.filter((p) => p.status === "approved" || p.status === "rejected");
  const approved = decided.filter((p) => p.status === "approved").length;
  const approvalRate = decided.length > 0 ? Math.round((approved / decided.length) * 100) : 0;

  // Employee ranking
  const empMap = new Map<string, { name: string; total: number; approved: number; rejected: number; pending: number }>();
  for (const p of petitions) {
    const key = p.employee_id;
    if (!empMap.has(key)) {
      empMap.set(key, { name: p.employee_name || "?", total: 0, approved: 0, rejected: 0, pending: 0 });
    }
    const e = empMap.get(key)!;
    e.total++;
    if (p.status === "approved") e.approved++;
    else if (p.status === "rejected") e.rejected++;
    else if (p.status === "pending") e.pending++;
  }

  const employeeRanking = Array.from(empMap.entries())
    .map(([id, d]) => ({
      employeeId: id,
      employeeName: d.name,
      total: d.total,
      approved: d.approved,
      rejected: d.rejected,
      pending: d.pending,
      satisfactionRate: d.approved + d.rejected > 0
        ? Math.round((d.approved / (d.approved + d.rejected)) * 100)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Pattern detection: same days requested multiple times
  const patterns: PetitionAnalyticsReport["patterns"] = [];
  const dayFrequency = new Map<string, Map<number, number>>(); // empId → day → count
  for (const p of petitions) {
    if (!dayFrequency.has(p.employee_id)) dayFrequency.set(p.employee_id, new Map());
    const empDays = dayFrequency.get(p.employee_id)!;
    for (const day of p.days) {
      empDays.set(day, (empDays.get(day) ?? 0) + 1);
    }
  }
  for (const [empId, dayMap] of dayFrequency) {
    const emp = empMap.get(empId);
    for (const [day, count] of dayMap) {
      if (count >= 2) {
        patterns.push({
          employeeId: empId,
          employeeName: emp?.name || "?",
          pattern: `Solicita el día ${day} recurrentemente`,
          frequency: count,
        });
      }
    }
  }

  return {
    totalPetitions,
    byType,
    approvalRate,
    employeeRanking,
    patterns: patterns.sort((a, b) => b.frequency - a.frequency),
  };
}
