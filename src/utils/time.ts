/**
 * Utilidades null-safe para manejo de tiempos en formato HH:MM:SS
 * Toleran valores null/undefined y formatos incompletos
 */

/**
 * Parsea tiempo en formato HH:MM o HH:MM:SS a objeto {h, m, s}
 * Tolera null/undefined y devuelve null si no es válido
 */
export function parseHMSSafe(hms?: string | null): { h: number; m: number; s: number } | null {
  if (!hms || typeof hms !== 'string' || hms.trim() === '') return null;
  
  const parts = hms.split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  
  return {
    h: parts[0] || 0,
    m: parts[1] || 0,
    s: parts[2] || 0,
  };
}

/**
 * Convierte HH:MM:SS a "HH:MM" legible
 * Devuelve null si input es null/inválido
 */
export function toHumanTime(hms?: string | null): string | null {
  const parsed = parseHMSSafe(hms);
  if (!parsed) return null;
  
  const h = String(parsed.h).padStart(2, '0');
  const m = String(parsed.m).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Genera label "HH:MM – HH:MM" o "HH:MM" si solo hay uno
 * Devuelve null si ambos son null/inválidos
 */
export function labelRange(start?: string | null, end?: string | null): string | null {
  const startLabel = toHumanTime(start);
  const endLabel = toHumanTime(end);
  
  if (!startLabel && !endLabel) return null;
  if (!startLabel) return endLabel;
  if (!endLabel) return startLabel;
  
  return `${startLabel} – ${endLabel}`;
}

/**
 * Calcula duración en minutos entre start y end
 * Soporta cruces de medianoche (end < start)
 * Devuelve null si alguno es inválido
 */
export function durationMinutes(start?: string | null, end?: string | null): number | null {
  const s = parseHMSSafe(start);
  const e = parseHMSSafe(end);
  
  if (!s || !e) return null;
  
  let startMin = s.h * 60 + s.m;
  let endMin = e.h * 60 + e.m;
  
  // Si end < start → cruce de medianoche
  if (endMin < startMin) {
    endMin += 24 * 60; // Sumar 24h
  }
  
  return endMin - startMin;
}

/**
 * Convierte tiempo a posición % en timeline (0-100%)
 * Devuelve null si tiempo inválido
 */
export function getTimePositionPercent(time?: string | null): number | null {
  const parsed = parseHMSSafe(time);
  if (!parsed) return null;
  
  const totalMinutes = parsed.h * 60 + parsed.m;
  return (totalMinutes / 1440) * 100; // 1440 min = 24h
}

/**
 * Interfaz para segmentos de turno renderizables
 * Usado cuando un turno cruza medianoche y se divide en 2 bloques
 */
export interface ShiftSegment {
  segmentId: string; // unique ID para key en React
  shiftId: string; // ID original del turno
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  label: string; // "(continúa)" o "(desde HH:MM)"
  isFirstSegment: boolean; // true si es el segmento A (start → 23:59)
}

/**
 * Divide un turno que cruza medianoche en dos segmentos renderizables.
 * 
 * Segmento A: start_time → 23:59:59 (label: "(continúa)")
 * Segmento B: 00:00:00 → end_time (label: "(desde HH:MM)")
 * 
 * Si el turno NO cruza medianoche (end >= start), retorna un solo segmento.
 * 
 * @param shiftId - ID del turno original
 * @param startTime - Hora de inicio (HH:MM:SS o HH:MM)
 * @param endTime - Hora de fin (HH:MM:SS o HH:MM)
 * @returns Array de ShiftSegment (1 o 2 elementos) + flag crossesMidnight
 */
export function segmentShiftAcrossMidnight(
  shiftId: string,
  startTime: string | null,
  endTime: string | null
): { segments: ShiftSegment[]; crossesMidnight: boolean } {
  // Null-safety: si alguno es null, no hay segmentos renderizables
  if (!startTime || !endTime) {
    return { segments: [], crossesMidnight: false };
  }

  const parsedStart = parseHMSSafe(startTime);
  const parsedEnd = parseHMSSafe(endTime);

  if (!parsedStart || !parsedEnd) {
    return { segments: [], crossesMidnight: false };
  }

  const startMinutes = parsedStart.h * 60 + parsedStart.m;
  const endMinutes = parsedEnd.h * 60 + parsedEnd.m;

  // Si end >= start, no cruza medianoche → un solo segmento
  if (endMinutes >= startMinutes) {
    return {
      segments: [
        {
          segmentId: `${shiftId}-single`,
          shiftId,
          start_time: startTime,
          end_time: endTime,
          label: "",
          isFirstSegment: true,
        },
      ],
      crossesMidnight: false,
    };
  }

  // Cruza medianoche → 2 segmentos
  const segmentA: ShiftSegment = {
    segmentId: `${shiftId}-A`,
    shiftId,
    start_time: startTime,
    end_time: "23:59:59",
    label: "(continúa)",
    isFirstSegment: true,
  };

  const segmentB: ShiftSegment = {
    segmentId: `${shiftId}-B`,
    shiftId,
    start_time: "00:00:00",
    end_time: endTime,
    label: `(desde ${toHumanTime(startTime) || "??:??"})`,
    isFirstSegment: false,
  };

  return {
    segments: [segmentA, segmentB],
    crossesMidnight: true,
  };
}
