/**
 * Phase 05 — assignGEX
 *
 * Asigna turnos al GEX (Guest Experience Agent) según ocupación.
 * - ROTA_PARCIAL: solo turnos 9×17 o 12×20 (no entra en M/T/N)
 * - Si hay datos de ocupación:
 *   - Peak mañana (muchos check-outs): 9×17
 *   - Peak tarde (muchos check-ins): 12×20
 * - Si no hay datos: alterna 9×17 y 12×20 por equidad
 * - 11×19 como transición si la secuencia lo requiere
 */

import type { PipelineContext, EngineEmployee, DailyOccupancy } from "../types";
import { makeAssignment, isRestOrAbsence } from "../helpers";

export function assignGEX(ctx: PipelineContext): PipelineContext {
  const { grid, roleGroups, input } = ctx;
  const { period, occupancy } = input;
  const totalDays = period.totalDays;

  const gexEmployees = roleGroups.ROTA_PARCIAL;
  if (gexEmployees.length === 0) return ctx;

  // Indexar ocupación por día
  const occupancyByDay = new Map<number, DailyOccupancy>();
  for (const occ of occupancy) {
    occupancyByDay.set(occ.day, occ);
  }

  for (const gex of gexEmployees) {
    if (gex.isNewHire && gex.startDay && gex.startDay > totalDays) continue;

    let alternateCounter = 0; // para alternar cuando no hay datos de ocupación

    for (let d = 1; d <= totalDays; d++) {
      // Skip si ya tiene asignación (ausencia, libre, petición A)
      if (grid[gex.id][d]?.locked) continue;
      if (isRestOrAbsence(grid[gex.id][d]?.code) && grid[gex.id][d]?.source !== "engine") continue;
      if (gex.isNewHire && gex.startDay && d < gex.startDay) continue;

      // Es día libre asignado por Phase 04 → respetar
      if (grid[gex.id][d]?.code === "D" && grid[gex.id][d]?.source === "engine") {
        // Verificar si Phase 04 asignó este como descanso real
        // Si el grid viene de initGrid (default D) y no fue tocado por Phase 04,
        // lo consideramos disponible para asignar.
        // Heurística: si es D con source=engine, Phase 04 lo puso → respetar
        continue;
      }

      // Determinar turno según ocupación
      const occ = occupancyByDay.get(d);
      let shiftCode: string;

      if (occ) {
        // Con datos de ocupación:
        // Más check-outs que check-ins → peak mañana → 9×17
        // Más check-ins → peak tarde → 12×20
        if (occ.checkOuts >= occ.checkIns) {
          shiftCode = "9x17";
        } else {
          shiftCode = "12x20";
        }
      } else {
        // Sin datos: alternar para equidad
        shiftCode = alternateCounter % 2 === 0 ? "9x17" : "12x20";
        alternateCounter++;
      }

      grid[gex.id][d] = makeAssignment(shiftCode, "engine");
    }
  }

  return { ...ctx, grid };
}
