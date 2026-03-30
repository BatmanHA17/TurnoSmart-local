import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Plus, MoreVertical, UserPlus, X, Check, ArrowUpDown, Clock, Info, PiggyBank, Coffee, Settings, Trash2, Grid3X3, Star, Save, History, Shield, AlertTriangle } from "lucide-react";
import type { ApprovedRequest } from "./TeamCalendar";
import { AddEmployeesToCalendarDialog } from "./AddEmployeesToCalendarDialog";
import { DragDropZones, DeleteZone } from "./DragDropZones";
import { useSelectedEmployees } from "@/hooks/useSelectedEmployees";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, getWeek } from "date-fns";
import { es } from "date-fns/locale";
import { UnifiedCalendarHeader } from "./calendar/UnifiedCalendarHeader";
import { WeekEmptyState } from "./calendar/WeekEmptyState";

import { ViewToggleButtons } from "./ViewToggleButtons";
import { AdvancedShiftDialog } from "./AdvancedShiftDialog";
import { ShiftConfigurationDialog } from "./ShiftConfigurationDialog";
import { ShiftBulkActions } from "./ShiftBulkActions";
import { ShiftDetailsPanel } from "./ShiftDetailsPanel";
import { TurnoSmartShiftDetailsPanel } from "./TurnoSmartShiftDetailsPanel";
import { DeleteShiftConfirmation } from "./DeleteShiftConfirmation";
import { ShiftSelectorPopup } from "./ShiftSelectorPopup";
import { ShiftCard } from "./ShiftCard";
import { TimeSlotRectangles } from "./TimeSlotRectangles";
import { CleanShiftsDialog } from "./CleanShiftsDialog";
import { getSavedShifts, getSavedShiftsSync, SavedShift } from "@/store/savedShiftsStore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { EmployeeCompensatoryBalance } from "./EmployeeCompensatoryBalance";
import { FavoritesArea, defaultAbsenceShifts, getCustomAbsences } from "./FavoritesArea";
import { useFavoriteShifts } from "@/hooks/useFavoriteShifts";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCalendarVersions } from "@/hooks/useCalendarVersions";
import { useCalendarPublishState } from "@/hooks/useCalendarPublishState";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useCalendarEmployeeFilter } from "@/hooks/useCalendarEmployeeFilter";
import { useEmployeeSortOrder } from "@/hooks/useEmployeeSortOrder";

import { VersionHistoryDialog } from "./calendar/VersionHistoryDialog";
import { OperationBackupsDialog } from "./calendar/OperationBackupsDialog";
import { ConfirmationDialog } from "./calendar/ConfirmationDialog";
import { DuplicateWeekDialog } from "./calendar/DuplicateWeekDialog";
import { useDataProtection } from "@/hooks/useDataProtection";
import { useDataPersistence } from "@/hooks/useDataPersistence";
import { ConnectionStatusBanner } from "./ConnectionStatusBanner";
import { EmployeeSortingSheet } from "./EmployeeSortingSheet";
import { CalendarActionButtons } from "./CalendarActionButtons";
import { CalendarFullScreenView } from "./CalendarFullScreenView";
import { CalendarStatusBadge } from "./CalendarStatusBadge";
import { useBiWeekAudit } from "@/hooks/useShiftAudit";
import { ShiftForAudit } from "@/utils/shiftAudit";
import { AuditCellHighlight, EmployeeViolationBadge } from "@/components/audit";
import { AuditViolationTooltip } from "@/components/audit/AuditViolationTooltip";
import { DailyNotesRow } from "./calendar/DailyNotesRow";
import { useDailyNotes } from "@/hooks/useDailyNotes";
import { UnassignedShiftsRow } from "./calendar/UnassignedShiftsRow";
import { useUnassignedShifts } from "@/hooks/useUnassignedShifts";
import { ICalExportButton } from "./calendar/ICalExportButton";
import { useCalendarDragDrop } from "@/hooks/useCalendarDragDrop";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  startDate?: string;
}

interface ShiftBlock {
  id: string;
  employeeId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "morning" | "afternoon" | "night" | "absence";
  color: string;
  name?: string;
  organization_id?: string;
  absenceCode?: string;
  hasBreak?: boolean;
  breaks?: any[];
  totalBreakTime?: number;
  breakType?: string;
  breakDuration?: string;
  notes?: string;
  validation_status?: 'pending' | 'validated' | 'invalidated';
}

interface BiWeeklyCalendarViewProps {
  approvedRequests?: ApprovedRequest[];
}

// VISTA DE 2 SEMANAS - 14 días
export function BiWeeklyCalendarView({ approvedRequests = [] }: BiWeeklyCalendarViewProps = {}) {
  const navigate = useNavigate();
  const { role, loading: roleLoading, isAdmin, isManager, isOwner } = useUserRoleCanonical();
  const { user } = useAuth();
  const isEmployee = role === 'EMPLOYEE';
  const canEdit = !isEmployee;
  const { org: currentOrg } = useCurrentOrganization();
  const { logActivity } = useActivityLog();
  const { favoriteShifts, addToFavorites, removeFromFavorites, isFavorite } = useFavoriteShifts();
  const { createVersion } = useCalendarVersions();
  const { createBackupBeforeOperation } = useDataProtection();
  
  // Estado para manejar los turnos asignados
  const [shiftBlocks, setShiftBlocks] = useState<ShiftBlock[]>([]);
  const isUndoRedoOperation = useRef(false);
  
  // Sistema Undo/Redo
  const {
    state: undoRedoState,
    saveState: saveUndoState,
    undo: undoBase,
    redo: redoBase,
    canUndo,
    canRedo,
    historySize,
    futureSize,
  } = useUndoRedo<ShiftBlock[]>(shiftBlocks);
  
  const undo = useCallback(() => {
    isUndoRedoOperation.current = true;
    undoBase();
  }, [undoBase]);
  
  const redo = useCallback(() => {
    isUndoRedoOperation.current = true;
    redoBase();
  }, [redoBase]);
  
  useEffect(() => {
    if (isUndoRedoOperation.current && undoRedoState !== shiftBlocks) {
      setShiftBlocks(undoRedoState);
      try {
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(undoRedoState.map(shift => ({
          ...shift,
          date: shift.date.toISOString ? shift.date.toISOString() : shift.date,
        }))));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      isUndoRedoOperation.current = false;
    }
  }, [undoRedoState, shiftBlocks]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // BI-WEEKLY: Empezar desde el lunes de la semana actual
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedCell, setSelectedCell] = useState<{employee: string, date: Date} | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [showEmployeeSortingSheet, setShowEmployeeSortingSheet] = useState(false);
  const [showAddShiftPopup, setShowAddShiftPopup] = useState<{employeeId: string, date: Date} | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<{employeeId: string, date: Date, multiDate?: boolean} | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftBlock | null>(null);
  const [showShiftConfiguration, setShowShiftConfiguration] = useState(false);
  const [showAddEmployeesDialog, setShowAddEmployeesDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState<{shift: any, employee: any} | null>(null);
  const [showTurnoSmartDetails, setShowTurnoSmartDetails] = useState<{shift: any, employee: any} | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<any>(null);
  const [showShiftSelector, setShowShiftSelector] = useState<{position: {x: number, y: number}, employeeId: string, date: Date} | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [dayCounters, setDayCounters] = useState<{[key: string]: number}>({});
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteZoneDragOver, setDeleteZoneDragOver] = useState(false);
  const [currentDropAction, setCurrentDropAction] = useState<'move' | 'duplicate' | null>(null);

  // Sprint 4.4 — cell-to-cell drag: tracks Alt/Ctrl copy-mode during drag
  const { isDragCopyMode, updateCopyMode, resetCopyMode } = useCalendarDragDrop();
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(false);
  const [hoveredZone, setHoveredZone] = useState<'move' | 'duplicate' | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showOperationBackups, setShowOperationBackups] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [draggedFavorite, setDraggedFavorite] = useState<any>(null);
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<string | null>(null);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [showDuplicateWeekDialog, setShowDuplicateWeekDialog] = useState(false);

  // BI-WEEKLY: Generar 14 días en lugar de 7
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const biWeekDays = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  // Calcular números de semana para el header
  const week1Number = getWeek(weekStart, { weekStartsOn: 1 });
  const week2Number = getWeek(addDays(weekStart, 7), { weekStartsOn: 1 });

  // Daily notes for the biweekly period
  const dailyNotesDateRange = useMemo(() => ({
    start: format(biWeekDays[0], "yyyy-MM-dd"),
    end: format(biWeekDays[13], "yyyy-MM-dd"),
  }), [biWeekDays[0].getTime()]);
  const { notes: dailyNotes, updateNote: updateDailyNote } = useDailyNotes(
    currentOrg?.id ?? "",
    dailyNotesDateRange
  );

  // Unassigned shifts (turnos sin asignar) for the biweekly period
  const { shifts: unassignedShifts, removeUnassignedShift } = useUnassignedShifts(
    currentOrg?.id ?? "",
    dailyNotesDateRange
  );

  // Publishing state
  const { 
    publishState, 
    isLoading: publishLoading, 
    publishCalendar, 
    unpublishCalendar, 
    canPublish, 
    isPublished, 
    isDraft,
  } = useCalendarPublishState(currentWeek);

  // Estado para colaboradores
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // iCal: resolve the current logged-in user's colaborador ID by email match
  const currentEmployeeId = useMemo(
    () => colaboradores.find((c: any) => c.email === user?.email)?.id as string | undefined,
    [colaboradores, user?.email]
  );

  // 🆕 Hook para sincronizar filtro de empleados eliminados entre vistas
  const { filteredEmployees } = useCalendarEmployeeFilter(employees, currentOrg?.org_id || null);

  // 🆕 Hook para sincronizar ordenamiento entre TODAS las vistas
  const { sortedEmployees, sortBy, setSortBy, resetSort, sortEmployees } = useEmployeeSortOrder(filteredEmployees);

  // BI-WEEKLY: Navegación por bloques de 2 semanas
  const goToPreviousBiWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextBiWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onSave: () => {
      if (hasUnsavedChanges) {
        saveShiftsToSupabase(shiftBlocks);
      }
    },
    enabled: canEdit,
  });
  
  // Warn before leaving with unsaved changes
  useBeforeUnload({
    when: hasUnsavedChanges && changeCount > 0,
    message: 'Tienes cambios sin guardar. ¿Seguro que quieres salir?',
  });

  // Wrapper para setShiftBlocks que guarda automáticamente en historial Undo/Redo
  const setShiftBlocksWithHistory = useCallback((updater: ShiftBlock[] | ((prev: ShiftBlock[]) => ShiftBlock[])) => {
    setShiftBlocks(prevBlocks => {
      saveUndoState(prevBlocks);
      const newBlocks = typeof updater === 'function' ? updater(prevBlocks) : updater;
      setHasUnsavedChanges(true);
      setChangeCount(prev => prev + 1);
      
      try {
        const serialized = newBlocks.map(shift => ({
          ...shift,
          date: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
        }));
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(serialized));
      } catch (error) {
        console.error('Error en backup local:', error);
      }
      
      return newBlocks;
    });
  }, [saveUndoState]);

  // BI-WEEKLY: Duplicate week handler
  const handleDuplicateWeek = useCallback(
    (source: "week1" | "week2", target: "week1" | "week2") => {
      const ws = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const week1Days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
      const week2Days = Array.from({ length: 7 }, (_, i) => addDays(ws, i + 7));

      const sourceDays = source === "week1" ? week1Days : week2Days;
      const targetDays = target === "week1" ? week1Days : week2Days;

      setShiftBlocksWithHistory((prev) => {
        const withoutTarget = prev.filter(
          (s) => !targetDays.some((d) => isSameDay(s.date, d))
        );
        const sourceShifts = prev.filter((s) =>
          sourceDays.some((d) => isSameDay(s.date, d))
        );
        const copied = sourceShifts.map((shift, idx) => {
          const srcDayIdx = sourceDays.findIndex((d) => isSameDay(shift.date, d));
          return {
            ...shift,
            id: `${shift.id}-dup-${Date.now()}-${idx}`,
            date: targetDays[srcDayIdx],
          };
        });
        return [...withoutTarget, ...copied];
      });

      toast({
        title: "Semana duplicada",
        description: `Semana ${source === "week1" ? "1" : "2"} copiada a semana ${
          target === "week1" ? "1" : "2"
        }`,
      });
      setShowDuplicateWeekDialog(false);
    },
    [currentWeek, setShiftBlocksWithHistory]
  );

  // Handler functions
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast({ title: "Exportando PDF", description: "Preparando documento para descarga..." });
  };

  const handlePublishCalendar = async (): Promise<boolean> => {
    if (!shiftBlocks || shiftBlocks.length === 0) {
      toast({
        title: "No hay turnos",
        description: "Debe haber al menos un turno para publicar el calendario",
        variant: "destructive"
      });
      return false;
    }
    const success = await publishCalendar(shiftBlocks, employees);
    return success;
  };

  const handleUnpublishCalendar = async (): Promise<boolean> => {
    const success = await unpublishCalendar();
    return success;
  };

  const handleDeleteCalendar = () => {
    toast({
      title: "Función en desarrollo",
      description: "La eliminación de calendarios estará disponible próximamente",
    });
  };

  // Save shifts to Supabase
  const saveShiftsToSupabase = async (shiftsToSave: ShiftBlock[]) => {
    try {
      for (const shift of shiftsToSave) {
        const shiftId = shift.id.startsWith('shift-') ? crypto.randomUUID() : shift.id;
        
        await supabase.from('calendar_shifts').upsert({
          id: shiftId,
          employee_id: shift.employeeId,
          date: format(shift.date, 'yyyy-MM-dd'),
          start_time: shift.startTime || null,
          end_time: shift.endTime || null,
          shift_name: shift.name || '',
          color: shift.color,
          notes: shift.notes || null,
          break_duration: shift.breakDuration || null,
          org_id: currentOrg?.org_id || null
        });
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setChangeCount(0);
      
      toast({
        title: "✅ Guardado",
        description: "Cambios guardados correctamente",
      });
    } catch (error) {
      console.error('Error saving shifts:', error);
      toast({
        title: "❌ Error",
        description: "Error al guardar los cambios",
        variant: "destructive",
      });
    }
  };

  // Función para cargar colaboradores
  const loadColaboradores = async () => {
    try {
      if (!currentOrg?.org_id) {
        setIsLoadingData(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nombre, apellidos, avatar_url, email, tiempo_trabajo_semanal, tipo_contrato, fecha_inicio_contrato, fecha_fin_contrato')
        .eq('org_id', currentOrg.org_id)
        .or(`status.eq.activo,and(status.eq.inactivo,fecha_fin_contrato.gte.${today})`)
        .order('nombre', { ascending: true });

      if (error) {
        setIsLoadingData(false);
        return;
      }

      setColaboradores(data || []);
      
      if (data && data.length > 0) {
        const mappedEmployees: Employee[] = data.map(colaborador => ({
          id: colaborador.id,
          name: `${colaborador.nombre} ${colaborador.apellidos}`,
          role: colaborador.tipo_contrato || 'Empleado',
          department: 'General',
          workingHours: colaborador.tiempo_trabajo_semanal ? `0h/${colaborador.tiempo_trabajo_semanal}h` : '0h/40h',
          startDate: colaborador.fecha_inicio_contrato || undefined
        }));
        
        // Recuperar orden manual si existe
        const savedManualOrder = localStorage.getItem('manual-employee-order');
        let finalEmployees = mappedEmployees;
        
        if (savedManualOrder) {
          try {
            const savedOrder = JSON.parse(savedManualOrder);
            const orderMap = new Map<string, number>(savedOrder.map((emp: any, index: number) => [emp.id, index]));
            
            finalEmployees = [...mappedEmployees].sort((a, b) => {
              const posA = orderMap.get(a.id) ?? -1;
              const posB = orderMap.get(b.id) ?? -1;
              
              if (posA >= 0 && posB >= 0) return posA - posB;
              if (posA >= 0) return -1;
              if (posB >= 0) return 1;
              return a.name.localeCompare(b.name);
            });
            
            setSortBy('manual');
            localStorage.setItem('calendar-sort-criteria', 'manual');
          } catch (error) {
            console.error('Error parsing manual order:', error);
            localStorage.removeItem('manual-employee-order');
          }
        }
        
        setEmployees(finalEmployees);
        localStorage.setItem('calendar-employees', JSON.stringify(mappedEmployees));
        await loadShiftsFromSupabase(mappedEmployees.map(e => e.id));
        setIsLoadingData(false);
      } else {
        setIsLoadingData(false);
      }
    } catch (error) {
      setIsLoadingData(false);
    }
  };

  // BI-WEEKLY: Cargar turnos para las 2 semanas
  useEffect(() => {
    if (currentOrg?.org_id && employees.length > 0) {
      loadShiftsFromSupabase(employees.map(e => e.id));
    }
  }, [currentWeek, currentOrg?.org_id]);

  // Cargar turnos desde Supabase para las 2 semanas
  const loadShiftsFromSupabase = async (employeeIds: string[]) => {
    try {
      if (!currentOrg?.org_id) return;

      // BI-WEEKLY: Cargar 14 días
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const biWeekEndStr = format(addDays(weekStart, 13), 'yyyy-MM-dd');

      const { data: shifts, error } = await supabase
        .from('calendar_shifts')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .gte('date', weekStartStr)
        .lte('date', biWeekEndStr);

      if (error) return;

      if (shifts && shifts.length > 0) {
        const savedShifts = await getSavedShifts();
        
        const mappedShifts: ShiftBlock[] = shifts.map(shift => {
          const savedShift = savedShifts.find(s => s.name === shift.shift_name);
          const ABSENCE_NAMES = ['Libre', 'Vacaciones', 'Enfermo', 'Falta', 'Permiso', 'Baja', 'Curso', 'Horas Sindicales', 'Sancionado'];
          const isAbsenceByName = ABSENCE_NAMES.some(name => 
            shift.shift_name.toLowerCase().includes(name.toLowerCase())
          );
          const isAbsenceByTime = !shift.start_time && !shift.end_time;
          const isAbsence = savedShift?.accessType === 'absence' || isAbsenceByName || isAbsenceByTime;
          
          return {
            id: shift.id,
            employeeId: shift.employee_id,
            date: new Date(shift.date),
            startTime: isAbsence ? undefined : shift.start_time,
            endTime: isAbsence ? undefined : shift.end_time,
            type: isAbsence ? 'absence' : 'morning',
            color: shift.color || savedShift?.color || '#86efac',
            name: savedShift?.name || shift.shift_name,
            notes: shift.notes,
            organization_id: shift.org_id,
            hasBreak: savedShift?.hasBreak || !!shift.break_duration || false,
            breakDuration: savedShift?.breakDuration || shift.break_duration || undefined,
            validation_status: (shift.validation_status as 'pending' | 'validated' | 'invalidated') || 'pending',
          };
        });

        setShiftBlocks(mappedShifts);
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(mappedShifts));
      } else {
        setShiftBlocks([]);
      }
    } catch (error) {
      console.error('Error en loadShiftsFromSupabase:', error);
    }
  };

  // Cargar colaboradores cuando org esté disponible
  useEffect(() => {
    if (!currentOrg?.org_id) return;
    loadColaboradores();
  }, [currentOrg?.org_id]);

  // Inicializar horarios guardados
  useEffect(() => {
    getSavedShifts().then(() => {});
  }, []);

  // Obtener horas semanales del colaborador
  const getWeeklyHoursFromColaborador = (employeeName: string): number => {
    const colaborador = colaboradores.find(col => 
      `${col.nombre} ${col.apellidos}`.toLowerCase().includes(employeeName.toLowerCase())
    );
    return colaborador?.tiempo_trabajo_semanal || 0;
  };

  // BI-WEEKLY: Calcular horas reales para 2 semanas
  const getBiWeeklyRealHours = (employeeId: string): number => {
    let totalHours = 0;
    
    const employeeShifts = shiftBlocks.filter(shift => 
      shift.employeeId === employeeId &&
      biWeekDays.some(day => isSameDay(shift.date, day)) &&
      shift.type !== 'absence'
    );
    
    employeeShifts.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        let startTotalMinutes = startHour * 60 + startMinute;
        let endTotalMinutes = endHour * 60 + endMinute;
        
        if (endTotalMinutes < startTotalMinutes) {
          endTotalMinutes += 24 * 60;
        }
        
        const breakMinutes = shift.breakDuration ? parseInt(shift.breakDuration) : 0;
        const durationMinutes = endTotalMinutes - startTotalMinutes - breakMinutes;
        totalHours += durationMinutes / 60;
      }
    });
    
    return Math.round(totalHours * 10) / 10;
  };

  // BI-WEEKLY: Calcular ausencias para 2 semanas
  const getBiWeeklyAbsenceHours = (employeeId: string): number => {
    let totalAbsenceHours = 0;
    
    const employeeAbsences = shiftBlocks.filter(shift => 
      shift.employeeId === employeeId &&
      biWeekDays.some(day => isSameDay(shift.date, day)) &&
      shift.type === 'absence'
    );
    
    employeeAbsences.forEach(() => {
      totalAbsenceHours += 8;
    });
    
    return totalAbsenceHours;
  };

  // Handler para cambiar el estado de validación de un turno (Sprint 2.3)
  const handleValidationChange = useCallback(async (shiftId: string, newStatus: 'pending' | 'validated' | 'invalidated') => {
    // Actualización optimista en estado local
    setShiftBlocks(prev => prev.map(s =>
      s.id === shiftId ? { ...s, validation_status: newStatus } : s
    ));

    const { error } = await supabase
      .from('calendar_shifts')
      .update({ validation_status: newStatus })
      .eq('id', shiftId);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado de validación", variant: "destructive" });
    }
  }, []);

  // Obtener turnos para empleado y fecha
  const getShiftsForEmployeeAndDate = (employeeId: string, date: Date): ShiftBlock[] => {
    return shiftBlocks.filter(shift => 
      shift.employeeId === employeeId && isSameDay(shift.date, date)
    );
  };

  // Handler para click en celda
  const handleCellClick = (employee: Employee, day: Date, e: React.MouseEvent) => {
    if (!canEdit) return;
    if (isPublished) {
      toast({
        title: "Calendario publicado",
        description: "No se pueden realizar cambios en un calendario publicado.",
        variant: "destructive",
      });
      return;
    }
    
    setShowShiftSelector({
      position: { x: e.clientX, y: e.clientY },
      employeeId: employee.id,
      date: day
    });
  };

  // Handler para seleccionar turno
  const handleShiftSelected = async (shift: SavedShift) => {
    if (!showShiftSelector) return;
    
    const employeeId = showShiftSelector.employeeId;
    const dateStr = format(showShiftSelector.date, 'yyyy-MM-dd');
    
    // Primero eliminar turno existente para evitar duplicados
    await supabase.from('calendar_shifts')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', dateStr);
    
    const newId = crypto.randomUUID();
    const newShift: ShiftBlock = {
      id: newId,
      employeeId: employeeId,
      date: showShiftSelector.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      type: shift.accessType === 'absence' ? 'absence' : 'morning',
      color: shift.color || '#86efac',
      name: shift.name,
      organization_id: currentOrg?.org_id || 'default',
      hasBreak: shift.hasBreak,
      breakDuration: shift.breakDuration,
    };
    
    // Actualizar estado local: eliminar turnos anteriores del mismo empleado+fecha
    setShiftBlocksWithHistory(prev => {
      const filtered = prev.filter(s => 
        !(s.employeeId === employeeId && isSameDay(s.date, showShiftSelector.date))
      );
      return [...filtered, newShift];
    });
    
    // Insertar nuevo turno
    try {
      await supabase.from('calendar_shifts').insert({
        id: newId,
        employee_id: newShift.employeeId,
        date: dateStr,
        start_time: newShift.startTime || null,
        end_time: newShift.endTime || null,
        shift_name: newShift.name || '',
        color: newShift.color,
        break_duration: newShift.breakDuration || null,
        org_id: currentOrg?.org_id,
      });
    } catch (error) {
      console.error('Error guardando turno:', error);
    }
    
    setShowShiftSelector(null);
  };

  // Eliminar turno
  const handleDeleteShift = async (shiftId: string) => {
    await supabase.from('calendar_shifts').delete().eq('id', shiftId);
    setShiftBlocksWithHistory(prev => prev.filter(s => s.id !== shiftId));
  };

  // Función para verificar si se puede asignar turno en una fecha específica
  const canAssignShiftOnDate = (employeeId: string, targetDate: Date): boolean => {
    const colaborador = colaboradores.find(c => c.id === employeeId);
    if (!colaborador) return false;
    if (!colaborador.fecha_inicio_contrato) return true;
    
    const startDate = new Date(colaborador.fecha_inicio_contrato);
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    if (colaborador.fecha_fin_contrato) {
      const endDate = new Date(colaborador.fecha_fin_contrato);
      const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return contractStart <= target && target <= contractEnd;
    }
    
    return contractStart <= target;
  };

  // Adaptar turno al contrato del empleado
  const adaptShiftToContract = (shift: SavedShift, targetEmployeeId: string) => {
    const targetColaborador = colaboradores.find(c => c.id === targetEmployeeId);
    const contractHours = targetColaborador?.tiempo_trabajo_semanal 
      ? Math.round(targetColaborador.tiempo_trabajo_semanal / 5)
      : 8;

    if (shift.accessType === 'absence' || !shift.startTime || !shift.endTime) {
      return { startTime: shift.startTime, endTime: shift.endTime, adapted: false, originalHours: 0, adaptedHours: 0 };
    }

    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const endTotalMinutes = (startHour * 60 + startMinute) + (contractHours * 60);
    const endHour = Math.floor(endTotalMinutes / 60) % 24;
    const endMin = endTotalMinutes % 60;
    
    return {
      startTime: shift.startTime,
      endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
      adapted: true,
      originalHours: 0,
      adaptedHours: contractHours
    };
  };

  // Adaptar shift block al contrato
  const adaptShiftBlockToContract = (shift: ShiftBlock, sourceEmployeeId: string, targetEmployeeId: string) => {
    if (!shift.startTime || !shift.endTime || shift.type === 'absence') {
      return { startTime: shift.startTime, endTime: shift.endTime, adapted: false, originalHours: 0, adaptedHours: 0 };
    }

    const sourceColaborador = colaboradores.find(c => c.id === sourceEmployeeId);
    const targetColaborador = colaboradores.find(c => c.id === targetEmployeeId);
    
    const sourceContractHours = sourceColaborador?.tiempo_trabajo_semanal ? Math.round(sourceColaborador.tiempo_trabajo_semanal / 5) : 8;
    const targetContractHours = targetColaborador?.tiempo_trabajo_semanal ? Math.round(targetColaborador.tiempo_trabajo_semanal / 5) : 8;

    if (sourceContractHours === targetContractHours) {
      return { startTime: shift.startTime, endTime: shift.endTime, adapted: false, originalHours: sourceContractHours, adaptedHours: targetContractHours };
    }

    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    const newEndTime = new Date(startTime.getTime() + (targetContractHours * 60 * 60 * 1000));
    
    return {
      startTime: shift.startTime,
      endTime: `${newEndTime.getHours().toString().padStart(2, '0')}:${newEndTime.getMinutes().toString().padStart(2, '0')}`,
      adapted: true,
      originalHours: sourceContractHours,
      adaptedHours: targetContractHours
    };
  };

  // Persistir turno en Supabase (elimina existente para evitar duplicados)
  const persistShiftToSupabase = async (shift: ShiftBlock) => {
    try {
      const dateStr = format(shift.date, 'yyyy-MM-dd');
      
      // Eliminar turno existente para este empleado+fecha
      await supabase.from('calendar_shifts')
        .delete()
        .eq('employee_id', shift.employeeId)
        .eq('date', dateStr);
      
      // Insertar el nuevo turno
      await supabase.from('calendar_shifts').insert({
        id: shift.id,
        employee_id: shift.employeeId,
        date: dateStr,
        start_time: shift.startTime || null,
        end_time: shift.endTime || null,
        shift_name: shift.name || '',
        color: shift.color,
        notes: shift.notes || null,
        break_duration: shift.breakDuration || null,
        org_id: currentOrg?.org_id || null
      });
      return true;
    } catch (error) {
      console.error('Error persistiendo turno:', error);
      return false;
    }
  };

  // Eliminar turno de Supabase
  const deleteShiftFromSupabase = async (shiftId: string) => {
    try {
      await supabase.from('calendar_shifts').delete().eq('id', shiftId);
      return true;
    } catch (error) {
      console.error('Error eliminando turno:', error);
      return false;
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');

    if (dropAction === 'move' || dropAction === 'duplicate') {
      e.dataTransfer.dropEffect = dropAction === 'move' ? 'move' : 'copy';
      setCurrentDropAction(dropAction as 'move' | 'duplicate');
    } else {
      // Sprint 4.4: Alt/Ctrl held → copy mode; otherwise move
      updateCopyMode(e);
      setCurrentDropAction(e.altKey || e.ctrlKey ? 'duplicate' : 'move');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetEmployeeId: string, targetDate: Date) => {
    e.preventDefault();
    if (!e.isTrusted) return;
    
    const dragDataRaw = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('application/json');
    if (!dragDataRaw) return;
    
    setDragOverCell(null);
    setIsDragging(false);
    setHoveredZone(null);
    
    if (!canAssignShiftOnDate(targetEmployeeId, targetDate)) {
      toast({ title: "Fecha inválida", description: "No se puede asignar turno en esta fecha.", variant: "destructive" });
      return;
    }
    
    // Handle favorite drop
    if (draggedFavorite) {
      const adaptedTimes = adaptShiftToContract(draggedFavorite, targetEmployeeId);
      const isAbsence = draggedFavorite.accessType === 'absence';
      const newId = crypto.randomUUID();
      
      const newShift: ShiftBlock = {
        id: newId,
        employeeId: targetEmployeeId,
        date: new Date(targetDate),
        startTime: isAbsence ? undefined : adaptedTimes.startTime,
        endTime: isAbsence ? undefined : adaptedTimes.endTime,
        type: isAbsence ? 'absence' : 'morning',
        color: draggedFavorite.color,
        name: draggedFavorite.name,
        absenceCode: isAbsence ? (draggedFavorite as any).absenceCode || draggedFavorite.name : undefined
      };
      
      setShiftBlocksWithHistory(currentShifts => {
        // Filtrar turnos existentes para evitar duplicados en estado local
        const filtered = currentShifts.filter(s => 
          !(s.employeeId === targetEmployeeId && isSameDay(s.date, targetDate))
        );
        const updatedShifts = [...filtered, newShift];
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
        return updatedShifts;
      });
      
      persistShiftToSupabase(newShift);
      setDraggedFavorite(null);
      return;
    }
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Handle favorite from dataTransfer
      if (dragData.type === 'favorite' && dragData.shift) {
        const favoriteShift = dragData.shift as SavedShift;
        const adaptedTimes = adaptShiftToContract(favoriteShift, targetEmployeeId);
        const isAbsence = dragData.isAbsence || favoriteShift.accessType === 'absence';
        const newId = crypto.randomUUID();
        
        const newShift: ShiftBlock = {
          id: newId,
          employeeId: targetEmployeeId,
          date: new Date(targetDate),
          startTime: isAbsence ? undefined : adaptedTimes.startTime,
          endTime: isAbsence ? undefined : adaptedTimes.endTime,
          type: isAbsence ? 'absence' : 'morning',
          color: favoriteShift.color,
          name: favoriteShift.name,
          absenceCode: isAbsence ? dragData.absenceCode || favoriteShift.name : undefined
        };
        
        setShiftBlocksWithHistory(currentShifts => {
          const filtered = currentShifts.filter(s => 
            !(s.employeeId === targetEmployeeId && isSameDay(s.date, targetDate))
          );
          return [...filtered, newShift];
        });
        persistShiftToSupabase(newShift);
        return;
      }
      
      const { shift, sourceEmployeeId } = dragData;
      
      // Same position - no action
      if (sourceEmployeeId === targetEmployeeId && format(new Date(shift.date), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')) {
        return;
      }
      
      const target = e.target as HTMLElement;
      let dropAction = target.getAttribute('data-drop-action');
      if (!dropAction) {
        dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');
      }
      // Sprint 4.4: Alt/Ctrl at drop time overrides zone/state action
      const keyboardCopy = e.altKey || e.ctrlKey;
      const action = keyboardCopy ? 'duplicate' : (dropAction || currentDropAction || 'move');

      if (action === 'duplicate') {
        const adaptedTimes = adaptShiftBlockToContract(shift, sourceEmployeeId, targetEmployeeId);
        const newId = crypto.randomUUID();
        const newShift: ShiftBlock = {
          ...shift,
          id: newId,
          employeeId: targetEmployeeId,
          date: new Date(targetDate),
          startTime: adaptedTimes.startTime,
          endTime: adaptedTimes.endTime
        };
        
        setShiftBlocksWithHistory(currentShifts => {
          const filtered = currentShifts.filter(s => 
            !(s.employeeId === targetEmployeeId && isSameDay(s.date, targetDate))
          );
          return [...filtered, newShift];
        });
        persistShiftToSupabase(newShift);
        // Sprint 4.4: feedback toast
        toast({ title: "Turno duplicado", description: "Copia creada en la nueva celda." });
      } else {
        const adaptedTimes = adaptShiftBlockToContract(shift, sourceEmployeeId, targetEmployeeId);
        const newId = crypto.randomUUID();

        setShiftBlocksWithHistory(currentShifts => {
          const filteredShifts = currentShifts.filter(s => s.id !== shift.id);
          const newShift: ShiftBlock = {
            ...shift,
            id: newId,
            employeeId: targetEmployeeId,
            date: new Date(targetDate),
            startTime: adaptedTimes.startTime,
            endTime: adaptedTimes.endTime
          };

          deleteShiftFromSupabase(shift.id);
          persistShiftToSupabase(newShift);

          return [...filteredShifts, newShift];
        });
        // Sprint 4.4: feedback toast
        toast({ title: "Turno movido", description: "El turno fue trasladado a la nueva celda." });
      }

      setCurrentDropAction(null);
      resetCopyMode();
    } catch (error) {
      console.error('Error al procesar drop:', error);
    }
  };

  const handleDragEnter = (employeeId: string, date: Date) => {
    setDragOverCell(`${employeeId}-${format(date, 'yyyy-MM-dd')}`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverCell(null);
    }
  };

  // Delete Zone Handlers
  const handleDeleteZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDeleteZoneDragOver(true);
  };

  const handleDeleteZoneDragLeave = () => {
    setDeleteZoneDragOver(false);
  };

  const handleDeleteZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDeleteZoneDragOver(false);
    setIsDragging(false);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (dragData.type === 'favorite' && dragData.isFavorite) {
        const favoriteShift = dragData.shift;
        if (favoriteShift.isSystemDefault) return;
        removeFromFavorites(favoriteShift.id);
        return;
      }
      
      if (dragData.shift && dragData.type === 'calendar') {
        const { shift } = dragData;
        const shiftExists = shiftBlocks.find(s => s.id === shift.id);
        if (!shiftExists) return;
        
        deleteShiftFromSupabase(shift.id);
        setShiftBlocksWithHistory(currentShifts => currentShifts.filter(s => s.id !== shift.id));
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Handle adding shift from TimeSlotRectangles
  const handleTimeSlotClick = (employee: Employee, date: Date, shiftIndex: number, e: React.MouseEvent, absenceCode?: string) => {
    e.stopPropagation();
    
    if (!canAssignShiftOnDate(employee.id, date)) return;

    if (absenceCode) {
      const absenceColors: Record<string, { color: string; name: string }> = {};
      defaultAbsenceShifts.forEach(shift => {
        const code = shift.id.split('-')[0];
        absenceColors[code] = { color: shift.color, name: shift.name };
      });
      const customAbsences = getCustomAbsences();
      customAbsences.forEach(ca => {
        absenceColors[ca.code] = { color: ca.color, name: ca.name };
      });
      
      const absenceInfo = absenceColors[absenceCode] || { color: '#6b7280', name: absenceCode };
      
      const newShift: ShiftBlock = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        date: date,
        startTime: undefined,
        endTime: undefined,
        type: 'absence',
        color: absenceInfo.color,
        name: absenceInfo.name,
        organization_id: currentOrg?.org_id || 'default',
        hasBreak: false,
        absenceCode: absenceCode
      };
      
      setShiftBlocksWithHistory(currentShifts => [...currentShifts, newShift]);
      persistShiftToSupabase(newShift);
    } else {
      const savedShifts = getSavedShiftsSync();
      const workShifts = savedShifts.filter(s => s.accessType !== 'absence');
      
      if (workShifts[shiftIndex]) {
        const selectedShift = workShifts[shiftIndex];
        const adaptedTimes = adaptShiftToContract(selectedShift, employee.id);
        
        const newShift: ShiftBlock = {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          date: date,
          startTime: adaptedTimes.startTime,
          endTime: adaptedTimes.endTime,
          type: 'morning',
          color: selectedShift.color,
          name: selectedShift.name,
          organization_id: currentOrg?.org_id || 'default',
          hasBreak: !!(selectedShift.breakType && selectedShift.breakDuration)
        };
        
        setShiftBlocksWithHistory(currentShifts => [...currentShifts, newShift]);
        persistShiftToSupabase(newShift);
      }
    }
  };

  // Handle adding shift from empty cell
  const handleAddShift = (employee: Employee, date: Date, event?: React.MouseEvent) => {
    if (isPublished) {
      toast({ title: "Calendario publicado", description: "No se pueden realizar cambios.", variant: "destructive" });
      return;
    }
    if (!canAssignShiftOnDate(employee.id, date)) return;

    let position = { x: 0, y: 0 };
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      position = { x: rect.right + 5, y: rect.top };
    }
    
    setShowShiftSelector({ employeeId: employee.id, date, position });
  };

  // Global drag event listeners
  useEffect(() => {
    const handleGlobalDragStart = () => setIsDragging(true);
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
      setDeleteZoneDragOver(false);
      setCurrentDropAction(null);
      setDraggedFavorite(null);
      setHoveredZone(null);
      resetCopyMode(); // Sprint 4.4
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Actualizar contador de empleados por día
  useEffect(() => {
    const counters: {[key: string]: number} = {};
    biWeekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      counters[dayKey] = shiftBlocks.filter(shift => 
        isSameDay(shift.date, day) && shift.type !== 'absence'
      ).length;
    });
    setDayCounters(counters);
  }, [shiftBlocks, currentWeek]);

  // ✅ Sorting now handled globally by useEmployeeSortOrder hook above

  // ✅ Sort change is now handled by EmployeeSortingSheet's onApplySort callback below

  // Calcular altura dinámica de filas basada en número de empleados (debe estar antes de cualquier return)
  const rowMinHeight = useMemo(() => {
    const employeeCount = sortedEmployees.length;
    if (employeeCount <= 5) return 'min-h-[80px]';
    if (employeeCount <= 8) return 'min-h-[64px]';
    if (employeeCount <= 12) return 'min-h-[52px]';
    if (employeeCount <= 18) return 'min-h-[44px]';
    return 'min-h-[38px]';
  }, [sortedEmployees.length]);

  // Transformar shiftBlocks a formato de auditoría
  const shiftsForAudit: ShiftForAudit[] = useMemo(() => {
    return shiftBlocks.map(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      return {
        id: shift.id,
        employeeId: shift.employeeId,
        employeeName: employee?.name || 'Desconocido',
        date: format(shift.date, 'yyyy-MM-dd'),
        shiftName: shift.name || 'Turno',
        startTime: shift.startTime,
        endTime: shift.endTime,
        isAbsence: shift.type === 'absence',
        absenceCode: shift.absenceCode,
        contractHours: 40 // Se podría obtener del colaborador
      };
    });
  }, [shiftBlocks, employees]);

  // Hook de auditoría para 2 semanas
  const {
    auditResult,
    isAuditing,
    runAudit,
    getViolationsForCell,
    getViolationsForEmployee,
    getMaxSeverityForCell
  } = useBiWeekAudit(shiftsForAudit, weekStart, currentOrg?.org_id);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-3">
        {/* Header Unificado - Idéntico en todas las vistas */}
        <UnifiedCalendarHeader
          viewMode="biweek"
          selectedDate={currentWeek}
          onDateChange={setCurrentWeek}
          hasUnsavedChanges={hasUnsavedChanges}
          changeCount={changeCount}
          onSave={() => saveShiftsToSupabase(shiftBlocks)}
          onPrint={handlePrint}
          onExport={handleExportPDF}
          canUndo={canUndo}
          canRedo={canRedo}
          historySize={historySize}
          futureSize={futureSize}
          onUndo={undo}
          onRedo={redo}
          onShowHistory={() => setShowVersionHistory(true)}
          onShowBackups={() => setShowOperationBackups(true)}
          onOpenSettings={() => setShowShiftConfiguration(true)}
          onDelete={handleDeleteCalendar}
          canEdit={canEdit}
          isPublished={isPublished}
          isDraft={isDraft}
          canPublish={canPublish}
          isPublishing={publishState.isPublishing}
          publishedAt={publishState.published_at}
          version={publishState.version}
          onPublish={handlePublishCalendar}
          onUnpublish={handleUnpublishCalendar}
          auditResult={auditResult}
          isAuditing={isAuditing}
          onRefreshAudit={runAudit}
          onClean={() => setShowCleanDialog(true)}
          onDuplicateWeek={canEdit ? () => setShowDuplicateWeekDialog(true) : undefined}
          employeeCount={sortedEmployees.length}
          dayCount={14}
          exportButton={
            <ICalExportButton
              shiftBlocks={shiftBlocks}
              employees={employees}
              biWeekDays={biWeekDays}
              canExportAll={!isEmployee}
              currentEmployeeId={currentEmployeeId}
            />
          }
        />

        {/* Mobile hint banner — only visible on small screens */}
        <div className="md:hidden mx-1 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
          <span className="text-xs text-primary/80 leading-snug">
            Para mejor experiencia, usa la Vista Semanal en móvil
          </span>
          <a
            href="/turnosmart/week"
            className="text-xs font-semibold text-primary whitespace-nowrap underline underline-offset-2 flex-shrink-0"
          >
            Ver semana
          </a>
        </div>

        {/* Área de Favoritos */}
        <FavoritesArea
          isVisible={showFavorites}
          favoriteShifts={favoriteShifts}
          onDragStart={(e, shift) => {
            setDraggedFavorite(shift);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
              const data = e.dataTransfer?.getData('application/json');
              if (data) {
                const dragData = JSON.parse(data);
                if (dragData && dragData.shift && dragData.type === 'calendar') {
                  // No permitir añadir ausencias a favoritos
                  if (dragData.shift.type === 'absence' || dragData.shift.absenceCode) return;
                  
                  const savedShiftFormat: SavedShift = {
                    id: `favorite-${Date.now()}`,
                    name: dragData.shift.name || 'Turno sin nombre',
                    startTime: dragData.shift.startTime,
                    endTime: dragData.shift.endTime,
                    color: dragData.shift.color || '#86efac',
                    accessType: 'company',
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  
                  addToFavorites(savedShiftFormat);
                }
              }
            } catch (error) {
              console.error("Error procesando drop en favoritos:", error);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onRemoveFavorite={removeFromFavorites}
        />

        {/* Tabla del calendario - 14 días */}
        {employees.length === 0 ? (
          <WeekEmptyState 
            currentWeek={currentWeek}
            onPreviousWeek={goToPreviousBiWeek}
            onNextWeek={goToNextBiWeek}
            onWeekChange={(date) => setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }))}
            weekDays={biWeekDays.slice(0, 7)}
          />
        ) : (
          <Card className="overflow-hidden relative flex-1 min-h-0 flex flex-col">
            {/* Calendar Status Badge */}
            {isPublished && (
              <div className="absolute top-2 right-2 z-10">
                <CalendarStatusBadge 
                  status={publishState.status}
                  version={publishState.version}
                  publishedAt={publishState.published_at}
                />
              </div>
            )}
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full min-w-[1350px] border-collapse h-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 bg-muted/50 z-10 py-2 px-1 text-left text-xs font-medium w-[90px] min-w-[90px] max-w-[90px] border-r">
                      <div className="flex flex-col items-start gap-1">
                        <div className="text-[7px] text-muted-foreground/60 font-medium">
                          S.{week1Number} - S.{week2Number}
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[8px] sm:text-[9px]">Personas / Día</span>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => setShowEmployeeSortingSheet(true)}
                                    >
                                      <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ordenar empleados</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={showTimeSlots ? "default" : "outline"}
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => setShowTimeSlots(!showTimeSlots)}
                                    >
                                      <Grid3X3 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[9px]">{showTimeSlots ? 'Ocultar' : 'Mostrar'} slots</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={showFavorites ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "h-5 w-5 p-0 transition-all duration-200",
                                        showFavorites 
                                          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                                          : 'hover:bg-muted'
                                      )}
                                      onClick={() => setShowFavorites(!showFavorites)}
                                    >
                                      <Star className={cn("h-3 w-3", showFavorites && 'fill-amber-400 text-amber-400')} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-[9px]">Favoritos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                    {biWeekDays.map((day, index) => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const isToday = isSameDay(day, new Date());
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      
                      return (
                        <th
                          key={dayKey}
                          className={cn(
                            "py-1 px-0.5 text-center text-[9px] sm:text-[10px] font-medium w-[90px] min-w-[90px] relative group",
                            isToday && "bg-primary/10",
                            isWeekend && "bg-muted/30",
                            index === 6 && "border-r-2 border-primary/30" // Separador entre semanas
                          )}
                        >
                          <div className="flex flex-col items-center gap-0">
                            <span className={cn(
                              "uppercase",
                              isToday && "text-primary font-bold"
                            )}>
                              {format(day, "EEE", { locale: es })}
                            </span>
                            <span className={cn(
                              "text-[10px] sm:text-xs",
                              isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
                            )}>
                              {format(day, "d")}
                            </span>
                            <div className="text-[7px] sm:text-[8px] text-muted-foreground">
                              {dayCounters[dayKey] || 0}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                
                <tbody className="h-full">
                  {/* Fila Notas del Día */}
                  <DailyNotesRow
                    days={biWeekDays}
                    notes={dailyNotes}
                    onUpdateNote={updateDailyNote}
                    canEdit={canEdit}
                  />
                  {/* Fila Turnos Sin Asignar */}
                  <UnassignedShiftsRow
                    days={biWeekDays}
                    shifts={unassignedShifts}
                    onRemoveShift={removeUnassignedShift}
                    canEdit={canEdit}
                  />
                  {sortedEmployees.map((employee) => {
                    const contractHours = getWeeklyHoursFromColaborador(employee.name) || 40;
                    const biWeeklyContractHours = contractHours * 2; // 2 semanas
                    const realHours = getBiWeeklyRealHours(employee.id);
                    const absenceHours = getBiWeeklyAbsenceHours(employee.id);
                    const difference = realHours - biWeeklyContractHours;
                    
                    return (
                      <tr key={employee.id} className="border-b hover:bg-muted/20">
                        {/* Columna del empleado */}
                        <td className="sticky left-0 bg-background z-10 py-1 px-1 border-r w-[90px] min-w-[90px] max-w-[90px]">
                          <div className="space-y-0">
                            <div 
                              className="text-[10px] sm:text-[11px] font-medium text-foreground truncate cursor-pointer hover:text-primary"
                              onClick={() => navigate(`/colaboradores/${employee.id}/profile`)}
                            >
                              {employee.name}
                            </div>
                            <div className="text-[8px] sm:text-[9px] text-muted-foreground flex gap-1">
                              <span title="Horas contrato (2 sem)">{biWeeklyContractHours}h</span>
                              <span>|</span>
                              <span title="Horas reales">{realHours}h</span>
                              <span>|</span>
                              <span title="Ausencias">{absenceHours}h</span>
                              <span>|</span>
                              <span 
                                className={difference > 0 ? "text-red-500" : "text-green-600"}
                                title="Diferencia"
                              >
                                {difference >= 0 ? '+' : ''}{difference}h
                              </span>
                            </div>
                            <EmployeeCompensatoryBalance 
                              colaboradorId={employee.id}
                              className="text-[8px]"
                            />
                          </div>
                        </td>
                        
                        {/* Celdas de los 14 días */}
                        {biWeekDays.map((day, index) => {
                          const shifts = getShiftsForEmployeeAndDate(employee.id, day);
                          const dayKey = format(day, 'yyyy-MM-dd');
                          const isToday = isSameDay(day, new Date());
                          
                          // Obtener violaciones de auditoría para esta celda
                          const cellViolations = getViolationsForCell(employee.id, dayKey);
                          const cellSeverity = getMaxSeverityForCell(employee.id, dayKey);
                          
                          // Sprint 4.4: is this cell the current drag target?
                          const isCellDragTarget = isDragging && dragOverCell === `${employee.id}-${dayKey}`;

                          return (
                            <td
                              key={dayKey}
                              className={cn(
                                `p-0.5 text-center cursor-pointer hover:bg-muted/30 relative w-[90px] min-w-[90px] ${rowMinHeight}`,
                                isToday && !isCellDragTarget && "bg-primary/5",
                                index === 6 && "border-r-2 border-primary/30",
                                // Sprint 4.4: improved drag-target highlight
                                isCellDragTarget && "ring-2 ring-inset ring-primary/50 bg-primary/5",
                                isCellDragTarget && isDragCopyMode && "cursor-copy",
                                isCellDragTarget && !isDragCopyMode && "cursor-move"
                              )}
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('[data-shift-card]')) return;
                                handleCellClick(employee, day, e);
                              }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, employee.id, day)}
                              onDragEnter={() => handleDragEnter(employee.id, day)}
                              onDragLeave={handleDragLeave}
                            >
                              <AuditCellHighlight severity={cellSeverity} className="h-full w-full">
                                {/* Sprint 4.4: Alt+soltar = duplicar hint */}
                                {isCellDragTarget && !isDragCopyMode && (
                                  <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
                                    <span className="text-[7px] bg-primary/80 text-primary-foreground px-1 py-px rounded-b leading-none select-none">
                                      Alt = duplicar
                                    </span>
                                  </div>
                                )}
                                {isCellDragTarget && isDragCopyMode && (
                                  <div className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none">
                                    <span className="text-[7px] bg-emerald-600/80 text-white px-1 py-px rounded-b leading-none select-none">
                                      Duplicar
                                    </span>
                                  </div>
                                )}
                                {/* DragDropZones - aparecen cuando hay dragging activo */}
                                {canEdit && isCellDragTarget && (
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
                                    onDrop={(e) => handleDrop(e, employee.id, day)}
                                  />
                                )}
                                {shifts.length > 0 ? (
                                  <AuditViolationTooltip violations={cellViolations}>
                                    <div className="h-full w-full space-y-0.5 relative">
                                      {shifts.map((shift) => (
                                        <ShiftCard
                                          key={shift.id}
                                          shift={shift}
                                          employee={employee}
                                          shiftsCount={shifts.length}
                                          isSelected={selectedShifts.has(shift.id)}
                                          onSelect={(s) => {
                                            setSelectedShifts(prev => {
                                              const newSet = new Set(prev);
                                              if (newSet.has(s.id)) newSet.delete(s.id);
                                              else newSet.add(s.id);
                                              return newSet;
                                            });
                                          }}
                                          onShowDetails={() => setShowShiftDetails({ shift, employee })}
                                          onDelete={() => handleDeleteShift(shift.id)}
                                          onEdit={() => {
                                            setEditingShift(shift);
                                            setShowAdvancedOptions({ employeeId: shift.employeeId, date: shift.date });
                                          }}
                                          onAddShift={canEdit ? handleAddShift : undefined}
                                          readOnly={!canEdit || isPublished}
                                          onValidationChange={canEdit && !isPublished ? handleValidationChange : undefined}
                                        />
                                      ))}
                                      {/* Indicador de violación */}
                                      {cellViolations.length > 0 && (
                                        <div className={cn(
                                          "absolute top-0 right-0 w-2 h-2 rounded-full z-10",
                                          cellSeverity === 'error' && "bg-destructive",
                                          cellSeverity === 'warning' && "bg-amber-500",
                                          cellSeverity === 'info' && "bg-primary"
                                        )} />
                                      )}
                                    </div>
                                  </AuditViolationTooltip>
                                ) : (
                                  <div className="h-full relative group">
                                    {/* Time slot rectangles - aparecen cuando showTimeSlots está activo */}
                                    {showTimeSlots && (
                                      <TimeSlotRectangles 
                                        onSlotClick={(shiftIndex, e, absenceCode) => handleTimeSlotClick(employee, day, shiftIndex, e, absenceCode)}
                                      />
                                    )}
                                    
                                    {/* Zona hover invisible */}
                                    <div 
                                      className="absolute inset-0 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddShift(employee, day, e);
                                      }}
                                    />
                                    {/* Símbolo + que aparece solo en hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      {canEdit && !isPublished && (
                                        <div className="bg-white/95 rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-gray-200">
                                          <Plus className="h-3 w-3 text-gray-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </AuditCellHighlight>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Delete Zone - aparece cuando se está arrastrando */}
        <DeleteZone
          isVisible={isDragging}
          isDragOver={deleteZoneDragOver}
          onDragOver={handleDeleteZoneDragOver}
          onDragLeave={handleDeleteZoneDragLeave}
          onDrop={handleDeleteZoneDrop}
        />

        {/* Shift Selector Popup */}
        {showShiftSelector && (
          <ShiftSelectorPopup
            isOpen={true}
            onClose={() => setShowShiftSelector(null)}
            onShiftSelected={handleShiftSelected}
            onAdvancedOptions={() => {
              setShowAdvancedOptions({
                employeeId: showShiftSelector.employeeId,
                date: showShiftSelector.date
              });
              setShowShiftSelector(null);
            }}
            onAdvancedMultiDate={() => {
              setShowAdvancedOptions({
                employeeId: showShiftSelector.employeeId,
                date: showShiftSelector.date,
                multiDate: true
              });
              setShowShiftSelector(null);
            }}
            position={showShiftSelector.position}
          />
        )}

        {/* Advanced Shift Dialog */}
        <AdvancedShiftDialog
          isOpen={!!showAdvancedOptions}
          onClose={() => {
            setShowAdvancedOptions(null);
            setEditingShift(null);
          }}
          employee={showAdvancedOptions ? employees.find(e => e.id === showAdvancedOptions.employeeId) : undefined}
          date={showAdvancedOptions?.date || new Date()}
          editingShift={editingShift || undefined}
          biWeekDays={biWeekDays}
          shiftBlocks={shiftBlocks}
          defaultMultiDate={showAdvancedOptions?.multiDate ?? false}
          onShiftAssigned={async (shiftData) => {
            if (showAdvancedOptions) {
              if (editingShift) {
                const updatedShifts = shiftBlocks.map(s => 
                  s.id === editingShift.id 
                    ? { ...s, ...shiftData, date: new Date(shiftData.date) }
                    : s
                );
                setShiftBlocksWithHistory(() => updatedShifts);
                
                await supabase.from('calendar_shifts').update({
                  start_time: shiftData.startTime,
                  end_time: shiftData.endTime,
                  shift_name: shiftData.name,
                  color: shiftData.color,
                  break_duration: shiftData.breakDuration,
                  notes: shiftData.notes,
                }).eq('id', editingShift.id);
              } else {
                const newId = crypto.randomUUID();
                const newShift: ShiftBlock = {
                  id: newId,
                  employeeId: shiftData.employeeId,
                  date: new Date(shiftData.date),
                  startTime: shiftData.startTime,
                  endTime: shiftData.endTime,
                  type: "morning",
                  color: shiftData.color || "#86efac",
                  name: shiftData.name,
                  organization_id: currentOrg?.org_id || 'default',
                  hasBreak: shiftData.hasBreak,
                  breakDuration: shiftData.breakDuration,
                  notes: shiftData.notes,
                };
                
                setShiftBlocksWithHistory(prev => [...prev, newShift]);
                
                await supabase.from('calendar_shifts').upsert({
                  id: newId,
                  employee_id: newShift.employeeId,
                  date: format(newShift.date, 'yyyy-MM-dd'),
                  start_time: newShift.startTime || null,
                  end_time: newShift.endTime || null,
                  shift_name: newShift.name || '',
                  color: newShift.color,
                  break_duration: newShift.breakDuration || null,
                  notes: newShift.notes || null,
                  org_id: currentOrg?.org_id,
                });
              }
            }
            setShowAdvancedOptions(null);
            setEditingShift(null);
          }}
        />

        {/* Shift Configuration Dialog */}
        <ShiftConfigurationDialog
          isOpen={showShiftConfiguration}
          onClose={() => setShowShiftConfiguration(false)}
        />

        {/* Add Employees Dialog */}
        <AddEmployeesToCalendarDialog
          open={showAddEmployeesDialog}
          onOpenChange={setShowAddEmployeesDialog}
          onEmployeesAdded={async (newEmployees) => {
            const calendarEmployees = newEmployees.map(emp => ({
              id: emp.id,
              name: emp.name,
              role: emp.category,
              department: emp.department,
              workingHours: `${emp.contract_hours}h/${emp.contract_hours * 5}h`
            }));
            
            const existingIds = new Set(employees.map(emp => emp.id));
            const uniqueNewEmployees = calendarEmployees.filter(emp => !existingIds.has(emp.id));
            
            if (uniqueNewEmployees.length > 0) {
              setEmployees(prev => [...prev, ...uniqueNewEmployees]);
            }
          }}
          existingEmployeeIds={employees.map(emp => emp.id)}
        />

        {/* Version History Dialog */}
        <VersionHistoryDialog
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          onRestore={(version) => {
            setConfirmRestoreVersion(version.id);
          }}
        />

        {/* Operation Backups Dialog */}
        <OperationBackupsDialog
          open={showOperationBackups}
          onOpenChange={setShowOperationBackups}
          onRestore={async (backupData, backupId) => {
            // Restore logic - reload shifts from backup
            if (backupData?.shiftBlocks) {
              const restoredShifts = backupData.shiftBlocks.map((s: any) => ({
                ...s,
                date: new Date(s.date),
              }));
              setShiftBlocks(restoredShifts);
              toast({ title: "✅ Backup restaurado", description: "Los datos han sido restaurados correctamente" });
            }
          }}
        />

        {/* Employee Sorting Sheet */}
        <EmployeeSortingSheet
          isOpen={showEmployeeSortingSheet}
          onClose={() => setShowEmployeeSortingSheet(false)}
          currentSortCriteria={sortBy}
          onApplySort={(sortedEmployees) => {
            // Map back to our Employee type
            const mapped = sortedEmployees.map(emp => ({
              id: emp.id,
              name: `${emp.nombre} ${emp.apellidos}`,
              role: emp.tipo_contrato || 'Empleado',
              department: emp.departamento || 'General',
              workingHours: emp.tiempo_trabajo_semanal ? `0h/${emp.tiempo_trabajo_semanal}h` : '0h/40h',
              startDate: emp.fecha_inicio_contrato || undefined
            }));
            setEmployees(mapped);
            // ✅ Save the manual order to global state (hook will sync across all views)
            localStorage.setItem('manual-employee-order', JSON.stringify(mapped));
            setSortBy('manual');
            setShowEmployeeSortingSheet(false);
          }}
          employees={colaboradores.map(c => ({
            id: c.id,
            nombre: c.nombre,
            apellidos: c.apellidos,
            email: c.email || '',
            tipo_contrato: c.tipo_contrato,
            tiempo_trabajo_semanal: c.tiempo_trabajo_semanal,
            fecha_inicio_contrato: c.fecha_inicio_contrato,
          }))}
        />
        
        {/* Clean Dialog */}
        <CleanShiftsDialog
          open={showCleanDialog}
          onOpenChange={setShowCleanDialog}
          currentDate={currentWeek}
          employees={employees}
          onSuccess={() => {
            loadShiftsFromSupabase(employees.map(e => e.id));
          }}
        />

        {/* Duplicate Week Dialog */}
        <DuplicateWeekDialog
          open={showDuplicateWeekDialog}
          onClose={() => setShowDuplicateWeekDialog(false)}
          onConfirm={handleDuplicateWeek}
          week1Label={`Semana ${week1Number} (${format(weekStart, "d MMM", { locale: es })} – ${format(addDays(weekStart, 6), "d MMM", { locale: es })})`}
          week2Label={`Semana ${week2Number} (${format(addDays(weekStart, 7), "d MMM", { locale: es })} – ${format(addDays(weekStart, 13), "d MMM", { locale: es })})`}
        />
      </div>
    </TooltipProvider>
  );
}
