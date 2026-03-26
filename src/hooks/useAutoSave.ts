import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => void;
  delay?: number; // milisegundos
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, delay = 3000, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<any>(null);
  const isFirstRun = useRef(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Función para comparar datos (shallow comparison)
  const hasDataChanged = useCallback((newData: any, prevData: any) => {
    if (!prevData) return false;
    return JSON.stringify(newData) !== JSON.stringify(prevData);
  }, []);

  // Función de autoguardado
  const autoSave = useCallback(async () => {
    if (data && hasDataChanged(data, previousDataRef.current)) {
      setIsAutoSaving(true);
      
      try {
        await onSave(data);
        previousDataRef.current = JSON.parse(JSON.stringify(data));
        
        toast({
          title: "Autoguardado",
          description: "Los cambios han sido guardados automáticamente",
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: "Error en autoguardado",
          description: "No se pudieron guardar los cambios automáticamente",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsAutoSaving(false);
      }
    }
  }, [data, onSave, hasDataChanged]);

  useEffect(() => {
    if (!enabled || !data) return;

    // No ejecutar en la primera carga
    if (isFirstRun.current) {
      previousDataRef.current = JSON.parse(JSON.stringify(data));
      isFirstRun.current = false;
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Solo programar autoguardado si hay cambios
    if (hasDataChanged(data, previousDataRef.current)) {
      timeoutRef.current = setTimeout(autoSave, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, autoSave, delay, enabled, hasDataChanged]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Función para forzar guardado inmediato
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    autoSave();
  }, [autoSave]);

  return { forceSave, isAutoSaving };
}