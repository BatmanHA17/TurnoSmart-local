import { useCallback, useEffect, useRef } from 'react';
import { useConnectionStatus } from './useConnectionStatus';
import { useOfflineQueue } from './useOfflineQueue';
import { useInstantSave, SaveStatus } from './useInstantSave';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ShiftBlock {
  id: string;
  employeeId: string;
  /** Puede ser Date o string ISO (de localStorage / snapshots) */
  date: Date | string;
  startTime?: string;
  endTime?: string;
  type: string;
  color: string;
  name?: string;
  notes?: string;
  breakDuration?: string;
  absenceCode?: string;
}

interface UseDataPersistenceOptions {
  orgId: string | undefined;
  onSyncComplete?: () => void;
}

export function useDataPersistence({ orgId, onSyncComplete }: UseDataPersistenceOptions) {
  const { status: connectionStatus, isOnline, isOffline } = useConnectionStatus();
  const previousOnlineState = useRef(isOnline);
  
  const { 
    queue, 
    addToQueue, 
    syncQueue, 
    pendingCount, 
    hasPending,
    isSyncing,
    lastSyncAt,
  } = useOfflineQueue({
    onSyncComplete: (successful, failed) => {
      if (successful > 0) {
        onSyncComplete?.();
      }
    },
  });

  const {
    status: saveStatus,
    lastSavedAt,
    error: saveError,
    saveShift,
    deleteShift,
    saveShiftsBatch,
    saveToLocalStorage,
    isSaving,
  } = useInstantSave({
    orgId,
    onOfflineQueue: (type: 'create' | 'update' | 'delete' | 'upsert', data: any) => addToQueue(type, data),
    isOnline,
  });

  // Sincronizar automáticamente cuando volvemos a estar online
  useEffect(() => {
    if (isOnline && !previousOnlineState.current && hasPending) {
      toast({
        title: "Conexión restaurada",
        description: `Sincronizando ${pendingCount} cambios pendientes...`,
      });
      syncQueue();
    }
    previousOnlineState.current = isOnline;
  }, [isOnline, hasPending, pendingCount, syncQueue]);

  // Guardar un turno individual con persistencia garantizada
  const persistShift = useCallback(async (shift: ShiftBlock): Promise<boolean> => {
    // 1. Guardar en localStorage inmediatamente como backup
    const allShifts = JSON.parse(localStorage.getItem('calendar-shift-blocks') || '[]');
    const existingIndex = allShifts.findIndex((s: any) => s.id === shift.id);
    
    if (existingIndex >= 0) {
      allShifts[existingIndex] = {
        ...shift,
        date: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
      };
    } else {
      allShifts.push({
        ...shift,
        date: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
      });
    }
    
    localStorage.setItem('calendar-shift-blocks', JSON.stringify(allShifts));
    localStorage.setItem('calendar-shifts-backup-timestamp', Date.now().toString());
    
    // 2. Intentar guardar en Supabase
    const result = await saveShift({
      id: shift.id,
      employeeId: shift.employeeId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      name: shift.name,
      color: shift.color,
      notes: shift.notes,
      breakDuration: shift.breakDuration,
    });

    return result;
  }, [saveShift]);

  // Eliminar un turno con persistencia garantizada
  const removeShift = useCallback(async (shiftId: string, employeeId: string, date: Date | string): Promise<boolean> => {
    // 1. Eliminar de localStorage inmediatamente
    const allShifts = JSON.parse(localStorage.getItem('calendar-shift-blocks') || '[]');
    const filteredShifts = allShifts.filter((s: any) => s.id !== shiftId);
    localStorage.setItem('calendar-shift-blocks', JSON.stringify(filteredShifts));
    localStorage.setItem('calendar-shifts-backup-timestamp', Date.now().toString());
    
    // 2. Intentar eliminar de Supabase
    const result = await deleteShift(shiftId, employeeId, date);

    return result;
  }, [deleteShift]);

  // Guardar múltiples turnos con persistencia garantizada
  const persistShiftsBatch = useCallback(async (shifts: ShiftBlock[]): Promise<boolean> => {
    // 1. Guardar en localStorage inmediatamente
    saveToLocalStorage(shifts as any);
    
    // 2. Intentar guardar en Supabase
    const result = await saveShiftsBatch(shifts as any);

    return result;
  }, [saveShiftsBatch, saveToLocalStorage]);

  // Forzar sincronización manual
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede sincronizar sin conexión a internet",
        variant: "destructive",
      });
      return false;
    }

    if (hasPending) {
      await syncQueue();
      return true;
    }

    return true;
  }, [isOnline, hasPending, syncQueue]);

  // Recuperar datos desde localStorage si Supabase falla
  const recoverFromLocalStorage = useCallback((): ShiftBlock[] => {
    try {
      const saved = localStorage.getItem('calendar-shift-blocks');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return parsed.map((shift: any) => ({
        ...shift,
        date: new Date(shift.date),
      }));
    } catch (error) {
      console.error('Error recovering from localStorage:', error);
      return [];
    }
  }, []);

  return {
    // Estado de conexión
    connectionStatus,
    isOnline,
    isOffline,
    
    // Estado de guardado
    saveStatus,
    lastSavedAt,
    saveError,
    isSaving,
    
    // Cola offline
    pendingCount,
    hasPending,
    isSyncing,
    lastSyncAt,
    
    // Funciones de persistencia
    persistShift,
    removeShift,
    persistShiftsBatch,
    forceSync,
    recoverFromLocalStorage,
  };
}
