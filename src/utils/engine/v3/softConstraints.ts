/**
 * TurnoSmart® — SMART Engine v3.0 — Soft Constraints
 *
 * These score candidate assignments. Higher = better.
 * Used by constructive heuristic to pick the best shift for each cell,
 * and by local search to evaluate swap quality.
 *
 * Maps to OP criteria (Opcionales).
 */

import type { SoftConstraint, SolverState, MutableEquity } from "./solverTypes";
import type { OptionalCriteria } from "../types";
import {
  SHIFT_UNDESIRABILITY, ERGONOMIC_SEQUENCE, FOM_AFOM_MIRROR,
} from "../constants";
import {
  isWorkingShift, periodDayOfWeekISO, violates12hRest,
} from "../helpers";
import { countCoverageOnDay, shiftToCoverageCategory } from "./coverageHelper";

// ---------------------------------------------------------------------------
// Mapping: soft constraint ID → criteria catalog key (from schedule_criteria)
// ---------------------------------------------------------------------------
export const SC_TO_CRITERIA_KEY: Record<string, string> = {
  "SC_ERGONOMIC":      "ERGONOMIC_ROTATION",
  "SC_EQUITY_MTN":     "SHIFT_EQUITY_MTN",
  "SC_COVERAGE":       "MIN_COVERAGE",
  "SC_WEEKEND_EQUITY": "WEEKEND_EQUITY",
  "SC_PETITIONS":      "SOFT_PETITIONS",
  "SC_MIRROR":         "FOM_AFOM_MIRROR",
  "SC_NIGHT_COVER":    "NIGHT_COVER_EQUITY",
  "SC_UNDESIRABILITY": "UNDESIRABILITY_WEIGHT",
  "SC_STAGGER_REST":   "ROTATING_REST_DAYS",
};

/**
 * Apply criteria boost values from the database to soft constraints.
 *
 * Boost range is 1-3:
 *   boost=1 → 0.5× weight (de-emphasize)
 *   boost=2 → 1.0× weight (neutral, default)
 *   boost=3 → 1.5× weight (emphasize)
 *
 * If a criterion is found but disabled → weight = 0.
 * If a criterion is not found in optionalCriteria → keep original weight.
 */
export function applyCriteriaBoost(
  softConstraints: SoftConstraint[],
  optionalCriteria: OptionalCriteria[],
): SoftConstraint[] {
  if (!optionalCriteria || optionalCriteria.length === 0) return softConstraints;

  // Build a lookup by criteria key for O(1) access
  const criteriaByKey = new Map<string, OptionalCriteria>();
  for (const oc of optionalCriteria) {
    criteriaByKey.set(oc.id, oc);
  }

  return softConstraints.map((sc) => {
    const criteriaKey = SC_TO_CRITERIA_KEY[sc.id];
    if (!criteriaKey) return sc; // no mapping → keep as-is

    const criterion = criteriaByKey.get(criteriaKey);
    if (!criterion) return sc; // not in optionalCriteria → keep as-is

    if (!criterion.enabled) {
      // Criterion disabled → zero weight
      return { ...sc, weight: 0 };
    }

    // Apply boost: boost/2 gives 0.5× for 1, 1× for 2, 1.5× for 3
    const multiplier = criterion.boost / 2;
    return { ...sc, weight: sc.weight * multiplier };
  });
}

// ---------------------------------------------------------------------------
// SC-01: Ergonomic rotation M→T→N (OP-02)
// ---------------------------------------------------------------------------
export const scErgonomicRotation: SoftConstraint = {
  id: "SC_ERGONOMIC",
  name: "Rotación ergonómica",
  weight: 1,
  score(state, empId, day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return 0;
    const emp = state.employees.get(empId);
    if (!emp || emp.rotationType !== "ROTA_COMPLETO") return 0;

    const schedule = state.grid[empId];
    // Find the last working shift before this day
    let prevCode: string | null = null;
    for (let d = day - 1; d >= 1; d--) {
      const c = schedule[d]?.code;
      if (c && isWorkingShift(c) && (c === "M" || c === "T" || c === "N")) {
        prevCode = c;
        break;
      }
    }
    if (!prevCode) return 0;

    const seq = ERGONOMIC_SEQUENCE;
    const prevIdx = seq.indexOf(prevCode as any);
    const curIdx = seq.indexOf(shiftCode as any);
    if (prevIdx < 0 || curIdx < 0) return 0;

    // Forward: M→T (+10), T→N (+10), same shift (+5), backward: penalty
    if (curIdx === (prevIdx + 1) % 3) return 10; // forward
    if (curIdx === prevIdx) return 5; // same
    return -15; // backward (N→M is very bad ergonomically)
  },
};

// ---------------------------------------------------------------------------
// SC-02: Shift equity M/T/N (OP-05)
// ---------------------------------------------------------------------------
export const scShiftEquity: SoftConstraint = {
  id: "SC_EQUITY_MTN",
  name: "Equidad M/T/N",
  weight: 1,
  score(state, empId, _day, shiftCode) {
    if (shiftCode !== "M" && shiftCode !== "T" && shiftCode !== "N") return 0;
    const emp = state.employees.get(empId);
    if (!emp || emp.rotationType !== "ROTA_COMPLETO") return 0;

    const eq = state.equity.get(empId);
    if (!eq) return 0;

    // Score: prefer the shift type the employee has done LEAST
    const counts = { M: eq.M, T: eq.T, N: eq.N };
    const min = Math.min(counts.M, counts.T, counts.N);
    const current = counts[shiftCode as "M" | "T" | "N"];

    // If this shift is the one they've done least → big bonus
    if (current === min) return 15;
    // If they've done more of this than average → penalty
    const avg = (counts.M + counts.T + counts.N) / 3;
    return Math.round((avg - current) * 3);
  },
};

// ---------------------------------------------------------------------------
// SC-03: Coverage bonus (OB-08 soft layer)
// ---------------------------------------------------------------------------
export const scCoverageBonus: SoftConstraint = {
  id: "SC_COVERAGE",
  name: "Cobertura",
  weight: 1.5,
  score(state, _empId, day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return 0;
    const coverageShift = shiftToCoverageCategory(shiftCode);
    if (!coverageShift) return 0;

    const minCov = state.input.constraints.minCoveragePerShift;
    const needed = minCov[coverageShift] ?? 1;
    const current = countCoverageOnDay(state.grid, day, coverageShift);

    // Under minimum → strong bonus
    if (current < needed) return 25;
    // At minimum → neutral for N (night rotation handles it), small bonus for M/T
    if (current === needed) return coverageShift === "N" ? 0 : 5;
    // Over minimum → penalty (stronger for N to protect seniority rotation)
    return coverageShift === "N" ? -25 : -2;
  },
};

// ---------------------------------------------------------------------------
// SC-04: Weekend equity (OP-04)
// ---------------------------------------------------------------------------
export const scWeekendEquity: SoftConstraint = {
  id: "SC_WEEKEND_EQUITY",
  name: "Equidad FDS",
  weight: 1,
  score(state, empId, day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return 0;
    const dow = periodDayOfWeekISO(state.input.period.startDate, day);
    if (dow !== 5 && dow !== 6) return 0; // not weekend

    const emp = state.employees.get(empId);
    if (!emp || emp.rotationType === "FIJO_NO_ROTA") return 0;

    const eq = state.equity.get(empId);
    if (!eq) return 0;

    // Employee with fewer weekends worked gets a bonus for working this weekend
    // Employee with more weekends worked gets a penalty
    const allEq = Array.from(state.equity.values());
    const avgWe = allEq.reduce((s, e) => s + e.weekendWorked, 0) / allEq.length;
    const diff = eq.weekendWorked - avgWe;

    return Math.round(-diff * 5); // negative diff (less than avg) → positive score
  },
};

// ---------------------------------------------------------------------------
// SC-05: Soft petitions (OP-14)
// ---------------------------------------------------------------------------
export const scSoftPetitions: SoftConstraint = {
  id: "SC_PETITIONS",
  name: "Peticiones blandas",
  weight: 2,
  score(state, empId, day, shiftCode) {
    const emp = state.employees.get(empId);
    if (!emp) return 0;

    let bonus = 0;
    for (const p of emp.petitions) {
      if (p.type !== "B" || p.status === "rejected") continue;
      if (!p.days.includes(day)) continue;
      // Requested shift matches
      if (p.requestedShift && shiftCode === p.requestedShift) {
        bonus += 20 * (6 - p.priority); // priority 1=most important
      }
      // Avoid shift matches → penalty
      if (p.avoidShift && shiftCode === p.avoidShift) {
        bonus -= 15 * (6 - p.priority);
      }
    }

    // Look-ahead: penalize shifts that would block a petition on the next day.
    // T→M violates 12h rest, N forces rest day — detect all such conflicts.
    if (isWorkingShift(shiftCode) && emp.rotationType === "ROTA_COMPLETO") {
      const nextDay = day + 1;
      for (const p of emp.petitions) {
        if (p.type !== "B" || p.status === "rejected") continue;
        if (!p.days.includes(nextDay)) continue;
        if (!p.requestedShift) continue;
        // N forces rest → any non-D petition is blocked
        if (shiftCode === "N" && p.requestedShift !== "D") {
          bonus -= 40 * (6 - p.priority);
        }
        // Any shift that violates 12h rest with tomorrow's petition
        else if (p.requestedShift !== "D" && violates12hRest(shiftCode, p.requestedShift)) {
          bonus -= 40 * (6 - p.priority);
        }
      }
    }

    return bonus;
  },
};

// ---------------------------------------------------------------------------
// SC-06: FOM↔AFOM mirror (OB-16 soft layer)
// ---------------------------------------------------------------------------
export const scFomAfomMirror: SoftConstraint = {
  id: "SC_MIRROR",
  name: "Espejo FOM-AFOM",
  weight: 2,
  score(state, empId, day, shiftCode) {
    const emp = state.employees.get(empId);
    if (!emp || emp.role !== "AFOM") return 0;

    // Find FOM
    const fom = Array.from(state.employees.values()).find(e => e.role === "FOM");
    if (!fom) return 0;
    const fomCell = state.grid[fom.id]?.[day];
    if (!fomCell) return 0;

    const expected = FOM_AFOM_MIRROR[fomCell.code];
    if (!expected) return 0;

    return shiftCode === expected ? 30 : -20;
  },
};

// ---------------------------------------------------------------------------
// SC-07: Night coverage equity (OP-08)
// ---------------------------------------------------------------------------
export const scNightCoverageEquity: SoftConstraint = {
  id: "SC_NIGHT_COVER",
  name: "Equidad cobertura nocturna",
  weight: 1,
  score(state, empId, day, shiftCode) {
    if (shiftCode !== "N") return 0;
    const emp = state.employees.get(empId);
    if (!emp || emp.rotationType !== "ROTA_COMPLETO") return 0;

    // Check if this is a night that needs coverage (Night Agent is resting)
    const nightAgent = Array.from(state.employees.values()).find(
      e => e.role === "NIGHT_SHIFT_AGENT"
    );
    if (!nightAgent) return 0;
    const naCell = state.grid[nightAgent.id]?.[day];
    if (!naCell || naCell.code !== "D") return 0; // Night agent is working → no coverage needed

    // Prefer the FDA with fewest night coverage assignments
    const eq = state.equity.get(empId);
    if (!eq) return 0;

    const fdaEquities = Array.from(state.employees.entries())
      .filter(([, e]) => e.rotationType === "ROTA_COMPLETO")
      .map(([id]) => state.equity.get(id)?.nightCoverage ?? 0);
    const minCov = Math.min(...fdaEquities);

    return eq.nightCoverage === minCov ? 20 : -5;
  },
};

// ---------------------------------------------------------------------------
// SC-08: Undesirability weight equity (OP-09)
// ---------------------------------------------------------------------------
export const scUndesirabilityEquity: SoftConstraint = {
  id: "SC_UNDESIRABILITY",
  name: "Equidad carga ponderada",
  weight: 0.5,
  score(_state, _empId, _day, shiftCode) {
    if (!isWorkingShift(shiftCode)) return 0;
    const weight = SHIFT_UNDESIRABILITY[shiftCode] ?? 1;
    // Prefer lower-weight shifts slightly (M > T > N)
    return Math.round((3 - weight) * 2);
  },
};

// ---------------------------------------------------------------------------
// SC-09: Rest day staggering (avoid everyone resting same day)
// ---------------------------------------------------------------------------
export const scRestStaggering: SoftConstraint = {
  id: "SC_STAGGER_REST",
  name: "Escalonar descansos",
  weight: 1,
  score(state, empId, day, shiftCode) {
    if (shiftCode !== "D") return 0;
    // Count how many others rest on this day
    let restCount = 0;
    for (const [id, schedule] of Object.entries(state.grid)) {
      if (id === empId) continue;
      if (schedule[day]?.code === "D") restCount++;
    }
    // Penalty per overlap
    return -restCount * 8;
  },
};

// ---------------------------------------------------------------------------
// ALL SOFT CONSTRAINTS
// ---------------------------------------------------------------------------
export const ALL_SOFT_CONSTRAINTS: SoftConstraint[] = [
  scErgonomicRotation,
  scShiftEquity,
  scCoverageBonus,
  scWeekendEquity,
  scSoftPetitions,
  scFomAfomMirror,
  scNightCoverageEquity,
  scUndesirabilityEquity,
  scRestStaggering,
];
