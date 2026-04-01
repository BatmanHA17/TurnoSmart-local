// Motor de auditoría de turnos
import { 
  AuditViolation, 
  AuditResult, 
  ViolationType,
  CoveragePolicy,
  EmployeeRestriction,
  ViolationsByEmployeeDate
} from '@/types/audit';
import { format, parseISO, differenceInMinutes, addDays, getDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaz para turnos (compatible con los tipos existentes)
export interface ShiftForAudit {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  shiftName: string;
  startTime?: string | null; // HH:mm
  endTime?: string | null;   // HH:mm
  isAbsence?: boolean;
  absenceCode?: string; // L, V, E, etc.
  contractHours?: number; // Horas semanales del contrato
}

// Genera un ID único para violaciones
function generateViolationId(): string {
  return `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 1. DETECTAR DESCANSO INSUFICIENTE ENTRE TURNOS (< 12 horas)
 */
export function checkMinimumRestBetweenShifts(
  shifts: ShiftForAudit[],
  minRestHours: number = 12
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  
  // Agrupar turnos por empleado
  const shiftsByEmployee = groupShiftsByEmployee(shifts);
  
  for (const [employeeId, employeeShifts] of Object.entries(shiftsByEmployee)) {
    // Ordenar por fecha y hora de inicio
    const sortedShifts = employeeShifts
      .filter(s => s.startTime && s.endTime && !s.isAbsence)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
    
    // Comparar cada turno con el siguiente
    for (let i = 0; i < sortedShifts.length - 1; i++) {
      const currentShift = sortedShifts[i];
      const nextShift = sortedShifts[i + 1];
      
      if (!currentShift.endTime || !nextShift.startTime) continue;
      
      // Calcular tiempo de descanso
      const endDateTime = parseDateTime(currentShift.date, currentShift.endTime);
      const startDateTime = parseDateTime(nextShift.date, nextShift.startTime);
      
      const restMinutes = differenceInMinutes(startDateTime, endDateTime);
      const restHours = restMinutes / 60;
      
      if (restHours < minRestHours && restHours >= 0) {
        violations.push({
          id: generateViolationId(),
          type: 'INSUFFICIENT_REST',
          severity: restHours < 8 ? 'error' : 'warning',
          employeeId,
          employeeName: currentShift.employeeName,
          date: nextShift.date,
          message: `Solo ${restHours.toFixed(1)}h de descanso entre turnos`,
          details: `El turno del ${formatDateShort(currentShift.date)} termina a las ${currentShift.endTime} y el siguiente comienza a las ${nextShift.startTime} el ${formatDateShort(nextShift.date)}. Esto da solo ${restHours.toFixed(1)} horas de descanso, menos de las ${minRestHours}h requeridas por ley.`,
          suggestion: `Ajustar el horario para garantizar al menos ${minRestHours} horas de descanso.`,
          relatedShiftIds: [currentShift.id, nextShift.id]
        });
      }
    }
  }
  
  return violations;
}

/**
 * 2. DETECTAR DÍAS LIBRES INSUFICIENTES EN LA SEMANA
 * CÓDIGOS válidos como descanso: L (Libre), V (Vacaciones), E (Enfermedad), 
 * P (Permiso), F (Falta), H (Horas sindicales), S (Sanción), C (Curso)
 */
// 'D' es el código oficial del motor SMART v2.0. 'L' se mantiene para compatibilidad con datos históricos.
const VALID_REST_CODES = ['D', 'L', 'V', 'E', 'P', 'F', 'H', 'S', 'C'];

export function checkWeeklyFreeDays(
  shifts: ShiftForAudit[],
  weekStart: Date,
  minFreeDaysFullTime: number = 2,
  requireConsecutive: boolean = true
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Agrupar turnos por empleado
  const shiftsByEmployee = groupShiftsByEmployee(shifts);
  
  for (const [employeeId, employeeShifts] of Object.entries(shiftsByEmployee)) {
    const employeeName = employeeShifts[0]?.employeeName || 'Empleado';
    const contractHours = employeeShifts[0]?.contractHours || 40;
    
    // Determinar mínimo de días libres según contrato
    const minFreeDays = contractHours >= 35 ? minFreeDaysFullTime : 
                        contractHours >= 20 ? 2 : 3;
    
    // Encontrar días de descanso válidos en la semana
    const restDays: Date[] = [];
    let fullWeekAbsence = true; // Para detectar si toda la semana es V, E, P, etc.
    let absenceType = ''; // Tipo de ausencia de la semana completa
    
    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayShifts = employeeShifts.filter(s => s.date === dateStr);
      
      // Verificar si es día de descanso válido (L, V, E, P, F, H, S, C)
      const hasValidRestCode = dayShifts.some(s =>
        VALID_REST_CODES.includes(s.absenceCode || '') ||
        s.shiftName === 'Descanso' || s.shiftName === 'D' ||
        s.shiftName === 'Libre' || s.shiftName === 'L' ||
        s.shiftName === 'Vacaciones' || s.shiftName === 'V'
      );
      
      // También cuenta como descanso si no hay turno asignado
      const noShiftAssigned = dayShifts.length === 0;
      
      if (hasValidRestCode || noShiftAssigned) {
        restDays.push(day);
        
        // Detectar tipo de ausencia para la semana
        const absenceCode = dayShifts[0]?.absenceCode;
        if (absenceCode && ['V', 'E', 'P', 'C', 'S'].includes(absenceCode)) {
          if (!absenceType) absenceType = absenceCode;
        }
      } else {
        // Hay un día con turno de trabajo real
        fullWeekAbsence = false;
      }
    }
    
    // Si toda la semana es vacaciones, enfermedad, permiso, etc. → NO alertar
    if (fullWeekAbsence && absenceType) {
      // Semana completa de V, E, P, C, S → No necesita días libres adicionales
      continue;
    }
    
    // Contar días D (Descanso) y L (Libre, legacy) como días libres reales
    const freeDays = restDays.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayShifts = employeeShifts.filter(s => s.date === dateStr);
      return dayShifts.some(s =>
        s.absenceCode === 'D' || s.absenceCode === 'L' ||
        s.shiftName === 'Descanso' || s.shiftName === 'Libre' ||
        s.shiftName === 'D' || s.shiftName === 'L'
      ) || dayShifts.length === 0;
    });
    
    // Verificar cantidad de días libres (solo L, no V/E/P/etc)
    if (freeDays.length < minFreeDays) {
      // No alertar si el empleado tiene días de ausencia válidos que compensan
      const totalRestDays = restDays.length;
      if (totalRestDays >= minFreeDays) {
        // Tiene suficiente descanso total (aunque sea V, E, P)
        continue;
      }
      
      violations.push({
        id: generateViolationId(),
        type: 'MISSING_FREE_DAYS',
        severity: freeDays.length === 0 ? 'error' : 'warning',
        employeeId,
        employeeName,
        date: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        message: `Solo ${freeDays.length} día(s) libre(s) esta semana`,
        details: `El empleado tiene solo ${freeDays.length} día(s) libre(s) en la semana del ${formatDateShort(format(weekStart, 'yyyy-MM-dd'))}. Según su contrato de ${contractHours}h, debería tener mínimo ${minFreeDays} días libres.`,
        suggestion: `Asignar ${minFreeDays - freeDays.length} día(s) libre(s) adicional(es).`
      });
    }
    
    // Verificar que los días libres sean consecutivos (solo si tiene días L reales)
    if (requireConsecutive && freeDays.length >= 2) {
      const hasConsecutive = checkConsecutiveDays(freeDays);
      
      if (!hasConsecutive) {
        violations.push({
          id: generateViolationId(),
          type: 'NON_CONSECUTIVE_FREE_DAYS',
          severity: 'warning',
          employeeId,
          employeeName,
          date: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          message: 'Días libres no consecutivos',
          details: `Los días libres del empleado no son consecutivos en la semana del ${formatDateShort(format(weekStart, 'yyyy-MM-dd'))}. La normativa laboral recomienda que los días de descanso sean consecutivos.`,
          suggestion: 'Reorganizar los días libres para que sean consecutivos.'
        });
      }
    }
  }
  
  return violations;
}

/**
 * 3. DETECTAR COBERTURA MÍNIMA POR FRANJA HORARIA
 */
export function checkMinimumCoverage(
  shifts: ShiftForAudit[],
  date: Date,
  coveragePolicies: CoveragePolicy[]
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = getDayName(getDay(date));
  
  // Filtrar turnos del día que no sean ausencias
  const dayShifts = shifts.filter(s => 
    s.date === dateStr && 
    !s.isAbsence && 
    s.startTime && 
    s.endTime
  );
  
  for (const policy of coveragePolicies) {
    if (!policy.isEnabled) continue;
    
    // Verificar si aplica a este día
    if (policy.appliesToDays && !policy.appliesToDays.includes(dayOfWeek)) {
      continue;
    }
    
    // Contar empleados que cubren esta franja
    const employeesInSlot = new Set<string>();
    
    for (const shift of dayShifts) {
      if (shiftsOverlapTimeRange(shift.startTime!, shift.endTime!, policy.startTime, policy.endTime)) {
        employeesInSlot.add(shift.employeeId);
      }
    }
    
    const count = employeesInSlot.size;
    
    if (count < policy.minEmployees) {
      violations.push({
        id: generateViolationId(),
        type: 'MISSING_COVERAGE',
        severity: count === 0 ? 'error' : 'warning',
        employeeId: '', // No aplica a un empleado específico
        employeeName: '',
        date: dateStr,
        message: `Cobertura insuficiente: ${policy.name}`,
        details: `Solo hay ${count} empleado(s) cubriendo la franja "${policy.name}" (${policy.startTime}-${policy.endTime}) el ${formatDateShort(dateStr)}. Se requieren mínimo ${policy.minEmployees}.`,
        suggestion: `Asignar ${policy.minEmployees - count} empleado(s) adicional(es) a esta franja.`
      });
    }
  }
  
  return violations;
}

/**
 * 4. DETECTAR VACACIONES SIN DÍAS LIBRES CONCATENADOS
 */
export function checkVacationFreeDays(
  shifts: ShiftForAudit[],
  requiredFreeDays: number = 2
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  
  // Agrupar turnos por empleado
  const shiftsByEmployee = groupShiftsByEmployee(shifts);
  
  for (const [employeeId, employeeShifts] of Object.entries(shiftsByEmployee)) {
    const employeeName = employeeShifts[0]?.employeeName || 'Empleado';
    
    // Ordenar por fecha
    const sortedShifts = [...employeeShifts].sort((a, b) => a.date.localeCompare(b.date));
    
    // Encontrar períodos de vacaciones
    const vacationPeriods = findVacationPeriods(sortedShifts);
    
    for (const period of vacationPeriods) {
      const startDate = parseISO(period.startDate);
      const endDate = parseISO(period.endDate);
      
      // Verificar días libres ANTES del período de vacaciones
      let freeDaysBefore = 0;
      for (let i = 1; i <= requiredFreeDays; i++) {
        const checkDate = format(addDays(startDate, -i), 'yyyy-MM-dd');
        const dayShift = sortedShifts.find(s => s.date === checkDate);
        if (dayShift?.absenceCode === 'L' || dayShift?.shiftName === 'Libre') {
          freeDaysBefore++;
        } else {
          break; // No consecutivos
        }
      }
      
      // Verificar días libres DESPUÉS del período de vacaciones
      let freeDaysAfter = 0;
      for (let i = 1; i <= requiredFreeDays; i++) {
        const checkDate = format(addDays(endDate, i), 'yyyy-MM-dd');
        const dayShift = sortedShifts.find(s => s.date === checkDate);
        if (dayShift?.absenceCode === 'L' || dayShift?.shiftName === 'Libre') {
          freeDaysAfter++;
        } else {
          break; // No consecutivos
        }
      }
      
      // Debe tener días libres antes O después
      if (freeDaysBefore < requiredFreeDays && freeDaysAfter < requiredFreeDays) {
        violations.push({
          id: generateViolationId(),
          type: 'VACATION_NO_FREE_DAYS',
          severity: 'warning',
          employeeId,
          employeeName,
          date: period.startDate,
          endDate: period.endDate,
          message: 'Vacaciones sin días libres concatenados',
          details: `El período de vacaciones (${formatDateShort(period.startDate)} - ${formatDateShort(period.endDate)}) no tiene ${requiredFreeDays} días libres consecutivos antes ni después. Tiene ${freeDaysBefore} día(s) antes y ${freeDaysAfter} día(s) después.`,
          suggestion: `Añadir ${requiredFreeDays} días libres consecutivos antes o después de las vacaciones.`
        });
      }
    }
  }
  
  return violations;
}

/**
 * 5. VERIFICAR RESTRICCIONES ESPECIALES DE EMPLEADO
 */
export function checkEmployeeRestrictions(
  shifts: ShiftForAudit[],
  restrictions: EmployeeRestriction[]
): AuditViolation[] {
  const violations: AuditViolation[] = [];
  
  for (const restriction of restrictions) {
    if (!restriction.isActive) continue;
    
    const employeeShifts = shifts.filter(s => s.employeeId === restriction.colaboradorId);
    
    for (const shift of employeeShifts) {
      if (shift.isAbsence) continue;
      
      const shiftDate = parseISO(shift.date);
      const dayOfWeek = getDay(shiftDate);
      
      switch (restriction.restrictionType) {
        case 'NO_DAY':
          if (restriction.config.dayOfWeek === dayOfWeek) {
            violations.push({
              id: generateViolationId(),
              type: 'EMPLOYEE_RESTRICTION',
              severity: 'warning',
              employeeId: shift.employeeId,
              employeeName: shift.employeeName,
              date: shift.date,
              message: `No puede trabajar ${getDayName(dayOfWeek)}`,
              details: `El empleado tiene una restricción que le impide trabajar los ${getDayName(dayOfWeek)}s. Motivo: ${restriction.reason || 'No especificado'}.`,
              suggestion: 'Reasignar el turno a otro día u otro empleado.',
              relatedShiftIds: [shift.id]
            });
          }
          break;
          
        case 'MAX_HOURS_DAY':
          if (restriction.config.maxHours && shift.startTime && shift.endTime) {
            const hours = calculateShiftHours(shift.startTime, shift.endTime);
            if (hours > restriction.config.maxHours) {
              violations.push({
                id: generateViolationId(),
                type: 'EMPLOYEE_RESTRICTION',
                severity: 'warning',
                employeeId: shift.employeeId,
                employeeName: shift.employeeName,
                date: shift.date,
                message: `Excede ${restriction.config.maxHours}h máximas por día`,
                details: `El turno asignado es de ${hours}h, pero el empleado tiene una restricción de máximo ${restriction.config.maxHours}h por día. Motivo: ${restriction.reason || 'Reducción de jornada'}.`,
                suggestion: `Reducir el turno a máximo ${restriction.config.maxHours} horas.`,
                relatedShiftIds: [shift.id]
              });
            }
          }
          break;
          
        case 'NO_TIME_RANGE':
          if (restriction.config.startTime && restriction.config.endTime && shift.startTime && shift.endTime) {
            if (shiftsOverlapTimeRange(shift.startTime, shift.endTime, restriction.config.startTime, restriction.config.endTime)) {
              violations.push({
                id: generateViolationId(),
                type: 'EMPLOYEE_RESTRICTION',
                severity: 'warning',
                employeeId: shift.employeeId,
                employeeName: shift.employeeName,
                date: shift.date,
                message: `No puede trabajar de ${restriction.config.startTime} a ${restriction.config.endTime}`,
                details: `El turno (${shift.startTime}-${shift.endTime}) coincide con una franja horaria restringida para este empleado. Motivo: ${restriction.reason || 'No especificado'}.`,
                suggestion: 'Ajustar el horario o reasignar a otro empleado.',
                relatedShiftIds: [shift.id]
              });
            }
          }
          break;
      }
    }
  }
  
  return violations;
}

/**
 * FUNCIÓN PRINCIPAL: Ejecutar todas las auditorías
 */
export function runFullAudit(
  shifts: ShiftForAudit[],
  options: {
    periodStart: Date;
    periodEnd: Date;
    coveragePolicies?: CoveragePolicy[];
    employeeRestrictions?: EmployeeRestriction[];
    minRestHours?: number;
    minFreeDaysFullTime?: number;
    requireConsecutiveFreeDays?: boolean;
    freeDaysAroundVacation?: number;
  }
): AuditResult {
  const allViolations: AuditViolation[] = [];
  
  // 1. Descanso mínimo entre turnos
  allViolations.push(...checkMinimumRestBetweenShifts(shifts, options.minRestHours || 12));
  
  // 2. Días libres semanales (por cada semana del período)
  let currentWeekStart = startOfWeek(options.periodStart, { weekStartsOn: 1 });
  while (currentWeekStart <= options.periodEnd) {
    allViolations.push(...checkWeeklyFreeDays(
      shifts,
      currentWeekStart,
      options.minFreeDaysFullTime || 2,
      options.requireConsecutiveFreeDays ?? true
    ));
    currentWeekStart = addDays(currentWeekStart, 7);
  }
  
  // 3. Cobertura mínima (por cada día del período)
  if (options.coveragePolicies && options.coveragePolicies.length > 0) {
    const days = eachDayOfInterval({ start: options.periodStart, end: options.periodEnd });
    for (const day of days) {
      allViolations.push(...checkMinimumCoverage(shifts, day, options.coveragePolicies));
    }
  }
  
  // 4. Vacaciones sin días libres
  allViolations.push(...checkVacationFreeDays(shifts, options.freeDaysAroundVacation || 2));
  
  // 5. Restricciones de empleado
  if (options.employeeRestrictions && options.employeeRestrictions.length > 0) {
    allViolations.push(...checkEmployeeRestrictions(shifts, options.employeeRestrictions));
  }
  
  // Generar resumen
  const summary = generateSummary(allViolations);
  
  return {
    violations: allViolations,
    summary,
    auditedPeriod: {
      startDate: format(options.periodStart, 'yyyy-MM-dd'),
      endDate: format(options.periodEnd, 'yyyy-MM-dd')
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Organizar violaciones por empleado y fecha para fácil acceso en UI
 */
export function organizeViolationsByEmployeeDate(violations: AuditViolation[]): ViolationsByEmployeeDate {
  const organized: ViolationsByEmployeeDate = {};
  
  for (const violation of violations) {
    if (!violation.employeeId) continue;
    
    if (!organized[violation.employeeId]) {
      organized[violation.employeeId] = {};
    }
    
    if (!organized[violation.employeeId][violation.date]) {
      organized[violation.employeeId][violation.date] = [];
    }
    
    organized[violation.employeeId][violation.date].push(violation);
  }
  
  return organized;
}

// ==================== FUNCIONES AUXILIARES ====================

function groupShiftsByEmployee(shifts: ShiftForAudit[]): Record<string, ShiftForAudit[]> {
  const grouped: Record<string, ShiftForAudit[]> = {};
  
  for (const shift of shifts) {
    if (!grouped[shift.employeeId]) {
      grouped[shift.employeeId] = [];
    }
    grouped[shift.employeeId].push(shift);
  }
  
  return grouped;
}

function parseDateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const dateObj = parseISO(date);
  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}

function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMM", { locale: es });
}

function checkConsecutiveDays(dates: Date[]): boolean {
  if (dates.length < 2) return true;
  
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = differenceInMinutes(sortedDates[i + 1], sortedDates[i]) / (24 * 60);
    if (Math.abs(diff - 1) < 0.1) {
      return true; // Al menos hay un par consecutivo
    }
  }
  
  return false;
}

function getDayName(dayIndex: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[dayIndex] || '';
}

function shiftsOverlapTimeRange(
  shiftStart: string,
  shiftEnd: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const ss = toMinutes(shiftStart);
  const se = toMinutes(shiftEnd);
  const rs = toMinutes(rangeStart);
  const re = toMinutes(rangeEnd);
  
  // Manejar turnos que cruzan medianoche
  if (se < ss) {
    // Turno nocturno: verificar ambas partes
    return (ss < re) || (se > rs);
  }
  
  if (re < rs) {
    // Rango nocturno
    return (ss < re) || (se > rs);
  }
  
  // Caso normal
  return !(se <= rs || ss >= re);
}

function calculateShiftHours(startTime: string, endTime: string): number {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  let start = toMinutes(startTime);
  let end = toMinutes(endTime);
  
  if (end < start) {
    end += 24 * 60; // Turno nocturno
  }
  
  return (end - start) / 60;
}

function findVacationPeriods(sortedShifts: ShiftForAudit[]): Array<{ startDate: string; endDate: string }> {
  const periods: Array<{ startDate: string; endDate: string }> = [];
  let currentPeriod: { startDate: string; endDate: string } | null = null;
  
  for (const shift of sortedShifts) {
    const isVacation = shift.absenceCode === 'V' || shift.shiftName === 'Vacaciones';
    
    if (isVacation) {
      if (!currentPeriod) {
        currentPeriod = { startDate: shift.date, endDate: shift.date };
      } else {
        // Verificar si es consecutivo
        const prevDate = parseISO(currentPeriod.endDate);
        const currDate = parseISO(shift.date);
        const diffDays = differenceInMinutes(currDate, prevDate) / (24 * 60);
        
        if (diffDays <= 1.5) {
          currentPeriod.endDate = shift.date;
        } else {
          periods.push(currentPeriod);
          currentPeriod = { startDate: shift.date, endDate: shift.date };
        }
      }
    } else if (currentPeriod) {
      periods.push(currentPeriod);
      currentPeriod = null;
    }
  }
  
  if (currentPeriod) {
    periods.push(currentPeriod);
  }
  
  return periods;
}

function generateSummary(violations: AuditViolation[]): AuditResult['summary'] {
  const summary: AuditResult['summary'] = {
    total: violations.length,
    byType: {} as Record<ViolationType, number>,
    bySeverity: { error: 0, warning: 0, info: 0 },
    byEmployee: {}
  };
  
  for (const v of violations) {
    // Por tipo
    summary.byType[v.type] = (summary.byType[v.type] || 0) + 1;
    
    // Por severidad
    summary.bySeverity[v.severity]++;
    
    // Por empleado
    if (v.employeeId) {
      summary.byEmployee[v.employeeId] = (summary.byEmployee[v.employeeId] || 0) + 1;
    }
  }
  
  return summary;
}
