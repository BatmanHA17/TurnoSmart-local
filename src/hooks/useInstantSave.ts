import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface ShiftData {
  id: string;
  employeeId: string;
  /**
   * Puede venir como Date (normal) o string ISO (si viene de localStorage / snapshots).
   */
  date: Date | string;
  startTime?: string;
  endTime?: string;
  name?: string;
  color: string;
  notes?: string;
  breakDuration?: string;
  absenceCode?: string;
}

interface UseInstantSaveOptions {
  orgId: string | undefined;
  onOfflineQueue?: (operation: 'create' | 'update' | 'delete' | 'upsert', data: any) => string;
  isOnline?: boolean;
}

/**
 * Normaliza una fecha que puede venir como Date o string ISO.
 * Retorna siempre un Date válido o lanza error si es inválida.
 */
const normalizeDate = (d: Date | string): Date => {
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) {
      console.error('normalizeDate: Date object inválido', d);
      return new Date(); // Fallback a fecha actual
    }
    return d;
  }
  
  // Es string, intentar parsear
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) {
    console.error('normalizeDate: No se pudo parsear la fecha string', d);
    return new Date(); // Fallback a fecha actual
  }
  return parsed;
};

/**
 * Formatea una fecha (Date o string) a 'yyyy-MM-dd' de forma segura.
 */
const safeFormatDate = (d: Date | string): string => {
  try {
    const normalized = normalizeDate(d);
    return format(normalized, 'yyyy-MM-dd');
  } catch (err) {
    console.error('safeFormatDate: Error formateando fecha', d, err);
    return format(new Date(), 'yyyy-MM-dd'); // Fallback
  }
};

export function useInstantSave({ orgId, onOfflineQueue, isOnline = true }: UseInstantSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveQueueRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  // Guardar en localStorage como backup inmediato
  const saveToLocalStorage = useCallback((shifts: ShiftData[]) => {
    try {
      const serialized = shifts.map(shift => ({
        ...shift,
        date: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
      }));
      localStorage.setItem('calendar-shift-blocks', JSON.stringify(serialized));
      localStorage.setItem('calendar-shifts-backup-timestamp', Date.now().toString());
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }, []);

  // Crear o actualizar un turno inmediatamente
  const saveShift = useCallback(async (shift: ShiftData): Promise<boolean> => {
    if (!orgId) {
      console.warn('No orgId provided for saving shift');
      return false;
    }

    // Usar safeFormatDate para evitar errores con fechas string
    const formattedDate = safeFormatDate(shift.date);
    const operationId = `${shift.employeeId}-${formattedDate}-${shift.name || 'shift'}`;
    
    // Evitar operaciones duplicadas simultáneas
    if (pendingOperationsRef.current.has(operationId)) {
      console.log(`⏳ Operación ya en progreso: ${operationId}`);
      return true;
    }

    // Cancelar cualquier guardado pendiente para el mismo turno
    if (saveQueueRef.current.has(operationId)) {
      clearTimeout(saveQueueRef.current.get(operationId));
      saveQueueRef.current.delete(operationId);
    }

    pendingOperationsRef.current.add(operationId);
    setStatus('saving');
    setError(null);

    try {
      // Si estamos offline, encolar la operación
      if (!isOnline) {
        if (onOfflineQueue) {
          onOfflineQueue('upsert', {
            id: shift.id,
            employee_id: shift.employeeId,
            date: formattedDate,
            start_time: shift.startTime,
            end_time: shift.endTime,
            shift_name: shift.name,
            color: shift.color,
            notes: shift.notes,
            break_duration: shift.breakDuration,
            org_id: orgId,
          });
        }
        setStatus('offline');
        pendingOperationsRef.current.delete(operationId);
        return true;
      }

      // Usar upsert para crear o actualizar en una sola operación
      const shiftData = {
        id: shift.id,
        employee_id: shift.employeeId,
        date: formattedDate,
        start_time: shift.startTime || null,
        end_time: shift.endTime || null,
        shift_name: shift.name || 'Turno',
        color: shift.color,
        notes: shift.notes || null,
        break_duration: shift.breakDuration || null,
        org_id: orgId,
      };

      const { error: upsertError } = await supabase
        .from('calendar_shifts')
        .upsert(shiftData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        throw upsertError;
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      console.log(`✅ Turno guardado inmediatamente: ${shift.name} para ${shift.employeeId}`);
      
      pendingOperationsRef.current.delete(operationId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setStatus('error');
      setError(errorMessage);
      console.error('❌ Error guardando turno:', err);
      
      // Encolar para reintento si hay cola offline disponible
      if (onOfflineQueue) {
        onOfflineQueue('upsert', {
          id: shift.id,
          employee_id: shift.employeeId,
          date: formattedDate,
          start_time: shift.startTime,
          end_time: shift.endTime,
          shift_name: shift.name,
          color: shift.color,
          notes: shift.notes,
          break_duration: shift.breakDuration,
          org_id: orgId,
        });
      }
      
      pendingOperationsRef.current.delete(operationId);
      return false;
    }
  }, [orgId, isOnline, onOfflineQueue]);

  // Eliminar un turno inmediatamente
  const deleteShift = useCallback(async (shiftId: string, employeeId: string, date: Date | string): Promise<boolean> => {
    if (!orgId) return false;

    const operationId = `delete-${shiftId}`;
    
    if (pendingOperationsRef.current.has(operationId)) {
      return true;
    }

    pendingOperationsRef.current.add(operationId);
    setStatus('saving');
    setError(null);

    try {
      if (!isOnline) {
        if (onOfflineQueue) {
          onOfflineQueue('delete', { id: shiftId });
        }
        setStatus('offline');
        pendingOperationsRef.current.delete(operationId);
        return true;
      }

      const { error: deleteError } = await supabase
        .from('calendar_shifts')
        .delete()
        .eq('id', shiftId);

      if (deleteError) {
        throw deleteError;
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      console.log(`🗑️ Turno eliminado inmediatamente: ${shiftId}`);
      
      pendingOperationsRef.current.delete(operationId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setStatus('error');
      setError(errorMessage);
      console.error('❌ Error eliminando turno:', err);
      
      if (onOfflineQueue) {
        onOfflineQueue('delete', { id: shiftId });
      }
      
      pendingOperationsRef.current.delete(operationId);
      return false;
    }
  }, [orgId, isOnline, onOfflineQueue]);

  // Guardar múltiples turnos (batch) con debounce
  const saveShiftsBatch = useCallback(async (shifts: ShiftData[]): Promise<boolean> => {
    if (!orgId || shifts.length === 0) return false;

    // Guardar en localStorage inmediatamente como backup
    saveToLocalStorage(shifts);

    setStatus('saving');
    setError(null);

    try {
      if (!isOnline) {
        shifts.forEach(shift => {
          if (onOfflineQueue) {
            onOfflineQueue('upsert', {
              id: shift.id,
              employee_id: shift.employeeId,
              date: safeFormatDate(shift.date),
              start_time: shift.startTime,
              end_time: shift.endTime,
              shift_name: shift.name,
              color: shift.color,
              notes: shift.notes,
              break_duration: shift.breakDuration,
              org_id: orgId,
            });
          }
        });
        setStatus('offline');
        return true;
      }

      // Preparar datos para upsert batch - incluir TODOS los turnos (no solo los que tienen horario)
      const shiftDataArray = shifts.map(shift => ({
        id: shift.id,
        employee_id: shift.employeeId,
        date: safeFormatDate(shift.date),
        start_time: shift.startTime || null,
        end_time: shift.endTime || null,
        shift_name: shift.name || 'Turno',
        color: shift.color,
        notes: shift.notes || null,
        break_duration: shift.breakDuration || null,
        org_id: orgId,
      }));

      if (shiftDataArray.length > 0) {
        const { error: batchError } = await supabase
          .from('calendar_shifts')
          .upsert(shiftDataArray, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (batchError) {
          throw batchError;
        }
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      console.log(`✅ ${shiftDataArray.length} turnos guardados en batch`);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setStatus('error');
      setError(errorMessage);
      console.error('❌ Error en guardado batch:', err);
      return false;
    }
  }, [orgId, isOnline, onOfflineQueue, saveToLocalStorage]);

  // Resetear estado
  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    lastSavedAt,
    error,
    saveShift,
    deleteShift,
    saveShiftsBatch,
    saveToLocalStorage,
    resetStatus,
    isSaving: status === 'saving',
    isOffline: status === 'offline',
    hasPendingOperations: pendingOperationsRef.current.size > 0,
  };
}
