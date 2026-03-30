/**
 * Phase 03 — anchorFixed
 *
 * Fija en el grid los turnos que no se calculan:
 * 1. FOM → turno fijo (M, T, G, GT) según configuración del período
 * 2. AFOM → espejo del FOM (FOM=M→AFOM=T, FOM=T→AFOM=M, etc.)
 * 3. Night Shift Agent → N todos los días laborables
 * 4. Ausencias pre-aprobadas (V, E, PM, PC, DB, DG) para todos
 * 5. Peticiones tipo A (duras) → se respetan al 100%
 */

import type { PipelineContext, EngineEmployee, ShiftCode } from "../types";
import { FOM_AFOM_MIRROR } from "../constants";
import { makeAssignment, isWorkingShift } from "../helpers";

export function anchorFixed(ctx: PipelineContext): PipelineContext {
  const { grid, roleGroups, input } = ctx;
  const totalDays = input.period.totalDays;

  // --- 1. Anclar ausencias pre-aprobadas para TODOS ---
  for (const emp of input.employees) {
    for (const absence of emp.absences) {
      if (absence.day >= 1 && absence.day <= totalDays) {
        grid[emp.id][absence.day] = makeAssignment(absence.code as ShiftCode, "petition_a");
        grid[emp.id][absence.day].locked = true;
      }
    }
  }

  // --- 2. Anclar peticiones tipo A (duras) ---
  for (const emp of input.employees) {
    for (const petition of emp.petitions) {
      if (petition.type !== "A" || petition.status !== "approved") continue;
      for (const day of petition.days) {
        if (day < 1 || day > totalDays) continue;
        if (grid[emp.id][day].locked) continue; // ausencia ya anclada tiene prioridad
        const code = petition.requestedShift ?? "D";
        grid[emp.id][day] = makeAssignment(code as ShiftCode, "petition_a");
        grid[emp.id][day].locked = true;
      }
    }
  }

  // --- 3. Anclar FOM (turno fijo) ---
  for (const fom of roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "FOM")) {
    const fixedShift = fom.fixedShift ?? "M";
    for (let d = 1; d <= totalDays; d++) {
      if (grid[fom.id][d].locked) continue; // ausencia/petición A ya anclada
      // Si es nueva incorporación y aún no empezó, skip
      if (fom.isNewHire && fom.startDay && d < fom.startDay) continue;
      grid[fom.id][d] = makeAssignment(fixedShift, "engine");
    }
  }

  // --- 4. Anclar AFOM (espejo del FOM) ---
  const fomEmployees = roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "FOM");
  for (const afom of roleGroups.COBERTURA.filter((e) => e.role === "AFOM")) {
    if (afom.isNewHire && afom.startDay && afom.startDay > totalDays) continue;

    for (let d = 1; d <= totalDays; d++) {
      if (grid[afom.id][d].locked) continue;
      if (afom.isNewHire && afom.startDay && d < afom.startDay) continue;

      // Buscar qué hace el FOM este día
      let mirrorCode: ShiftCode = "M"; // default si no hay FOM
      for (const fom of fomEmployees) {
        const fomCode = grid[fom.id][d]?.code;
        if (fomCode && FOM_AFOM_MIRROR[fomCode]) {
          mirrorCode = FOM_AFOM_MIRROR[fomCode];
        }
      }

      grid[afom.id][d] = makeAssignment(mirrorCode, "engine");
    }
  }

  // --- 5. Anclar Night Shift Agent (noche fija) ---
  for (const nightAgent of roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "NIGHT_SHIFT_AGENT")) {
    for (let d = 1; d <= totalDays; d++) {
      if (grid[nightAgent.id][d].locked) continue;
      if (nightAgent.isNewHire && nightAgent.startDay && d < nightAgent.startDay) continue;
      grid[nightAgent.id][d] = makeAssignment("N", "engine");
    }
  }

  return { ...ctx, grid };
}
