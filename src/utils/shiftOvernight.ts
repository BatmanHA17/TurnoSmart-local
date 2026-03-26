import { addDays, isBefore, parse } from "date-fns";

/**
 * Detecta si un turno cruza la medianoche
 * @param startTime - Hora de inicio (HH:mm)
 * @param endTime - Hora de fin (HH:mm)
 * @returns true si el turno cruza la medianoche
 */
export function isOvernightShift(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  
  try {
    const baseDate = new Date(2000, 0, 1);
    const start = parse(startTime, "HH:mm", baseDate);
    const end = parse(endTime, "HH:mm", baseDate);
    
    // Si end es antes que start, cruza medianoche
    return isBefore(end, start);
  } catch {
    return false;
  }
}

/**
 * Calcula las fechas afectadas por un turno overnight
 * @param shiftDate - Fecha del turno
 * @param startTime - Hora de inicio
 * @param endTime - Hora de fin
 * @returns Array de fechas afectadas [fecha_inicio, fecha_fin]
 */
export function getOvernightDates(
  shiftDate: Date,
  startTime: string,
  endTime: string
): Date[] {
  const isOvernight = isOvernightShift(startTime, endTime);
  
  if (!isOvernight) {
    return [shiftDate];
  }
  
  // El turno comienza en shiftDate y termina al día siguiente
  return [shiftDate, addDays(shiftDate, 1)];
}

/**
 * Valida que no haya conflictos de turnos overnight
 * @param existingShifts - Turnos existentes del empleado
 * @param newShiftDate - Fecha del nuevo turno
 * @param newStartTime - Hora de inicio del nuevo turno
 * @param newEndTime - Hora de fin del nuevo turno
 * @returns true si hay conflicto
 */
export function hasOvernightConflict(
  existingShifts: Array<{ date: Date; start_time: string; end_time: string }>,
  newShiftDate: Date,
  newStartTime: string,
  newEndTime: string
): boolean {
  const newDates = getOvernightDates(newShiftDate, newStartTime, newEndTime);
  
  for (const existing of existingShifts) {
    const existingDates = getOvernightDates(
      existing.date,
      existing.start_time,
      existing.end_time
    );
    
    // Verificar si las fechas se solapan
    const overlap = newDates.some(newDate =>
      existingDates.some(existingDate =>
        newDate.getTime() === existingDate.getTime()
      )
    );
    
    if (overlap) return true;
  }
  
  return false;
}
