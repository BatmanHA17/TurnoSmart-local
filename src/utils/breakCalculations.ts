// Utilidades para calcular y manejar descansos/pausas en turnos

export interface Break {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // minutos
}

/**
 * Calcula el tiempo total de descanso de un array de pausas
 * @param breaks Array de pausas/descansos
 * @returns Tiempo total en minutos
 */
export const calculateTotalBreakTime = (breaks: Break[]): number => {
  if (!breaks || breaks.length === 0) return 0;
  
  return breaks.reduce((total, breakItem) => {
    // Si tiene horarios programados (startTime y endTime), calcular la diferencia
    if (breakItem.startTime && breakItem.endTime) {
      const start = parseTimeToMinutes(breakItem.startTime);
      const end = parseTimeToMinutes(breakItem.endTime);
      
      // Manejar casos overnight (aunque es raro en pausas)
      let duration = end - start;
      if (duration < 0) {
        duration += 24 * 60; // Añadir 24 horas en minutos
      }
      
      return total + duration;
    }
    
    // Si no tiene horarios, usar la duración manual
    if (breakItem.duration && breakItem.duration > 0) {
      return total + breakItem.duration;
    }
    
    // Si no tiene ni horarios ni duración manual, usar 30 minutos por defecto
    return total + 30;
  }, 0);
};

/**
 * Convierte tiempo en formato HH:MM a minutos
 * @param time Tiempo en formato "HH:MM"
 * @returns Minutos
 */
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convierte minutos a formato HH:MM
 * @param minutes Minutos
 * @returns Tiempo en formato "HH:MM"
 */
export const minutesToTimeFormat = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Formatea el tiempo de descanso para mostrar en la UI
 * @param minutes Minutos de descanso
 * @returns String formateado (ej: "30 min", "1h 15min")
 */
export const formatBreakTime = (minutes: number): string => {
  if (minutes === 0) return '0 min';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Verifica si un turno tiene descansos configurados
 * @param breaks Array de pausas
 * @returns true si hay al menos una pausa válida
 */
export const hasValidBreaks = (breaks: Break[]): boolean => {
  if (!breaks || breaks.length === 0) return false;
  
  return breaks.some(breakItem => 
    (breakItem.startTime && breakItem.endTime) || 
    (breakItem.duration && breakItem.duration > 0)
  );
};