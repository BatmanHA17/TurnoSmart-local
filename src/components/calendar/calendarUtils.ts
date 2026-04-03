import { startOfWeek, addDays, isSameDay } from "date-fns";
import {
  ShiftBlock,
  isAbsenceType,
  getShiftHours,
} from "@/utils/calendarShiftUtils";
import type { CalendarEmployee } from "./calendarTypes";

// ─── Contract / Visibility helpers ─────────────────────────────────────────────

/** Should a colaborador appear in the calendar based on contract dates? */
export function shouldShowColaborador(colaborador: any): boolean {
  if (!colaborador) return false;
  if (colaborador.status === 'inactivo') return false;
  if (!colaborador.fecha_inicio_contrato) return true;

  const today = new Date();
  const startDate = new Date(colaborador.fecha_inicio_contrato);
  const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (colaborador.fecha_fin_contrato) {
    const endDate = new Date(colaborador.fecha_fin_contrato);
    const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return contractStart <= checkDate && checkDate <= contractEnd;
  }
  return contractStart <= checkDate;
}

/** Can a shift be assigned to this colaborador on a specific date? */
export function canAssignShiftOnDate(
  colaborador: any,
  targetDate: Date,
  isFirstDayShift: boolean = false,
): boolean {
  if (!colaborador) return false;
  if (colaborador.status === 'inactivo') return false;
  if (!colaborador.fecha_inicio_contrato) return true;

  const startDate = new Date(colaborador.fecha_inicio_contrato);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (colaborador.fecha_fin_contrato) {
    const endDate = new Date(colaborador.fecha_fin_contrato);
    const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (isFirstDayShift && target.getTime() === contractStart.getTime()) return true;
    return contractStart <= target && target <= contractEnd;
  }

  if (isFirstDayShift && target.getTime() === contractStart.getTime()) return true;
  return contractStart <= target;
}

// ─── Hours calculation helpers ─────────────────────────────────────────────────

/** Get weekly contract hours from a colaborador record (by name lookup). */
export function getWeeklyHoursFromColaborador(
  employeeName: string,
  colaboradores: any[],
): number {
  const colaborador = colaboradores.find(col =>
    `${col.nombre}${col.apellidos ? ' ' + col.apellidos : ''}`.toLowerCase().includes(employeeName.toLowerCase()) ||
    employeeName.toLowerCase().includes(`${col.nombre}${col.apellidos ? ' ' + col.apellidos : ''}`.toLowerCase()),
  );
  return colaborador?.tiempo_trabajo_semanal || 0;
}

/** Calculate real working hours for an employee in a given week. */
export function getWeeklyRealHours(
  employeeId: string,
  currentWeek: Date,
  shiftBlocks: ShiftBlock[],
): number {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const employeeShifts = shiftBlocks.filter(shift =>
    shift.employeeId === employeeId &&
    weekDays.some(day => isSameDay(shift.date, day)) &&
    !isAbsenceType(shift),
  );

  let totalHours = 0;
  employeeShifts.forEach(shift => {
    if (shift.startTime && shift.endTime) {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;
      if (endTotalMinutes < startTotalMinutes) endTotalMinutes += 24 * 60;
      totalHours += (endTotalMinutes - startTotalMinutes) / 60;
    }
  });
  return Math.round(totalHours * 10) / 10;
}

/** Calculate absence hours for an employee in a given week. */
export function getWeeklyAbsenceHours(
  employeeId: string,
  currentWeek: Date,
  shiftBlocks: ShiftBlock[],
): number {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const employeeAbsences = shiftBlocks.filter(shift =>
    shift.employeeId === employeeId &&
    weekDays.some(day => isSameDay(shift.date, day)) &&
    isAbsenceType(shift),
  );

  let totalAbsenceHours = 0;
  employeeAbsences.forEach(shift => {
    if (shift.startTime && shift.endTime) {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;
      if (endTotalMinutes < startTotalMinutes) endTotalMinutes += 24 * 60;
      totalAbsenceHours += (endTotalMinutes - startTotalMinutes) / 60;
    }
  });
  return Math.round(totalAbsenceHours * 10) / 10;
}

/** Total planned hours for an employee across all visible shifts. */
export function calculateEmployeeHours(
  employeeId: string,
  shiftBlocks: ShiftBlock[],
): number {
  const shifts = shiftBlocks.filter(shift => String(shift.employeeId) === String(employeeId));
  return shifts.reduce((total, shift) => total + getShiftHours(shift), 0);
}

/** Check if an employee exceeds weekly contract hours (scaled to period). */
export function checkEmployeeHoursCompliance(
  employeeId: string,
  shiftBlocks: ShiftBlock[],
  colaboradores: any[],
): { isExceeded: boolean; plannedHours: number; contractHours: number } {
  const plannedHours = calculateEmployeeHours(employeeId, shiftBlocks);
  const colaborador = colaboradores.find(c => c.id === employeeId);
  if (!colaborador) return { isExceeded: false, plannedHours: 0, contractHours: 0 };

  const weeklyContract = colaborador.tiempo_trabajo_semanal || 40;
  const empShifts = shiftBlocks.filter(s => s.employeeId === employeeId);
  if (empShifts.length === 0) return { isExceeded: false, plannedHours: 0, contractHours: weeklyContract };

  const dates = empShifts.map(s => s.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daySpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  const weeksInPeriod = Math.max(1, Math.ceil(daySpan / 7));
  const contractHours = weeklyContract * weeksInPeriod;

  return { isExceeded: plannedHours > contractHours, plannedHours, contractHours };
}

/** Get employee stats (planned hours, hours to plan, hour bank). */
export function getEmployeeStats(
  employeeId: string,
  shiftBlocks: ShiftBlock[],
  colaboradores: any[],
): { plannedHours: number; hoursToPlanned: number; hourBank: number; contractMonths: number } {
  const colaborador = colaboradores.find(c => c.id === employeeId);
  if (!colaborador) return { plannedHours: 0, hoursToPlanned: 0, hourBank: 0, contractMonths: 0 };

  const plannedHours = calculateEmployeeHours(employeeId, shiftBlocks);
  const contractHours = colaborador.tiempo_trabajo_semanal || 40;

  const shiftsForEmployee = shiftBlocks.filter(shift => shift.employeeId === employeeId);
  if (shiftsForEmployee.length === 0) {
    return { plannedHours: 0, hoursToPlanned: contractHours, hourBank: 0, contractMonths: 9 };
  }

  const hoursToPlanned = Math.max(0, contractHours - plannedHours);
  return { plannedHours, hoursToPlanned, hourBank: 0, contractMonths: 9 };
}

/** Display string for contract hours (e.g. "40h semanales"). */
export function getContractHoursLabel(
  employeeId: string,
  employees: CalendarEmployee[],
): string {
  const employee = employees.find(emp => emp.id === employeeId);
  const workingHours = employee?.workingHours || "0h/40h";
  const weeklyHours = workingHours.split('/')[1] || "40h";
  const weeklyHoursNumber = parseInt(weeklyHours.replace('h', ''));
  return `${weeklyHoursNumber}h semanales`;
}

/** Get all shifts for an employee on a specific date. */
export function getShiftsForEmployeeAndDate(
  employeeId: string,
  date: Date,
  shiftBlocks: ShiftBlock[],
): ShiftBlock[] {
  return shiftBlocks.filter(shift =>
    shift.employeeId === employeeId && isSameDay(shift.date, date),
  );
}

/** Get the first shift for an employee on a date (convenience). */
export function getShiftForEmployeeAndDate(
  employeeId: string,
  date: Date,
  shiftBlocks: ShiftBlock[],
): ShiftBlock | undefined {
  const shifts = getShiftsForEmployeeAndDate(employeeId, date, shiftBlocks);
  return shifts.length > 0 ? shifts[0] : undefined;
}
