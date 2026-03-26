import { useMemo, useState } from "react";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { DayShiftDialog } from "./DayShiftDialog";
import { getShiftType, shiftRequiresTime } from "@/constants/shiftTypes";
import { Coffee, GripVertical } from "lucide-react";
import { differenceInHours, parseISO } from "date-fns";

interface DayShiftBlockProps {
  shift: ShiftBlockDay;
  dayOffset?: number; // 0-6 for week view
  onUpdate: (shiftId: string, updates: Partial<ShiftBlockDay>) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
  readOnly?: boolean;
}

export function DayShiftBlock({ shift, dayOffset = 0, onUpdate, onDelete, readOnly = false }: DayShiftBlockProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Obtener información del tipo de turno
  const shiftType = getShiftType(shift.shift_name);
  const requiresTime = shiftRequiresTime(shift.shift_name);
  
  // Detectar si es un día de descanso/ausencia (no requiere horario)
  const isRestDay = !requiresTime;
  
  // Calculate position and width based on time (0-24 hours)
  const { left, width } = useMemo(() => {
    // Si es descanso, ocupar todo el día (0% a 100%)
    if (isRestDay) {
      return {
        left: '0%',
        width: '100%'
      };
    }
    
    // Para turnos normales, calcular basado en minutos del día
    // Convertir slots (30 min cada uno) a minutos
    const startMinutes = shift.slotStart * 30; // slot 0 = 00:00, slot 1 = 00:30, etc.
    const endMinutes = shift.slotEnd * 30;
    
    // Calcular porcentaje del día (1440 minutos en 24 horas)
    const leftPercentage = (startMinutes / 1440) * 100;
    const widthPercentage = ((endMinutes - startMinutes) / 1440) * 100;
    
    return {
      left: `${leftPercentage}%`,
      width: `${widthPercentage}%`
    };
  }, [shift.slotStart, shift.slotEnd, isRestDay]);

  // Calculate shift duration in hours
  const calculateShiftDuration = () => {
    if (!shift.start_time || !shift.end_time) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const startDateTime = parseISO(`${today}T${shift.start_time}`);
    const endDateTime = parseISO(`${today}T${shift.end_time}`);
    
    let duration = differenceInHours(endDateTime, startDateTime);
    
    // Handle overnight shifts
    if (duration < 0) {
      duration += 24;
    }
    
    return duration;
  };

  const shiftDuration = calculateShiftDuration();

  // Determinar el color basado en el tipo de turno
  const blockColor = shiftType?.color || shift.color || '#6b7280';

  return (
    <>
      <div
        className={`absolute top-1 bottom-1 rounded-sm overflow-visible shadow-sm group ${
          isRestDay 
            ? 'bg-slate-200/90 hover:bg-slate-300/90' // Banner para descanso/ausencia - mismo que ShiftCard
            : 'hover:shadow-md' // Estilo normal para turnos de trabajo - mismo que ShiftCard
        } ${
          readOnly ? 'cursor-default' : 'cursor-pointer transition-all'
        } ${isDragging ? 'opacity-50 z-50' : ''}`}
        style={{
          left,
          width,
          backgroundColor: isRestDay ? undefined : `${blockColor}50`, // 50% opacidad igual que ShiftCard
        }}
        onClick={readOnly ? undefined : () => setShowDialog(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={`${shiftType?.name || shift.shift_name}\n${shift.start_time && shift.end_time ? `${shift.start_time} - ${shift.end_time}` : ''}\n${shift.employee_name}`}
      >
        {/* Icono de drag - aparece en hover en el borde izquierdo */}
        {isHovered && !readOnly && !isRestDay && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 to-transparent flex items-center justify-start pl-0.5 cursor-grab active:cursor-grabbing z-10"
            draggable
            onDragStart={(e) => {
              setIsDragging(true);
              e.dataTransfer.setData('application/json', JSON.stringify({
                shiftId: shift.id,
                employeeId: shift.employee_id,
                type: 'time-drag'
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => setIsDragging(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        )}
        {isRestDay ? (
          // Banner para días sin horario (descansos, vacaciones, ausencias) - mismo que ShiftCard
          <div className="px-2 py-1 h-full flex items-center justify-center">
            <div className="text-[9px] text-slate-600 font-medium truncate leading-none">
              {shift.shift_name === 'L' ? 'Descanso semanal (1 día)' : shiftType?.name || shift.shift_name}
            </div>
          </div>
        ) : (
          // Layout normal para turnos de trabajo - exacto al ShiftCard
          <div className="flex flex-col h-full p-1 pr-8 relative">
            {/* Nombre del turno - alineado a la izquierda arriba */}
            <div className="text-left text-[10px] font-medium text-gray-900 truncate leading-tight">
              {shiftType?.name || shift.shift_name}
            </div>
            
            {/* Banner blanco con horario - justo debajo del nombre - exacto al ShiftCard */}
            {shift.start_time && shift.end_time && (
              <div 
                className="bg-white rounded px-1.5 py-0.5 shadow-sm border border-gray-200 mt-0.5 cursor-pointer transition-colors hover:bg-blue-50"
                onMouseEnter={() => setIsBannerHovered(true)}
                onMouseLeave={() => setIsBannerHovered(false)}
              >
                <div className="text-[8px] font-medium text-gray-700 leading-tight">
                  {isBannerHovered ? (
                    `Duración: ${shiftDuration}h`
                  ) : (
                    <>
                      {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      {shift.break_duration && (
                        <span className="text-gray-500">
                          {' '}({shift.break_duration})
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Icono de café en esquina inferior derecha - exacto al ShiftCard */}
            {shift.break_duration && (
              <div className="absolute bottom-0.5 right-0.5 z-10 bg-white/80 rounded-full p-0.5">
                <Coffee className="h-2.5 w-2.5 text-amber-700 drop-shadow-sm" />
              </div>
            )}
            
            {/* Overnight indicator */}
            {shift.isOvernight && (
              <div className="absolute top-1 right-1">
                <span className="text-[8px] bg-background/80 px-1 rounded">
                  →
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <DayShiftDialog
          shift={shift}
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
