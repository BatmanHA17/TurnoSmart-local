// Pure utility functions extracted from GoogleCalendarStyle.tsx
// These have no dependency on React state and can be tested in isolation.

export interface ShiftBlock {
  id: string;
  employeeId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "morning" | "afternoon" | "night" | "absence";
  color: string;
  name?: string;
  organization_id?: string;
  absenceCode?: string;
  hasBreak?: boolean;
  breaks?: any[];
  totalBreakTime?: number;
  breakType?: string;
  breakDuration?: string;
  notes?: string;
  /** true si el FOM ha bloqueado este turno — el motor no lo sobreescribe al regenerar */
  locked?: boolean;
}

// Tipos de ausencias disponibles
export const absenceTypes = [
  'Baja por enfermedad',
  'Descanso semanal',
  'Vacaciones',
  'Accidente laboral',
  'Ausencia injustificada',
  'Ausencia justificada',
  'Baja parental',
  'Baja por maternidad',
  'Baja por paternidad',
  'Día festivo',
  'Enfermedad profesional',
  'Excedencia sin sueldo',
  'Formación',
  'Indisponibilidad temporal',
  'Paro parcial',
  'Permiso retribuido',
  'Reconocimiento médico',
  'Recuperación día festivo',
  'Recuperación por horas de ropa',
  'Recuperación por horas nocturnas',
  'Suspensión disciplinaria',
  'Suspensión preventiva'
];

// Verifica si un tipo de turno es una ausencia
export const isAbsenceType = (shift: ShiftBlock): boolean => {
  if (shift.type === 'absence') {
    return true;
  }
  if (shift.name) {
    return absenceTypes.some(absence =>
      shift.name!.toLowerCase().includes(absence.toLowerCase()) ||
      absence.toLowerCase().includes(shift.name!.toLowerCase())
    );
  }
  return false;
};

// Convierte HH:MM:SS a HH:MM (elimina segundos si existen)
export const formatTimeFromDatabase = (timeString: string): string => {
  if (timeString.includes(':') && timeString.split(':').length === 3) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }
  return timeString;
};

// Calcula la hora de fin a partir de una hora de inicio y duración en horas
export const calculateEndTime = (startTime: string, hours: number): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + (hours * 60);
  const endHour = Math.floor(endTotalMinutes / 60) % 24;
  const endMinute = endTotalMinutes % 60;
  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

// Calcula las horas entre hora de inicio y fin (maneja turnos nocturnos)
export const calculateShiftHours = (startTime?: string | null, endTime?: string | null): number => {
  if (!startTime || !endTime) {
    return 8; // Asumimos 8 horas para ausencias de día completo
  }
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotalMin = startHour * 60 + startMin;
  let endTotalMin = endHour * 60 + endMin;
  if (endTotalMin < startTotalMin) {
    endTotalMin += 24 * 60;
  }
  return (endTotalMin - startTotalMin) / 60;
};

// Determina si un turno debe contar como horas trabajadas
export const shouldCountHours = (shiftData: ShiftBlock): boolean => {
  if (shiftData.type === "absence") {
    const shiftName = shiftData.name?.trim() || '';
    if (shiftName === 'Curso' || shiftName === 'C') {
      return true;
    }
    return false;
  }
  // 'D' es el código oficial del motor SMART. 'L' se mantiene para compatibilidad con datos históricos.
  const absenceCodes = ['D', 'V', 'L', 'E', 'F', 'P', 'H', 'S', 'Vacaciones', 'Libre', 'Descanso', 'Día Libre', 'Descanso Semanal', 'Enfermo', 'Falta', 'Permiso', 'Horas Sindicales', 'Sancionado', 'Baja IT'];
  const shiftName = shiftData.name?.trim() || '';
  if (shiftName === 'Curso' || shiftName === 'C') {
    return true;
  }
  if (absenceCodes.includes(shiftName)) {
    return false;
  }
  if (shiftData.absenceCode && shiftData.absenceCode !== 'C' && shiftData.absenceCode !== 'Curso') {
    return false;
  }
  return true;
};

// Devuelve las horas reales del turno (0 si es ausencia no computable)
export const getShiftHours = (shift: ShiftBlock): number => {
  return shouldCountHours(shift) ? calculateShiftHours(shift.startTime, shift.endTime) : 0;
};
