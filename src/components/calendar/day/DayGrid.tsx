import { useMemo, useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { ShiftCard } from "@/components/ShiftCard";
import { ShiftSelectorPopup } from "@/components/ShiftSelectorPopup";
import { ShiftDetailsPanel } from "@/components/ShiftDetailsPanel";
import { AdvancedShiftDialog } from "@/components/AdvancedShiftDialog";
import { DeleteShiftConfirmation } from "@/components/DeleteShiftConfirmation";
import { DeleteZone } from "@/components/DragDropZones";
import { TOTAL_SLOTS_PER_DAY } from "@/constants/dayCalendar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeViewPermissions } from "@/hooks/useEmployeeViewPermissions";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
}

interface AdvancedEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
}

interface DayGridProps {
  employees: Employee[];
  selectedDate: Date;
  shifts: ShiftBlockDay[];
  onUpdate: (shiftId: string, updates: Partial<ShiftBlockDay>) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
  onCreate?: (employeeId: string, date: Date, shiftData: any) => Promise<void>;
  readOnly?: boolean;
  isPublished?: boolean;
}

export function DayGrid({ employees, selectedDate, shifts, onUpdate, onDelete, onCreate, readOnly = false, isPublished = false }: DayGridProps) {
  // 🔒 FASE 1: Obtener permisos de vista según rol
  const permissions = useEmployeeViewPermissions();
  
  const [showShiftSelector, setShowShiftSelector] = useState<{position: {x: number, y: number}, employeeId: string, date: Date} | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<{employeeId: string, date: Date} | null>(null);
  const [showShiftDetails, setShowShiftDetails] = useState<{shift: any, employee: any} | null>(null);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<any>(null);
  
  // Estado para almacenar fechas de inicio de contrato
  const [contractStartDates, setContractStartDates] = useState<Record<string, string>>({});
  
  // Drag & Drop states - Simplificado
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isDeleteZoneHovered, setIsDeleteZoneHovered] = useState(false);
  
  // 🔒 EMPLOYEE no puede editar - combinamos con readOnly y publicación
  const effectiveReadOnly = readOnly || !permissions.canEditShifts || isPublished;

  // Cargar fechas de inicio de contrato de los empleados
  useEffect(() => {
    const loadContractDates = async () => {
      if (!employees.length) return;
      
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, fecha_inicio_contrato')
        .in('id', employees.map(e => e.id));
      
      if (error) {
        console.error('Error loading contract dates:', error);
        return;
      }
      
      const dates: Record<string, string> = {};
      data?.forEach(emp => {
        if (emp.fecha_inicio_contrato) {
          dates[emp.id] = emp.fecha_inicio_contrato;
        }
      });
      
      setContractStartDates(dates);
    };
    
    loadContractDates();
  }, [employees]);

  // Calculate current time position (only if selected date is today)
  const nowPosition = useMemo(() => {
    const now = new Date();
    const isToday = format(now, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    
    if (!isToday) return null;
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const percentage = (totalMinutes / (24 * 60)) * 100;
    
    return percentage;
  }, [selectedDate]);

  // Convert Employee to AdvancedEmployee format
  const mapToAdvancedEmployee = (emp: Employee): AdvancedEmployee => ({
    id: emp.id,
    name: `${emp.nombre} ${emp.apellidos}`,
    role: 'Empleado',
    department: 'General',
    workingHours: '0h/40h'
  });

  // Convert ShiftBlockDay to ShiftCard format
  const mapShiftToCardFormat = (shift: ShiftBlockDay) => ({
    id: shift.id,
    date: shift.date,
    name: shift.shift_name,
    startTime: shift.start_time,
    endTime: shift.end_time,
    color: shift.color,
    hasBreak: !!shift.break_duration,
    breaks: shift.break_duration ? [{
      id: '1',
      type: 'Pausa',
      duration: shift.break_duration,
      isPaid: false
    }] : [],
    notes: shift.notes,
    employee_id: shift.employee_id,
    shift_name: shift.shift_name,
    start_time: shift.start_time,
    end_time: shift.end_time,
    break_duration: shift.break_duration,
    slotStart: shift.slotStart,
    slotEnd: shift.slotEnd,
    isOvernight: shift.isOvernight
  });

  const handleCellClick = (e: React.MouseEvent, employeeId: string, date: Date) => {
    // 🔒 Bloquear si no tiene permisos de creación
    if (effectiveReadOnly || !permissions.canCreateShifts) {
      if (isPublished && !permissions.isEmployee) {
        toast({
          title: "Turno publicado. No es posible editar",
          description: "Debes despublicar el calendario primero",
          variant: "destructive"
        });
      }
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setShowShiftSelector({
      position: { x: e.clientX, y: e.clientY },
      employeeId,
      date
    });
  };

  const handleShiftSelected = async (shiftData: any) => {
    if (!showShiftSelector || !onCreate) return;
    
    const { employeeId, date } = showShiftSelector;
    
    await onCreate(employeeId, date, shiftData);
    setShowShiftSelector(null);
  };

  const handleAdvancedOptions = () => {
    if (!showShiftSelector) return;
    
    setShowAdvancedOptions({
      employeeId: showShiftSelector.employeeId,
      date: showShiftSelector.date
    });
    setShowShiftSelector(null);
  };

  const handleShowDetails = (shift: any, employee: Employee) => {
    // 🔒 Si está publicado, mostrar advertencia para roles con permisos
    if (isPublished && !permissions.isEmployee) {
      toast({
        title: "Turno publicado. No es posible editar",
        description: "Debes despublicar el calendario primero para editar turnos",
        variant: "destructive"
      });
      return;
    }
    // ✅ Siempre permitir ver detalles, pero el panel respetará permisos
    setShowShiftDetails({ shift, employee });
  };

  const handleEditShift = (shift: any) => {
    // 🔒 Solo permitir si tiene permisos de edición
    if (!permissions.canEditShifts) {
      toast({
        title: "Acción no permitida",
        description: "No tienes permisos para editar turnos",
        variant: "destructive"
      });
      return;
    }
    setEditingShift(shift);
  };

  const handleDeleteShift = (shift: any) => {
    // 🔒 Solo permitir si tiene permisos de eliminación
    if (!permissions.canDeleteShifts) {
      toast({
        title: "Acción no permitida",
        description: "No tienes permisos para eliminar turnos",
        variant: "destructive"
      });
      return;
    }
    setShowDeleteConfirmation(shift);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirmation) {
      await onDelete(showDeleteConfirmation.id);
      setShowDeleteConfirmation(null);
    }
  };

  // Drag & Drop Handlers - Para cambio de horario horizontal
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetEmployeeId: string, targetDate: Date) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setShowDeleteZone(false);

    // 🔒 Verificar permisos antes de permitir drop
    if (effectiveReadOnly || !permissions.canEditShifts) {
      toast({
        title: "Acción no permitida",
        description: permissions.isEmployee 
          ? "No tienes permisos para mover turnos" 
          : "No se pueden realizar cambios en un calendario publicado",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const dragData = JSON.parse(data);
      
      // Permitir drag para cambio de horario y empleado
      if (dragData.shift) {
        const shift = dragData.shift;
        
        // Calcular nueva hora basada en la posición del drop
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const totalWidth = rect.width;
        
        // Calcular el slot (30 min cada uno) basado en la posición
        const percentage = clickX / totalWidth;
        const totalMinutes = percentage * 24 * 60;
        const newStartSlot = Math.round(totalMinutes / 30);
        
        // Calcular duración del turno en slots
        const currentShift = shifts.find(s => s.id === shift.id);
        if (!currentShift) return;
        
        const duration = currentShift.slotEnd - currentShift.slotStart;
        const newEndSlot = newStartSlot + duration;
        
        // Validar que no se salga del día
        if (newStartSlot >= 0 && newEndSlot <= 48) {
          // Convertir slots a tiempo HH:MM
          const startHour = Math.floor(newStartSlot / 2);
          const startMinute = (newStartSlot % 2) * 30;
          const endHour = Math.floor(newEndSlot / 2);
          const endMinute = (newEndSlot % 2) * 30;
          
          const newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
          const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
          
          // Preparar actualizaciones
          const updates: any = {
            start_time: newStartTime,
            end_time: newEndTime
          };
          
          // Si se cambió de empleado, actualizar employee_id
          if (targetEmployeeId !== dragData.sourceEmployeeId) {
            updates.employee_id = targetEmployeeId;
          }
          
          await onUpdate(shift.id, updates);

          toast({
            title: "Turno actualizado",
            description: targetEmployeeId !== dragData.sourceEmployeeId 
              ? `Turno movido y nuevo horario: ${newStartTime.slice(0, 5)} - ${newEndTime.slice(0, 5)}`
              : `Nuevo horario: ${newStartTime.slice(0, 5)} - ${newEndTime.slice(0, 5)}`
          });
        }
      }
    } catch (error) {
      console.error('Error en drop:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el turno",
        variant: "destructive"
      });
    }
  };

  const handleDeleteZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setShowDeleteZone(false);
    setIsDragging(false);
    setIsDeleteZoneHovered(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const dragData = JSON.parse(data);
      
      if (dragData.shift && dragData.shift.id) {
        await onDelete(dragData.shift.id);
        
        toast({
          title: "Turno eliminado",
          description: "El turno se eliminó correctamente"
        });
      }
    } catch (error) {
      console.error('Error eliminando turno:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el turno",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="relative min-w-max">
        {/* Current time red line - across all employees */}
        {nowPosition !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-lg"
            style={{ left: `${nowPosition}%` }}
          >
            <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md" />
          </div>
        )}

        {/* Employee rows */}
        <div className="divide-y divide-border">
          {employees.map((employee) => {
            const dayShifts = shifts.filter(
              s => s.employee_id === employee.id
            );
            
            return (
              <div
                key={employee.id}
                className="relative h-[68px] hover:bg-accent/20 transition-colors flex"
              >
                {/* Single day column */}
                <div 
                  className="flex-1 relative cursor-pointer" 
                  style={{ minWidth: '100%', width: '100%' }}
                  onClick={(e) => {
                    // Solo abrir selector si no se clickeó en un shift
                    if (!(e.target as HTMLElement).closest('[data-shift-card]')) {
                      handleCellClick(e, employee.id, selectedDate);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, employee.id, selectedDate)}
                >
                  {/* Grid background (24 hours) */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div
                        key={hour}
                        className="flex-1 border-r border-border/20 relative"
                      >
                        {/* 30-minute subdivision */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/10" />
                      </div>
                    ))}
                  </div>

                  {/* Shift blocks for this day */}
                  <div className="absolute inset-0">
                    {dayShifts.length === 0 && (() => {
                      // Mostrar mensaje "Primer día" solo si es el día de inicio del contrato y no hay turnos
                      const contractStartDate = contractStartDates[employee.id];
                      if (contractStartDate) {
                        const startDate = new Date(contractStartDate);
                        const isFirstDay = isSameDay(selectedDate, startDate);
                        
                        if (isFirstDay) {
                          return (
                            <div 
                              key={`primer-dia-${employee.id}-${format(selectedDate, 'yyyy-MM-dd')}`} 
                              className="absolute top-2 left-2 z-10 pointer-events-none"
                            >
                              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border border-gray-200">
                                <span className="text-xs">👋</span>
                                <span className="text-[10px] font-medium text-gray-600">Primer día</span>
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                    
                    {dayShifts.map((shift) => {
                      // Calcular posición basada en slots
                      const startMinutes = shift.slotStart * 30;
                      const endMinutes = shift.slotEnd * 30;
                      const leftPercentage = (startMinutes / 1440) * 100;
                      const widthPercentage = ((endMinutes - startMinutes) / 1440) * 100;
                      
                      return (
                        <div
                          key={shift.id}
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${leftPercentage}%`,
                            width: `${widthPercentage}%`
                          }}
                        >
                          <ShiftCard
                            shift={mapShiftToCardFormat(shift)}
                            employee={employee}
                            onShowDetails={(s) => handleShowDetails(s, employee)}
                            // 🔒 Solo pasar handlers si tiene permisos
                            onEdit={permissions.canEditShifts ? handleEditShift : undefined}
                            onDelete={permissions.canDeleteShifts ? handleDeleteShift : undefined}
                            onSelect={permissions.canEditShifts ? handleEditShift : undefined}
                            onAddShift={permissions.canCreateShifts && !effectiveReadOnly ? (emp, date, e) => {
                              if (e) {
                                handleCellClick(e as React.MouseEvent, emp.id, selectedDate);
                              }
                            } : undefined}
                            // 🔒 Drag & Drop deshabilitado si no tiene permisos
                            onDragStart={permissions.canDragShifts ? () => {
                              setIsDragging(true);
                              setShowDeleteZone(true);
                            } : undefined}
                            onDragEnd={permissions.canDragShifts ? () => {
                              setIsDragging(false);
                              setShowDeleteZone(false);
                            } : undefined}
                            readOnly={effectiveReadOnly}
                            shiftsCount={dayShifts.length}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift Selector Popup */}
      {showShiftSelector && (
        <ShiftSelectorPopup
          isOpen={true}
          onClose={() => setShowShiftSelector(null)}
          onShiftSelected={handleShiftSelected}
          onAdvancedOptions={handleAdvancedOptions}
          position={showShiftSelector.position}
        />
      )}

      {/* Advanced Shift Dialog */}
      {showAdvancedOptions && onCreate && (() => {
        const emp = employees.find(e => e.id === showAdvancedOptions.employeeId);
        return emp ? (
          <AdvancedShiftDialog
            isOpen={true}
            onClose={() => setShowAdvancedOptions(null)}
            employee={mapToAdvancedEmployee(emp)}
            date={showAdvancedOptions.date}
            onShiftAssigned={async (shiftData) => {
              await onCreate(showAdvancedOptions.employeeId, showAdvancedOptions.date, shiftData);
              setShowAdvancedOptions(null);
            }}
          />
        ) : null;
      })()}

      {/* Shift Details Panel */}
      {showShiftDetails && (
        <ShiftDetailsPanel
          isOpen={true}
          onClose={() => setShowShiftDetails(null)}
          shift={showShiftDetails.shift}
          employee={showShiftDetails.employee}
          // 🔒 Solo pasar handlers si tiene permisos
          onEdit={permissions.canEditShifts ? (shift) => {
            setEditingShift(shift);
            setShowShiftDetails(null);
          } : undefined}
          onDelete={permissions.canDeleteShifts ? (shift) => {
            setShowDeleteConfirmation(shift);
            setShowShiftDetails(null);
          } : undefined}
          onDuplicate={permissions.canCreateShifts ? (shift) => {
          } : undefined}
        />
      )}

      {/* Edit Shift Dialog */}
      {editingShift && (() => {
        const emp = employees.find(e => e.id === editingShift.employee_id);
        return emp ? (
          <AdvancedShiftDialog
            isOpen={true}
            onClose={() => setEditingShift(null)}
            employee={mapToAdvancedEmployee(emp)}
            date={new Date(editingShift.date)}
            editingShift={editingShift}
            onShiftAssigned={async (shiftData) => {
              await onUpdate(editingShift.id, shiftData);
              setEditingShift(null);
            }}
          />
        ) : null;
      })()}

      {/* Delete Confirmation */}
      {showDeleteConfirmation && (
        <DeleteShiftConfirmation
          isOpen={true}
          onClose={() => setShowDeleteConfirmation(null)}
          onConfirm={confirmDelete}
          shiftName={showDeleteConfirmation.shift_name}
        />
      )}

      {/* Delete Zone - Global */}
      <DeleteZone
        isVisible={showDeleteZone && isDragging}
        isDragOver={isDeleteZoneHovered}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDeleteZoneHovered(true);
        }}
        onDragLeave={() => setIsDeleteZoneHovered(false)}
        onDrop={handleDeleteZoneDrop}
      />
    </>
  );
}

