import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook global para sincronizar el ordenamiento de empleados entre todas las vistas
 * Garantiza que el orden sea consistente en Week, Day, Month, y otras vistas
 *
 * El ordenamiento se persiste en localStorage y se restaura al cambiar de vista
 */

interface Employee {
  id: string;
  name: string;
  role?: string;
  startDate?: string;
  [key: string]: any;
}

const SORT_KEY = 'calendar-employee-sort-criteria';
const MANUAL_ORDER_KEY = 'manual-employee-order';
const DEFAULT_SORT = 'name-asc';

export function useEmployeeSortOrder(employees: Employee[]) {
  // Estado global del sortBy - se sincroniza con localStorage
  const [sortBy, setSortByState] = useState<string>(() => {
    return localStorage.getItem(SORT_KEY) || DEFAULT_SORT;
  });

  // Persiste el cambio de sortBy a localStorage
  const setSortBy = useCallback((newSortBy: string) => {
    setSortByState(newSortBy);
    localStorage.setItem(SORT_KEY, newSortBy);
  }, []);

  // Resetear al orden por defecto (nombre ascendente)
  const resetSort = useCallback(() => {
    setSortBy(DEFAULT_SORT);
    localStorage.removeItem(MANUAL_ORDER_KEY);
  }, [setSortBy]);

  // Función para aplicar el ordenamiento
  const sortEmployees = useCallback((emps: Employee[], sortType: string): Employee[] => {
    // Verificar si hay un orden manual guardado
    const savedManualOrder = localStorage.getItem(MANUAL_ORDER_KEY);
    if (savedManualOrder) {
      try {
        const manualOrder = JSON.parse(savedManualOrder);
        const orderMap = new Map<string, number>(
          manualOrder.map((emp: any, index: number) => [emp.id, index])
        );

        return [...emps].sort((a, b) => {
          const posA = orderMap.get(a.id) ?? -1;
          const posB = orderMap.get(b.id) ?? -1;

          if (posA >= 0 && posB >= 0) {
            return posA - posB;
          }
          if (posA >= 0) return -1;
          if (posB >= 0) return 1;

          // Fallback al sortType especificado
          return applySortLogic(a, b, sortType);
        });
      } catch (error) {
        console.error('Error parsing manual order:', error);
        localStorage.removeItem(MANUAL_ORDER_KEY);
      }
    }

    return [...emps].sort((a, b) => applySortLogic(a, b, sortType));
  }, []);

  // Empleados ya ordenados según el sortBy actual
  const sortedEmployees = useMemo(
    () => sortEmployees(employees, sortBy),
    [employees, sortBy, sortEmployees]
  );

  return {
    sortBy,
    setSortBy,
    resetSort,
    sortedEmployees,
    sortEmployees,
  };
}

/**
 * Lógica de ordenamiento reutilizable
 */
function applySortLogic(a: Employee, b: Employee, sortType: string): number {
  // ✅ Support both 'name' property and 'nombre'/'apellidos' properties
  const getFullName = (emp: Employee): string => {
    if (emp.name) return emp.name;
    // Handle Supabase properties
    if ((emp as any).nombre) {
      const nombre = (emp as any).nombre || '';
      const apellidos = (emp as any).apellidos || '';
      return `${nombre} ${apellidos}`.trim();
    }
    return '';
  };

  const nameA = getFullName(a);
  const nameB = getFullName(b);

  switch (sortType) {
    case 'name-asc':
      return nameA.localeCompare(nameB, 'es', { numeric: true });
    case 'name-desc':
      return nameB.localeCompare(nameA, 'es', { numeric: true });
    case 'surname-asc':
      return nameA
        .split(' ')
        .slice(-1)[0]
        .localeCompare(nameB.split(' ').slice(-1)[0], 'es', { numeric: true });
    case 'surname-desc':
      return nameB
        .split(' ')
        .slice(-1)[0]
        .localeCompare(nameA.split(' ').slice(-1)[0], 'es', { numeric: true });
    case 'role-asc':
      return (a.role || '').localeCompare(b.role || '');
    case 'role-desc':
      return (b.role || '').localeCompare(a.role || '');
    case 'seniority-recent':
      return (
        new Date(b.startDate || '1900-01-01').getTime() -
        new Date(a.startDate || '1900-01-01').getTime()
      );
    case 'seniority-old':
      return (
        new Date(a.startDate || '1900-01-01').getTime() -
        new Date(b.startDate || '1900-01-01').getTime()
      );
    default:
      return 0;
  }
}
