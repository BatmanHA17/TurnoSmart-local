/**
 * Phase 03 — anchorFixed
 *
 * Fija en el grid los turnos que no se calculan:
 * 1. Ausencias pre-aprobadas (V, E, PM, PC, DB, DG) para todos
 * 2. Peticiones tipo A (duras) → se respetan al 100%
 * 3. FOM → M de lunes a viernes + D locked en S+D (siempre libra fin de semana)
 *    Los S+D quedan VACÍOS (sin turno) para que el director añada G/GT manualmente
 * 4. AFOM → espejo del FOM:
 *    FOM=M → AFOM=T | FOM=D(fin semana) → AFOM cubre (M o T)
 *    FOM=G/GT → AFOM libra (su FDS largo ideal)
 *    Solo FOM hace G/GT (Guardias/Duties), NUNCA AFOM
 * 5. Night Shift Agent → N todos los días laborables
 */

import type { PipelineContext, EngineEmployee, ShiftCode } from "../types";
import { FOM_AFOM_MIRROR } from "../constants";
import { makeAssignment, isWorkingShift, isPeriodWeekend, isPeriodSaturday, isPeriodSunday } from "../helpers";

export function anchorFixed(ctx: PipelineContext): PipelineContext {
  const { grid, roleGroups, input } = ctx;
  const totalDays = input.period.totalDays;
  const startDate = input.period.startDate; // used to map period day → real calendar date

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
        if (grid[emp.id][day].locked) continue;
        const code = petition.requestedShift ?? "D";
        grid[emp.id][day] = makeAssignment(code as ShiftCode, "petition_a");
        grid[emp.id][day].locked = true;
      }
    }
  }

  // --- 3. Anclar FOM ---
  // L-V: turno fijo (M por defecto)
  // S+D sin guardia: D locked (FOM libra)
  // S+D con guardia (fomGuardiaDays): G (sábado) o GT (domingo)
  //   → Phase 04 asignará 2 libres entre semana para esas semanas
  const guardiaDays = new Set(input.fomGuardiaDays ?? []);

  for (const fom of roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "FOM")) {
    const fixedShift = fom.fixedShift ?? "M";
    for (let d = 1; d <= totalDays; d++) {
      if (grid[fom.id][d].locked) continue; // ausencia/petición A ya anclada
      if (fom.isNewHire && fom.startDay && d < fom.startDay) continue;

      if (isPeriodWeekend(startDate, d)) {
        if (guardiaDays.has(d)) {
          // FOM tiene guardia este día → siempre G (tanto sábado como domingo)
          grid[fom.id][d] = makeAssignment("G", "engine");
          // C7: Acumular DG en lugar de auto-asignar libre entre semana
          // El FOM colocará los DG manualmente cuando quiera
          ctx.dgAccumulated[fom.id] = (ctx.dgAccumulated[fom.id] ?? 0) + 1;
        } else {
          // FOM libra este S/D — D locked
          grid[fom.id][d] = makeAssignment("D", "engine");
          grid[fom.id][d].locked = true;
        }
      } else {
        // L-V: turno fijo (M)
        grid[fom.id][d] = makeAssignment(fixedShift, "engine");
      }
    }
  }

  // --- 4. Anclar AFOM (espejo del FOM) ---
  // FOM=M(L-V) → AFOM=T
  // FOM=D(S+D) → AFOM cubre (M por defecto, o T según necesidad)
  // FOM=G/GT   → AFOM libra (FDS largo ideal para AFOM)
  // AFOM NUNCA hace G/GT
  const fomEmployees = roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "FOM");
  for (const afom of roleGroups.COBERTURA.filter((e) => e.role === "AFOM")) {
    if (afom.isNewHire && afom.startDay && afom.startDay > totalDays) continue;

    for (let d = 1; d <= totalDays; d++) {
      if (grid[afom.id][d].locked) continue;
      if (afom.isNewHire && afom.startDay && d < afom.startDay) continue;

      // Buscar qué hace el FOM este día
      let fomCode: string = "M";
      for (const fom of fomEmployees) {
        fomCode = grid[fom.id][d]?.code ?? "M";
      }

      if (fomCode === "G") {
        // FOM en guardia → AFOM libra (su FDS largo ideal)
        grid[afom.id][d] = makeAssignment("D", "engine");
      } else if (fomCode === "D" || fomCode === "V" || fomCode === "E") {
        // FOM libre/vacaciones/baja → AFOM cubre
        // En fines de semana cuando FOM libra, AFOM trabaja (M por defecto)
        grid[afom.id][d] = makeAssignment("M", "engine");
      } else {
        // FOM trabaja (M o T) → AFOM en espejo
        const mirrorCode = FOM_AFOM_MIRROR[fomCode] ?? "T";
        grid[afom.id][d] = makeAssignment(mirrorCode, "engine");
      }
    }
  }

  // --- 5. Night Shift Agent ---
  // Assign N to ALL days (not locked). Phase 04 will overwrite 2 of them
  // with locked D (rest). lockSurvivingFixedShifts then locks the remaining N.
  // This ensures Night Agent's N shifts are explicit in the grid from the start,
  // rather than relying on Phase 07's coverage mechanism to fill them retroactively.
  for (const na of roleGroups.FIJO_NO_ROTA.filter((e) => e.role === "NIGHT_SHIFT_AGENT")) {
    for (let d = 1; d <= totalDays; d++) {
      if (grid[na.id][d].locked) continue; // ausencia/petición A ya anclada
      if (na.isNewHire && na.startDay && d < na.startDay) continue;
      grid[na.id][d] = makeAssignment("N", "engine");
      // NOT locked: Phase 04 needs to be able to pick 2 days as rest
    }
  }

  return { ...ctx, grid };
}
