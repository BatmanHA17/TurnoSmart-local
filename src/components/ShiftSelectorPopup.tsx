import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getSavedShifts } from "@/store/savedShiftsStore";
import { CalendarX, Clock } from "lucide-react";
import { defaultAbsenceShifts, getCustomAbsences, CUSTOM_ABSENCES_KEY } from "./FavoritesArea";

interface ShiftSelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftSelected: (shift: any) => void;
  onAdvancedOptions: () => void;
  position: { x: number; y: number };
}

export function ShiftSelectorPopup({
  isOpen,
  onClose,
  onShiftSelected,
  onAdvancedOptions,
  position
}: ShiftSelectorPopupProps) {
  const [showAbsences, setShowAbsences] = useState(false);
  const [allShifts, setAllShifts] = useState<any[]>([]);
  const [absenceShifts, setAbsenceShifts] = useState<any[]>([]);

  // Combinar horarios guardados en store y favoritos de localStorage
  useEffect(() => {
    const loadShifts = async () => {
      // Cargar desde la base de datos forzando recarga fresca
      const savedShifts = await getSavedShifts(true);
      
      // Cargar favoritos desde localStorage
      try {
        const stored = localStorage.getItem('turnosmart-favorite-shifts');
        const favoriteShifts = stored ? JSON.parse(stored) : [];
        
        // Filtrar duplicados basándose en el nombre
        const combined = [...savedShifts];
        favoriteShifts.forEach((fav: any) => {
          const exists = combined.some(shift => shift.name === fav.name);
          if (!exists) {
            combined.push(fav);
          }
        });
        
        setAllShifts(combined);
      } catch (error) {
        console.error('Error cargando favoritos:', error);
        setAllShifts(savedShifts);
      }

      // Cargar ausencias (predefinidas + personalizadas)
      const customAbsences = getCustomAbsences();
      const customAbsenceShifts = customAbsences.map(ca => ({
        id: ca.id,
        name: ca.name,
        startTime: '',
        endTime: '',
        color: ca.color,
        accessType: 'absence',
        isSystemDefault: false,
        description: ca.description,
        absenceCode: ca.code
      }));
      
      const allAbsences = [
        ...defaultAbsenceShifts.map(s => ({
          ...s,
          absenceCode: s.id.split('-')[0]
        })),
        ...customAbsenceShifts
      ];
      
      setAbsenceShifts(allAbsences);
    };

    if (isOpen) {
      loadShifts();
    }
  }, [isOpen]);
  
  // Separar turnos normales de ausencias, eliminar duplicados y ordenar por hora de inicio
  const regularShifts = allShifts
    .filter(shift => shift.accessType !== 'absence')
    // Eliminar duplicados por nombre
    .filter((shift, index, arr) => arr.findIndex(s => s.name === shift.name) === index)
    .sort((a, b) => {
      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      return timeA.localeCompare(timeB);
    });

  if (!isOpen) return null;

  // Calculate responsive position to avoid overflow
  const calculatePosition = () => {
    const popup = { width: 288, height: 384 };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    let left = position.x;
    let top = position.y;
    
    if (left + popup.width > viewport.width - 20) {
      left = viewport.width - popup.width - 20;
    }
    
    if (left < 20) {
      left = 20;
    }
    
    if (top + popup.height > viewport.height - 20) {
      top = viewport.height - popup.height - 20;
    }
    
    if (top < 20) {
      top = 20;
    }
    
    return { left, top };
  };

  const finalPosition = calculatePosition();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup Card */}
      <Card 
        className="fixed z-50 w-72 bg-white shadow-xl border border-gray-200 max-h-96 overflow-hidden"
        style={{
          left: `${finalPosition.left}px`,
          top: `${finalPosition.top}px`,
        }}
      >
        <div className="p-3 space-y-2">
          <div className="text-xs font-medium text-gray-600 mb-3">
            Seleccionar horario o ausencia
          </div>

          {/* Toggle para mostrar ausencias */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Mostrar ausencias</span>
              <span className="text-xs text-gray-500">({absenceShifts.length})</span>
            </div>
            <Switch
              checked={showAbsences}
              onCheckedChange={setShowAbsences}
            />
          </div>
          
          <div className="overflow-y-auto max-h-60 space-y-3">
            {/* Turnos Regulares */}
            {regularShifts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  <Clock className="h-3 w-3" />
                  Horarios de Trabajo ({regularShifts.length})
                </div>
                <div className="space-y-1">
                  {regularShifts.map((shift) => (
                    <Button
                      key={shift.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 border hover:bg-gray-50"
                      onClick={() => {
                        onShiftSelected(shift);
                        onClose();
                      }}
                      style={{ borderLeftColor: shift.color, borderLeftWidth: '3px' }}
                    >
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-900">
                          {shift.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ausencias - Solo mostrar si el toggle está activado */}
            {showAbsences && absenceShifts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  <CalendarX className="h-3 w-3" />
                  Tipos de Ausencia ({absenceShifts.length})
                </div>
                <div className="space-y-1">
                  {absenceShifts.map((shift) => (
                    <Button
                      key={shift.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-auto p-2 border hover:bg-gray-50"
                      onClick={() => {
                        onShiftSelected({
                          ...shift,
                          isAbsence: true,
                          absenceCode: shift.absenceCode
                        });
                        onClose();
                      }}
                      style={{ borderLeftColor: shift.color, borderLeftWidth: '3px' }}
                    >
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-900">
                          {shift.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Día completo
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mensaje cuando no hay turnos */}
            {regularShifts.length === 0 && (!showAbsences || absenceShifts.length === 0) && (
              <div className="text-center py-4 text-xs text-gray-500">
                {!showAbsences && absenceShifts.length > 0 
                  ? "No hay horarios guardados. Activa 'Mostrar ausencias' para ver tipos de ausencia."
                  : "No hay horarios guardados"
                }
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs justify-start h-auto p-2 hover:bg-gray-50"
              onClick={() => {
                onAdvancedOptions();
                onClose();
              }}
            >
              <span className="text-blue-600 mr-1">+</span>
              Opciones avanzadas
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
