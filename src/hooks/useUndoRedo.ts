import { useState, useCallback, useRef, useEffect } from 'react';

interface HistoryState<T> {
  state: T;
  timestamp: number;
}

const MAX_HISTORY_SIZE = 50;
const HISTORY_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

// Helper function to serialize state with Date objects
function serializeState<T>(state: T): string {
  return JSON.stringify(state, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
}

// Helper function to deserialize state with Date objects
function deserializeState<T>(serialized: string): T {
  return JSON.parse(serialized, (key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
}

export function useUndoRedo<T>(initialState: T) {
  const [present, setPresent] = useState<T>(initialState);
  const [past, setPast] = useState<HistoryState<T>[]>([]);
  const [future, setFuture] = useState<HistoryState<T>[]>([]);
  
  // Refs para evitar closures problemáticas
  const presentRef = useRef<T>(present);
  const lastSavedRef = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const isUndoRedoInProgress = useRef(false); // Flag para evitar sincronización durante undo/redo

  // Mantener presentRef sincronizado
  useEffect(() => {
    presentRef.current = present;
  }, [present]);

  // Sincronizar con initialState cuando cambia externamente (pero NO durante undo/redo)
  useEffect(() => {
    // CRÍTICO: No sincronizar si hay una operación de undo/redo en progreso
    if (isUndoRedoInProgress.current) {
      return;
    }
    
    const initialStateStr = serializeState(initialState);
    const presentStr = serializeState(presentRef.current);
    
    // Solo sincronizar si:
    // 1. No está inicializado, O
    // 2. El estado externo cambió significativamente
    if (!isInitialized.current || initialStateStr !== presentStr) {
      
      setPresent(initialState);
      presentRef.current = initialState;
      
      if (!isInitialized.current) {
        isInitialized.current = true;
      }
    }
  }, [initialState]);

  // Limpiar historial antiguo cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPast(prev => prev.filter(item => now - item.timestamp < HISTORY_EXPIRY_MS));
      setFuture(prev => prev.filter(item => now - item.timestamp < HISTORY_EXPIRY_MS));
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const saveState = useCallback((stateToSave: T) => {
    setPast(prev => {
      // Evitar guardar duplicados CONSECUTIVOS solamente
      if (prev.length > 0) {
        const lastState = prev[prev.length - 1].state;
        const lastStateStr = serializeState(lastState);
        const newStateStr = serializeState(stateToSave);
        
        if (lastStateStr === newStateStr) {
          return prev;
        }
      }
      
      
      const newHistory = [
        ...prev,
        { state: stateToSave, timestamp: Date.now() }
      ];
      
      
      return newHistory.slice(-MAX_HISTORY_SIZE);
    });
    
    // Limpiar el futuro
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    isUndoRedoInProgress.current = true;
    
    setPast(prevPast => {
      if (prevPast.length === 0) {
        isUndoRedoInProgress.current = false;
        return prevPast;
      }

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      // CRÍTICO: Guardar el estado ACTUAL en el futuro antes de restaurar
      const currentState = presentRef.current;
      setFuture(prevFuture => [
        ...prevFuture,
        { state: currentState, timestamp: Date.now() }
      ]);
      
      // Restaurar el estado anterior
      setPresent(previous.state);
      presentRef.current = previous.state;
      lastSavedRef.current = serializeState(previous.state);
      
      // Limpiar flag después de un tick
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
      }, 0);
      
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    isUndoRedoInProgress.current = true;
    
    setFuture(prevFuture => {
      if (prevFuture.length === 0) {
        isUndoRedoInProgress.current = false;
        return prevFuture;
      }

      const next = prevFuture[prevFuture.length - 1];
      const newFuture = prevFuture.slice(0, prevFuture.length - 1);

      // CRÍTICO: Guardar el estado ACTUAL en el pasado antes de restaurar
      const currentState = presentRef.current;
      setPast(prevPast => [
        ...prevPast,
        { state: currentState, timestamp: Date.now() }
      ]);
      
      // Restaurar el estado siguiente
      setPresent(next.state);
      presentRef.current = next.state;
      lastSavedRef.current = serializeState(next.state);
      
      // Limpiar flag después de un tick
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
      }, 0);
      
      return newFuture;
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setPresent(newState);
    presentRef.current = newState;
    setPast([]);
    setFuture([]);
    lastSavedRef.current = serializeState(newState);
  }, []);

  return {
    state: present,
    saveState,
    undo,
    redo,
    reset,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historySize: past.length,
    futureSize: future.length,
  };
}
