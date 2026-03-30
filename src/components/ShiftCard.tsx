import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, MoreVertical, Eye, Edit, Trash2, Plus, Coffee, GripVertical } from "lucide-react";
import { format, differenceInHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { calculateTotalBreakTime, formatBreakTime } from "@/utils/breakCalculations";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { ShiftValidationBadge, ValidationStatus } from "@/components/calendar/ShiftValidationBadge";

interface ShiftEmployee {
  id: string;
  nombre: string;
  apellidos: string;
}

interface ShiftCardProps {
  shift: ShiftBlockDay;
  employee: ShiftEmployee;
  onShowDetails: (shift: ShiftBlockDay) => void;
  onEdit: (shift: ShiftBlockDay) => void;
  onDelete: (shift: ShiftBlockDay) => void;
  onAddShift?: (employee: ShiftEmployee, date: Date, event?: React.MouseEvent) => void;
  onSelect?: (shift: ShiftBlockDay) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onValidationChange?: (shiftId: string, newStatus: ValidationStatus) => void;
  isSelected?: boolean;
  shiftsCount?: number;
  readOnly?: boolean;
}

export function ShiftCard({ shift, employee, onShowDetails, onEdit, onDelete, onAddShift, onSelect, onDragStart, onDragEnd, onValidationChange, isSelected = false, shiftsCount = 1, readOnly = false }: ShiftCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  // Calculate responsive text sizes based on available space and multiple shifts
  const isMultipleShifts = shiftsCount > 1;
  const textSizeClass = isMultipleShifts ? "text-[9px]" : "text-xs";
  const timeTextClass = isMultipleShifts ? "text-[8px]" : "text-xs";

  // Calculate shift duration in hours
  const calculateShiftDuration = () => {
    if (!shift.startTime || !shift.endTime) return 0;

    const today = new Date().toISOString().split('T')[0];
    const startDateTime = parseISO(`${today}T${shift.startTime}`);
    const endDateTime = parseISO(`${today}T${shift.endTime}`);

    let duration = differenceInHours(endDateTime, startDateTime);

    // Handle overnight shifts
    if (duration < 0) {
      duration += 24;
    }

    return duration;
  };

  const shiftDuration = calculateShiftDuration();

  return (
    <div className="relative w-full h-full group flex">
      {/* Main Shift Card - Responsive design */}
      <div
        className={`transition-all relative overflow-visible z-20 shadow-sm ${
          shift.type === 'absence'
            ? 'w-full h-full rounded-md cursor-grab active:cursor-grabbing' // Ausencias ocupan todo el espacio
            : 'w-full h-[70%] rounded-sm hover:shadow-md cursor-grab active:cursor-grabbing self-end'
        } ${isDragging ? 'opacity-50 transform rotate-2 shadow-lg' : ''}`}
        data-shift-card="true"
        draggable={!readOnly}
        style={{ 
          // Aplicar fondo con el color del turno
          backgroundColor: shift.type === 'absence'
            ? (shift.color ? `${shift.color}` : '#94a3b8') // Color personalizado o gris por defecto
            : `${shift.color}50` // Aplicar color del turno con 50% de opacidad
        }}
        onDragStart={(e) => {
          if (readOnly) {
            e.preventDefault();
            return;
          }
          setIsDragging(true);
          onDragStart?.();
          
          const dragData = {
            shift: shift,
            sourceEmployeeId: employee?.id,
            type: 'calendar'
          };
          
          e.dataTransfer.setData('application/json', JSON.stringify(dragData));
          e.dataTransfer.effectAllowed = 'copyMove';
        }}
        onDragEnd={(e) => {
          setIsDragging(false);
          onDragEnd?.();
        }}
        onClick={(e) => {
          // Solo ejecutar onClick si no se está draggeando
          if (!isDragging) {
            e.stopPropagation(); // Prevent cell click
            onSelect && onSelect(shift);
          }
        }}
      >
        {/* Icono de drag - aparece en hover en el borde izquierdo - SOLO para turnos con horario */}
        {!readOnly && shift.type !== 'absence' && (
          <div
            className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 to-transparent flex items-center justify-start pl-0.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        )}
        {/* Contenido del turno - Banner para ausencias */}
        {shift.type === 'absence' ? (
          <div className="px-2 py-1 h-full flex items-center justify-center overflow-hidden">
            <div className="text-sm text-white font-semibold leading-tight w-full text-center drop-shadow-sm [word-spacing:100vw]">
              {shift.name || 'Ausencia'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full p-0.5 pr-5 relative pointer-events-none gap-[1px]">
            {/* Nombre del turno - alineado a la izquierda, fuerza salto de línea en espacios */}
            <div className="text-left text-[9px] font-medium text-gray-900 leading-[1.15] [word-spacing:100vw]">
              {shift.name || "Turno sin nombre"}
            </div>
            
            {/* Banner compacto con horario */}
            {shift.startTime && shift.endTime && (
              <div className="pointer-events-auto">
                <div 
                  className="bg-white/90 rounded-sm px-1 py-[1px] shadow-sm border border-gray-200/50 mt-[2px] cursor-pointer transition-colors hover:bg-blue-50"
                  onMouseEnter={() => setIsBannerHovered(true)}
                  onMouseLeave={() => setIsBannerHovered(false)}
                >
                  <div className="text-[7px] font-medium text-gray-600 leading-none whitespace-nowrap">
                    {isBannerHovered ? (
                      `${shiftDuration}h`
                    ) : (
                      <>
                        {shift.startTime.slice(0, 5)}-{shift.endTime.slice(0, 5)}
                        {shift.hasBreak && shift.breaks && shift.breaks.length > 0 && (
                          <span className="text-gray-500 ml-0.5">
                            ({formatBreakTime(calculateTotalBreakTime(shift.breaks))})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Icono de café más pequeño */}
            {shift.hasBreak && (
              <div className="absolute bottom-0.5 right-0.5 z-10 bg-white/80 rounded-full p-0.5">
                <Coffee className="h-2 w-2 text-amber-700 drop-shadow-sm" />
              </div>
            )}
          </div>
        )}
        
        {/* Validation badge — top-left corner, visible on hover (or always when not pending) */}
        {shift.type !== 'absence' && (shift as any).validation_status !== undefined && (
          <div
            className="absolute top-0.5 left-0.5 z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ShiftValidationBadge
              status={((shift as any).validation_status as ValidationStatus) || 'pending'}
              canEdit={!readOnly}
              onStatusChange={onValidationChange ? (s) => onValidationChange(shift.id, s) : undefined}
              size="xs"
            />
          </div>
        )}

        {/* Three dots menu usando Popover - Solución definitiva - OCULTO en modo readOnly */}
        {!readOnly && (
          <div
            className={
              `absolute ${isMultipleShifts ? 'top-0 right-0' : 'top-1 right-1'} ` +
              'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto'
            }
          >
            <Popover open={showMenu} onOpenChange={setShowMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isMultipleShifts ? 'h-3 w-3' : 'h-5 w-5'} p-0 hover:bg-gray-200 transition-all`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className={`${isMultipleShifts ? 'h-2 w-2' : 'h-3.5 w-3.5'} text-gray-600`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-0 bg-white shadow-xl border border-border/50"
                align="end"
                side="bottom"
                sideOffset={4}
                avoidCollisions={true}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="py-1">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDetails(shift);
                      setShowMenu(false);
                    }}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Mostrar detalles</span>
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(shift);
                      setShowMenu(false);
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                    <span>Editar</span>
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(shift);
                      setShowMenu(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Add shift button - Centered on bottom border, appears on hover - OCULTO en modo readOnly */}
        {onAddShift && !readOnly && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              className={`${isMultipleShifts ? 'h-3 w-3' : 'h-4 w-4'} p-0 bg-white border border-orange-400 hover:bg-orange-50 rounded-full transition-all shadow-sm`}
              onClick={(e) => {
                e.stopPropagation();
                onAddShift(employee, new Date(shift.date), e);
              }}
            >
              <Plus className={`${isMultipleShifts ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5'} text-orange-600`} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}