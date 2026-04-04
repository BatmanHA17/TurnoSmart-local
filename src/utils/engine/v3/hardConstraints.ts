/**
 * TurnoSmart® — SMART Engine v3.0 — Hard Constraints
 *
 * These constraints MUST be satisfied. If isFeasible returns false,
 * the assignment is not allowed.
 *
 * Maps to OB criteria (Obligatorios).
 */

import type { HardConstraint, SolverState } from "./solverTypes";
import {
  SHIFT_TIMES, WORKING_SHIFTS, ROLE_CONFIGS,
} from "../constants";
import {
  isWorkingShift, violates12hRest, weeklyHours, getWeeks,
  periodDayOfWeekISO,
} from "../helpers";

// ---------------------------------------------------------------------------
// HC-01: 12h rest between shifts (OB-01)
// ---------------------------------------------------------------------------
export const hc12hRest: HardConstraint = {
  id: "HC_12H_REST",
  name: "Descanso 12h entre jornadas",
  isFeasible(state, empId, day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return true;
    const schedule = state.grid[empId];
    // Check previous day
    if (day > 1) {
      const prev = schedule[day - 1];
      if (prev && isWorkingShift(prev.code)) {
        if (violates12hRest(prev.code, shiftCode)) return false;
      }
    }
    // Check next day (if already assigned)
    if (day < state.input.period.totalDays) {
      const next = schedule[day + 1];
      if (next && isWorkingShift(next.code) && next.locked) {
        if (violates12hRest(shiftCode, next.code)) return false;
      }
    }
    return true;
  },
};

// ---------------------------------------------------------------------------
// HC-02: Night → next day free (OB-03) — only ROTA_COMPLETO
// ---------------------------------------------------------------------------
export const hcNightThenRest: HardConstraint = {
  id: "HC_NIGHT_REST",
  name: "Noche → día siguiente libre",
  isFeasible(state, empId, day, shiftCode) {
    const emp = state.employees.get(empId);
    if (!emp || emp.rotationType === "FIJO_NO_ROTA") return true; // Night Agent exempt

    const schedule = state.grid[empId];

    // If assigning N: check that next day is not a working locked shift
    if (shiftCode === "N" && day < state.input.period.totalDays) {
      const next = schedule[day + 1];
      if (next && next.locked && isWorkingShift(next.code)) return false;
    }

    // If assigning a working shift: check that previous day was not N
    if (isWorkingShift(shiftCode) && shiftCode !== "N" && day > 1) {
      const prev = schedule[day - 1];
      if (prev && prev.code === "N") return false;
    }

    return true;
  },
};

// ---------------------------------------------------------------------------
// HC-03: Max weekly hours (OB-04)
// ---------------------------------------------------------------------------
export const hcMaxWeeklyHours: HardConstraint = {
  id: "HC_MAX_WEEKLY_HOURS",
  name: "Máximo 40h semanales",
  isFeasible(state, empId, day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return true;
    const schedule = state.grid[empId];
    const weeks = getWeeks(state.input.period.totalDays);
    const weekIdx = Math.floor((day - 1) / 7);
    const week = weeks[weekIdx];
    if (!week) return true;

    const shiftInfo = SHIFT_TIMES[shiftCode];
    const addHours = shiftInfo?.hours ?? 8;
    const currentHours = weeklyHours(schedule, week);
    const maxH = state.input.constraints.law.maxWeeklyHours;

    return (currentHours + addHours) <= maxH;
  },
};

// ---------------------------------------------------------------------------
// HC-04: Locked cells cannot be overwritten
// ---------------------------------------------------------------------------
export const hcLockedCells: HardConstraint = {
  id: "HC_LOCKED",
  name: "Celdas bloqueadas",
  isFeasible(state, empId, day, _shiftCode) {
    const cell = state.grid[empId]?.[day];
    return !cell?.locked;
  },
};

// ---------------------------------------------------------------------------
// HC-05: Role-allowed shifts (OB-10, OB-11)
// ---------------------------------------------------------------------------
export const hcRoleAllowedShifts: HardConstraint = {
  id: "HC_ROLE_SHIFTS",
  name: "Turno permitido por rol",
  isFeasible(state, empId, _day, shiftCode) {
    const emp = state.employees.get(empId);
    if (!emp) return false;
    const config = ROLE_CONFIGS[emp.role];
    if (!config) return true;
    // D is always allowed (rest)
    if (shiftCode === "D") return true;
    return config.allowedShifts.includes(shiftCode as any);
  },
};

// ---------------------------------------------------------------------------
// HC-06: Absences are immovable (V, E, PM, PC, etc.)
// ---------------------------------------------------------------------------
export const hcAbsenceImmovable: HardConstraint = {
  id: "HC_ABSENCE",
  name: "Ausencias no modificables",
  isFeasible(state, empId, day, shiftCode) {
    const cell = state.grid[empId]?.[day];
    if (!cell) return true;
    const absenceCodes = new Set(["V", "E", "PM", "PC", "DB", "DG", "F"]);
    // If cell has an absence that's locked, can't change it
    if (absenceCodes.has(cell.code) && cell.locked) {
      return shiftCode === cell.code; // only same code allowed
    }
    return true;
  },
};

// ---------------------------------------------------------------------------
// HC-07: Petition type A (hard petitions) must be respected
// ---------------------------------------------------------------------------
export const hcHardPetitions: HardConstraint = {
  id: "HC_HARD_PETITIONS",
  name: "Peticiones duras respetadas",
  isFeasible(state, empId, day, shiftCode) {
    const emp = state.employees.get(empId);
    if (!emp) return true;
    for (const p of emp.petitions) {
      if (p.type !== "A" || p.status === "rejected") continue;
      if (!p.days.includes(day)) continue;
      // If petition requests a specific shift, only that shift is allowed
      if (p.requestedShift && shiftCode !== p.requestedShift) return false;
      // If petition avoids a shift, that shift is not allowed
      if (p.avoidShift && shiftCode === p.avoidShift) return false;
    }
    return true;
  },
};

// ---------------------------------------------------------------------------
// HC-08: Guard only for FOM (OB-10)
// ---------------------------------------------------------------------------
export const hcGuardOnlyChief: HardConstraint = {
  id: "HC_GUARD_CHIEF",
  name: "Guardia solo FOM",
  isFeasible(state, empId, _day, shiftCode) {
    if (shiftCode !== "G" && shiftCode !== "GT") return true;
    const emp = state.employees.get(empId);
    return emp?.role === "FOM";
  },
};

// ---------------------------------------------------------------------------
// ALL HARD CONSTRAINTS
// ---------------------------------------------------------------------------
export const ALL_HARD_CONSTRAINTS: HardConstraint[] = [
  hcLockedCells,
  hcAbsenceImmovable,
  hc12hRest,
  hcNightThenRest,
  hcMaxWeeklyHours,
  hcRoleAllowedShifts,
  hcHardPetitions,
  hcGuardOnlyChief,
];
