import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para sincronizar filtro de empleados entre todas las vistas del calendario
 * (semana, día, mes, etc)
 *
 * Estrategia: Almacenar en localStorage una lista de "IDs excluidos" en lugar de
 * "IDs incluidos", para evitar que la lista se sobreescriba entre vistas.
 */

interface Employee {
  id: string;
  [key: string]: any;
}

export function useCalendarEmployeeFilter(allEmployees: Employee[], orgId: string | null) {
  const [excludedEmployeeIds, setExcludedEmployeeIds] = useState<Set<string>>(new Set());

  const storageKey = orgId ? `calendar-employee-exclusions-${orgId}` : null;

  // Cargar la lista de excluidos desde localStorage al montar
  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const ids = JSON.parse(saved);
        setExcludedEmployeeIds(new Set(ids));
      }
    } catch (error) {
      console.error('Error loading excluded employees from localStorage:', error);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Guardar lista de excluidos a localStorage cuando cambia
  useEffect(() => {
    if (!storageKey) return;

    const idsArray = Array.from(excludedEmployeeIds);
    if (idsArray.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(idsArray));
    } else {
      // Si no hay excluidos, limpiar la key
      localStorage.removeItem(storageKey);
    }
  }, [excludedEmployeeIds, storageKey]);

  // Filtrar empleados: retornar solo los que NO están excluidos
  const filteredEmployees = allEmployees.filter(emp => !excludedEmployeeIds.has(emp.id));

  // Función para excluir (eliminar de vista) un empleado
  const excludeEmployee = useCallback((employeeId: string) => {
    setExcludedEmployeeIds(prev => new Set([...prev, employeeId]));
  }, []);

  // Función para incluir (restaurar) un empleado
  const includeEmployee = useCallback((employeeId: string) => {
    setExcludedEmployeeIds(prev => {
      const next = new Set(prev);
      next.delete(employeeId);
      return next;
    });
  }, []);

  // Función para resetear todos los filtros
  const resetFilter = useCallback(() => {
    setExcludedEmployeeIds(new Set());
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Función para obtener el estado actual (útil para debugging)
  const getExcludedCount = () => excludedEmployeeIds.size;
  const isEmployeeExcluded = (employeeId: string) => excludedEmployeeIds.has(employeeId);

  return {
    filteredEmployees,
    excludeEmployee,
    includeEmployee,
    resetFilter,
    getExcludedCount,
    isEmployeeExcluded,
    excludedEmployeeIds: Array.from(excludedEmployeeIds),
  };
}
