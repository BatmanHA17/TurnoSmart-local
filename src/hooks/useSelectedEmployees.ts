import { useState, useEffect } from 'react';

interface SelectedEmployee {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo_contrato?: string;
  tiempo_trabajo_semanal?: number;
}

export const useSelectedEmployees = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([]);

  useEffect(() => {
    // Cargar empleados seleccionados desde localStorage al montar
    const stored = localStorage.getItem('selectedEmployeesForCalendar');
    if (stored) {
      try {
        const parsedEmployees = JSON.parse(stored);
        setSelectedEmployees(parsedEmployees);
        // Limpiar localStorage después de cargar
        localStorage.removeItem('selectedEmployeesForCalendar');
      } catch (error) {
        console.error('Error parsing stored employees:', error);
      }
    }
  }, []);

  const clearSelectedEmployees = () => {
    setSelectedEmployees([]);
    localStorage.removeItem('selectedEmployeesForCalendar');
  };

  return {
    selectedEmployees,
    setSelectedEmployees,
    clearSelectedEmployees
  };
};