import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'upsert';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

interface UseOfflineQueueOptions {
  maxRetries?: number;
  onSyncComplete?: (successful: number, failed: number) => void;
  onOperationFailed?: (operation: PendingOperation, error: Error) => void;
}

const STORAGE_KEY = 'offline-operations-queue';
const MAX_QUEUE_SIZE = 500;

export function useOfflineQueue(options: UseOfflineQueueOptions = {}) {
  const { maxRetries = 3, onSyncComplete, onOperationFailed } = options;
  
  const [queue, setQueue] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const processingRef = useRef(false);

  // Cargar cola desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrar operaciones completadas o muy antiguas (> 24h)
        const validOps = parsed.filter((op: PendingOperation) => 
          op.status !== 'completed' && 
          Date.now() - op.timestamp < 24 * 60 * 60 * 1000
        );
        setQueue(validOps);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Guardar cola en localStorage cuando cambie
  useEffect(() => {
    try {
      // Limitar tamaño de la cola
      const trimmedQueue = queue.slice(-MAX_QUEUE_SIZE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, [queue]);

  // Añadir operación a la cola (solo para calendar_shifts)
  const addToQueue = useCallback((
    type: PendingOperation['type'],
    data: any
  ): string => {
    const operation: PendingOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
      status: 'pending',
    };

    setQueue(prev => [...prev, operation]);
    
    return operation.id;
  }, [maxRetries]);

  // Procesar una operación individual (específica para calendar_shifts)
  const processOperation = async (operation: PendingOperation): Promise<boolean> => {
    try {
      const { type, data } = operation;

      switch (type) {
        case 'create':
        case 'upsert':
          const { error: upsertError } = await supabase
            .from('calendar_shifts')
            .upsert(data, { onConflict: 'id', ignoreDuplicates: false });
          if (upsertError) throw upsertError;
          break;

        case 'update':
          const { id: updateId, ...updateData } = data;
          const { error: updateError } = await supabase
            .from('calendar_shifts')
            .update(updateData)
            .eq('id', updateId);
          if (updateError) throw updateError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('calendar_shifts')
            .delete()
            .eq('id', data.id);
          if (deleteError) throw deleteError;
          break;
      }

      return true;
    } catch (error) {
      console.error(`Error procesando operación ${operation.id}:`, error);
      return false;
    }
  };

  // Sincronizar cola completa
  const syncQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;
    
    processingRef.current = true;
    setIsSyncing(true);
    
    
    let successful = 0;
    let failed = 0;
    const updatedQueue: PendingOperation[] = [];

    for (const operation of queue) {
      if (operation.status === 'completed') {
        continue;
      }

      // Marcar como procesando
      operation.status = 'processing';
      
      const success = await processOperation(operation);
      
      if (success) {
        operation.status = 'completed';
        successful++;
      } else {
        operation.retries++;
        
        if (operation.retries >= operation.maxRetries) {
          operation.status = 'failed';
          operation.error = 'Máximo de reintentos alcanzado';
          failed++;
          onOperationFailed?.(operation, new Error(operation.error));
          console.error(`❌ Operación ${operation.id} falló permanentemente`);
        } else {
          operation.status = 'pending';
          updatedQueue.push(operation);
          console.warn(`⚠️ Operación ${operation.id} reintentará (${operation.retries}/${operation.maxRetries})`);
        }
      }
    }

    setQueue(updatedQueue);
    setLastSyncAt(new Date());
    setIsSyncing(false);
    processingRef.current = false;

    if (successful > 0 || failed > 0) {
      onSyncComplete?.(successful, failed);
      
      if (successful > 0 && failed === 0) {
        toast({
          title: "✅ Sincronización completada",
          description: `${successful} cambios sincronizados correctamente`,
          duration: 3000,
        });
      } else if (failed > 0) {
        toast({
          title: "⚠️ Sincronización parcial",
          description: `${successful} exitosos, ${failed} fallidos`,
          variant: "destructive",
          duration: 5000,
        });
      }
    }

  }, [queue, onSyncComplete, onOperationFailed]);

  // Limpiar operaciones completadas
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(op => op.status !== 'completed'));
  }, []);

  // Limpiar toda la cola
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Obtener operaciones pendientes
  const getPendingCount = useCallback(() => {
    return queue.filter(op => op.status === 'pending' || op.status === 'processing').length;
  }, [queue]);

  return {
    queue,
    addToQueue,
    syncQueue,
    clearCompleted,
    clearQueue,
    isSyncing,
    lastSyncAt,
    pendingCount: getPendingCount(),
    hasPending: getPendingCount() > 0,
  };
}
