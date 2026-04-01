import { format, getDay, parseISO, isWeekend } from "date-fns";

export interface ShiftForAnalytics {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  shiftName: string;
  absenceCode?: string | null;
}

export interface WeekdayDistribution {
  employeeId: string;
  employeeName: string;
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
  total: number;
}

export interface WeekendComparison {
  employeeId: string;
  employeeName: string;
  sabados: number;
  domingos: number;
  totalFinesSemana: number;
}

export interface AbsenceByType {
  type: string;
  label: string;
  count: number;
  color: string;
}

export interface ShiftTimeDistribution {
  employeeId: string;
  employeeName: string;
  mananas: number;
  tardes: number;
  noches: number;
}

export interface EmployeeRequests {
  employeeId: string;
  employeeName: string;
  totalRequests: number;
  vacaciones: number;
  permisos: number;
  otros: number;
}

const ABSENCE_CODES = {
  V: { label: "Vacaciones", color: "hsl(142, 21%, 41%)" },
  E: { label: "Enfermedad", color: "hsl(4, 43%, 55%)" },
  P: { label: "Permiso", color: "hsl(205, 37%, 47%)" },
  F: { label: "Falta", color: "hsl(26, 61%, 49%)" },
  H: { label: "Horas sindicales", color: "hsl(269, 27%, 54%)" },
  S: { label: "Sanción", color: "hsl(42, 49%, 51%)" },
  C: { label: "Curso", color: "hsl(323, 36%, 51%)" },
  L: { label: "Libre", color: "hsl(42, 8%, 47%)" },     // legacy
  D: { label: "Descanso", color: "hsl(215, 14%, 65%)" }, // motor SMART v2.0
};

const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export function classifyShiftTime(startTime: string | null | undefined): "manana" | "tarde" | "noche" | null {
  if (!startTime) return null;
  
  const [hours] = startTime.split(":").map(Number);
  
  if (hours >= 6 && hours < 14) return "manana";
  if (hours >= 14 && hours < 22) return "tarde";
  return "noche";
}

export function isWorkShift(shift: ShiftForAnalytics): boolean {
  const absenceCode = shift.absenceCode?.toUpperCase();
  if (!absenceCode) return true;
  return !["L", "V", "E", "P", "F", "H", "S", "C"].includes(absenceCode);
}

export function calculateWeekdayDistribution(shifts: ShiftForAnalytics[]): WeekdayDistribution[] {
  const employeeMap = new Map<string, WeekdayDistribution>();

  shifts.forEach((shift) => {
    if (!isWorkShift(shift)) return;

    const dateObj = typeof shift.date === "string" ? parseISO(shift.date) : shift.date;
    const dayOfWeek = getDay(dateObj);
    const dayName = WEEKDAY_NAMES[dayOfWeek] as keyof Omit<WeekdayDistribution, "employeeId" | "employeeName" | "total">;

    if (!employeeMap.has(shift.employeeId)) {
      employeeMap.set(shift.employeeId, {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName,
        lunes: 0,
        martes: 0,
        miercoles: 0,
        jueves: 0,
        viernes: 0,
        sabado: 0,
        domingo: 0,
        total: 0,
      });
    }

    const emp = employeeMap.get(shift.employeeId)!;
    if (dayName) {
      emp[dayName]++;
      emp.total++;
    }
  });

  return Array.from(employeeMap.values()).sort((a, b) => b.total - a.total);
}

export function calculateWeekendComparison(shifts: ShiftForAnalytics[]): WeekendComparison[] {
  const employeeMap = new Map<string, WeekendComparison>();

  shifts.forEach((shift) => {
    if (!isWorkShift(shift)) return;

    const dateObj = typeof shift.date === "string" ? parseISO(shift.date) : shift.date;
    const dayOfWeek = getDay(dateObj);

    if (dayOfWeek !== 0 && dayOfWeek !== 6) return;

    if (!employeeMap.has(shift.employeeId)) {
      employeeMap.set(shift.employeeId, {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName,
        sabados: 0,
        domingos: 0,
        totalFinesSemana: 0,
      });
    }

    const emp = employeeMap.get(shift.employeeId)!;
    if (dayOfWeek === 6) emp.sabados++;
    if (dayOfWeek === 0) emp.domingos++;
    emp.totalFinesSemana++;
  });

  return Array.from(employeeMap.values()).sort((a, b) => b.totalFinesSemana - a.totalFinesSemana);
}

export function calculateAbsencesByType(shifts: ShiftForAnalytics[]): AbsenceByType[] {
  const absenceCounts = new Map<string, number>();

  shifts.forEach((shift) => {
    const code = shift.absenceCode?.toUpperCase();
    if (code && code !== "X" && code !== "XB" && ABSENCE_CODES[code as keyof typeof ABSENCE_CODES]) {
      absenceCounts.set(code, (absenceCounts.get(code) || 0) + 1);
    }
  });

  return Object.entries(ABSENCE_CODES)
    .filter(([code]) => absenceCounts.has(code))
    .map(([code, info]) => ({
      type: code,
      label: info.label,
      count: absenceCounts.get(code) || 0,
      color: info.color,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateShiftTimeDistribution(shifts: ShiftForAnalytics[]): ShiftTimeDistribution[] {
  const employeeMap = new Map<string, ShiftTimeDistribution>();

  shifts.forEach((shift) => {
    if (!isWorkShift(shift)) return;

    const timeCategory = classifyShiftTime(shift.startTime);
    if (!timeCategory) return;

    if (!employeeMap.has(shift.employeeId)) {
      employeeMap.set(shift.employeeId, {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName,
        mananas: 0,
        tardes: 0,
        noches: 0,
      });
    }

    const emp = employeeMap.get(shift.employeeId)!;
    if (timeCategory === "manana") emp.mananas++;
    if (timeCategory === "tarde") emp.tardes++;
    if (timeCategory === "noche") emp.noches++;
  });

  return Array.from(employeeMap.values()).sort((a, b) => 
    (b.mananas + b.tardes + b.noches) - (a.mananas + a.tardes + a.noches)
  );
}

export function calculateEmployeeAbsences(shifts: ShiftForAnalytics[]): Map<string, AbsenceByType[]> {
  const employeeAbsences = new Map<string, Map<string, number>>();

  shifts.forEach((shift) => {
    const code = shift.absenceCode?.toUpperCase();
    if (code && ABSENCE_CODES[code as keyof typeof ABSENCE_CODES] && code !== "L") {
      if (!employeeAbsences.has(shift.employeeId)) {
        employeeAbsences.set(shift.employeeId, new Map());
      }
      const empMap = employeeAbsences.get(shift.employeeId)!;
      empMap.set(code, (empMap.get(code) || 0) + 1);
    }
  });

  const result = new Map<string, AbsenceByType[]>();
  employeeAbsences.forEach((absenceMap, employeeId) => {
    result.set(
      employeeId,
      Array.from(absenceMap.entries()).map(([code, count]) => ({
        type: code,
        label: ABSENCE_CODES[code as keyof typeof ABSENCE_CODES]?.label || code,
        count,
        color: ABSENCE_CODES[code as keyof typeof ABSENCE_CODES]?.color || "hsl(0, 0%, 50%)",
      }))
    );
  });

  return result;
}
