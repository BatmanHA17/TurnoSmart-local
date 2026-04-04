/**
 * CalendarDayCell — Extracted from GoogleCalendarStyle.tsx (Phase 3 split)
 * Renders a single day cell for an employee in the calendar grid.
 */
import React from "react";
import { format, isSameDay } from "date-fns";
import { Plus } from "lucide-react";
import { ShiftCard } from "../ShiftCard";
import { DragDropZones } from "../DragDropZones";
import { TimeSlotRectangles } from "../TimeSlotRectangles";
import { AuditCellHighlight } from "@/components/audit";
import { AuditViolationTooltip } from "@/components/audit/AuditViolationTooltip";
import { getTagObjects } from "@/utils/engine/smartTags";
import { toast } from "@/hooks/use-toast";
import type { CalendarEmployee } from "./calendarTypes";
import type { ShiftBlock } from "@/utils/calendarShiftUtils";
import type { AuditViolation } from "@/types/audit";

export interface CalendarDayCellProps {
  employee: CalendarEmployee;
  day: Date;
  dayIndex: number;
  shifts: ShiftBlock[];
  isSelected: boolean;
  hasAbsenceToday: boolean;
  // Audit
  cellViolations: AuditViolation[];
  cellSeverity: 'error' | 'warning' | 'info' | null;
  // Drag state
  dragOverCell: string | null;
  isDragging: boolean;
  hoveredZone: 'move' | 'duplicate' | null;
  // Permissions
  canEdit: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  isPublished: boolean;
  // UI toggles
  showTimeSlots: boolean;
  selectedShifts: Set<string>;
  colaboradores: any[];
  // Handlers
  onCellClick: (employee: CalendarEmployee, day: Date, e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, employeeId: string, day: Date) => void;
  onDragEnter: (employeeId: string, day: Date) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onShiftSelect: (shiftId: string) => void;
  onToggleLock: (shift: ShiftBlock, e: React.MouseEvent) => void;
  onAddShift: ((employee: CalendarEmployee, day: Date, e: React.MouseEvent) => void) | undefined;
  onTimeSlotClick: (employee: CalendarEmployee, day: Date, shiftIndex: number, e: React.MouseEvent, absenceCode?: string) => void;
  onShowDetails: (shift: ShiftBlock, employee: CalendarEmployee) => void;
  onEditShift: (shift: ShiftBlock) => void;
  onDeleteShift: (shift: ShiftBlock) => void;
  setHoveredZone: (zone: 'move' | 'duplicate' | null) => void;
  setCurrentDropAction: (action: 'move' | 'duplicate' | null) => void;
  // Utils
  isPostPubEdited: (employeeId: string, dateKey: string) => boolean;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = React.memo(({
  employee,
  day,
  dayIndex,
  shifts,
  isSelected,
  hasAbsenceToday,
  cellViolations,
  cellSeverity,
  dragOverCell,
  isDragging,
  hoveredZone,
  canEdit,
  isManager,
  isAdmin,
  isOwner,
  isEmployee,
  isPublished,
  showTimeSlots,
  selectedShifts,
  colaboradores,
  onCellClick,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onShiftSelect,
  onToggleLock,
  onAddShift,
  onTimeSlotClick,
  onShowDetails,
  onEditShift,
  onDeleteShift,
  setHoveredZone,
  setCurrentDropAction,
  isPostPubEdited,
}) => {
  const dayKey = format(day, "yyyy-MM-dd");
  const cellDragKey = `${employee.id}-${dayKey}`;

  return (
    <td
      key={dayIndex}
      id={`cell-${employee.id}-${dayKey}`}
      className={`p-0.5 sm:p-1 text-center cursor-pointer hover:bg-muted/30 relative h-14 sm:h-16 md:h-20 transition-all ${isSelected ? "bg-muted/40" : ""} ${hasAbsenceToday ? "bg-green-100" : ""} ${
        dragOverCell === cellDragKey ? 'bg-blue-100' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-shift-card]')) return;
        onCellClick(employee, day, e);
      }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-shift-card]')) e.stopPropagation();
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, employee.id, day)}
      onDragEnter={() => onDragEnter(employee.id, day)}
      onDragLeave={onDragLeave}
    >
      <AuditCellHighlight severity={cellSeverity} className="h-full w-full">
        {/* Drag-drop zones when dragging */}
        {(canEdit || isManager) && isDragging && dragOverCell === cellDragKey && (
          <DragDropZones
            isActive={true}
            hoveredZone={hoveredZone}
            onMoveHover={(isHovering) => setHoveredZone(isHovering ? 'move' : null)}
            onDuplicateHover={(isHovering) => setHoveredZone(isHovering ? 'duplicate' : null)}
            onDragOver={(e) => {
              e.preventDefault();
              const target = e.target as HTMLElement;
              const dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');
              if (dropAction === 'move') setHoveredZone('move');
              else if (dropAction === 'duplicate') setHoveredZone('duplicate');
              setCurrentDropAction(dropAction as 'move' | 'duplicate' || 'move');
            }}
            onDrop={(e) => onDrop(e, employee.id, day)}
          />
        )}

        {shifts.length > 0 ? (
          <AuditViolationTooltip violations={cellViolations}>
            <div className="h-full w-full space-y-0.5 relative">
              {/* Violation dot */}
              {cellViolations.length > 0 && (
                <div className={`absolute top-0 right-0 w-2 h-2 rounded-full z-10 ${
                  cellSeverity === 'error' ? 'bg-destructive' :
                  cellSeverity === 'warning' ? 'bg-amber-500' : 'bg-primary'
                }`} />
              )}
              {/* Post-publication edit indicator */}
              {isPostPubEdited(employee.id, dayKey) && (
                <div className="absolute top-0 left-0 w-2 h-2 rounded-full z-10 bg-blue-500" title="Editado post-publicación" />
              )}
              {/* SMART tag dots */}
              {shifts.some(s => s.notes && getTagObjects(s.notes).length > 0) && (
                <div
                  className="absolute bottom-0 left-0 z-10 flex gap-0.5 p-0.5"
                  title={shifts.flatMap(s => getTagObjects(s.notes).map(t => t.label)).join(' ')}
                >
                  {shifts.flatMap(s => getTagObjects(s.notes)).slice(0, 2).map((tag, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  ))}
                </div>
              )}

              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className={`${shifts.length > 1 ? 'h-8' : 'h-full'} w-full relative`}
                  onContextMenu={(e) => (canEdit || isManager) ? onToggleLock(shift, e) : e.preventDefault()}
                >
                  {/* Lock icon */}
                  {shift.locked && (
                    <div className="absolute top-0.5 right-0.5 z-30 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-500 drop-shadow">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <ShiftCard
                    shift={shift}
                    employee={employee}
                    shiftsCount={shifts.length}
                    isSelected={selectedShifts.has(shift.id)}
                    onSelect={onShiftSelect}
                    onShowDetails={(s) => {
                      if (isPublished && !isEmployee) {
                        toast({
                          title: "Turno publicado. No es posible editar",
                          description: "Debes despublicar el calendario primero para editar turnos",
                          variant: "destructive",
                        });
                        return;
                      }
                      onShowDetails(s, employee);
                    }}
                    onEdit={(s) => {
                      if (isPublished) {
                        toast({
                          title: "Calendario publicado",
                          description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
                          variant: "destructive",
                        });
                        return;
                      }
                      onEditShift(s);
                    }}
                    onDelete={(s) => {
                      if (isPublished) {
                        toast({
                          title: "Calendario publicado",
                          description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
                          variant: "destructive",
                        });
                        return;
                      }
                      onDeleteShift(s);
                    }}
                    onAddShift={onAddShift ? () => onAddShift(employee, day, {} as React.MouseEvent) : undefined}
                    readOnly={(isEmployee && !isManager && !isAdmin && !isOwner) || isPublished}
                  />
                </div>
              ))}
            </div>
          </AuditViolationTooltip>
        ) : (
          <div className="h-full relative group">
            {/* Time slot rectangles */}
            {showTimeSlots && (
              <TimeSlotRectangles
                onSlotClick={(shiftIndex, e, absenceCode) => onTimeSlotClick(employee, day, shiftIndex, e, absenceCode)}
              />
            )}

            {/* "Primer día" badge */}
            {(() => {
              const empleadoColaborador = colaboradores.find(c => c.id === employee.id);
              const fechaInicioContrato = empleadoColaborador?.fecha_inicio_contrato;

              if (fechaInicioContrato) {
                const fechaInicio = new Date(fechaInicioContrato);
                if (isSameDay(day, fechaInicio) && shifts.length === 0) {
                  return (
                    <div key={`primer-dia-${employee.id}-${dayKey}`} className="absolute top-1 left-1 right-1 z-10 pointer-events-none">
                      <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 shadow-sm border border-gray-200">
                        <span className="text-xs">👋</span>
                        <span className="text-[10px] font-medium text-gray-600">Primer día</span>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Invisible hover zone for adding shifts */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddShift) onAddShift(employee, day, e);
              }}
            />
            {/* + symbol on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white/95 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-md border border-gray-200 hover:border-gray-300">
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600" />
              </div>
            </div>
          </div>
        )}
      </AuditCellHighlight>
    </td>
  );
});

CalendarDayCell.displayName = 'CalendarDayCell';
