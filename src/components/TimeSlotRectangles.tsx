import React, { useState, useEffect } from 'react';
import { getSavedShifts, SavedShift } from "@/store/savedShiftsStore";
import { defaultAbsenceShifts, getCustomAbsences } from './FavoritesArea';

interface TimeSlotRectanglesProps {
  onSlotClick: (shiftIndex: number, e: React.MouseEvent, absenceCode?: string) => void;
}

// Límites visuales - aumentados para mostrar todos los horarios
const MAX_WORK_SHIFTS = 20;
const MAX_ABSENCE_SLOTS = 12;

export const TimeSlotRectangles: React.FC<TimeSlotRectanglesProps> = ({ onSlotClick }) => {
  const [savedShifts, setSavedShifts] = useState<SavedShift[]>([]);
  
  // Cargar horarios inicialmente y cuando cambien
  useEffect(() => {
    const loadShifts = async () => {
      const shifts = await getSavedShifts(true); // forceReload para obtener datos frescos
      setSavedShifts(shifts);
    };
    
    loadShifts();
    
    // Escuchar cambios en horarios guardados
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saved-shifts-updated') {
        loadShifts();
      }
    };
    
    // También escuchar evento personalizado para cambios locales
    const handleCustomUpdate = () => {
      loadShifts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shifts-updated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shifts-updated', handleCustomUpdate);
    };
  }, []);
  
  // Filtrar solo turnos de trabajo (no ausencias), eliminar duplicados y ordenar por hora de inicio
  const mainShifts = savedShifts
    .filter(s => s.accessType !== 'absence')
    // Eliminar duplicados por nombre (mantener el primero)
    .filter((shift, index, arr) => arr.findIndex(s => s.name === shift.name) === index)
    .sort((a, b) => {
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB);
    })
    .slice(0, MAX_WORK_SHIFTS);

  // Generar slots de ausencias dinámicamente
  const customAbsences = getCustomAbsences();
  
  const allAbsences = [
    // Primero las del sistema (por defecto)
    ...defaultAbsenceShifts.map(shift => ({
      code: shift.id.split('-')[0],
      name: shift.name,
      color: shift.color,
      isSystem: true
    })),
    // Después las personalizadas (ordenadas por fecha de creación)
    ...customAbsences
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(ca => ({
        code: ca.code,
        name: ca.name,
        color: ca.color,
        isSystem: false
      }))
  ];
  
  // Eliminar duplicados por nombre (mantener el primero - el del sistema tiene prioridad)
  const absenceSlots = allAbsences
    .filter((absence, index, arr) => arr.findIndex(a => a.name === absence.name) === index)
    .slice(0, MAX_ABSENCE_SLOTS);

  return (
    <div className="absolute top-1 left-1 right-1 flex flex-col gap-3 z-10">
      {/* Fila 1: Turnos de trabajo (borde, sin relleno) */}
      <div className="flex gap-1">
        {mainShifts.map((shift, index) => (
          <div
            key={shift.id || index}
            className="w-4 h-2.5 border cursor-pointer transition-all duration-150 rounded-sm hover:opacity-80"
            style={{ 
              borderColor: shift.color,
              borderWidth: '1px',
              backgroundColor: 'transparent'
            }}
            onClick={(e) => onSlotClick(index, e)}
            title={`${shift.name} (${shift.startTime} - ${shift.endTime})`}
          />
        ))}
      </div>
      
      {/* Fila 2: Ausencias (fondo relleno) - dinámicas */}
      <div className="flex gap-1 flex-wrap">
        {absenceSlots.map((absence) => (
          <div
            key={absence.code}
            className="w-4 h-2.5 cursor-pointer transition-all duration-150 rounded-sm hover:opacity-80"
            style={{ 
              backgroundColor: absence.color,
              opacity: 0.7
            }}
            onClick={(e) => onSlotClick(-1, e, absence.code)}
            title={absence.name}
          />
        ))}
      </div>
    </div>
  );
};
