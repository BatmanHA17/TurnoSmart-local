/**
 * auditFixSuggester — Maps engine AuditViolations to actionable SuggestedFix
 *
 * Each engine violation rule gets a concrete fix suggestion:
 * - 12H_REST (T→M): Change M → 11x19 transition
 * - MIN_COVERAGE: Assign available FDA to empty shift
 * - CONSECUTIVE_REST: Move one rest day adjacent to the other
 * - NIGHT_THEN_REST: Add D after N
 * - MAX_CONSECUTIVE_NIGHTS: Insert D to break the streak
 * - EQUITY_DEVIATION: Swap shifts between over/under employees
 *
 * The FOM sees the suggestion and approves with one click.
 */

import type { SuggestedFix, SuggestedFixAction } from '@/types/audit';
import type { AuditViolation as EngineViolation } from '@/utils/engine/types';
import { SHIFT_TIMES } from '@/utils/engine/constants';

interface FixContext {
  /** Map of employeeId → name for display */
  employeeNames: Record<string, string>;
  /** Period start date ISO string */
  startDate: string;
}

/**
 * Given an engine violation, produce a SuggestedFix (or null if no fix available).
 */
export function suggestFix(
  violation: EngineViolation,
  ctx: FixContext
): SuggestedFix | null {
  const empName = ctx.employeeNames[violation.employeeId] || violation.employeeId;
  const dayDate = violation.day ? periodDayToISO(ctx.startDate, violation.day) : '';

  switch (violation.rule) {
    // ── 12H REST VIOLATION ─────────────────────────────────────────
    case '12H_REST':
    case 'AFTERNOON_TO_MORNING': {
      // T→M: suggest changing M to 11x19 (transition shift)
      const nextDay = violation.day ? violation.day + 1 : 0;
      const nextDayDate = nextDay ? periodDayToISO(ctx.startDate, nextDay) : dayDate;
      return {
        action: 'CHANGE_SHIFT',
        label: `Cambiar M→11h a 19h para ${empName} el día ${nextDay}`,
        employeeId: violation.employeeId,
        date: nextDayDate,
        fromShift: 'M',
        toShift: '11x19',
        toShiftStartTime: '11:00',
        toShiftEndTime: '19:00',
        toShiftColor: SHIFT_TIMES['11x19'] ? '#fde047' : undefined,
      };
    }

    // ── COVERAGE GAP ───────────────────────────────────────────────
    case 'MIN_COVERAGE': {
      // Extract shift from description (e.g., "turno M: 0 persona(s)")
      const shiftMatch = violation.description.match(/turno (\w+):/);
      const shift = shiftMatch?.[1] || 'M';
      const shiftInfo = SHIFT_TIMES[shift];
      return {
        action: 'CHANGE_SHIFT',
        label: `Asignar ${shift} a un FDA disponible el día ${violation.day}`,
        employeeId: '_suggest_best', // Special marker: let the handler find best candidate
        date: dayDate,
        fromShift: 'D',
        toShift: shift,
        toShiftStartTime: shiftInfo?.startTime || '07:00',
        toShiftEndTime: shiftInfo?.endTime || '15:00',
      };
    }

    // ── NON-CONSECUTIVE REST ───────────────────────────────────────
    case 'CONSECUTIVE_REST': {
      return {
        action: 'MOVE_REST_DAY',
        label: `Mover libre para hacerlos consecutivos (${empName})`,
        employeeId: violation.employeeId,
        date: dayDate,
      };
    }

    // ── NIGHT WITHOUT REST AFTER ───────────────────────────────────
    case 'NIGHT_THEN_REST': {
      const nextDay = violation.day ? violation.day + 1 : 0;
      const nextDayDate = nextDay ? periodDayToISO(ctx.startDate, nextDay) : dayDate;
      return {
        action: 'ADD_REST_DAY',
        label: `Añadir descanso post-noche para ${empName} día ${nextDay}`,
        employeeId: violation.employeeId,
        date: nextDayDate,
        targetDate: nextDayDate,
      };
    }

    // ── TOO MANY CONSECUTIVE NIGHTS ────────────────────────────────
    case 'MAX_CONSECUTIVE_NIGHTS': {
      return {
        action: 'ADD_REST_DAY',
        label: `Insertar descanso para romper racha de noches (${empName})`,
        employeeId: violation.employeeId,
        date: dayDate,
        targetDate: dayDate,
      };
    }

    // ── EQUITY DEVIATION ───────────────────────────────────────────
    case 'EQUITY_DEVIATION': {
      return {
        action: 'SWAP_SHIFTS',
        label: `Reequilibrar turnos M/T/N de ${empName}`,
        employeeId: violation.employeeId,
        date: dayDate,
      };
    }

    // ── CROSS-PERIOD 12H ───────────────────────────────────────────
    case 'CROSS_PERIOD_12H': {
      return {
        action: 'CHANGE_SHIFT',
        label: `Cambiar turno día 1 para respetar 12h con período anterior`,
        employeeId: violation.employeeId,
        date: periodDayToISO(ctx.startDate, 1),
        fromShift: 'M',
        toShift: '11x19',
        toShiftStartTime: '11:00',
        toShiftEndTime: '19:00',
      };
    }

    default:
      return null;
  }
}

/**
 * Batch: generate suggestions for all violations
 */
export function suggestAllFixes(
  violations: EngineViolation[],
  ctx: FixContext
): Map<string, SuggestedFix> {
  const fixes = new Map<string, SuggestedFix>();
  for (const v of violations) {
    const fix = suggestFix(v, ctx);
    if (fix) {
      const key = `${v.rule}-${v.employeeId}-${v.day ?? 0}`;
      fixes.set(key, fix);
    }
  }
  return fixes;
}

// ── HELPERS ──────────────────────────────────────────────────────────

function periodDayToISO(startDate: string, day: number): string {
  const base = new Date(startDate + 'T00:00:00');
  base.setDate(base.getDate() + day - 1);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
