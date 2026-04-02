import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Plus, MoreVertical, UserPlus, X, Check, ArrowUpDown, Clock, Info, PiggyBank, Coffee, Settings, Trash2, Grid3X3, Star, Save, History, Shield } from "lucide-react";
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
import { getSavedShifts, getSavedShiftsSync, SavedShift } from "@/store/savedShiftsStore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useTurnoSmartRole } from "@/hooks/useTurnoSmartRole";
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
import { useEmployeeSortOrder, getManualOrderKey } from "@/hooks/useEmployeeSortOrder";

import { VersionHistoryDialog } from "./calendar/VersionHistoryDialog";
import { OperationBackupsDialog } from "./calendar/OperationBackupsDialog";
import { PetitionsListPanel } from "./calendar/PetitionsListPanel";
import { PetitionFormDialog } from "./calendar/PetitionFormDialog";
import { OccupancyImportDialog } from "./calendar/OccupancyImportDialog";
import { CriteriaConfigDialog } from "./calendar/CriteriaConfigDialog";
import { ConflictResolutionDialog } from "./calendar/ConflictResolutionDialog";
import { useEditLog } from "@/hooks/useEditLog";
import { useCriteria } from "@/hooks/useCriteria";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { usePetitions } from "@/hooks/usePetitions";
import { useOccupancyData } from "@/hooks/useOccupancyData";
import { ConfirmationDialog } from "./calendar/ConfirmationDialog";
import { useDataProtection } from "@/hooks/useDataProtection";
import { useDataPersistence } from "@/hooks/useDataPersistence";
import { ConnectionStatusBanner } from "./ConnectionStatusBanner";
import { EmployeeSortingSheet } from "./EmployeeSortingSheet";
import { CalendarActionButtons } from "./CalendarActionButtons";
import { CalendarFullScreenView } from "./CalendarFullScreenView";
import { CalendarStatusBadge } from "./CalendarStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CleanShiftsDialog } from "./CleanShiftsDialog";
import { useWeekAudit } from "@/hooks/useShiftAudit";
import { ShiftForAudit } from "@/utils/shiftAudit";
import { AuditCellHighlight, EmployeeViolationBadge } from "@/components/audit";
import { SuggestedFix, AuditViolation } from "@/types/audit";
import { OnboardingTour, useOnboardingTour } from "@/components/onboarding/OnboardingTour";
import { getTagObjects } from "@/utils/engine/smartTags";
import { AuditViolationTooltip } from "@/components/audit/AuditViolationTooltip";
import { useSmartGenerate } from "@/hooks/useSmartGenerate";
import { useSmartGenerateV2 } from "@/hooks/useSmartGenerateV2";
import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";
import { SmartSuggestionsPanel } from "./calendar/SmartSuggestionsPanel";
import { GenerateScheduleSheet, GenerateConfig } from "@/components/calendar/GenerateScheduleSheet";
import { AlternativesResultSheet } from "@/components/calendar/AlternativesResultSheet";
import { GenerateScheduleWizard } from "@/components/calendar/GenerateScheduleWizard";
import type { WizardConfig, PreviousPeriodSummary } from "@/components/calendar/GenerateScheduleWizard";
import {
  ShiftBlock,
  absenceTypes,
  isAbsenceType,
  formatTimeFromDatabase,
  calculateEndTime,
  calculateShiftHours,
  shouldCountHours,
  getShiftHours,
} from "@/utils/calendarShiftUtils";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  startDate?: string;
}

interface GoogleCalendarStyleProps {
  approvedRequests?: ApprovedRequest[];
}

export function GoogleCalendarStyle({ approvedRequests = [] }: GoogleCalendarStyleProps = {}) {
  const navigate = useNavigate();
  const { role, loading: roleLoading, isAdmin, isManager, isOwner } = useUserRoleCanonical();
  const { tsRole, colaboradorId, canManage, isEmpleado, loading: tsRoleLoading } = useTurnoSmartRole();
  const { user } = useAuth();
  const isEmployee = isEmpleado; // Usar TurnoSmart role (no canonical)
  const canEdit = canManage; // Solo FOM/Super-Admin pueden editar
  const { org } = useCurrentOrganization();
  const { logActivity } = useActivityLog();
  const { favoriteShifts, addToFavorites, removeFromFavorites, isFavorite} = useFavoriteShifts();
  const { createVersion } = useCalendarVersions();
  const { createBackupBeforeOperation } = useDataProtection();
  
  // Sistema de persistencia de datos con soporte offline
  const {
    connectionStatus,
    isOnline,
    isOffline,
    saveStatus,
    lastSavedAt: persistenceLastSaved,
    isSaving: isPersistenceSaving,
    pendingCount,
    hasPending,
    isSyncing,
    persistShift,
    removeShift,
    persistShiftsBatch,
    forceSync,
  } = useDataPersistence({
    orgId: org?.id,
    onSyncComplete: () => {
      // Recargar turnos después de sincronización
      if (employees.length > 0) {
        loadShiftsFromSupabase(employees.map(e => e.id));
      }
    },
  });

  // Current time state removed - not needed for week view

  // Estado para manejar los turnos asignados - declarar temprano
  const [shiftBlocks, setShiftBlocks] = useState<ShiftBlock[]>([]);

  // Flag para evitar que loadShiftsFromSupabase sobrescriba el state
  // después de que onResult (SMART generate) acaba de setear los bloques del mes.
  const skipDbReloadRef = useRef(false);

  // Flag para controlar cuando el undo/redo debe sincronizarse
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
  
  // Wrapper para undo que marca que es una operación de undo/redo
  const undo = useCallback(() => {
    isUndoRedoOperation.current = true;
    undoBase();
  }, [undoBase]);
  
  const redo = useCallback(() => {
    isUndoRedoOperation.current = true;
    redoBase();
  }, [redoBase]);
  
  // Sincronizar shiftBlocks con undo/redo state SOLO en operaciones de undo/redo
  useEffect(() => {
    if (isUndoRedoOperation.current && undoRedoState !== shiftBlocks) {
      
      // CRÍTICO: Actualizar directamente sin pasar por setShiftBlocksWithHistory
      // para evitar guardar este cambio en el historial
      setShiftBlocks(undoRedoState);
      
      // Actualizar localStorage también
      try {
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(undoRedoState.map(shift => ({
          ...shift,
          date: shift.date.toISOString ? shift.date.toISOString() : shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }))));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      isUndoRedoOperation.current = false;
    }
  }, [undoRedoState, shiftBlocks]);

  // Auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Full screen view state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
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
  
  // Warn before leaving with unsaved changes OR pending offline operations
  useBeforeUnload({
    when: (hasUnsavedChanges && changeCount > 0) || hasPending,
    message: hasPending 
      ? `Tienes ${pendingCount} cambios pendientes de sincronizar. ¿Seguro que quieres salir?`
      : 'Tienes cambios sin guardar. ¿Seguro que quieres salir?',
  });
  
  // Wrapper para setShiftBlocks que guarda automáticamente en historial Undo/Redo Y persiste inmediatamente
  const setShiftBlocksWithHistory = useCallback((updater: ShiftBlock[] | ((prev: ShiftBlock[]) => ShiftBlock[])) => {
    setShiftBlocks(prevBlocks => {

      // CRÍTICO: Guardar el estado ACTUAL (prevBlocks) ANTES de aplicar cualquier cambio
      saveUndoState(prevBlocks);

      // Aplicar el cambio
      const computedBlocks = typeof updater === 'function' ? updater(prevBlocks) : updater;

      // Asegurar IDs persistibles (UUID) para evitar errores "invalid input syntax for type uuid"
      // CRÍTICO: incluir 'smart-' para que engine IDs se conviertan a UUID UNA sola vez aquí,
      // evitando que ensureUUID() genere UUIDs diferentes en cada persistShiftsBatch y duplique filas en DB
      const newBlocks = computedBlocks.map((b) => {
        if (typeof b.id === 'string' && (b.id.startsWith('shift-') || b.id.startsWith('first-day-') || b.id.startsWith('smart-'))) {
          return { ...b, id: crypto.randomUUID() };
        }
        return b;
      });

      // Marcar como cambio no guardado
      setHasUnsavedChanges(true);
      setChangeCount(prev => prev + 1);

      // 🚀 PERSISTENCIA INSTANTÁNEA: Guardar en localStorage y Supabase inmediatamente
      // Guardar en localStorage como backup inmediato
      try {
        const serialized = newBlocks.map(shift => ({
          ...shift,
          date: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
        }));
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(serialized));
        localStorage.setItem('calendar-shifts-backup-timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error en backup local:', error);
      }

      // Persistir en Supabase de forma asíncrona
      if (org?.id) {
        persistShiftsBatch(newBlocks).then(success => {
          if (success) {
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            setSaveError(null);
          }
        }).catch(err => {
          console.error('Error en persistencia:', err);
          setSaveError(err.message);
        });
      }

      return newBlocks;
    });
  }, [saveUndoState, org?.id, persistShiftsBatch]);
  
  // Handler functions for action buttons
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast({ title: "Exportando PDF", description: "Preparando documento para descarga..." });
    // Integrar con ScheduleExportConfig existente
  };

  const handleExportExcel = () => {
    toast({ title: "Exportando Excel", description: "Preparando archivo para descarga..." });
    // Integrar con funcionalidad de Excel existente
  };

  const handleExportImage = () => {
    toast({ title: "Descargando imagen", description: "Capturando calendario como imagen..." });
    // Implementar captura de pantalla
  };

  // Publish handlers
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
    // Show confirmation dialog for calendar deletion
    toast({
      title: "Función en desarrollo",
      description: "La eliminación de calendarios estará disponible próximamente",
    });
  };
  
  const handleRestoreVersion = async (version: any) => {
    // Mostrar confirmación antes de restaurar
    setConfirmRestoreVersion(version.id);
  };

  const handleConfirmRestoreVersion = async () => {
    if (!confirmRestoreVersion) return;
    
    try {
      // Buscar la versión por ID
      const { data: versions, error: versionError } = await supabase
        .from('calendar_versions')
        .select('*')
        .eq('id', confirmRestoreVersion)
        .single();

      if (versionError || !versions) {
        throw new Error('Versión no encontrada');
      }
      
      const version = versions;
      
      // Crear backup de la versión actual antes de restaurar
      const backupShifts = shiftBlocks.map(shift => ({
        ...shift,
        date: format(shift.date, "yyyy-MM-dd"),
      }));
      
      // Mapear employees al formato esperado por createVersion
      const backupEmployees = employees.map(emp => ({
        id: emp.id,
        nombre: emp.name.split(' ')[0] || emp.name,
        apellidos: emp.name.split(' ').slice(1).join(' ') || '',
        email: emp.id + '@temp.com', // Temporal, no tenemos email en este contexto
        ...emp
      }));
      
      await createVersion(
        backupShifts as any,
        backupEmployees as any,
        { start: currentWeek, end: addDays(currentWeek, 6) },
        true,
        `Backup antes de restaurar: ${format(new Date(), "dd/MM/yyyy HH:mm")}`
      );
      
      // Restaurar la versión seleccionada - convertir dates de string a Date
      const restoredData = version.snapshot_data as any;
      const restoredShifts = restoredData.shiftBlocks.map((shift: any) => ({
        ...shift,
        date: typeof shift.date === 'string' ? new Date(shift.date) : shift.date,
      }));
      
      // Convertir employees restaurados al formato de GoogleCalendarStyle
      const restoredEmployees = restoredData.employees.map((emp: any) => ({
        id: emp.id,
        name: `${emp.nombre || ''} ${emp.apellidos || ''}`.trim(),
        role: emp.role || '',
        department: emp.department || '',
        workingHours: emp.workingHours || '',
        ...emp
      }));
      
      setShiftBlocksWithHistory(restoredShifts);
      updateEmployees(restoredEmployees);
      
      // Guardar en localStorage y Supabase
      localStorage.setItem('calendar-shift-blocks', JSON.stringify(restoredShifts));
      await saveShiftsToSupabase(restoredShifts);
      
      // Log activity
      await logActivity({
        action: "VERSION_RESTAURADA",
        entityType: "calendar_version",
        entityName: version.version_name,
        details: {
          versionId: version.id,
          versionNumber: version.version_number,
          totalShifts: (restoredData.metadata as any)?.totalShifts,
          employeeCount: (restoredData.metadata as any)?.employeeCount,
        }
      });
      
      setConfirmRestoreVersion(null);
      
      toast({
        title: "✅ Versión restaurada",
        description: `Se ha restaurado "${version.version_name}". Se creó un backup automático de tu versión anterior.`,
      });
    } catch (error) {
      console.error("Error restaurando versión:", error);
      toast({
        title: "❌ Error al restaurar",
        description: "No se pudo restaurar la versión",
        variant: "destructive",
      });
    }
  };
  
  // Current time update removed - not needed for week view
  
  // Debug de permisos
  useEffect(() => {
  }, [isAdmin, role, roleLoading]);
  
  // Punto 8: Por defecto siempre aparece en current week (lunes actual)
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedCell, setSelectedCell] = useState<{employee: string, date: Date} | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [showEmployeeSortingSheet, setShowEmployeeSortingSheet] = useState(false);
  const [showEmployeeTooltips, setShowEmployeeTooltips] = useState<{[key: string]: boolean}>({});
  const [showAddShiftPopup, setShowAddShiftPopup] = useState<{employeeId: string, date: Date} | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<{employeeId: string, date: Date} | null>(null);
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
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(false);
  const [hoveredZone, setHoveredZone] = useState<'move' | 'duplicate' | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showOperationBackups, setShowOperationBackups] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [showPetitions, setShowPetitions] = useState(false);
  const [showPetitionForm, setShowPetitionForm] = useState(false);
  const [showOccupancyImport, setShowOccupancyImport] = useState(false);
  const [showCriteriaConfig, setShowCriteriaConfig] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingPostPubShift, setPendingPostPubShift] = useState<{ shift: ShiftBlock; conflictInfo: any } | null>(null);
  
  // Confirmation dialogs state  
  const [confirmClearCalendar, setConfirmClearCalendar] = useState(false);
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(() => {
    try { return localStorage.getItem('turnosmart-show-favorites') === 'true'; } catch { return false; }
  });
  const [draggedFavorite, setDraggedFavorite] = useState<any>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Publishing state - after currentWeek is declared
  const { 
    publishState, 
    isLoading: publishLoading, 
    error: publishError, 
    publishCalendar, 
    unpublishCalendar, 
    canPublish, 
    isPublished, 
    isDraft,
    clearError: clearPublishError
  } = useCalendarPublishState(currentWeek);

  // Generation history for VersionHistoryDialog tab
  const {
    generations,
    isLoading: isLoadingGenerations,
  } = useGenerationHistory({ organizationId: org?.id });

  // Petitions
  const {
    petitions,
    createPetition,
    updatePetitionStatus,
    refresh: refreshPetitions,
  } = usePetitions({ organizationId: org?.id });
  const pendingPetitionsCount = petitions.filter(p => p.status === 'pending').length;

  // Post-publication edit log
  const {
    logEdit,
    isPostPubEdited,
    postPubCount,
  } = useEditLog({ organizationId: org?.id });

  // Criteria for the SMART engine
  const {
    criteria,
    isLoading: criteriaLoading,
    upsertCriteria,
    seedDefaults,
  } = useCriteria({ organizationId: org?.id });

  // Occupancy data for OccupancyImportDialog
  const {
    occupancy: occupancyForWizard,
    records: occupancyRecords,
    upsertBatch: upsertOccupancyBatch,
  } = useOccupancyData({
    organizationId: org?.id,
    year: currentWeek.getFullYear(),
    month: currentWeek.getMonth() + 1,
  });

  // Average movements/day for header tooltip (NEW-02)
  const avgMovementsPerDay = useMemo(() => {
    if (!occupancyRecords || occupancyRecords.length === 0) return 0;
    const total = occupancyRecords.reduce(
      (sum, r) => sum + (r.check_ins ?? 0) + (r.check_outs ?? 0),
      0
    );
    return total / occupancyRecords.length;
  }, [occupancyRecords]);

  // Auto-save function
  const saveCalendarState = async (shiftBlocksToSave: ShiftBlock[]) => {
    try {
      setSaveError(null);
      
      // 1. Persist all shifts to Supabase (existing logic)
      for (const shift of shiftBlocksToSave) {
        await persistShiftToSupabase(shift);
      }
      
      // 2. Create version snapshot
      const weekRange = {
        start: weekStart,
        end: addDays(weekStart, 6)
      };
      
      await createVersion(
        shiftBlocksToSave.map(shift => ({
          employeeId: shift.employeeId,
          date: typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0],
          startTime: shift.startTime,
          endTime: shift.endTime,
          name: shift.name || 'Turno',
          color: shift.color,
          notes: shift.notes,
          breakDuration: shift.breakDuration
        })),
        employees as any[], // Cast to bypass type checking
        weekRange,
        true // isAutoSave
      );
      
      // 3. Update local storage as backup
      localStorage.setItem('calendar_shifts_backup', JSON.stringify({
        shifts: shiftBlocksToSave,
        timestamp: new Date().toISOString(),
        weekStart: weekStart.toISOString()
      }));
      
      // 4. Log activity
      await logActivity({
        action: 'autoguardar_calendario',
        entityType: 'calendario',
        entityName: `Semana ${format(weekStart, 'dd/MM/yyyy')}`,
        details: {
          totalTurnos: shiftBlocksToSave.length,
          empleados: employees.length,
          cambios: changeCount
        }
      });
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setChangeCount(0);
      
    } catch (error) {
      console.error('Error saving calendar state:', error);
      setSaveError(error instanceof Error ? error.message : 'Error al guardar');
    }
  };

  // Auto-save integration
  const { forceSave, isAutoSaving } = useAutoSave({
    data: shiftBlocks || [], // Provide fallback
    onSave: saveCalendarState,
    delay: 3000, // 3 seconds
    enabled: !!shiftBlocks // Only enable when shiftBlocks exists
  });

  // Track changes - REMOVED: This was causing infinite loop
  // Changes are now tracked only when setShiftBlocksWithHistory is called

  // Handle publish errors
  useEffect(() => {
    if (publishError) {
      toast({
        title: "Error de publicación",
        description: publishError,
        variant: "destructive"
      });
      clearPublishError();
    }
  }, [publishError, clearPublishError]);

  // Hook para manejar empleados seleccionados desde colaboradores
  const { selectedEmployees: selectedFromColaboradores, clearSelectedEmployees } = useSelectedEmployees();

  // Estado para colaboradores de Supabase
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  // Sample employees data - now loads from Supabase colaboradores
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Estado de carga inicial de datos
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 🆕 Hook para sincronizar filtro de empleados eliminados entre vistas
  const {
    filteredEmployees,
    excludeEmployee,
    includeEmployee,
    resetFilter,
    isEmployeeExcluded
  } = useCalendarEmployeeFilter(employees, org?.id || null);

  // DISABLED: Auto-generation of "Primer día" shifts removed to prevent unwanted recreation
  // Users can manually create these shifts if needed
  // 
  // Previous behavior: automatically created "Primer día" shifts for contract start dates
  // Problem: Would recreate shifts that users had intentionally deleted
  // Solution: Remove automatic generation - let users create shifts manually when needed

  // Función para cargar colaboradores desde Supabase y sincronizar con employees
  const loadColaboradores = async () => {
    try {
      // 🔄 SINCRONIZADO CON /turnosmart/day - MISMA CONSULTA EXACTA
      if (!org?.id) {
        console.warn('No hay org_id disponible para cargar colaboradores');
        setIsLoadingData(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // ✅ CRITICAL FIX #3: ALWAYS fetch colaboradores from Supabase
      // The colaboradores data is needed for shouldShowColaborador() to work!
      // If we return early with only employees from localStorage, the filter will fail
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nombre, apellidos, avatar_url, email, tiempo_trabajo_semanal, tipo_contrato, fecha_inicio_contrato, fecha_fin_contrato, status')
        .eq('org_id', org.org_id)
        .or(`status.eq.activo,status.eq.active,fecha_fin_contrato.gte.${today}`)
        .order('nombre', { ascending: true }); // Mismo orden que en CalendarDay

      if (error) {
        console.error('Error cargando colaboradores:', error);
        setIsLoadingData(false);
        return;
      }

      // ✅ CRITICAL: Always set colaboradores even if we have filtered employees
      // This ensures shouldShowColaborador() can find the contract dates
      setColaboradores(data || []);

      // 🆕 REMOVED: Old localStorage 'calendar-employees' logic
      // Filtering is now handled by useCalendarEmployeeFilter hook
      // which uses a per-org exclusion list in localStorage

      // Convertir colaboradores a formato Employee y actualizar el estado
      if (data && data.length > 0) {
        const mappedEmployees: Employee[] = data.map(colaborador => ({
          id: colaborador.id,
          name: `${colaborador.nombre}${colaborador.apellidos ? ' ' + colaborador.apellidos : ''}`,
          role: colaborador.tipo_contrato || 'Empleado',
          department: 'General',
          workingHours: colaborador.tiempo_trabajo_semanal ? `0h/${colaborador.tiempo_trabajo_semanal}h` : '0h/40h',
          startDate: colaborador.fecha_inicio_contrato || undefined
        }));

        // Recuperar orden manual si existe (scoped por org)
        const manualOrderKey = getManualOrderKey(org?.id);
        const savedManualOrder = localStorage.getItem(manualOrderKey);
        let finalEmployees = mappedEmployees;

        if (savedManualOrder) {
          try {
            const savedOrder = JSON.parse(savedManualOrder);
            const orderMap = new Map<string, number>(savedOrder.map((emp: any, index: number) => [emp.id, index]));

            finalEmployees = [...mappedEmployees].sort((a, b) => {
              const posA = orderMap.get(a.id) ?? -1;
              const posB = orderMap.get(b.id) ?? -1;

              if (posA >= 0 && posB >= 0) {
                return posA - posB;
              }
              if (posA >= 0) return -1;
              if (posB >= 0) return 1;
              return a.name.localeCompare(b.name);
            });

            setSortBy('manual');
          } catch (error) {
            console.error('Error parsing manual order:', error);
            localStorage.removeItem(manualOrderKey);
          }
        }

        // 🆕 Set employees WITHOUT saving to 'calendar-employees' localStorage
        // The filtering will be handled by useCalendarEmployeeFilter hook
        setEmployees(finalEmployees);

        // ✅ ENABLED: Loading shifts from Supabase when employees are loaded
        // This ensures turnos persist when navigating between pages
        await loadShiftsFromSupabase(mappedEmployees.map(e => e.id));

        // Marcar carga inicial como completa
        setIsLoadingData(false);
      } else {
        // Si no hay empleados, marcar carga como completa
        setIsLoadingData(false);
      }
    } catch (error) {
      console.error('Error en loadColaboradores:', error);
      setIsLoadingData(false);
    }
  };

  // 🔄 CRÍTICO: Recargar turnos cuando cambie la semana visible
  const prevWeekRef = useRef(currentWeek);
  useEffect(() => {
    // Si el usuario navega a otra semana, desactivar el guard post-generación
    if (prevWeekRef.current !== currentWeek) {
      skipDbReloadRef.current = false;
      prevWeekRef.current = currentWeek;
    }

    // Solo cargar si tenemos org Y empleados, para evitar cargas innecesarias
    if (org?.id && employees.length > 0) {
      loadShiftsFromSupabase(employees.map(e => e.id));
    }
  }, [currentWeek, org?.id]); // Recargar cuando cambie la semana o la organización

  // Función para cargar turnos desde Supabase
  const loadShiftsFromSupabase = async (employeeIds: string[]) => {
    // Guard: si acabamos de aplicar una alternativa SMART, no sobrescribir el state
    // con datos parciales (solo 1 semana) de la DB.
    if (skipDbReloadRef.current) {
      console.log('[loadShiftsFromSupabase] Skipped — skipDbReloadRef active (post-generate)');
      return;
    }
    try {
      // 🔄 SINCRONIZADO: Filtrar por org_id para evitar mezclar turnos de diferentes organizaciones
      if (!org?.id) {
        console.warn('No hay org_id disponible para cargar turnos');
        return;
      }

      // ✅ FIXED: Cargar solo los turnos de la semana visible
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const { data: shifts, error } = await supabase
        .from('calendar_shifts')
        .select('*')
        .eq('org_id', org.org_id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);

      if (error) {
        console.error('Error cargando turnos:', error);
        return;
      }

      if (shifts && shifts.length > 0) {
        // Obtener horarios guardados actualizados para sincronizar nombres
        const savedShifts = await getSavedShifts();
        
        const mappedShifts: ShiftBlock[] = shifts.map(shift => {
          // Buscar el horario guardado correspondiente por nombre original
          const savedShift = savedShifts.find(s => s.name === shift.shift_name);
          
          // Detectar ausencias por nombre O por horarios nulos
          const ABSENCE_NAMES = ['Descanso', 'Libre', 'Vacaciones', 'Enfermo', 'Falta', 'Permiso', 'Baja', 'Curso', 'Horas Sindicales', 'Sancionado'];
          const isAbsenceByName = ABSENCE_NAMES.some(name => 
            shift.shift_name.toLowerCase().includes(name.toLowerCase())
          );
          const isAbsenceByTime = !shift.start_time && !shift.end_time;
          const isAbsenceByTimeRange = shift.start_time === '00:00:00' && shift.end_time === '23:59:00';
          const isAbsence = savedShift?.accessType === 'absence' || isAbsenceByName || isAbsenceByTime || isAbsenceByTimeRange;
          
          return {
            id: shift.id,
            employeeId: shift.employee_id,
            date: new Date(shift.date),
            // Si es ausencia, forzar undefined para no mostrar horario
            startTime: isAbsence ? undefined : shift.start_time,
            endTime: isAbsence ? undefined : shift.end_time,
            type: isAbsence ? 'absence' : 'morning',
            color: shift.color || savedShift?.color || '#86efac',
            name: savedShift?.name || shift.shift_name, // Usar nombre actualizado del horario guardado
            notes: shift.notes,
            organization_id: shift.org_id,
            hasBreak: savedShift?.hasBreak || !!shift.break_duration || false,
            breakDuration: savedShift?.breakDuration || shift.break_duration || undefined,
            breaks: savedShift?.breaks || [],
            totalBreakTime: savedShift?.totalBreakTime || (shift.break_duration ? parseInt(shift.break_duration) : 0),
            locked: (shift as any).locked ?? false,
          };
        });

        
        // SIEMPRE recargar desde Supabase para asegurar sincronización
        setShiftBlocks(() => {
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(mappedShifts));
          return mappedShifts;
        });
      } else {
        // Limpiar estado si no hay turnos
        setShiftBlocks([]);
        localStorage.removeItem('calendar-shift-blocks');
      }
    } catch (error) {
      console.error('Error en loadShiftsFromSupabase:', error);
    }
  };

  // Función para verificar si un colaborador debe aparecer en el calendario
  const shouldShowColaborador = (colaborador: any, weekDate: Date = new Date()): boolean => {
    // Si no existe el colaborador, no mostrarlo
    if (!colaborador) {
      return false;
    }

    // Si el colaborador está marcado como inactivo, no mostrarlo
    if (colaborador.status === 'inactivo') {
      return false;
    }

    // Si no tiene fecha de inicio, mostrarlo por defecto
    if (!colaborador.fecha_inicio_contrato) {
      return true;
    }

    // ✅ CRITICAL FIX #2: Use TODAY's date for contract check, not the week start date
    // This way employees appear if their contract is ACTIVE TODAY, regardless of when the week starts
    // BEFORE: Would compare against week start (e.g., March 23) and hide employees starting March 25
    // NOW: Compares against today's actual date
    const today = new Date();
    const startDate = new Date(colaborador.fecha_inicio_contrato);
    const checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    // ✅ Verificar fecha de fin de contrato
    if (colaborador.fecha_fin_contrato) {
      const endDate = new Date(colaborador.fecha_fin_contrato);
      const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      // El colaborador debe aparecer solo si su contrato está activo HOY
      return contractStart <= checkDate && checkDate <= contractEnd;
    }

    // Si no tiene fecha de fin, solo verificar que haya empezado HOY O ANTES
    return contractStart <= checkDate;
  };

  // Función para verificar si se puede asignar turno en una fecha específica
  const canAssignShiftOnDate = (employeeId: string, targetDate: Date, isFirstDayShift: boolean = false): boolean => {
    const colaborador = colaboradores.find(c => c.id === employeeId);
    
    // Si no existe el colaborador, no permitir
    if (!colaborador) {
      return false;
    }
    
    // Si está inactivo, no permitir asignación
    if (colaborador.status === 'inactivo') {
      return false;
    }
    
    // Si no tiene fecha de inicio, permitir por defecto
    if (!colaborador.fecha_inicio_contrato) {
      return true;
    }
    
    const startDate = new Date(colaborador.fecha_inicio_contrato);
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    // ✅ Verificar fecha de fin de contrato
    if (colaborador.fecha_fin_contrato) {
      const endDate = new Date(colaborador.fecha_fin_contrato);
      const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      // Permitir turnos "Primer día" exactamente en la fecha de inicio
      if (isFirstDayShift && target.getTime() === contractStart.getTime()) {
        return true;
      }
      
      // Solo permitir asignación si la fecha está dentro del rango del contrato
      return contractStart <= target && target <= contractEnd;
    }
    
    // Si no tiene fecha de fin, solo verificar que no sea antes del inicio
    // Permitir turnos "Primer día" exactamente en la fecha de inicio
    if (isFirstDayShift && target.getTime() === contractStart.getTime()) {
      return true;
    }
    
    return contractStart <= target;
  };

  // Función para obtener horas semanales de un empleado desde colaboradores
  const getWeeklyHoursFromColaborador = (employeeName: string): number => {
    const colaborador = colaboradores.find(col => 
      `${col.nombre}${col.apellidos ? ' ' + col.apellidos : ''}`.toLowerCase().includes(employeeName.toLowerCase()) ||
      employeeName.toLowerCase().includes(`${col.nombre}${col.apellidos ? ' ' + col.apellidos : ''}`.toLowerCase())
    );
    
    return colaborador?.tiempo_trabajo_semanal || 0;
  };

  // Función para calcular horas reales de la semana para un empleado
  const getWeeklyRealHours = (employeeId: string): number => {
    const currentWeekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    
    let totalHours = 0;
    
    // Buscar todos los turnos del empleado en la semana actual (excluyendo ausencias)
    const employeeShifts = shiftBlocks.filter(shift => 
      shift.employeeId === employeeId &&
      weekDays.some(day => isSameDay(shift.date, day)) &&
      !isAbsenceType(shift)
    );
    
    employeeShifts.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        // Calcular horas del turno
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        const startTotalMinutes = startHour * 60 + startMinute;
        let endTotalMinutes = endHour * 60 + endMinute;
        
        // Manejar turnos que cruzan medianoche
        if (endTotalMinutes < startTotalMinutes) {
          endTotalMinutes += 24 * 60;
        }
        
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        const hours = durationMinutes / 60;
        
        totalHours += hours;
      }
    });
    
    return Math.round(totalHours * 10) / 10; // Redondear a 1 decimal
  };

  // Función para calcular ausencias realizadas de la semana para un empleado
  const getWeeklyAbsenceHours = (employeeId: string): number => {
    const currentWeekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lunes
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    
    let totalAbsenceHours = 0;
    
    // Buscar todos los turnos de ausencia del empleado en la semana actual
    const employeeAbsences = shiftBlocks.filter(shift => 
      shift.employeeId === employeeId &&
      weekDays.some(day => isSameDay(shift.date, day)) &&
      isAbsenceType(shift)
    );
    
    employeeAbsences.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        // Calcular horas de la ausencia
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);
        
        const startTotalMinutes = startHour * 60 + startMinute;
        let endTotalMinutes = endHour * 60 + endMinute;
        
        // Manejar ausencias que cruzan medianoche
        if (endTotalMinutes < startTotalMinutes) {
          endTotalMinutes += 24 * 60;
        }
        
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        const hours = durationMinutes / 60;
        
        totalAbsenceHours += hours;
      }
    });
    
    return Math.round(totalAbsenceHours * 10) / 10; // Redondear a 1 decimal
  };
  
  // Función para navegar al perfil del colaborador
  const navigateToColaborador = (employeeName: string) => {
    const colaborador = colaboradores.find(c => 
      c.nombre &&
      `${c.nombre}${c.apellidos ? ' ' + c.apellidos : ''}` === employeeName
    );
    
    if (!colaborador) return;
    
    // Si es employee, solo puede navegar a su propio perfil
    if (isEmployee) {
      const currentUserColaborador = colaboradores.find(c => c.email === user?.email);
      if (!currentUserColaborador || currentUserColaborador.id !== colaborador.id) {
        toast({
          title: "Acceso restringido",
          description: "Solo puedes acceder a tu propio perfil",
          variant: "destructive"
        });
        return;
      }
    }
    
    navigate(`/colaboradores/${colaborador.id}/profile`);
  };

  // Función para adaptar horarios de turnos favoritos según el contrato del empleado
  // Función para adaptar horarios de shift blocks según el contrato del empleado
  const adaptShiftBlockToContract = (shift: ShiftBlock, sourceEmployeeId: string, targetEmployeeId: string) => {
    // Si no hay horarios definidos, no adaptar
    if (!shift.startTime || !shift.endTime) {
      return {
        startTime: shift.startTime,
        endTime: shift.endTime,
        adapted: false,
        originalHours: 0,
        adaptedHours: 0
      };
    }

    // Obtener información de los colaboradores
    const sourceColaborador = colaboradores.find(c => c.id === sourceEmployeeId);
    const targetColaborador = colaboradores.find(c => c.id === targetEmployeeId);
    const sourceEmployee = employees.find(e => e.id === sourceEmployeeId);
    const targetEmployee = employees.find(e => e.id === targetEmployeeId);
    
    // Calcular horas diarias de cada contrato
    const sourceContractHours = sourceColaborador?.tiempo_trabajo_semanal 
      ? Math.round(sourceColaborador.tiempo_trabajo_semanal / 5) 
      : sourceEmployee?.name ? getWeeklyHoursFromColaborador(sourceEmployee.name) / 5 : 8;
      
    const targetContractHours = targetColaborador?.tiempo_trabajo_semanal 
      ? Math.round(targetColaborador.tiempo_trabajo_semanal / 5) 
      : targetEmployee?.name ? getWeeklyHoursFromColaborador(targetEmployee.name) / 5 : 8;

    // Si ambos tienen las mismas horas de contrato, no adaptar
    if (sourceContractHours === targetContractHours) {
      return {
        startTime: shift.startTime,
        endTime: shift.endTime,
        adapted: false,
        originalHours: sourceContractHours,
        adaptedHours: targetContractHours
      };
    }

    // Si es un turno de ausencia (libre), no adaptarlo
    if (shift.type === 'absence' || shift.name === 'Descanso Semanal' || shift.name?.includes('Descanso') || shift.name?.includes('Libre')) {
      return {
        startTime: shift.startTime,
        endTime: shift.endTime,
        adapted: false,
        originalHours: sourceContractHours,
        adaptedHours: targetContractHours
      };
    }

    // Parsear hora de inicio del turno original
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    // Calcular nueva hora de fin basada en las horas del contrato objetivo
    const newEndTime = new Date(startTime.getTime() + (targetContractHours * 60 * 60 * 1000));
    
    const adaptedEndTime = `${newEndTime.getHours().toString().padStart(2, '0')}:${newEndTime.getMinutes().toString().padStart(2, '0')}`;

    return {
      startTime: shift.startTime,
      endTime: adaptedEndTime,
      adapted: true,
      originalHours: sourceContractHours,
      adaptedHours: targetContractHours
    };
  };
  const adaptShiftToContract = (shift: SavedShift, targetEmployeeId: string) => {
    // Obtener las horas del contrato del empleado objetivo
    const targetColaborador = colaboradores.find(c => c.id === targetEmployeeId);
    const targetEmployee = employees.find(e => e.id === targetEmployeeId);
    
    // Si no encontramos información del contrato, usar el turno original
    const contractHours = targetColaborador?.tiempo_trabajo_semanal 
      ? Math.round(targetColaborador.tiempo_trabajo_semanal / 5) // horas diarias
      : targetEmployee?.name ? getWeeklyHoursFromColaborador(targetEmployee.name) / 5 : 8;
    

    // Si es un turno de ausencia (libre), no adaptarlo
    if (shift.accessType === 'absence' || shift.name === 'Descanso Semanal') {
      return {
        startTime: shift.startTime,
        endTime: shift.endTime,
        adapted: false
      };
    }

    // Si no tiene horarios definidos, mantener original
    if (!shift.startTime || !shift.endTime) {
      return {
        startTime: shift.startTime,
        endTime: shift.endTime,
        adapted: false
      };
    }

    // Parsear hora de inicio del turno original
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    
    // Calcular nueva hora de fin basada en las horas del contrato
    const endTotalMinutes = (startHour * 60 + startMinute) + (contractHours * 60);
    const endHour = Math.floor(endTotalMinutes / 60) % 24;
    const endMin = endTotalMinutes % 60;
    
    const adaptedStartTime = shift.startTime;
    const adaptedEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    return {
      startTime: adaptedStartTime,
      endTime: adaptedEndTime,
      adapted: true,
      originalHours: shift.startTime && shift.endTime ? 
        (() => {
          const [oStartH, oStartM] = shift.startTime.split(':').map(Number);
          const [oEndH, oEndM] = shift.endTime.split(':').map(Number);
          return ((oEndH * 60 + oEndM) - (oStartH * 60 + oStartM)) / 60;
        })() : 0,
      adaptedHours: contractHours
    };
  };
  // Removed duplicate shiftBlocks declaration - already declared above

  // Función para actualizar empleados con persistencia y sin duplicados
  const updateEmployees = (newEmployees: Employee[]) => {
    // Filtrar duplicados antes de establecer el estado
    const uniqueEmployees = newEmployees.reduce((acc: Employee[], emp) => {
      if (!acc.find(existing => existing.id === emp.id)) {
        acc.push(emp);
      }
      return acc;
    }, []);
    
    
    setEmployees(uniqueEmployees);
    localStorage.setItem('calendar-employees', JSON.stringify(uniqueEmployees));
  };

  // Función para eliminar empleado del calendario con validación
  const removeEmployeeFromCalendar = (employeeId: string, employeeName: string) => {

    // Verificar permisos: solo admin, super_admin y roles superiores pueden eliminar empleados
    // 🔧 TEMPORALMENTE DESHABILITADO PARA TESTING: Esta función solo filtra la vista, no elimina datos
    // if (!isAdmin) {
    //   // toast({
    //   //   title: "Sin permisos",
    //   //   description: "No tienes permisos para eliminar empleados del calendario.",
    //   //   variant: "destructive",
    //   // });
    //   return;
    // }

    // Verificar si el empleado tiene horarios asignados (filtrar horarios válidos)
    const employeeShifts = shiftBlocks.filter(shift => 
      shift.employeeId === employeeId && 
      shift.startTime && 
      shift.endTime &&
      shift.date
    );
    
    
    if (employeeShifts.length > 0) {
      // Mostrar confirmación para forzar eliminación
      if (confirm(`${employeeName} tiene ${employeeShifts.length} horario(s) asignado(s). ¿Deseas forzar la eliminación de este empleado y todos sus horarios?`)) {
        forceDeleteEmployee(employeeId, employeeName);
        return true;
      }
      return false;
    }

    // Si no tiene shifts, proceder con la eliminación
    // 🆕 Use excludeEmployee from hook instead of manipulating state
    excludeEmployee(employeeId);

    // toast({
    //   title: "Empleado eliminado",
    //   description: `${employeeName} ha sido eliminado del calendario.`,
    // });

    return true;
  };

  // Función para forzar la eliminación de un empleado y sus horarios
  const forceDeleteEmployee = (employeeId: string, employeeName: string) => {
    // Eliminar todos los horarios del empleado con historial
    setShiftBlocksWithHistory(currentShifts => {
      const filteredShifts = currentShifts.filter(shift => shift.employeeId !== employeeId);
      localStorage.setItem('calendar-shift-blocks', JSON.stringify(filteredShifts));
      return filteredShifts;
    });

    // 🆕 Use excludeEmployee from hook instead of manipulating state
    excludeEmployee(employeeId);

    // toast({
    //   title: "Empleado eliminado forzadamente",
    //   description: `${employeeName} y todos sus horarios han sido eliminados del calendario.`,
    // });

    return true;
  };

  // Cargar colaboradores cuando org esté disponible O cuando se monta el componente
  useEffect(() => {
    if (!org?.id) {
      return;
    }

    loadColaboradores();
  }, [org?.id]); // Ejecutar cuando org esté disponible

  // ✅ FIX: Verificar que employees no esté vacío cuando se navega entre semanas
  // Si está vacío, intentar cargar nuevamente
  useEffect(() => {
    if (employees.length === 0 && org?.id && !isLoadingData) {
      // No hay empleados - cargar desde Supabase
      loadColaboradores();
    }
  }, [org?.id, isLoadingData]); // Re-verificar cuando la org o loading state cambia

  // REMOVIDO: Limpieza automática de localStorage que estaba causando logout
  // El problema era que este useEffect se ejecutaba en cada renderizado
  // y podría estar interfiriendo con las claves de sesión de Supabase

  // Función para limpiar localStorage y Supabase manualmente
  const clearLocalStorageShifts = async () => {
    // Mostrar confirmación en lugar de ejecutar directamente
    setConfirmClearCalendar(true);
  };

  const handleConfirmClearCalendar = async () => {
    try {
      const orgId = typeof org === 'string' ? org : org?.id;
      
      // 🛡️ PROTECCIÓN: Crear backup antes de eliminar todo
      if (shiftBlocks.length > 0) {
        await createBackupBeforeOperation(
          'clear_calendar',
          {
            shiftBlocks: shiftBlocks.map(shift => ({
              ...shift,
              date: format(shift.date, "yyyy-MM-dd"),
            })),
            employees,
            timestamp: new Date().toISOString(),
          },
          `Limpieza completa del calendario - ${shiftBlocks.length} turnos`,
          shiftBlocks.length
        );
      }
      
      // 1. Eliminar todos los turnos de la organización actual desde Supabase
      if (orgId) {
        const { error } = await supabase
          .from('calendar_shifts')
          .delete()
          .eq('org_id', orgId);
        
        if (error) {
          console.error('Error eliminando turnos de Supabase:', error);
        } else {
        }
      }
      
      // 2. Limpiar localStorage
      localStorage.removeItem('calendar-shift-blocks');
      
      // 3. Limpiar estado local
      setShiftBlocks([]);
      
      
      toast({
        title: "✅ Calendario limpiado",
        description: "Todos los turnos han sido eliminados. Se creó un backup de seguridad que puedes restaurar desde el botón de Backups.",
      });
    } catch (error) {
      console.error('Error en clearLocalStorageShifts:', error);
      toast({
        title: "❌ Error",
        description: "Hubo un problema al limpiar el calendario.",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar un turno específico de Supabase
  const deleteShiftFromSupabase = async (shiftId: string) => {
    try {
      // Get shift details before deletion for logging
      const { data: shiftData, error: shiftFetchError } = await supabase
        .from('calendar_shifts')
        .select('*')
        .eq('id', shiftId)
        .single();
      if (shiftFetchError) console.error('[deleteShiftFromSupabase] Error fetching shift for log:', shiftFetchError);
      
      const { error } = await supabase
        .from('calendar_shifts')
        .delete()
        .eq('id', shiftId);
      
      if (error) {
        console.error('Error eliminando turno de Supabase:', error);
        return false;
      }
      
      
      // Log activity
      if (shiftData) {
        const employee = employees.find(e => e.id === shiftData.employee_id);
        await logActivity({
          action: "TURNO_ELIMINADO",
          entityType: "calendar_shift",
          entityName: `${shiftData.shift_name} - ${employee?.name || 'Colaborador'}`,
          details: {
            employeeName: employee?.name,
            employeeId: shiftData.employee_id,
            shiftName: shiftData.shift_name,
            date: shiftData.date,
            startTime: shiftData.start_time,
            endTime: shiftData.end_time
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error en deleteShiftFromSupabase:', error);
      return false;
    }
  };

  // Función para persistir turno en Supabase
  const persistShiftToSupabase = async (shift: ShiftBlock) => {
    try {
      // Asegurar que tenemos un UUID válido para el ID
      const shiftId = shift.id.startsWith('first-day-') || shift.id.startsWith('shift-') || shift.id.startsWith('smart-')
        ? crypto.randomUUID()
        : shift.id;
      
      const { data, error } = await supabase
        .from('calendar_shifts')
        .upsert({
          id: shiftId,
          employee_id: shift.employeeId,
          date: format(shift.date, 'yyyy-MM-dd'),
          start_time: shift.startTime && shift.startTime.trim() !== '' ? shift.startTime : null,
          end_time: shift.endTime && shift.endTime.trim() !== '' ? shift.endTime : null,
          shift_name: shift.name || '',
          color: shift.color,
          notes: shift.notes || null,
          organization: shift.organization_id || 'default',
          break_duration: shift.breakDuration || null,
          org_id: org?.id || null,
          locked: shift.locked ?? false,
        }, { onConflict: 'employee_id,date,org_id', ignoreDuplicates: false })
        .select()
        .single();

      if (error) {
        console.error('Error persistiendo turno en Supabase:', error);
        return false;
      }

      
      // Log activity
      const employee = employees.find(e => e.id === shift.employeeId);
      await logActivity({
        action: "TURNO_CREADO",
        entityType: "calendar_shift",
        entityName: `${shift.name} - ${employee?.name || 'Colaborador'}`,
        details: {
          employeeName: employee?.name,
          employeeId: shift.employeeId,
          shiftName: shift.name,
          date: format(shift.date, 'yyyy-MM-dd'),
          startTime: shift.startTime,
          endTime: shift.endTime,
          source: "calendar"
        }
      });
      
      // Actualizar el ID en el estado local si se generó uno nuevo
      if (shiftId !== shift.id) {
        setShiftBlocks(currentShifts => {
          const updatedShifts = currentShifts.map(s => 
            s.id === shift.id ? { ...s, id: shiftId } : s
          );
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
          return updatedShifts;
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error en persistShiftToSupabase:', error);
      return false;
    }
  };

  // Función para actualizar todos los turnos con el mismo nombre
  const updateAllShiftsWithSameName = async (oldShiftName: string, updatedShiftData: Partial<ShiftBlock>) => {
    try {
      // Normalizar el nombre para evitar problemas de espacios
      const normalizedOldName = oldShiftName.trim();
      
      
      // Primero, verificar cuántos turnos hay con este nombre ANTES de actualizar
      const { data: existingShifts, error: countError } = await supabase
        .from('calendar_shifts')
        .select('id, shift_name, employee_id, date, color, start_time, end_time')
        .eq('shift_name', normalizedOldName)
        .eq('org_id', org?.id || null);
      
      if (countError) {
        console.error('❌ Error verificando turnos:', countError);
      } else {
      }
      
      // 1. Actualizar en Supabase usando match EXACTO del nombre - TODOS A LA VEZ
      const { data: updatedRecords, error: updateError } = await supabase
        .from('calendar_shifts')
        .update({
          shift_name: updatedShiftData.name || normalizedOldName,
          start_time: updatedShiftData.startTime || null,
          end_time: updatedShiftData.endTime || null,
          color: updatedShiftData.color,
          break_duration: updatedShiftData.breakDuration || null,
          notes: updatedShiftData.notes || null,
        })
        .eq('shift_name', normalizedOldName)
        .eq('org_id', org?.id || null)
        .select();

      if (updateError) {
        console.error('❌ Error actualizando en Supabase:', updateError);
        toast({
          title: "Error de sincronización",
          description: "No se pudieron actualizar todos los turnos en el servidor",
          variant: "destructive",
        });
        return false;
      }

      
      // Verificar que la actualización fue exitosa
      if (updatedRecords && updatedRecords.length !== existingShifts?.length) {
        console.warn(`⚠️ ADVERTENCIA: Se esperaban ${existingShifts?.length} actualizaciones pero se realizaron ${updatedRecords.length}`);
      }

      // 2. RECARGAR TODOS los turnos desde Supabase para tener el estado 100% sincronizado
      // Esperar un momento para asegurar que la actualización se haya completado en la BD
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const { data: allShifts, error: fetchError } = await supabase
        .from('calendar_shifts')
        .select('*')
        .eq('org_id', org?.id || null)
        .order('date', { ascending: true });

      if (fetchError) {
        console.error('❌ Error recargando turnos:', fetchError);
        toast({
          title: "Error de sincronización",
          description: "Los cambios se guardaron pero hubo un problema al recargar",
          variant: "destructive",
        });
      } else if (allShifts) {
        
        // Verificar que los turnos actualizados están presentes
        const verifyUpdated = allShifts.filter(s => 
          s.shift_name === (updatedShiftData.name || normalizedOldName)
        );
        
        // Convertir TODOS los datos de Supabase al formato ShiftBlock
        const convertedShifts: ShiftBlock[] = allShifts.map((shift: any) => ({
          id: shift.id || crypto.randomUUID(),
          employeeId: shift.employee_id,
          date: new Date(shift.date),
          startTime: shift.start_time,
          endTime: shift.end_time,
          type: shift.shift_type || 'morning',
          color: shift.color || '#86efac',
          name: shift.shift_name,
          organization_id: shift.org_id || 'default',
          hasBreak: !!shift.break_duration,
          breaks: [],
          totalBreakTime: shift.break_duration || 0,
          breakType: undefined,
          breakDuration: shift.break_duration,
          notes: shift.notes,
          absenceCode: shift.absence_code
        }));

        // 3. Actualizar el estado local COMPLETAMENTE con los datos de Supabase
        setShiftBlocks(() => {
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(convertedShifts));
          
          // Contar cuántos tienen el nombre actualizado
          const updatedNameCount = convertedShifts.filter(s => 
            s.name === (updatedShiftData.name || normalizedOldName)
          ).length;
          
          // Verificar que NO hay turnos con nombres incorrectos actualizados
          const allShiftNames = new Set(convertedShifts.map(s => s.name));
          
          return convertedShifts;
        });
      }

      // 4. Log activity
      await logActivity({
        action: "TURNOS_ACTUALIZADOS_EN_LOTE",
        entityType: "calendar_shift",
        entityName: `${oldShiftName} → ${updatedShiftData.name || oldShiftName}`,
        details: {
          oldName: oldShiftName,
          newName: updatedShiftData.name,
          changes: updatedShiftData,
          shiftsAffected: updatedRecords?.length || 0,
          source: "calendar"
        }
      });

      
      // 5. Esperar un momento adicional para asegurar que no hay operaciones en curso que sobrescriban
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 6. Verificación final - recargar una vez más para confirmar
      const { data: finalCheck } = await supabase
        .from('calendar_shifts')
        .select('id, shift_name, color, start_time, end_time')
        .eq('shift_name', updatedShiftData.name || normalizedOldName)
        .eq('org_id', org?.id || null);
      
      if (finalCheck && finalCheck.length > 0) {
      }
      
      toast({
        title: "Turnos sincronizados",
        description: `${updatedRecords?.length || 0} turno(s) actualizado(s) exitosamente`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error crítico en updateAllShiftsWithSameName:', error);
      toast({
        title: "Error crítico",
        description: "Ocurrió un error al actualizar los turnos",
        variant: "destructive",
      });
      return false;
    }
  };

  // SOLO guardar en localStorage cuando se modifica explícitamente
  const updateShiftBlocks = async (newShiftBlocks: ShiftBlock[]) => {
    setShiftBlocks(newShiftBlocks);
    try {
      localStorage.setItem('calendar-shift-blocks', JSON.stringify(newShiftBlocks));
      
      // Guardar en Supabase - PREVENIENDO DUPLICADOS
      if (org?.id) {
        await saveShiftsToSupabase(newShiftBlocks);
      }
    } catch (error) {
      console.error("Error guardando horarios en localStorage:", error);
    }
  };

  // Función para guardar turnos en Supabase evitando duplicados - MEJORADA
  const saveShiftsToSupabase = async (shifts: ShiftBlock[]) => {
    try {
      // Primero eliminar turnos existentes para los mismos empleados y fechas
      const uniqueShifts = shifts.filter(shift => shift.startTime && shift.endTime);
      
      for (const shift of uniqueShifts) {
        // Eliminar turnos duplicados existentes (por empleado, fecha y nombre de turno)
        await supabase
          .from('calendar_shifts')
          .delete()
          .match({
            employee_id: shift.employeeId,
            date: format(shift.date, 'yyyy-MM-dd'),
            shift_name: shift.name
          });

        // Insertar el turno actualizado con toda la información sincronizada
        const { error } = await supabase
          .from('calendar_shifts')
          .insert({
            employee_id: shift.employeeId,
            date: format(shift.date, 'yyyy-MM-dd'),
            start_time: shift.startTime,
            end_time: shift.endTime,
            shift_name: shift.name, // Nombre actualizado del horario
            color: shift.color,
            notes: shift.notes,
            break_duration: shift.breakDuration,
            org_id: org?.id,
            organization: org?.id
          });

        if (error) {
          console.error('Error guardando turno en Supabase:', error);
        } else {
        }
      }
      
    } catch (error) {
      console.error('Error en saveShiftsToSupabase:', error);
    }
  };

  // Función para recargar turnos y sincronizar cambios de horarios guardados
  const reloadAndSyncShifts = async () => {
    if (employees.length > 0) {
      await loadShiftsFromSupabase(employees.map(e => e.id));
    }
  };

  // Escuchar cambios en horarios guardados para sincronizar
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'saved-shifts-updated') {
        reloadAndSyncShifts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [employees]);

  // ❌ REMOVED: Debug functionality no longer needed

  // Inicializar horarios guardados desde la base de datos
  useEffect(() => {
    getSavedShifts().then(() => {
    });
  }, []);

  // ❌ REMOVED: Auto-generation functionality causing infinite loop

  // Efecto para procesar empleados seleccionados desde colaboradores
  useEffect(() => {
    if (selectedFromColaboradores.length > 0) {
      // Convertir empleados de colaboradores al formato del calendario
      const newEmployees = selectedFromColaboradores.map(colaborador => ({
        id: colaborador.id,
        name: `${colaborador.nombre}${colaborador.apellidos ? ' ' + colaborador.apellidos : ''}`,
        role: colaborador.tipo_contrato || "Sin definir",
        department: "Bares", // Por defecto
        workingHours: `0h/${colaborador.tiempo_trabajo_semanal || 40}h`
      }));
      
      // Actualizar empleados existentes y añadir nuevos - CON PREVENCIÓN DE DUPLICADOS
      let updatedEmployees = [...employees];
      const newEmployeesAdded: { employee: Employee; colaborador: any }[] = [];
      
      newEmployees.forEach(newEmployee => {
        const existingIndex = updatedEmployees.findIndex(emp => emp.id === newEmployee.id);
        const originalColaborador = selectedFromColaboradores.find(col => col.id === newEmployee.id);
        
        if (existingIndex >= 0) {
          // Actualizar empleado existente con nueva información
          updatedEmployees[existingIndex] = newEmployee;
        } else {
          // Añadir nuevo empleado solo si no existe
          updatedEmployees.push(newEmployee);
          newEmployeesAdded.push({ employee: newEmployee, colaborador: originalColaborador });
        }
      });
      
      // Filtrar duplicados una vez más por seguridad
      updatedEmployees = updatedEmployees.reduce((acc: Employee[], emp) => {
        if (!acc.find(existing => existing.id === emp.id)) {
          acc.push(emp);
        }
        return acc;
      }, []);
      
      updateEmployees(updatedEmployees);
      
      // ❌ DISABLED: Auto-generation of "Primer día" for new employees removed
      
      // Limpiar empleados seleccionados después de procesarlos
      clearSelectedEmployees();
    }
  }, [selectedFromColaboradores]);

  // DISABLED: Sincronización automática en tiempo real eliminada para evitar modificaciones automáticas
  // Esta función estaba causando cambios automáticos cuando había modificaciones en la tabla colaboradores

  // Calculate hours for each employee across the week
  const calculateEmployeeHours = (employeeId: string) => {
    // Convertir ambos IDs a string para comparación consistente
    const shifts = shiftBlocks.filter(shift => String(shift.employeeId) === String(employeeId));
    
    // DEBUG para varios empleados (removed hardcoded IDs)
    const isDebugEmployee = false; // Disabled debug mode
    
    if (isDebugEmployee) {
      
      shifts.forEach((shift, index) => {
      });
    }
    
    const totalHours = shifts.reduce((total, shift) => {
      const shiftHours = getShiftHours(shift);
      if (employeeId === "2") {
      }
      return total + shiftHours;
    }, 0);
    
    if (employeeId === "2") {
    }
    
    return totalHours;
  };

  // Mock employees with contract hours for calculations
  const mockEmployees = [
    { id: "1", name: "Bruce Wayne", role: "Manager", department: "Bares", contractHours: 40 },
    { id: "2", name: "Daniela Banda", role: "Camarera", department: "Bares", contractHours: 40 },
    { id: "3", name: "Joker As", role: "Recepcionista", department: "Recepción", contractHours: 30 },
    { id: "4", name: "Sergio Mateo", role: "Ayudante", department: "Cocina", contractHours: 40 },
    { id: "5", name: "María García", role: "Jefe de Sector", department: "Bares", contractHours: 40 },
    { id: "6", name: "Carlos López", role: "Camarero", department: "Restaurante", contractHours: 40 },
    { id: "7", name: "Ana Ruiz", role: "Recepcionista", department: "Recepción", contractHours: 30 },
    { id: "8", name: "Pedro Sánchez", role: "Ayudante", department: "Bares", contractHours: 20 },
  ];

  // Mock shifts data with hours information - SIMPLIFICADO
  const mockShifts = shiftBlocks.map(shift => ({
    ...shift,
    hours: getShiftHours(shift)
  }));

  // Function to check if employee exceeds weekly hours (scaled to visible period)
  const checkEmployeeHoursCompliance = (employeeId: string): { isExceeded: boolean, plannedHours: number, contractHours: number } => {
    const plannedHours = calculateEmployeeHours(employeeId);
    const colaborador = colaboradores.find(c => c.id === employeeId);
    if (!colaborador) return { isExceeded: false, plannedHours: 0, contractHours: 0 };

    const weeklyContract = colaborador.tiempo_trabajo_semanal || 40;
    // Scale contract hours using actual date range span (not just days with shifts)
    const empShifts = shiftBlocks.filter(s => s.employeeId === employeeId);
    if (empShifts.length === 0) return { isExceeded: false, plannedHours: 0, contractHours: weeklyContract };
    const dates = empShifts.map(s => s.date.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daySpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeksInPeriod = Math.max(1, Math.ceil(daySpan / 7));
    const contractHours = weeklyContract * weeksInPeriod;
    const isExceeded = plannedHours > contractHours;

    return { isExceeded, plannedHours, contractHours };
  };

  // Calculate planned hours, hours to plan, and hour bank for each employee
  const getEmployeeStats = (employeeId: string) => {
    const colaborador = colaboradores.find(c => c.id === employeeId);
    if (!colaborador) return { plannedHours: 0, hoursToPlanned: 0, hourBank: 0, contractMonths: 0 };

    const plannedHours = calculateEmployeeHours(employeeId);
    const contractHours = colaborador.tiempo_trabajo_semanal || 40;
    
    // Si no tiene horarios asignados, devolver 0h
    const shiftsForEmployee = shiftBlocks.filter(shift => shift.employeeId === employeeId);
    if (shiftsForEmployee.length === 0) {
      return { 
        plannedHours: 0, 
        hoursToPlanned: contractHours, 
        hourBank: 0, 
        contractMonths: 9 
      };
    }
    
    const hoursToPlanned = Math.max(0, contractHours - plannedHours);
    
    // DEBUG GENERALIZADO para empleados con turnos
    
    // Simulate contract months remaining (in a real app this would come from contract data)
    const contractMonths = 9; // "9m" as shown in TurnoSmart example
    
    // Hour bank will be implemented later as mentioned in the Scribehow
    const hourBank = 0;
    
    return { plannedHours, hoursToPlanned, hourBank, contractMonths };
  };

  // Función para mostrar las horas contractuales base
  const getContractHours = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    
    
    // Extraer las horas semanales del workingHours (formato: "0h/40h")
    const workingHours = employee?.workingHours || "0h/40h";
    const weeklyHours = workingHours.split('/')[1] || "40h";
    const weeklyHoursNumber = parseInt(weeklyHours.replace('h', ''));
    
    
    return `${weeklyHoursNumber}h semanales`;
  };

  // Helper function to get shifts for employee and date (support multiple shifts)
  const getShiftsForEmployeeAndDate = (employeeId: string, date: Date): ShiftBlock[] => {
    return shiftBlocks.filter(shift => 
      shift.employeeId === employeeId && isSameDay(shift.date, date)
    );
  };

  const getShiftForEmployeeAndDate = (employeeId: string, date: Date) => {
    const shifts = getShiftsForEmployeeAndDate(employeeId, date);
    return shifts.length > 0 ? shifts[0] : undefined;
  };

  /** Bloquea o desbloquea un turno con clic derecho. Solo managers. */
  const handleToggleLock = (shift: ShiftBlock, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isEmployee) return;

    const newLocked = !shift.locked;
    setShiftBlocksWithHistory((prev) =>
      prev.map((s) => (s.id === shift.id ? { ...s, locked: newLocked } : s))
    );

    // Persistir en DB directamente
    supabase
      .from("calendar_shifts")
      .update({ locked: newLocked } as any)
      .eq("id", shift.id)
      .then(({ error }) => {
        if (error) console.error("Error actualizando locked:", error);
      });

    toast({
      title: newLocked ? "🔒 Turno bloqueado" : "🔓 Turno desbloqueado",
      description: newLocked
        ? "El motor SMART no sobreescribirá este turno al regenerar."
        : "El motor SMART puede modificar este turno al regenerar.",
    });
  };

  const handleRestoreKit = async () => {
    const orgId = org?.id;
    if (!orgId) return;

    // C10: Paleta progresiva CLARO→OSCURO
    // Paleta pastel progresiva: claro (mañana) → medio (tarde) → oscuro (noche)
    const KIT_SHIFTS = [
      { name: "Mañana",      start_time: "07:00", end_time: "15:00", color: "#fde68a", has_break: true,  total_break_time: 30 }, // amber-200 (claro)
      { name: "Tarde",       start_time: "15:00", end_time: "23:00", color: "#fdba74", has_break: true,  total_break_time: 30 }, // orange-300 (medio)
      { name: "Noche",       start_time: "23:00", end_time: "07:00", color: "#a5b4fc", has_break: true,  total_break_time: 30 }, // indigo-300 (oscuro pastel)
      { name: "Transición",  start_time: "11:00", end_time: "19:00", color: "#fcd34d", has_break: true,  total_break_time: 30 }, // amber-300 (entre M y T)
      { name: "GEX Mañana",  start_time: "09:00", end_time: "17:00", color: "#d9f99d", has_break: true,  total_break_time: 30 }, // lime-200 (claro)
      { name: "GEX Tarde",   start_time: "12:00", end_time: "20:00", color: "#bef264", has_break: true,  total_break_time: 30 }, // lime-300 (medio)
      { name: "Guardia",     start_time: "09:00", end_time: "21:00", color: "#fca5a5", has_break: false, total_break_time: 0  }, // red-300 (pastel)
    ];

    const { data: existing, error: fetchError } = await supabase
      .from("saved_shifts")
      .select("name")
      .eq("org_id", orgId);

    if (fetchError) {
      toast({ title: "Error", description: "No se pudo verificar los horarios existentes.", variant: "destructive" });
      return;
    }

    const existingNames = new Set((existing ?? []).map((s: { name: string }) => s.name));
    const toInsert = KIT_SHIFTS.filter((s) => !existingNames.has(s.name));
    const skipped = KIT_SHIFTS.length - toInsert.length;

    if (toInsert.length === 0) {
      toast({ title: "Kit ya instalado", description: `Los ${KIT_SHIFTS.length} horarios base ya existen. Sin duplicados.` });
      return;
    }

    const rows = toInsert.map((s) => ({
      org_id: orgId,
      name: s.name,
      start_time: s.start_time,
      end_time: s.end_time,
      color: s.color,
      has_break: s.has_break,
      total_break_time: s.total_break_time,
    }));

    const { error: insertError } = await supabase.from("saved_shifts").insert(rows);
    if (insertError) {
      toast({ title: "Error al restaurar", description: insertError.message, variant: "destructive" });
      return;
    }

    const msg = skipped > 0
      ? `Restaurados ${toInsert.length} horarios. ${skipped} ya existían (sin duplicar).`
      : `Restaurados ${toInsert.length} horarios base.`;
    toast({ title: "Kit restaurado", description: msg });
  };

  const handleApplyAuditFix = (fix: SuggestedFix, violation: AuditViolation) => {
    if (fix.action === 'CHANGE_SHIFT' || fix.action === 'ADD_REST_DAY') {
      const fixDate = new Date(fix.date + 'T00:00:00');
      const isRestDay = fix.action === 'ADD_REST_DAY';

      // Buscar shift existente del empleado en esa fecha
      const existingShift = shiftBlocks.find(
        (s) => s.employeeId === fix.employeeId && format(s.date, 'yyyy-MM-dd') === fix.date
      );

      const newShift: ShiftBlock = {
        id: existingShift?.id || `fix-${Date.now()}`,
        employeeId: fix.employeeId,
        employeeName: violation.employeeName || fix.employeeId,
        date: fixDate,
        shiftName: fix.toShift || 'Descanso',
        startTime: fix.toShiftStartTime || null,
        endTime: fix.toShiftEndTime || null,
        color: fix.toShiftColor || (isRestDay ? '#94a3b8' : '#3b82f6'),
        isAbsence: isRestDay,
        absenceCode: isRestDay ? 'D' : undefined,
        locked: false,
      };

      setShiftBlocksWithHistory((prev) => {
        if (existingShift) {
          return prev.map((s) => (s.id === existingShift.id ? newShift : s));
        }
        return [...prev, newShift];
      });

      // Persistir en DB
      const orgId = org?.id;
      if (orgId && existingShift?.id && !existingShift.id.startsWith('fix-')) {
        supabase
          .from('calendar_shifts')
          .update({
            shift_name: newShift.shiftName,
            start_time: newShift.startTime,
            end_time: newShift.endTime,
            color: newShift.color,
            is_absence: newShift.isAbsence || false,
            absence_code: newShift.absenceCode || null,
          } as any)
          .eq('id', existingShift.id)
          .then(({ error }) => {
            if (error) console.error('Error aplicando fix:', error);
          });
      }

      toast({
        title: '🔧 Fix aplicado',
        description: fix.label,
      });

      // Re-ejecutar auditoría tras aplicar fix
      setTimeout(() => runAudit(), 500);
    }
  };

  const handleCellClick = (employee: Employee, date: Date, event?: React.MouseEvent) => {
    // 🔒 BLOQUEO: Si es EMPLOYEE, no permitir crear turnos
    if (isEmployee) {
      return;
    }
    
    // 🔒 Si está publicado: permite el flujo pero resolución de conflicto post-pub
    // (ConflictResolutionDialog se abre en handleShiftSelected si isPublished)
    
    const existingShift = getShiftForEmployeeAndDate(employee.id, date);
    
    // Don't show popup if clicking on a shift card area - let the ShiftCard handle its own clicks
    if (existingShift && event?.target) {
      const target = event.target as HTMLElement;
      // Check if the click is on a shift card or its children
      if (target.closest('[data-shift-card]')) {
        return;
      }
    }
    
    if (existingShift && event?.detail === 2) {
      // Double click - show shift details
      setShowShiftDetails({ shift: existingShift, employee });
      return;
    }
    
    // Single click on empty cell - show shift selector popup
    if (event && !existingShift) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setShowShiftSelector({
        position: { x: rect.left, y: rect.bottom + 5 },
        employeeId: employee.id,
        date: date
      });
    }
  };

  // Actualizar contadores de día cuando cambian los turnos
  const updateDayCounters = () => {
    const counters: {[key: string]: number} = {};
    weekDays.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      const shiftsForDay = shiftBlocks.filter(shift => 
        format(shift.date, "yyyy-MM-dd") === dayKey
      );
      
      // Contar EMPLEADOS ÚNICOS trabajando por día (máximo 1 por empleado/día), excluyendo ausencias
      const workingShifts = shiftsForDay.filter(shift => {
        // Solo contar turnos de empleados que deberían estar activos en esta fecha
        const colaborador = colaboradores.find(c => c.id === shift.employeeId);
        if (!shouldShowColaborador(colaborador, day)) {
          return false;
        }
        return shouldCountHours(shift);
      });
      const uniqueEmployees = new Set(workingShifts.map(shift => shift.employeeId));
      counters[dayKey] = uniqueEmployees.size;
    });
    setDayCounters(counters);
  };

  // Actualizar contadores cuando cambien los turnos
  useEffect(() => {
    updateDayCounters();
  }, [shiftBlocks, weekDays]);

  // Función para seleccionar/deseleccionar turnos individuales
  const handleShiftSelect = (shift: any) => {
    setSelectedShifts(prev => {
      const newSet = new Set(prev);
      const shiftId = shift.id;
      
      if (newSet.has(shiftId)) {
        newSet.delete(shiftId);
      } else {
        newSet.add(shiftId);
      }
      
      return newSet;
    });
  };

  // Función para seleccionar/deseleccionar columna completa
  const handleColumnSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isColumnSelected = selectedColumns.has(dateString);
    
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (isColumnSelected) {
        newSet.delete(dateString);
      } else {
        newSet.add(dateString);
      }
      return newSet;
    });

    setSelectedShifts(prev => {
      const newSet = new Set(prev);
      
      // Obtener todos los turnos de esta fecha
      employees.forEach(employee => {
        const shifts = getShiftsForEmployeeAndDate(employee.id, date);
        shifts.forEach(shift => {
          if (isColumnSelected) {
            newSet.delete(shift.id);
          } else {
            newSet.add(shift.id);
          }
        });
      });
      
      return newSet;
    });
  };

  const handleShiftSelected = (selectedShift: any, employeeId: string, date: Date) => {
    // Validar si se puede asignar turno en esta fecha (no es primer día)
    if (!canAssignShiftOnDate(employeeId, date, false)) {
      const colaborador = colaboradores.find(c => c.id === employeeId);
      const employee = employees.find(e => e.id === employeeId);
      if (colaborador?.fecha_inicio_contrato) {
        const startDate = new Date(colaborador.fecha_inicio_contrato);
        // toast({
        //   title: "No se puede asignar turno",
        //   description: `${employee?.name || 'El colaborador'} no puede tener turnos antes de su fecha de inicio: ${format(startDate, 'dd/MM/yyyy', { locale: es })}`,
        //   variant: "destructive",
        // });
      }
      return;
    }

    // Crear un nuevo horario basado en el seleccionado
    const isAbsence = selectedShift.isAbsence || selectedShift.accessType === 'absence';
    
    const newShift: ShiftBlock = {
      id: crypto.randomUUID(),
      employeeId,
      date,
      startTime: isAbsence ? undefined : (selectedShift.startTime || undefined),
      endTime: isAbsence ? undefined : (selectedShift.endTime || undefined),
      type: isAbsence ? 'absence' : 'morning',
      color: selectedShift.color || "#86efac",
      name: selectedShift.name,
      organization_id: org?.id || 'default',
      hasBreak: !!(selectedShift.breakType && selectedShift.breakDuration),
      absenceCode: isAbsence ? (selectedShift.absenceCode || selectedShift.name) : undefined
    };
    
    // Si el calendario está publicado → abrir ConflictResolutionDialog
    if (isPublished) {
      const existingShift = shiftBlocks.find(
        s => s.employeeId === employeeId &&
        format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const employee = employees.find(e => e.id === employeeId);
      setPendingPostPubShift({
        shift: newShift,
        conflictInfo: {
          rule: "POST_PUBLICATION_EDIT",
          severity: "warning",
          description: "Este calendario está publicado. Editar un turno publicado requiere registrar el motivo (fuerza mayor) o realizar un intercambio.",
          employeeId,
          employeeName: employee?.name || employeeId,
          day: date.getDate(),
          currentCode: existingShift?.name || "—",
          newCode: newShift.name,
        },
      });
      setShowConflictDialog(true);
      return;
    }

    // CRITICAL FIX: Usar callback para mantener estado consistente + Undo/Redo
    setShiftBlocksWithHistory(currentShifts => {
      const updatedShifts = [...currentShifts, newShift];
      // Persistir inmediatamente en localStorage
      localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
      return updatedShifts;
    });

    // CRÍTICO: Persistir inmediatamente en Supabase
    persistShiftToSupabase(newShift).catch(error => {
      console.error('Error crítico guardando turno en Supabase:', error);
    });
  };

  const handleTimeSlotClick = (employee: Employee, date: Date, shiftIndex: number, e: React.MouseEvent, absenceCode?: string) => {
    e.stopPropagation();
    
    // Validar si se puede asignar turno en esta fecha (no es primer día)
    if (!canAssignShiftOnDate(employee.id, date, false)) {
      const colaborador = colaboradores.find(c => c.id === employee.id);
      if (colaborador?.fecha_inicio_contrato) {
        const startDate = new Date(colaborador.fecha_inicio_contrato);
      }
      return;
    }

    // Manejar slots de ausencia (dinámico: sistema + personalizadas)
    if (absenceCode) {
      // Construir mapeo dinámico de colores desde defaultAbsenceShifts y customAbsences
      const absenceColors: Record<string, { color: string; name: string }> = {};
      
      // Ausencias del sistema
      defaultAbsenceShifts.forEach(shift => {
        const code = shift.id.split('-')[0];
        absenceColors[code] = { color: shift.color, name: shift.name };
      });
      
      // Ausencias personalizadas
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
        organization_id: org?.id || 'default',
        hasBreak: false,
        absenceCode: absenceCode
      };
      
      setShiftBlocksWithHistory(currentShifts => {
        const updatedShifts = [...currentShifts, newShift];
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
        return updatedShifts;
      });
      
      persistShiftToSupabase(newShift).catch(error => {
        console.error(`Error crítico guardando turno ${absenceInfo.name} en Supabase:`, error);
      });
      return;
    }

    const savedShifts = getSavedShiftsSync()
      .filter(s => s.accessType !== 'absence')
      .sort((a, b) => {
        const timeA = a.startTime || '99:99';
        const timeB = b.startTime || '99:99';
        return timeA.localeCompare(timeB);
      });
    const selectedShift = savedShifts[shiftIndex];
    
    if (selectedShift) {
      // Manejar ausencias como turnos de día completo
      const isAbsence = selectedShift.accessType === 'absence';
      const absenceCode = isAbsence ? selectedShift.name : null;
      
      // Crear turno directamente con los datos del slot seleccionado
      const newShift: ShiftBlock = {
        id: crypto.randomUUID(),
        employeeId: employee.id,
        date: date,
        startTime: isAbsence ? undefined : (selectedShift.startTime || '08:00'),
        endTime: isAbsence ? undefined : (selectedShift.endTime || '16:00'),
        type: isAbsence ? 'absence' : (selectedShift.name.includes('Mañana') ? 'morning' : selectedShift.name.includes('Tarde') ? 'afternoon' : 'night') as 'morning' | 'afternoon' | 'night' | 'absence',
        color: selectedShift.color,
        name: selectedShift.name,
        organization_id: org?.id || 'default',
        hasBreak: !!(selectedShift.breakType && selectedShift.breakDuration),
        absenceCode: absenceCode
      };
      
      // CRITICAL FIX: Usar callback para mantener estado consistente + Undo/Redo
      setShiftBlocksWithHistory(currentShifts => {
        const updatedShifts = [...currentShifts, newShift];
        // Persistir inmediatamente en localStorage
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
        return updatedShifts;
      });
      
      // CRÍTICO: Persistir inmediatamente en Supabase
      persistShiftToSupabase(newShift).catch(error => {
        console.error('Error crítico guardando turno en Supabase:', error);
      });
    }
  };

  // Function to handle adding additional shifts
  const handleAddShift = (employee: Employee, date: Date, event?: React.MouseEvent) => {
    // Check if calendar is published
    if (isPublished) {
      toast({
        title: "Calendario publicado",
        description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
        variant: "destructive",
      });
      return;
    }

    // Validar si se puede asignar turno en esta fecha (no es primer día)
    if (!canAssignShiftOnDate(employee.id, date, false)) {
      const colaborador = colaboradores.find(c => c.id === employee.id);
      if (colaborador?.fecha_inicio_contrato) {
        const startDate = new Date(colaborador.fecha_inicio_contrato);
        // toast({
        //   title: "No se puede asignar turno",
        //   description: `${employee.name} no puede tener turnos antes de su fecha de inicio: ${format(startDate, 'dd/MM/yyyy', { locale: es })}`,
        //   variant: "destructive",
        // });
      }
      return;
    }

    let position = { x: 0, y: 0 };
    
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      // Posicionar a la derecha del elemento trigger
      position = { 
        x: rect.right + 5,
        y: rect.top
      };
    }
    
    setShowShiftSelector({
      employeeId: employee.id,
      date,
      position
    });
  };

  // Función para seleccionar/deseleccionar empleado completo
  const handleEmployeeSelect = (employeeId: string) => {
    const isEmployeeSelected = selectedEmployees.has(employeeId);
    
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (isEmployeeSelected) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });

    setSelectedShifts(prev => {
      const newSet = new Set(prev);
      
      // Obtener todos los turnos de este empleado en la semana actual
      weekDays.forEach(day => {
        const shifts = getShiftsForEmployeeAndDate(employeeId, day);
        shifts.forEach(shift => {
          if (isEmployeeSelected) {
            newSet.delete(shift.id);
          } else {
            newSet.add(shift.id);
          }
        });
      });
      
      return newSet;
    });
  };

  const handleEmployeeSelection = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleDaySelection = (dayKey: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayKey)) {
      newSelected.delete(dayKey);
    } else {
      newSelected.add(dayKey);
    }
    setSelectedDays(newSelected);
  };

  const clearSelection = () => {
    setSelectedEmployees(new Set());
    setSelectedDays(new Set());
    setSelectedShifts(new Set());
    setSelectedColumns(new Set());
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');
    
    // console.log('handleDragOver', { dropAction, target: target.className });
    
    if (dropAction === 'move' || dropAction === 'duplicate') {
      e.dataTransfer.dropEffect = dropAction === 'move' ? 'move' : 'copy';
      setCurrentDropAction(dropAction as 'move' | 'duplicate');
      // console.log('Setting drop action:', dropAction);
    } else {
      e.dataTransfer.dropEffect = 'move';
      setCurrentDropAction('move');
      // console.log('Setting default drop action: move');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetEmployeeId: string, targetDate: Date) => {
    e.preventDefault();
    
    // CRITICAL PROTECTION: Solo procesar si realmente se originó de una interacción de usuario válida
    if (!e.isTrusted) {
      return;
    }
    
    // PROTECTION: Verificar que existe data válido del drag (text/plain o application/json)
    const dragDataRaw = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('application/json');
    if (!dragDataRaw) {
      return;
    }
    
    setDragOverCell(null);
    setIsDragging(false);
    setHoveredZone(null);
    
    // Validar si se puede asignar turno en esta fecha (no es primer día)
    if (!canAssignShiftOnDate(targetEmployeeId, targetDate, false)) {
      const colaborador = colaboradores.find(c => c.id === targetEmployeeId);
      const employee = employees.find(e => e.id === targetEmployeeId);
      let errorMessage = "No se puede asignar turno en esta fecha.";
      
      if (colaborador?.fecha_fin_contrato) {
        const endDate = new Date(colaborador.fecha_fin_contrato);
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const contractEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        if (targetDateOnly > contractEnd) {
          errorMessage = `El contrato de ${employee?.name || 'este colaborador'} finalizó el ${format(endDate, 'dd/MM/yyyy', { locale: es })}. No se pueden asignar turnos después de esta fecha.`;
        }
      }
      
      if (colaborador?.fecha_inicio_contrato && !colaborador?.fecha_fin_contrato) {
        const startDate = new Date(colaborador.fecha_inicio_contrato);
        const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const contractStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        
        if (targetDateOnly < contractStart) {
          errorMessage = `El contrato de ${employee?.name || 'este colaborador'} comienza el ${format(startDate, 'dd/MM/yyyy', { locale: es })}. No se pueden asignar turnos antes de esta fecha.`;
        }
      }
      
      toast({
        title: "Fecha inválida",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }
    
    // Verificar si viene de favoritos
    if (draggedFavorite) {
      // Adaptar el turno al contrato del empleado objetivo
      const adaptedTimes = adaptShiftToContract(draggedFavorite, targetEmployeeId);
      
      // Obtener el absenceCode real del draggedFavorite
      const isAbsence = draggedFavorite.accessType === 'absence';
      
      const newShift: ShiftBlock = {
        id: `shift-${Date.now()}`,
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
        const updatedShifts = [...currentShifts, newShift];
        localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
        return updatedShifts;
      });
      
      // CRÍTICO: Persistir inmediatamente en Supabase
      persistShiftToSupabase(newShift).catch(error => {
        console.error('Error crítico guardando turno favorito en Supabase:', error);
      });
      
      // Log activity for favorite shift
      const targetEmployee = employees.find(e => e.id === targetEmployeeId);
      await logActivity({
        action: "TURNO_FAVORITO_AÑADIDO",
        entityType: "calendar_shift",
        entityName: `${draggedFavorite.name} - ${targetEmployee?.name || 'Colaborador'}`,
        details: {
          employeeName: targetEmployee?.name,
          employeeId: targetEmployeeId,
          shiftName: draggedFavorite.name,
          date: targetDate.toISOString().split('T')[0],
          startTime: adaptedTimes.startTime,
          endTime: adaptedTimes.endTime,
          source: "favorites",
          adapted: adaptedTimes.adapted,
          originalHours: adaptedTimes.originalHours,
          adaptedHours: adaptedTimes.adaptedHours
        }
      });
      
      setDraggedFavorite(null);
      
      // Mostrar información de adaptación en el toast
      const toastMessage = adaptedTimes.adapted 
        ? `"${draggedFavorite.name}" adaptado de ${adaptedTimes.originalHours}h a ${adaptedTimes.adaptedHours}h (${adaptedTimes.startTime}-${adaptedTimes.endTime})`
        : `"${draggedFavorite.name}" añadido al calendario`;
      
      // toast({
      //   title: adaptedTimes.adapted ? "Horario adaptado automáticamente" : "Horario agregado desde favoritos",
      //   description: toastMessage,
      // });
      return;
    }
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Manejar si viene desde favoritos a través de dataTransfer
      if (dragData.type === 'favorite' && dragData.shift) {
        const favoriteShift = dragData.shift as SavedShift;
        const adaptedTimes = adaptShiftToContract(favoriteShift, targetEmployeeId);
        
        // Usar el absenceCode del dragData si está disponible
        const isAbsence = dragData.isAbsence || favoriteShift.accessType === 'absence';
        const absenceCode = dragData.absenceCode || (favoriteShift as any).absenceCode || favoriteShift.name;
        
        const newShift: ShiftBlock = {
          id: `shift-${Date.now()}`,
          employeeId: targetEmployeeId,
          date: new Date(targetDate),
          startTime: isAbsence ? undefined : adaptedTimes.startTime,
          endTime: isAbsence ? undefined : adaptedTimes.endTime,
          type: isAbsence ? 'absence' : 'morning',
          color: favoriteShift.color,
          name: favoriteShift.name,
          absenceCode: isAbsence ? absenceCode : undefined
        };
        
        setShiftBlocksWithHistory(currentShifts => {
          const updatedShifts = [...currentShifts, newShift];
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
          return updatedShifts;
        });
        
        // CRÍTICO: Persistir inmediatamente en Supabase
        persistShiftToSupabase(newShift).catch(error => {
          console.error('Error crítico guardando turno favorito en Supabase:', error);
        });
        
        const toastMessage = adaptedTimes.adapted 
          ? `"${favoriteShift.name}" adaptado de ${adaptedTimes.originalHours}h a ${adaptedTimes.adaptedHours}h (${adaptedTimes.startTime}-${adaptedTimes.endTime})`
          : `"${favoriteShift.name}" añadido al calendario`;
        
        // toast({
        //   title: adaptedTimes.adapted ? "Horario adaptado automáticamente" : "Horario agregado desde favoritos",
        //   description: toastMessage,
        // });
        return;
      }
      
      const { shift, sourceEmployeeId } = dragData;
      
      // Si es el mismo empleado y la misma fecha, no hacer nada
      if (sourceEmployeeId === targetEmployeeId && 
          format(new Date(shift.date), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')) {
        return;
      }
      
      // Determinar la acción basada en dónde se soltó - buscar más profundamente
      const target = e.target as HTMLElement;
      let dropAction = target.getAttribute('data-drop-action');
      
      // Si no encuentra el atributo directamente, buscar en el padre más cercano
      if (!dropAction) {
        dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');
      }
      
      const action = dropAction || currentDropAction || 'move';
      
      
      if (action === 'duplicate') {
        // Duplicar: crear nuevo horario sin eliminar el original
        // Adaptar el turno al contrato del empleado objetivo
        const adaptedTimes = adaptShiftBlockToContract(shift, sourceEmployeeId, targetEmployeeId);
        
        const newShift: ShiftBlock = {
          ...shift,
          id: `shift-${Date.now()}`,
          employeeId: targetEmployeeId,
          date: new Date(targetDate),
          startTime: adaptedTimes.startTime,
          endTime: adaptedTimes.endTime
        };
        
        
        setShiftBlocksWithHistory(currentShifts => {
          const updatedShifts = [...currentShifts, newShift];
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
          return updatedShifts;
        });
        
        // CRÍTICO: Persistir inmediatamente en Supabase
        persistShiftToSupabase(newShift).catch(error => {
          console.error('Error crítico guardando turno duplicado en Supabase:', error);
        });
        
        // Mostrar información de adaptación si fue necesaria
        if (adaptedTimes.adapted) {
        }
        
        // toast({
        //   title: "Horario duplicado",
        //   description: `Horario duplicado para ${employees.find(e => e.id === targetEmployeeId)?.name || 'empleado'}`,
        // });
      } else {
        // Mover: eliminar original y crear nuevo
        // Adaptar el turno al contrato del empleado objetivo
        const adaptedTimes = adaptShiftBlockToContract(shift, sourceEmployeeId, targetEmployeeId);
        
        
        setShiftBlocksWithHistory(currentShifts => {
          const filteredShifts = currentShifts.filter(s => s.id !== shift.id);
          
          const newShift: ShiftBlock = {
            ...shift,
            id: `shift-${Date.now()}`,
            employeeId: targetEmployeeId,
            date: new Date(targetDate),
            startTime: adaptedTimes.startTime,
            endTime: adaptedTimes.endTime
          };
          
          const updatedShifts = [...filteredShifts, newShift];
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
          
          // CRÍTICO: Persistir inmediatamente en Supabase y eliminar el original
          deleteShiftFromSupabase(shift.id);
          persistShiftToSupabase(newShift).catch(error => {
            console.error('Error crítico guardando turno movido en Supabase:', error);
          });
          
          return updatedShifts;
        });
        
        // Mostrar información de adaptación si fue necesaria
        if (adaptedTimes.adapted) {
        }
        
        // toast({
        //   title: "Horario movido",
        //   description: `Horario movido a ${employees.find(e => e.id === targetEmployeeId)?.name || 'empleado'}`,
        // });
      }
      
      setCurrentDropAction(null);
    } catch (error) {
      console.error('Error al procesar drop:', error);
      // toast({
      //   title: "Error",
      //   description: "Error al procesar el turno",
      //   variant: "destructive",
      // });
    }
  };

  const handleDragEnter = (employeeId: string, date: Date) => {
    const cellKey = `${employeeId}-${format(date, 'yyyy-MM-dd')}`;
    setDragOverCell(cellKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar dragOverCell si realmente salimos de la celda
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
      
      // Verificar si es un favorito
      if (dragData.type === 'favorite' && dragData.isFavorite) {
        const favoriteShift = dragData.shift;
        
        // No permitir eliminar el turno por defecto "Descanso Semanal"
        if (favoriteShift.isSystemDefault) {
          // toast({
          //   title: "No se puede eliminar",
          //   description: "El turno 'Descanso Semanal' es un turno del sistema y no se puede eliminar",
          //   variant: "destructive",
          // });
          return;
        }
        
        // Eliminar de favoritos
        removeFromFavorites(favoriteShift.id);
        
        // toast({
        //   title: "Favorito eliminado",
        //   description: `El turno "${favoriteShift.name}" ha sido eliminado de favoritos`,
        // });
        return;
      }
      
      // Si es un turno del calendario
      if (dragData.shift && dragData.type === 'calendar') {
        const { shift } = dragData;
        
        // Verificar que el turno existe en el array
        const shiftExists = shiftBlocks.find(s => s.id === shift.id);
        
        if (!shiftExists) {
          // toast({
          //   title: "Error",
          //   description: "El turno no existe en el calendario",
          //   variant: "destructive",
          // });
          return;
        }
        
        // Eliminar de Supabase primero
        deleteShiftFromSupabase(shift.id);
        
        // Eliminar el turno del calendario con historial
        setShiftBlocksWithHistory(currentShifts => {
          const newShiftBlocks = currentShifts.filter(s => s.id !== shift.id);
          localStorage.setItem('calendar-shift-blocks', JSON.stringify(newShiftBlocks));
          return newShiftBlocks;
        });
        
        // Registro de actividad sin toast
        return;
      }
      
      
      // Registro de actividad sin toast
    } catch (error) {
      console.error('Error al eliminar:', error);
      // toast({
      //   title: "Error",
      //   description: "Error al eliminar",
      //   variant: "destructive",
      // });
    }
  };

  // Global drag start/end handlers
  useEffect(() => {
    const handleGlobalDragStart = (e: DragEvent) => {
      setIsDragging(true);
    };
    
    const handleGlobalDragEnd = (e: DragEvent) => {
      setIsDragging(false);
      setDeleteZoneDragOver(false);
      setCurrentDropAction(null);
      setDraggedFavorite(null);
      setHoveredZone(null);
    };

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Auto-scroll cuando se arrastra cerca de los bordes
  useEffect(() => {
    if (!isDragging) return;
    
    let scrollInterval: NodeJS.Timeout | null = null;
    
    const handleDragMove = (e: DragEvent) => {
      const threshold = 100; // Píxeles desde el borde para activar scroll
      const scrollSpeed = 10; // Velocidad de scroll
      
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;
      
      // Scroll hacia abajo cuando está cerca del borde inferior
      if (mouseY > viewportHeight - threshold) {
        if (!scrollInterval) {
          scrollInterval = setInterval(() => {
            window.scrollBy(0, scrollSpeed);
          }, 16); // ~60fps
        }
      }
      // Scroll hacia arriba cuando está cerca del borde superior
      else if (mouseY < threshold) {
        if (!scrollInterval) {
          scrollInterval = setInterval(() => {
            window.scrollBy(0, -scrollSpeed);
          }, 16);
        }
      }
      // Detener scroll cuando no está cerca de los bordes
      else {
        if (scrollInterval) {
          clearInterval(scrollInterval);
          scrollInterval = null;
        }
      }
    };
    
    document.addEventListener('dragover', handleDragMove);
    
    return () => {
      document.removeEventListener('dragover', handleDragMove);
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [isDragging]);

  const hasSelections = selectedEmployees.size > 0 || selectedDays.size > 0;

  const sortEmployees = (employees: Employee[], sortType: string) => {
    return [...employees].sort((a, b) => {
      switch (sortType) {
        case "name-asc":
          return a.name.localeCompare(b.name, 'es', { numeric: true });
        case "name-desc":
          return b.name.localeCompare(a.name, 'es', { numeric: true });
        case "surname-asc":
          return a.name.split(' ').slice(-1)[0].localeCompare(b.name.split(' ').slice(-1)[0], 'es', { numeric: true });
        case "surname-desc":
          return b.name.split(' ').slice(-1)[0].localeCompare(a.name.split(' ').slice(-1)[0], 'es', { numeric: true });
        case "role-asc":
          return a.role.localeCompare(b.role);
        case "role-desc":
          return b.role.localeCompare(a.role);
        case "seniority-recent":
          // Más reciente primero (mayor fecha de inicio)
          return new Date(b.startDate || '1900-01-01').getTime() - new Date(a.startDate || '1900-01-01').getTime();
        case "seniority-old":
          // Más antiguo primero (menor fecha de inicio)
          return new Date(a.startDate || '1900-01-01').getTime() - new Date(b.startDate || '1900-01-01').getTime();
        default:
          return 0;
      }
    });
  };

  // Filtrar empleados que deberían aparecer según su fecha de inicio de contrato
  // ✅ CRÍTICO FIX #1: Mostrar TODOS los empleados válidos (con contrato vigente)
  // No filtrar por shifts - los empleados deben aparecer aunque no tengan turnos esta semana
  // Esto permite crear turnos desde cero en week view (antes estaba completamente vacío)
  // 🆕 Use filteredEmployees to respect exclusions set via excludeEmployee hook
  const activeEmployees = filteredEmployees.filter(employee => {
    const colaborador = colaboradores.find(c => c.id === employee.id);

    // Mostrar empleado si cumple fechas de contrato (no requiere shifts esta semana)
    return shouldShowColaborador(colaborador, currentWeek);
  });

  // 🆕 Usar hook global para sincronizar ordenamiento entre TODAS las vistas
  // Esto garantiza que si cambias de Week a Month a Day, el orden sea IDÉNTICO
  const { sortedEmployees, sortBy, setSortBy } = useEmployeeSortOrder(activeEmployees, org?.id);

  // Tour de onboarding (solo primera vez)
  const { shouldShow: showTour, completeTour } = useOnboardingTour(org?.id);

  // SMART Schedule Generator (v1 — legacy)
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);
  const { generate: runSmartGenerate, isGenerating } = useSmartGenerate({
    employees,
    currentWeek,
    orgId: org?.id,
    onResult: (newBlocks) => {
      skipDbReloadRef.current = true;
      const monthStart = new Date(newBlocks[0]?.date ?? currentWeek);
      monthStart.setDate(1);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      setShiftBlocksWithHistory((prev) => {
        const otherMonths = prev.filter((b) => {
          const d = new Date(b.date);
          return !(d.getFullYear() === year && d.getMonth() === month);
        });
        return [...otherMonths, ...newBlocks];
      });
      setShowGenerateSheet(false);
      setTimeout(() => { skipDbReloadRef.current = false; }, 5000);
    },
  });

  // SMART Schedule Generator v2 — 3 alternativas con score
  const [showAlternativesSheet, setShowAlternativesSheet] = useState(false);
  const {
    generation: smartGeneration,
    isGenerating: isGeneratingV2,
    generate: runSmartGenerateV2,
    applyAlternative,
  } = useSmartGenerateV2({
    employees,
    currentWeek,
    orgId: org?.id,
    onResult: (newBlocks) => {
      // 🛡️ Bloquear recargas de DB mientras se persisten los nuevos bloques.
      // Sin esto, loadShiftsFromSupabase (que solo carga 1 semana) sobrescribe
      // el state del mes completo que acabamos de generar.
      skipDbReloadRef.current = true;

      const monthStart = new Date(newBlocks[0]?.date ?? currentWeek);
      monthStart.setDate(1);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      setShiftBlocksWithHistory((prev) => {
        const otherMonths = prev.filter((b) => {
          const d = new Date(b.date);
          return !(d.getFullYear() === year && d.getMonth() === month);
        });
        return [...otherMonths, ...newBlocks];
      });
      setShowAlternativesSheet(false);

      // Desbloquear después de que la persistencia tenga tiempo de completar.
      // El batch upsert tarda ~1-2s; damos 5s de margen.
      setTimeout(() => {
        skipDbReloadRef.current = false;
      }, 5000);
    },
  });

  // Wizard SMART v2 (9 pasos)
  const [showWizard, setShowWizard] = useState(false);
  const hasExistingShifts = shiftBlocks.length > 0;

  // SMART+IA: sugerencias proactivas
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const savedShiftCodes = useMemo(
    () => getSavedShiftsSync().map((s: any) => s.name as string),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const employeesForIA = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        name: e.name,
        vacationDaysUsed: 0,   // TODO: conectar con contador real cuando exista
        vacationDaysTotal: 30,
      })),
    [employees]
  );
  const {
    suggestions: smartSuggestions,
    detectAfterGeneration,
    acceptSuggestion,
    dismissSuggestion,
    clearAll: clearSmartSuggestions,
    pendingCount: smartPendingCount,
  } = useSmartSuggestions({ savedShiftCodes, employees: employeesForIA });

  const handleOpenGenerateSheet = () => setShowWizard(true);
  const handleGenerate = (config: GenerateConfig) => {
    // Legacy: redirigir al wizard
    runSmartGenerateV2();
    setShowGenerateSheet(false);
    setShowAlternativesSheet(true);
  };
  const handleWizardGenerate = (config: WizardConfig) => {
    runSmartGenerateV2(config.weeks, config.fomGuardiaDays ?? []);
  };

  const handleApplyAlternative = (index: number) => {
    applyAlternative(index);
    setShowWizard(false);
    setShowAlternativesSheet(false);
    // SMART+IA: detectar patrones tras aplicar alternativa
    if (smartGeneration) {
      detectAfterGeneration(smartGeneration);
    }
    // Auto-navegar al inicio del período generado para que el FOM vea los turnos inmediatamente
    if (smartGeneration?.alternatives[index]) {
      const startDate = smartGeneration.alternatives[index].output.meta.period.startDate;
      if (startDate) {
        setCurrentWeek(new Date(startDate + "T00:00:00"));
      }
    }
    // Persistencia automática: setShiftBlocks updater ya llama persistShiftsBatch
  };

  // C9: Calcular resumen del período anterior para Wizard Step 5
  // T2-9: Previous period summary from employee_equity DB (real historical data)
  const [previousPeriodSummary, setPreviousPeriodSummary] = useState<PreviousPeriodSummary[]>([]);
  useEffect(() => {
    if (!org?.id || employees.length === 0) { setPreviousPeriodSummary([]); return; }
    const loadPreviousPeriod = async () => {
      try {
        const periodStart = format(currentWeek, 'yyyy-MM-dd');
        const { data } = await supabase
          .from('employee_equity')
          .select('employee_id, morning_count, afternoon_count, night_count, period_end')
          .eq('organization_id', org.id)
          .lt('period_end', periodStart)
          .order('period_end', { ascending: false });
        if (data && data.length > 0) {
          // Take most recent per employee
          const seen = new Set<string>();
          const summaries: PreviousPeriodSummary[] = [];
          for (const row of data) {
            if (seen.has(row.employee_id)) continue;
            seen.add(row.employee_id);
            const emp = employees.find(e => e.id === row.employee_id);
            if (!emp) continue;
            summaries.push({
              employeeId: row.employee_id,
              employeeName: emp.name,
              lastShift: '-',
              morningCount: row.morning_count ?? 0,
              afternoonCount: row.afternoon_count ?? 0,
              nightCount: row.night_count ?? 0,
            });
          }
          if (summaries.length > 0) { setPreviousPeriodSummary(summaries); return; }
        }
      } catch { /* graceful — table may not exist */ }
      // Fallback: compute from current shiftBlocks if no DB data
      if (shiftBlocks.length === 0) { setPreviousPeriodSummary([]); return; }
      const summaryMap = new Map<string, PreviousPeriodSummary>();
      for (const emp of employees) {
        summaryMap.set(emp.id, { employeeId: emp.id, employeeName: emp.name, lastShift: '-', morningCount: 0, afternoonCount: 0, nightCount: 0 });
      }
      const sorted = [...shiftBlocks].filter(s => !s.isAbsence).sort((a, b) => a.date.getTime() - b.date.getTime());
      for (const shift of sorted) {
        const s = summaryMap.get(shift.employeeId);
        if (!s) continue;
        s.lastShift = shift.shiftName || '-';
        const code = (shift.shiftName || '').charAt(0).toUpperCase();
        if (code === 'M' || shift.shiftName === 'Mañana') s.morningCount++;
        else if (code === 'T' || shift.shiftName === 'Tarde') s.afternoonCount++;
        else if (code === 'N' || shift.shiftName === 'Noche') s.nightCount++;
      }
      setPreviousPeriodSummary(Array.from(summaryMap.values()).filter(s => s.lastShift !== '-'));
    };
    loadPreviousPeriod();
  }, [org?.id, employees.length, currentWeek]); // eslint-disable-line react-hooks/exhaustive-deps

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
        contractHours: 40
      };
    });
  }, [shiftBlocks, employees]);

  // Hook de auditoría para semana
  const {
    auditResult,
    isAuditing,
    runAudit,
    getViolationsForCell,
    getViolationsForEmployee,
    getMaxSeverityForCell
  } = useWeekAudit(shiftsForAudit, weekStart, org?.id);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-3">
      {/* Header Unificado - Idéntico en todas las vistas */}
        <UnifiedCalendarHeader
          viewMode="week"
          selectedDate={currentWeek}
          onDateChange={setCurrentWeek}
          hasUnsavedChanges={hasUnsavedChanges}
          changeCount={changeCount}
          onSave={forceSave}
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
          onOpenPetitions={() => setShowPetitions(true)}
          onOpenOccupancy={() => setShowOccupancyImport(true)}
          onOpenCriteria={() => setShowCriteriaConfig(true)}
          pendingPetitionsCount={pendingPetitionsCount}
          postPubChangeCount={postPubCount}
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
          onGenerate={canEdit && !isPublished ? handleOpenGenerateSheet : undefined}
          isGenerating={isGenerating}
          currentDate={currentWeek}
          hasExistingShifts={shiftBlocks.length > 0}
          onOpenSmartIA={() => setShowSmartSuggestions(true)}
          smartPendingCount={smartPendingCount}
          auditResult={auditResult}
          isAuditing={isAuditing}
          onRefreshAudit={runAudit}
          onApplyAuditFix={handleApplyAuditFix}
          onViolationClick={(violation) => {
            // Navigate to the cell referenced by the violation
            const cellId = `cell-${violation.employeeId}-${violation.date}`;
            const cellEl = document.getElementById(cellId);
            if (cellEl) {
              cellEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              // Highlight the cell temporarily
              cellEl.classList.add('ring-2', 'ring-destructive', 'ring-offset-2');
              setTimeout(() => {
                cellEl.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2');
              }, 3000);
            }
          }}
          onClean={() => setShowCleanDialog(true)}
          employeeCount={sortedEmployees.length}
          dayCount={7}
          avgMovementsPerDay={avgMovementsPerDay}
        />

      {/* Área de Favoritos */}
      <div data-tour="favorites-area">
      <FavoritesArea
        isVisible={showFavorites}
        favoriteShifts={favoriteShifts}
        onDragStart={(e, shift) => {
          setDraggedFavorite(shift);
          // El setData ya se maneja en FavoritesArea
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Verificar si hay datos en dataTransfer (desde ShiftCard)
          try {
            const data = e.dataTransfer.getData('application/json');
            
            if (data) {
              const dragData = JSON.parse(data);
              
            if (dragData && dragData.shift) {
              
              // Verificar si es "Descanso Semanal" - no permitir duplicados
              if (dragData.shift.name === "Descanso Semanal" || 
                  dragData.shift.absenceCode === 'D' ||
                  dragData.shift.type === 'absence') {
                // toast({
                //   title: "Descanso Semanal ya disponible",
                //   description: "El turno de descanso semanal ya está disponible por defecto en favoritos",
                //   variant: "default"
                // });
                return;
              }
              
              // Convertir el shift del calendario a formato SavedShift
              const savedShiftFormat: SavedShift = {
                id: `favorite-${Date.now()}`, // Nuevo ID para favorito
                name: dragData.shift.name || 'Turno sin nombre',
                startTime: dragData.shift.startTime,
                endTime: dragData.shift.endTime,
                color: dragData.shift.color || '#86efac',
                accessType: dragData.shift.type === 'absence' ? 'absence' : 'company',
                
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              addToFavorites(savedShiftFormat);
              return;
            }
            }
          } catch (error) {
            console.error("Error procesando dataTransfer:", error);
          }
          
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onRemoveFavorite={removeFromFavorites}
        onRestoreKit={handleRestoreKit}
      />
      </div>

      {/* Main Calendar Table */}
      {(() => {
        // Calcular si hay turnos en la semana actual
        const hasShiftsThisWeek = shiftBlocks.some(shift => 
          weekDays.some(day => isSameDay(shift.date, day))
        );
        const hasEmployees = employees.length > 0;
        // CRÍTICO: Solo mostrar WeekEmptyState para EMPLOYEE, nunca para OWNER/ADMIN/MANAGER
        const showEmptyState = !isLoadingData && !hasShiftsThisWeek && hasEmployees && role === 'EMPLOYEE' && !isAdmin;

        return showEmptyState ? (
          <WeekEmptyState
            currentWeek={currentWeek}
            onPreviousWeek={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            onNextWeek={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            onWeekChange={setCurrentWeek}
            weekDays={weekDays}
          />
        ) : (
          <Card className="overflow-hidden relative">
            {/* Calendar Status Badge - Positioned in top right */}
            {isPublished && (
              <div className="absolute top-2 right-2 z-10">
                <CalendarStatusBadge 
                  status={publishState.status}
                  version={publishState.version}
                  publishedAt={publishState.published_at}
                />
              </div>
            )}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table data-tour="calendar-table" className="w-full min-w-[580px] md:min-w-[700px] lg:min-w-full">
            {/* Header Row - Sticky */}
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b bg-muted/30">
                <th className="text-left p-1 sm:p-2 w-24 sm:w-32 md:w-48 min-w-[90px] sm:min-w-[120px] md:min-w-[200px] relative">
                    <div className="flex flex-col items-start gap-1">
                      {/* Número de semana sutil */}
                      <div className="text-[7px] sm:text-[8px] text-muted-foreground/60 font-medium mb-1">
                        S.{getWeek(weekStart, { weekStartsOn: 1 })}
                      </div>
                       <div className="flex items-center justify-between w-full">
                          <div className="text-[8px] sm:text-[9px] font-medium text-muted-foreground">
                            Personas / Día
                          </div>
                          <div className="flex items-center gap-1">
                              {/* Botón ordenar - OCULTO para empleados */}
                              {canEdit && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-muted/50 rounded-md"
                                      onClick={() => setShowEmployeeSortingSheet(true)}
                                    >
                                      <ArrowUpDown className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ordenar empleados</p>
                                  </TooltipContent>
                                </Tooltip>
                             )}

                           {/* Add employee icon */}
                            {/* Botón añadir empleados - OCULTO para empleados */}
                            {canEdit && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
                                    onClick={() => {
                                      navigate('/colaboradores?mode=selection&return=turnos-crear');
                                    }}
                                  >
                                    <UserPlus className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Añadir empleados al calendario</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                           {/* Toggle Time Slots Button - OCULTO para empleados */}
                           {canEdit && (
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant={showTimeSlots ? "default" : "outline"}
                                   size="sm"
                                   className="h-6 w-6 p-0"
                                   onClick={() => setShowTimeSlots(!showTimeSlots)}
                                 >
                                   <Grid3X3 className="h-3 w-3" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p className="text-[9px]">{showTimeSlots ? 'Ocultar' : 'Mostrar'} slots</p>
                               </TooltipContent>
                             </Tooltip>
                           )}

                           {/* Favorites Button - OCULTO para empleados */}
                           {canEdit && (
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant={showFavorites ? "default" : "outline"}
                                   size="sm"
                                   className={`h-6 w-6 p-0 transition-all duration-200 ${
                                     showFavorites 
                                       ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                                       : 'hover:bg-muted'
                                   }`}
                                   onClick={() => { const next = !showFavorites; setShowFavorites(next); try { localStorage.setItem('turnosmart-show-favorites', String(next)); } catch {} }}
                                 >
                                   <Star className={`h-3 w-3 ${showFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p className="text-[9px]">Favoritos</p>
                               </TooltipContent>
                             </Tooltip>
                           )}
                         </div>
                       </div>
                    </div>
                </th>
                {weekDays.map((day, index) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  return (
                   <th key={dayKey} className="text-center p-1 sm:p-2 min-w-[65px] sm:min-w-[75px] md:min-w-[100px] w-[65px] sm:w-[75px] md:w-[100px] relative group">
                     <div className="flex items-center justify-center gap-1">
                        <div className="flex flex-col items-center justify-center gap-1">
                           {/* Día y número con estilo pill verde para día actual */}
                           <div className={`flex items-center justify-center gap-1 ${isSameDay(day, new Date()) ? "bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold" : ""}`}>
                             <div className={`text-[8px] sm:text-[9px] font-medium ${isSameDay(day, new Date()) ? "text-emerald-800" : "text-muted-foreground"}`}>
                               {format(day, "EEE", { locale: es }).toUpperCase()}
                             </div>
                             <div className={`text-[8px] sm:text-[9px] md:text-[11px] font-medium ${isSameDay(day, new Date()) ? "text-emerald-800" : ""}`}>
                               {format(day, "d")}
                             </div>
                           </div>
                          {/* Contador de personas/día minimalista */}
                          <div className="text-[7px] sm:text-[8px] md:text-[10px] text-gray-500 font-medium">
                            {dayCounters[format(day, "yyyy-MM-dd")] || 0}
                          </div>
                       </div>
                       
                        {/* Checkbox para seleccionar columna completa - estilo TurnoSmart */}
                        <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="checkbox"
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer accent-black"
                           checked={selectedColumns.has(format(day, 'yyyy-MM-dd'))}
                           onChange={() => handleColumnSelect(day)}
                           onClick={(e) => e.stopPropagation()}
                         />
                       </div>
                     </div>
                   </th>
                  );
                })}
              </tr>
            </thead>
            
            {/* Employee Rows */}
            <tbody>
                 {sortedEmployees.map((employee, employeeIndex) => {
                  const compliance = checkEmployeeHoursCompliance(employee.id);
                  
                  // Check if employee has approved absences this week
                  const hasAbsenceThisWeek = approvedRequests.some(request => {
                    const employeeNameLower = request.employee.toLowerCase();
                    const colaboradorNameLower = employee.name.toLowerCase();
                    
                    // Flexible name matching
                    const matchesEmployee = colaboradorNameLower.includes(employeeNameLower.split(' ')[0]) || 
                                           employeeNameLower.includes(colaboradorNameLower.split(' ')[0]) ||
                                           colaboradorNameLower.includes('spider') && employeeNameLower.includes('spider') ||
                                           colaboradorNameLower.includes('batman') && employeeNameLower.includes('batman') ||
                                           colaboradorNameLower.includes('super') && employeeNameLower.includes('super');
                    
                    if (!matchesEmployee) return false;
                    
                    // Check if absence overlaps with current week
                    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
                    const weekEnd = addDays(weekStart, 6);
                    
                    return (request.startDate <= weekEnd && request.endDate >= weekStart);
                  });
                  
                  // Get absence details for this employee if any
                  const employeeAbsence = approvedRequests.find(request => {
                    const employeeNameLower = request.employee.toLowerCase();
                    const colaboradorNameLower = employee.name.toLowerCase();
                    
                    const matchesEmployee = colaboradorNameLower.includes(employeeNameLower.split(' ')[0]) || 
                                           employeeNameLower.includes(colaboradorNameLower.split(' ')[0]) ||
                                           colaboradorNameLower.includes('spider') && employeeNameLower.includes('spider') ||
                                           colaboradorNameLower.includes('batman') && employeeNameLower.includes('batman') ||
                                           colaboradorNameLower.includes('super') && employeeNameLower.includes('super');
                    
                    if (!matchesEmployee) return false;
                    
                    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
                    const weekEnd = addDays(weekStart, 6);
                    
                    return (request.startDate <= weekEnd && request.endDate >= weekStart);
                  });
                  
                  // Calculate absence duration in days
                  const absenceDays = employeeAbsence ? 
                    Math.floor((employeeAbsence.endDate.getTime() - employeeAbsence.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
                  
                  return (
                  <tr key={employee.id} className={`border-b hover:bg-muted/20 ${selectedEmployees.has(employee.id) ? "bg-muted/30" : ""} ${compliance.isExceeded ? "bg-red-50" : ""} ${hasAbsenceThisWeek ? "bg-green-50" : ""}`}>
                  {/* Employee Info Column */}
                  <td className="py-0.5 px-1 border-r relative group">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0 flex-1">
                            {/* Nickname como en la imagen de referencia */}
                             <div className="flex items-center gap-1">
                               <div 
                                 className={`text-[9px] sm:text-[10px] md:text-[11px] font-medium text-gray-900 truncate transition-colors ${
                                   canEdit || colaboradores.find(c => c.id === employee.id)?.user_id === user?.id ? 'cursor-pointer hover:text-blue-600' : ''
                                 }`}
                                 onClick={() => {
                                   // Solo permitir navegación si puede editar O si es su propio perfil
                                   const colaborador = colaboradores.find(c => c.id === employee.id);
                                   if (canEdit || (colaborador && colaborador.user_id === user?.id)) {
                                     navigateToColaborador(employee.name);
                                   }
                                 }}
                                 title={canEdit || colaboradores.find(c => c.id === employee.id)?.user_id === user?.id ? "Ver perfil del colaborador" : ""}
                               >
                              {employee.name}
                                </div>
                                {/* Badge de violaciones de auditoría del empleado */}
                                {(() => {
                                  const employeeViolations = getViolationsForEmployee(employee.id);
                                  const maxSeverity = employeeViolations.length > 0 
                                    ? employeeViolations.reduce((max, v) => {
                                        const order = { error: 3, warning: 2, info: 1 };
                                        return order[v.severity] > order[max] ? v.severity : max;
                                      }, 'info' as 'error' | 'warning' | 'info')
                                    : null;
                                  return maxSeverity ? (
                                    <EmployeeViolationBadge 
                                      count={employeeViolations.length} 
                                      maxSeverity={maxSeverity} 
                                    />
                                  ) : null;
                                })()}
                               {/* Show absence badge if employee has approved absence */}
                              {hasAbsenceThisWeek && employeeAbsence && (
                                <div className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  Vacaciones ({absenceDays} días)
                                </div>
                              )}
                            {compliance.isExceeded && (
                              <div 
                                className="h-3 w-3 text-red-500 cursor-help flex-shrink-0 relative group"
                                title={`Se han detectado posibles irregularidades en el cumplimiento de la normativa laboral. Revisa las horas planificadas de este colaborador (${compliance.plannedHours}h/${compliance.contractHours}h)`}
                              >
                                <Info className="h-3 w-3" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-red-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                  ⚠️ Exceso de horas: {compliance.plannedHours}h/{compliance.contractHours}h
                                </div>
                              </div>
                            )}
                          </div>
                          
                           {/* Línea de horas exactamente como en la imagen: planificadas | reales | ausencias | diferencia */}
                           <div className="text-[8px] sm:text-[9px] text-gray-600 whitespace-nowrap flex gap-1">
                             <span 
                               className="cursor-help"
                               title="Horas contratos"
                             >
                               {getWeeklyHoursFromColaborador(employee.name) || compliance.plannedHours}h
                             </span>
                             <span>|</span>
                             <span
                               className="cursor-help"
                               title="Horas reales esta semana"
                             >
                               {(() => {
                                 const realH = getWeeklyRealHours(employee.id);
                                 const wholeHours = Math.floor(realH);
                                 const minutes = Math.round((realH - wholeHours) * 60);
                                 return `${wholeHours}h ${minutes}'`;
                               })()}
                             </span>
                             <span>|</span>
                             <span 
                               className="cursor-help"
                               title="Ausencias realizadas"
                             >
                               {getWeeklyAbsenceHours(employee.id)}h
                             </span>
                             <span>|</span>
                             <span 
                               className="cursor-help"
                               title="Diferencia"
                             >
                               {(() => {
                                 const contractHours = getWeeklyHoursFromColaborador(employee.name) || compliance.plannedHours;
                                 const realHours = getWeeklyRealHours(employee.id);
                                 const difference = realHours - contractHours;
                                 const isPositive = difference > 0;
                                 return (
                                   <span className={isPositive ? "text-red-500" : ""}>
                                     {difference >= 0 ? '+' : ''}{difference}h
                                   </span>
                                 );
                               })()}
                             </span>
                            </div>
                             
                              {/* Quinta información: Compensar Xh - debajo de las horas con tamaño 8px */}
                              <div 
                                className={`text-[8px] text-blue-600 transition-colors ${
                                  canEdit || colaboradores.find(c => c.id === employee.id)?.email === user?.email
                                   ? 'cursor-pointer hover:text-blue-800'
                                   : 'cursor-not-allowed opacity-50'
                               }`}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 
                                 // Si es employee, solo puede ver su propia compensación
                                 if (isEmployee) {
                                   const currentUserColaborador = colaboradores.find(c => c.email === user?.email);
                                   if (!currentUserColaborador || currentUserColaborador.id !== employee.id) {
                                     toast({
                                       title: "Acceso restringido",
                                       description: "Solo puedes acceder a tu propia información",
                                       variant: "destructive"
                                     });
                                     return;
                                   }
                                 }
                                 
                                 // Navegar directamente a la página del colaborador, tab de vacaciones-ausencias usando navigate
                                 navigate(`/colaboradores/${employee.id}/absences`);
                               }}
                               title={canEdit || colaboradores.find(c => c.id === employee.id)?.email === user?.email 
                                 ? "Ver compensación de horas extras" 
                                 : "Solo puedes ver tu propia información"}
                             >
                               <EmployeeCompensatoryBalance 
                                 colaboradorId={employee.id}
                                 className="cursor-pointer text-[8px]"
                               />
                             </div>
                        </div>
                        {/* Controles del empleado - checkbox y botón eliminar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <input
                            type="checkbox"
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer accent-black"
                           checked={selectedEmployees.has(employee.id)}
                           onChange={() => handleEmployeeSelect(employee.id)}
                           onClick={(e) => e.stopPropagation()}
                         />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEmployeeFromCalendar(employee.id, employee.name);
                            }}
                            className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 hover:text-red-700 transition-colors"
                            title={`Eliminar ${employee.name} del calendario`}
                          >
                            <X className="w-full h-full" />
                          </button>
                       </div>
                     </div>
                     
                   </td>
                  
                   {/* Day Columns */}
                    {weekDays.map((day, dayIndex) => {
                      const shifts = getShiftsForEmployeeAndDate(employee.id, day);
                      const dayKey = format(day, "yyyy-MM-dd");
                      const isSelected = selectedDays.has(dayKey) || selectedEmployees.has(employee.id);
                      
                      // Check if this specific day has an approved absence
                      const hasAbsenceToday = employeeAbsence && 
                        day >= employeeAbsence.startDate && 
                        day <= employeeAbsence.endDate;
                      
                      // Obtener violaciones de auditoría para esta celda
                      const cellViolations = getViolationsForCell(employee.id, dayKey);
                      const cellSeverity = getMaxSeverityForCell(employee.id, dayKey);
                      
                      return (
                           <td
                            key={dayIndex}
                            id={`cell-${employee.id}-${dayKey}`}
                            className={`p-0.5 sm:p-1 text-center cursor-pointer hover:bg-muted/30 relative h-14 sm:h-16 md:h-20 transition-all ${isSelected ? "bg-muted/40" : ""} ${hasAbsenceToday ? "bg-green-100" : ""} ${
                              dragOverCell === `${employee.id}-${format(day, 'yyyy-MM-dd')}` ? 'bg-blue-100' : ''
                            }`}
                           onClick={(e) => {
                             // No interferir con drag de ShiftCards
                             const target = e.target as HTMLElement;
                             if (target.closest('[data-shift-card]')) {
                               return;
                             }
                             handleCellClick(employee, day, e);
                           }}
                           onMouseDown={(e) => {
                             // Prevenir interferencia con drag de ShiftCards
                             const target = e.target as HTMLElement;
                             if (target.closest('[data-shift-card]')) {
                               e.stopPropagation();
                             }
                           }}
                           onDragOver={handleDragOver}
                           onDrop={(e) => handleDrop(e, employee.id, day)}
                            onDragEnter={() => handleDragEnter(employee.id, day)}
                            onDragLeave={handleDragLeave}
                        >
                          <AuditCellHighlight severity={cellSeverity} className="h-full w-full">
                             {/* Current time line removed from week view */}
                            {/* Zonas de drag and drop que aparecen cuando hay dragging activo */}
                            {(canEdit || isManager) && isDragging && dragOverCell === `${employee.id}-${format(day, "yyyy-MM-dd")}` && (
                              <DragDropZones
                                isActive={true}
                                hoveredZone={hoveredZone}
                                onMoveHover={(isHovering) => {
                                  setHoveredZone(isHovering ? 'move' : null);
                                }}
                                onDuplicateHover={(isHovering) => {
                                  setHoveredZone(isHovering ? 'duplicate' : null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  const target = e.target as HTMLElement;
                                  const dropAction = target.closest('[data-drop-action]')?.getAttribute('data-drop-action');
                                  
                                  if (dropAction === 'move') {
                                    setHoveredZone('move');
                                  } else if (dropAction === 'duplicate') {
                                    setHoveredZone('duplicate');
                                  }
                                  
                                  setCurrentDropAction(dropAction as 'move' | 'duplicate' || 'move');
                                }}
                                onDrop={(e) => {
                                  handleDrop(e, employee.id, day);
                                }}
                              />
                            )}
                          {shifts.length > 0 ? (
                            <AuditViolationTooltip violations={cellViolations}>
                            <div className="h-full w-full space-y-0.5 relative">
                              {/* Indicador visual de violación */}
                              {cellViolations.length > 0 && (
                                <div className={`absolute top-0 right-0 w-2 h-2 rounded-full z-10 ${
                                  cellSeverity === 'error' ? 'bg-destructive' :
                                  cellSeverity === 'warning' ? 'bg-amber-500' : 'bg-primary'
                                }`} />
                              )}
                              {/* Indicador de edición post-publicación */}
                              {isPostPubEdited(employee.id, format(day, 'yyyy-MM-dd')) && (
                                <div className="absolute top-0 left-0 w-2 h-2 rounded-full z-10 bg-blue-500" title="Editado post-publicación" />
                              )}
                              {/* T3-8: SMART tag indicator */}
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
                              {shifts.map((shift, shiftIndex) => (
                                <div
                                  key={shift.id}
                                  className={`${shifts.length > 1 ? 'h-8' : 'h-full'} w-full relative`}
                                  onContextMenu={(e) => (canEdit || isManager) ? handleToggleLock(shift, e) : e.preventDefault()}
                                >
                                  {/* Icono candado — overlay cuando está bloqueado */}
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
                                       onSelect={handleShiftSelect}
                                      onShowDetails={(shift) => {
                                        // 🔒 Si está publicado y no es EMPLOYEE, bloquear edición
                                        if (isPublished && !isEmployee) {
                                          toast({
                                            title: "Turno publicado. No es posible editar",
                                            description: "Debes despublicar el calendario primero para editar turnos",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        setShowTurnoSmartDetails({ shift, employee });
                                      }}
                                       onEdit={(shift) => {
                                         if (isPublished) {
                                           toast({
                                             title: "Calendario publicado",
                                             description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
                                             variant: "destructive",
                                           });
                                           return;
                                         }
                                         setEditingShift(shift);
                                         setShowAdvancedOptions({
                                           employeeId: shift.employeeId,
                                           date: new Date(shift.date)
                                         });
                                      }}
                                       onDelete={(shift) => {
                                         if (isPublished) {
                                           toast({
                                             title: "Calendario publicado",
                                             description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
                                             variant: "destructive",
                                           });
                                           return;
                                         }
                                         setShowDeleteConfirmation(shift);
                                       }}
                                       onAddShift={(canEdit || isManager) ? handleAddShift : undefined}
                                       readOnly={(isEmployee && !isManager && !isAdmin && !isOwner) || isPublished}
                                    />
                                </div>
                              ))}
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
                
                {/* Mensaje "Primer día" separado - solo para el primer día de contrato */}
                {(() => {
                  const empleadoColaborador = colaboradores.find(c => c.id === employee.id);
                  const fechaInicioContrato = empleadoColaborador?.fecha_inicio_contrato;
                  
                  if (fechaInicioContrato) {
                    const fechaInicio = new Date(fechaInicioContrato);
                    const esPrimerDia = isSameDay(day, fechaInicio);
                    
                    // Solo mostrar si es primer día Y no hay turnos asignados
                    if (esPrimerDia && shifts.length === 0) {
                      return (
                        <div key={`primer-dia-${employee.id}-${format(day, 'yyyy-MM-dd')}`} className="absolute top-1 left-1 right-1 z-10 pointer-events-none">
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

                {/* Zona hover invisible - activa al hacer hover */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddShift(employee, day, e);
                  }}
                />
                 {/* Símbolo + que aparece solo en hover */}
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
                   })}
                 </tr>
                 );
               })}
               
             </tbody>
           </table>
         </div>
       </Card>
        );
      })()}
      
      {/* Add Employee Button positioned under "Personas/Día" column */}
      <div className="flex">
        <div className="w-24 sm:w-32 md:w-48 pr-2 sm:pr-4">
        </div>
      </div>

      {/* Add Shift Popup */}
      {showAddShiftPopup && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          onClick={() => setShowAddShiftPopup(null)}
        >
          <Card 
            className="w-64 p-4 bg-background border border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <div className="text-[10px] font-semibold">Horario</div>
              <div className="text-[8px] text-muted-foreground">
                Empleado/a: {employees.find(e => e.id === showAddShiftPopup?.employeeId)?.name}
              </div>
              <div className="text-[8px] text-muted-foreground">
                {format(showAddShiftPopup?.date || new Date(), "EEEE, d MMMM yyyy", { locale: es })}
              </div>
              
              {/* Mostrar horarios guardados disponibles */}
              <div className="space-y-2">
                {getSavedShiftsSync().length > 0 ? (
                  getSavedShiftsSync().map((shift) => (
                    <div 
                      key={shift.id} 
                      className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
                      onClick={() => {
                        // Asignar el horario guardado al empleado
                        const newShift: ShiftBlock = {
                          id: `shift-${Date.now()}`,
                          employeeId: showAddShiftPopup?.employeeId || '',
                          date: showAddShiftPopup?.date || new Date(),
          startTime: shift.startTime || undefined,
          endTime: shift.endTime || undefined,
                          type: "morning",
                          color: shift.color,
                          name: shift.name,
                          organization_id: org?.id || 'default',
                          hasBreak: !!(shift.breakType && shift.breakDuration)
                        };
                        setShiftBlocksWithHistory(currentShifts => {
                          const updatedShifts = [...currentShifts, newShift];
                          localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
                          return updatedShifts;
                        });
                        setShowAddShiftPopup(null);
                      }}
                    >
                      <div>
                        <div className="text-[9px] font-medium">{shift.name}</div>
                        <div className="text-[8px] text-muted-foreground">
                          {shift.startTime && shift.endTime ? `${shift.startTime} - ${shift.endTime}` : 'Día completo'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-[8px] text-muted-foreground">
                    No hay horarios guardados disponibles
                  </div>
                )}
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-6 text-[8px]"
                onClick={() => {
                  setShowAdvancedOptions(showAddShiftPopup);
                  setShowAddShiftPopup(null);
                }}
              >
                Opciones avanzadas
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Advanced Shift Dialog */}
      <AdvancedShiftDialog
        isOpen={!!showAdvancedOptions}
        onClose={() => {
          setShowAdvancedOptions(null);
          setEditingShift(null);
        }}
        employee={employees.find(e => e.id === showAdvancedOptions?.employeeId)}
        date={showAdvancedOptions?.date || new Date()}
        editingShift={editingShift || (showAdvancedOptions ? shiftBlocks.find(s => 
          s.employeeId === showAdvancedOptions.employeeId && 
          format(s.date, "yyyy-MM-dd") === format(showAdvancedOptions.date, "yyyy-MM-dd")
        ) : undefined)}
        onShiftAssigned={async (shiftData) => {
          if (showAdvancedOptions && shiftData.employeeId) {
            // Si estamos editando, actualizar el turno existente
            const existingShiftIndex = shiftBlocks.findIndex(s => 
              s.employeeId === showAdvancedOptions.employeeId && 
              format(s.date, "yyyy-MM-dd") === format(showAdvancedOptions.date, "yyyy-MM-dd")
            );
            
            if (existingShiftIndex !== -1 && editingShift) {
              
              // IMPORTANTE: Normalizar los nombres para evitar problemas de espacios
              const oldShiftName = editingShift.name?.trim() || '';
              const newShiftName = shiftData.name?.trim() || '';
              
              
              // Verificar si se van a actualizar todos los turnos con el mismo nombre
              const willUpdateAllShifts = oldShiftName && (oldShiftName !== newShiftName || 
                  editingShift.startTime !== shiftData.startTime ||
                  editingShift.endTime !== shiftData.endTime ||
                  editingShift.color !== shiftData.color ||
                  JSON.stringify(editingShift.breaks) !== JSON.stringify(shiftData.breaks));
              
              if (willUpdateAllShifts) {
                // Si vamos a actualizar todos los turnos, NO actualizar localmente primero
                // porque updateAllShiftsWithSameName ya hace el trabajo completo
                
                // CRÍTICO: Pasar el nombre EXACTO que está en la base de datos
                await updateAllShiftsWithSameName(oldShiftName, {
                  name: newShiftName,
                  startTime: shiftData.startTime,
                  endTime: shiftData.endTime,
                  color: shiftData.color,
                  breaks: shiftData.breaks,
                  hasBreak: shiftData.hasBreak,
                  totalBreakTime: shiftData.totalBreakTime,
                  breakType: shiftData.breakType,
                  breakDuration: shiftData.breakDuration,
                  notes: shiftData.notes,
                });
              } else {
                // Solo actualizar este turno específico si NO se van a actualizar todos
                const newBlocks = [...shiftBlocks];
                newBlocks[existingShiftIndex] = {
                  ...newBlocks[existingShiftIndex],
                  startTime: shiftData.startTime || undefined,
                  endTime: shiftData.endTime || undefined,
                  name: newShiftName,
                  organization_id: org?.id || 'default',
                  hasBreak: shiftData.hasBreak || false,
                  breaks: shiftData.breaks || [],
                  totalBreakTime: shiftData.totalBreakTime || 0,
                  breakType: shiftData.breakType,
                  breakDuration: shiftData.breakDuration,
                  notes: shiftData.notes,
                  color: shiftData.color || newBlocks[existingShiftIndex].color
                };
                updateShiftBlocks(newBlocks);
              }
              
              // Limpiar el estado de edición
              setEditingShift(null);
            } else {
              // Crear nuevo horario si no existe
              const newShift: ShiftBlock = {
                id: `shift-${Date.now()}`,
                employeeId: shiftData.employeeId,
                date: new Date(shiftData.date),
                startTime: shiftData.startTime || undefined,
                endTime: shiftData.endTime || undefined,
                type: "morning",
                color: shiftData.color || "#86efac",
                name: shiftData.name,
                organization_id: org?.id || 'default',
                hasBreak: shiftData.hasBreak || false,
                breaks: shiftData.breaks || [],
                totalBreakTime: shiftData.totalBreakTime || 0,
                breakType: shiftData.breakType,
                breakDuration: shiftData.breakDuration,
                notes: shiftData.notes
              };
              setShiftBlocksWithHistory(currentShifts => {
                const updatedShifts = [...currentShifts, newShift];
                localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
                return updatedShifts;
              });
            }
          }
        }}
      />

      {/* SMART Generate Sheet */}
      <GenerateScheduleSheet
        open={showGenerateSheet}
        onOpenChange={setShowGenerateSheet}
        employees={employees}
        currentWeek={currentWeek}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
      />

      {/* SMART v2 Alternatives Result Sheet */}
      <AlternativesResultSheet
        open={showAlternativesSheet}
        onOpenChange={setShowAlternativesSheet}
        generation={smartGeneration}
        onApplyAlternative={handleApplyAlternative}
      />

      {/* SMART v2 Wizard (9 pasos) */}
      {/* Tour de onboarding */}
      <OnboardingTour isActive={showTour} onComplete={completeTour} />

      <GenerateScheduleWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        currentWeek={currentWeek}
        hasExistingShifts={hasExistingShifts}
        pendingPetitionsCount={pendingPetitionsCount}
        hasOccupancyData={occupancyRecords.length > 0}
        petitions={petitions}
        occupancyData={occupancyForWizard}
        employees={sortedEmployees}
        previousPeriod={previousPeriodSummary}
        onOpenPetitions={() => setShowPetitions(true)}
        onOpenOccupancy={() => setShowOccupancyImport(true)}
        onOpenCriteria={() => setShowCriteriaConfig(true)}
        onGenerate={handleWizardGenerate}
        generation={smartGeneration}
        isGenerating={isGeneratingV2}
        onApplyAlternative={handleApplyAlternative}
      />

      {/* Shift Configuration Dialog */}
      <ShiftConfigurationDialog
        isOpen={showShiftConfiguration}
        onClose={() => setShowShiftConfiguration(false)}
      />
      
      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        onRestore={handleRestoreVersion}
        generations={generations as any}
        isLoadingGenerations={isLoadingGenerations}
      />
      
      {/* Operation Backups Dialog */}
      <OperationBackupsDialog
        open={showOperationBackups}
        onOpenChange={setShowOperationBackups}
        onRestore={async (backupData, backupId) => {
          try {
            // Restaurar desde backup
            if (backupData.shiftBlocks) {
              const restoredShifts = backupData.shiftBlocks.map((shift: any) => ({
                ...shift,
                date: typeof shift.date === 'string' ? new Date(shift.date) : shift.date,
              }));
              
              setShiftBlocksWithHistory(restoredShifts);
              localStorage.setItem('calendar-shift-blocks', JSON.stringify(restoredShifts));
              await saveShiftsToSupabase(restoredShifts);
              
              toast({
                title: "Backup restaurado",
                description: `Se han restaurado ${restoredShifts.length} turnos desde el backup`,
              });
            }
          } catch (error) {
            console.error("Error restaurando backup:", error);
            toast({
              title: "Error al restaurar",
              description: "No se pudo restaurar el backup",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Bulk Actions Dialog */}
      <ShiftBulkActions
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedEmployees={selectedEmployees}
        selectedDays={selectedDays}
        employees={employees}
        weekDays={weekDays}
        onBulkAssign={(bulkData) => {
          
          if (bulkData.type === "assign") {
            // Create shifts for all selected combinations
            const newShifts: ShiftBlock[] = [];
            
            bulkData.employees.forEach((empId: string) => {
              bulkData.days.forEach((dayKey: string) => {
                const dayDate = new Date(dayKey);
                const newShift: ShiftBlock = {
                  id: `shift-${Date.now()}-${empId}-${dayKey}`,
                  employeeId: empId,
                  date: dayDate,
          startTime: bulkData.shiftData.startTime || undefined,
          endTime: bulkData.shiftData.endTime || undefined,
                  type: "morning",
                  color: "#86efac",
                  name: `Turno ${bulkData.shiftData.template}`,
                  organization_id: org?.id || 'default',
                  hasBreak: bulkData.shiftData.addBreaks
                };
                newShifts.push(newShift);
              });
            });
            
            setShiftBlocksWithHistory(currentShifts => {
              const updatedShifts = [...currentShifts, ...newShifts];
              localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
              return updatedShifts;
            });
          } else if (bulkData.type === "rest") {
            // Add rest days logic here
          }
          
          // Clear selections after bulk action
          clearSelection();
        }}
      />

      {/* Shift Details Panel */}
      <ShiftDetailsPanel
        isOpen={!!showShiftDetails}
        onClose={() => setShowShiftDetails(null)}
        shift={showShiftDetails?.shift}
        employee={showShiftDetails?.employee}
        onEdit={(shift) => {
          if (isPublished) {
            toast({
              title: "Calendario publicado",
              description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
              variant: "destructive",
            });
            return;
          }
          setEditingShift(shift);
          setShowAdvancedOptions({
            employeeId: shift.employeeId,
            date: new Date(shift.date)
          });
          setShowShiftDetails(null);
        }}
        onDelete={async (shiftId) => {
          if (isPublished) {
            toast({
              title: "Calendario publicado",
              description: "No se pueden realizar cambios en un calendario publicado. Use el megáfono para modificar.",
              variant: "destructive",
            });
            return;
          }
          // Eliminar de Supabase primero
          await deleteShiftFromSupabase(shiftId);
          
          // Luego eliminar del estado local con historial
          setShiftBlocksWithHistory(currentShifts => {
            const filteredShifts = currentShifts.filter(s => s.id !== shiftId);
            localStorage.setItem('calendar-shift-blocks', JSON.stringify(filteredShifts));
            return filteredShifts;
          });
          setShowShiftDetails(null);
        }}
        onDuplicate={(shift) => {
          const duplicatedShift: ShiftBlock = {
            ...shift,
            id: `shift-${Date.now()}-duplicate`,
            date: new Date(shift.date)
          };
          setShiftBlocksWithHistory(currentShifts => {
            const updatedShifts = [...currentShifts, duplicatedShift];
            localStorage.setItem('calendar-shift-blocks', JSON.stringify(updatedShifts));
            return updatedShifts;
          });
          setShowShiftDetails(null);
        }}
      />

      {/* Add Employees Dialog */}
      <AddEmployeesToCalendarDialog
        open={showAddEmployeesDialog}
        onOpenChange={setShowAddEmployeesDialog}
        onEmployeesAdded={async (newEmployees, effectiveDate, applyRestDays) => {
          
          // Convert database employees to calendar employee format
          const calendarEmployees = newEmployees.map(emp => ({
            id: emp.id,
            name: emp.name,
            role: emp.category,
            department: emp.department,
            workingHours: `${emp.contract_hours}h/${emp.contract_hours * 5}h`
          }));
          
          // Add new employees to existing ones, avoiding duplicates
          const existingIds = new Set(employees.map(emp => emp.id));
          const uniqueNewEmployees = calendarEmployees.filter(emp => !existingIds.has(emp.id));
          
          if (uniqueNewEmployees.length > 0) {
            // Actualizar lista de empleados
            setEmployees(prev => [...prev, ...uniqueNewEmployees]);
            
            // Log activity for added employees
            for (const employee of uniqueNewEmployees) {
              await logActivity({
                action: "COLABORADOR_AÑADIDO",
                entityType: "employee_management",
                entityName: employee.name,
                details: {
                  employeeId: employee.id,
                  employeeName: employee.name,
                  department: employee.department,
                  role: employee.role,
                  workingHours: employee.workingHours,
                  source: "calendar_dialog"
                }
              });
            }
            
            // DISABLED: Auto-generation of "Primer día" for new employees removed
          }
        }}
        existingEmployeeIds={employees.map(emp => emp.id)}
      />

      {/* TurnoSmart Style Shift Details Panel */}
      <TurnoSmartShiftDetailsPanel
        isOpen={!!showTurnoSmartDetails}
        onClose={() => setShowTurnoSmartDetails(null)}
        shift={showTurnoSmartDetails?.shift}
        employee={showTurnoSmartDetails?.employee}
        onEdit={(shift) => {
          setEditingShift(shift);
          setShowAdvancedOptions({
            employeeId: shift.employeeId,
            date: new Date(shift.date)
          });
          setShowTurnoSmartDetails(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteShiftConfirmation
        isOpen={!!showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(null)}
        deleteData={showDeleteConfirmation?.type === 'bulk' ? showDeleteConfirmation : undefined}
        onConfirm={async () => {
          if (showDeleteConfirmation) {
             if (showDeleteConfirmation.type === 'bulk') {
               // Bulk delete con backup
                const shiftsToDelete = showDeleteConfirmation.shifts;
                
                // 🛡️ PROTECCIÓN: Crear backup antes de bulk delete
                if (shiftsToDelete.length >= 5) { // Solo para 5+ turnos
                  await createBackupBeforeOperation(
                    'bulk_delete',
                    {
                      deletedShifts: shiftsToDelete.map(shift => ({
                        ...shift,
                        date: format(shift.date, "yyyy-MM-dd"),
                      })),
                      remainingShifts: shiftBlocks.filter(shift => 
                        !shiftsToDelete.some(s => s.id === shift.id)
                      ).map(shift => ({
                        ...shift,
                        date: format(shift.date, "yyyy-MM-dd"),
                      })),
                      timestamp: new Date().toISOString(),
                    },
                    `Eliminación masiva de ${shiftsToDelete.length} turnos`,
                    shiftsToDelete.length
                  );
                }
                
                setShiftBlocksWithHistory(currentShifts => {
                  const filteredShifts = currentShifts.filter(shift => !shiftsToDelete.some(s => s.id === shift.id));
                  localStorage.setItem('calendar-shift-blocks', JSON.stringify(filteredShifts));
                  return filteredShifts;
                });
                setSelectedShifts(new Set()); // Clear shift selection
               setSelectedColumns(new Set()); // Clear column selection
               setSelectedEmployees(new Set()); // Clear employee selection
                 // Registro de actividad sin toast
            } else {
              // Single delete
              const shiftToDelete = showDeleteConfirmation;
              
              // Eliminar de Supabase primero
              await deleteShiftFromSupabase(shiftToDelete.id);
              
              setShiftBlocksWithHistory(currentShifts => {
                const filteredShifts = currentShifts.filter(s => s.id !== shiftToDelete.id);
                localStorage.setItem('calendar-shift-blocks', JSON.stringify(filteredShifts));
                return filteredShifts;
              });
              // Clear employee selection if they have no more shifts
              setSelectedEmployees(prev => {
                const newSet = new Set(prev);
                const remainingShifts = shiftBlocks.filter(s => 
                  s.employeeId === shiftToDelete.employeeId && s.id !== shiftToDelete.id
                );
                if (remainingShifts.length === 0) {
                  newSet.delete(shiftToDelete.employeeId);
                }
                return newSet;
              });
              // Registro de actividad sin toast
            }
            setShowDeleteConfirmation(null);
          }
        }}
        shiftName={showDeleteConfirmation?.name}
      />

      {/* Shift Selector Popup */}
      <ShiftSelectorPopup
        isOpen={!!showShiftSelector}
        onClose={() => setShowShiftSelector(null)}
        position={showShiftSelector?.position || { x: 0, y: 0 }}
        onShiftSelected={(shift) => {
          if (showShiftSelector) {
            handleShiftSelected(shift, showShiftSelector.employeeId, showShiftSelector.date);
            setShowShiftSelector(null);
          }
        }}
        onAdvancedOptions={() => {
          if (showShiftSelector) {
            const employee = employees.find(emp => emp.id === showShiftSelector.employeeId);
            if (employee) {
              setShowAdvancedOptions({
                employeeId: showShiftSelector.employeeId,
                date: showShiftSelector.date
              });
            } else {
            }
            setShowShiftSelector(null);
          } else {
          }
        }}
      />
    </div>
        
        {/* Zona de eliminación que aparece durante el drag */}
        <DeleteZone
          isVisible={isDragging}
          isDragOver={deleteZoneDragOver}
          onDragOver={handleDeleteZoneDragOver}
          onDragLeave={handleDeleteZoneDragLeave}
          onDrop={handleDeleteZoneDrop}
        />

        {/* Employee Sorting Sheet */}
        <EmployeeSortingSheet 
          isOpen={showEmployeeSortingSheet}
          onClose={() => {
            // Limpiar estados de drag and drop al cerrar
            setIsDragging(false);
            setDeleteZoneDragOver(false);
            setDragOverCell(null);
            setCurrentDropAction(null);
            setHoveredZone(null);
            setDraggedFavorite(null);
            setShowEmployeeSortingSheet(false);
          }}
          employees={sortedEmployees.map(emp => {
            // Buscar datos completos del colaborador basado en el orden actual del calendario
            const fullColaborador = colaboradores.find(col => col.id === emp.id);
            return {
              id: emp.id,
              nombre: fullColaborador?.nombre || emp.name.split(' ')[0] || '',
              apellidos: fullColaborador?.apellidos || emp.name.split(' ').slice(1).join(' ') || '',
              email: fullColaborador?.email || '',
              tipo_contrato: fullColaborador?.tipo_contrato || emp.role,
              tiempo_trabajo_semanal: fullColaborador?.tiempo_trabajo_semanal || 40,
              fecha_inicio_contrato: fullColaborador?.fecha_inicio_contrato || emp.startDate,
              fecha_nacimiento: fullColaborador?.fecha_nacimiento,
              genero: fullColaborador?.genero,
              categoria: fullColaborador?.categoria,
              departamento: fullColaborador?.departamento || emp.department,
              // establecimiento_por_defecto: ELIMINADO - usar org_id en su lugar
              telefono_movil: fullColaborador?.telefono_movil,
              status: fullColaborador?.status
            };
          })}
          onApplySort={(sortedEmployees) => {
            
            // Convert back to Employee format and update the calendar
            const sortedCalendarEmployees = sortedEmployees.map(emp => ({
              id: emp.id,
              name: `${emp.nombre}${emp.apellidos ? ' ' + emp.apellidos : ''}`,
              role: emp.tipo_contrato || "Sin definir",
              department: emp.departamento || "Bares",
              workingHours: `0h/${emp.tiempo_trabajo_semanal || 40}h`,
              startDate: emp.fecha_inicio_contrato
            }));
            
            
            updateEmployees(sortedCalendarEmployees);
            setSortBy(sortedEmployees.some((_, index, arr) => index > 0 && !arr[index-1].apellidos) ? "manual" : "applied"); // Mark as manual if custom order, otherwise applied
          }}
          currentSortCriteria={sortBy}
          orgId={org?.id}
        />
        
        {/* Calendar Full Screen View */}
        <CalendarFullScreenView
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          employees={employees}
          shiftBlocks={shiftBlocks}
          currentWeek={currentWeek}
          onPrint={handlePrint}
          onExport={handleExportPDF}
        />

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={confirmClearCalendar}
          onOpenChange={setConfirmClearCalendar}
          onConfirm={handleConfirmClearCalendar}
          title="¿Limpiar todo el calendario?"
          description="Esta acción eliminará todos los turnos del calendario. Se creará un backup automático que podrás restaurar más tarde desde el botón de Backups."
          confirmText="Sí, limpiar"
          cancelText="Cancelar"
          variant="destructive"
          affectedCount={shiftBlocks.length}
        />

        <ConfirmationDialog
          open={confirmRestoreVersion !== null}
          onOpenChange={(open) => !open && setConfirmRestoreVersion(null)}
          onConfirm={handleConfirmRestoreVersion}
          title="¿Restaurar esta versión?"
          description="Se creará un backup automático de la versión actual antes de restaurar. Podrás volver a la versión actual desde el historial si lo necesitas."
          confirmText="Sí, restaurar"
          cancelText="Cancelar"
          variant="info"
        />

        {/* Connection Status Banner - Sistema de persistencia */}
        <ConnectionStatusBanner
          connectionStatus={connectionStatus}
          saveStatus={saveStatus}
          pendingCount={pendingCount}
          isSyncing={isSyncing}
          onManualSync={forceSync}
          lastSavedAt={persistenceLastSaved}
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

        {/* Petitions Panel */}
        <PetitionsListPanel
          open={showPetitions}
          onOpenChange={setShowPetitions}
          petitions={petitions}
          isLoading={false}
          onApprove={(id) => updatePetitionStatus(id, 'approved')}
          onReject={(id) => updatePetitionStatus(id, 'rejected')}
          onDelete={(id) => updatePetitionStatus(id, 'rejected')}
          onCreateNew={() => setShowPetitionForm(true)}
        />

        {/* Petition Form Dialog */}
        <PetitionFormDialog
          open={showPetitionForm}
          onOpenChange={setShowPetitionForm}
          employees={employees.map(e => ({ id: e.id, name: e.name }))}
          organizationId={org?.id || ''}
          periodStart={format(weekStart, 'yyyy-MM-dd')}
          periodEnd={format(addDays(weekStart, 6), 'yyyy-MM-dd')}
          totalDays={7}
          onSubmit={async (data) => {
            await createPetition(data as any);
            refreshPetitions();
          }}
        />

        {/* Occupancy Import Dialog */}
        <OccupancyImportDialog
          open={showOccupancyImport}
          onOpenChange={setShowOccupancyImport}
          totalDays={new Date(currentWeek.getFullYear(), currentWeek.getMonth() + 1, 0).getDate()}
          year={currentWeek.getFullYear()}
          month={currentWeek.getMonth() + 1}
          existingData={occupancyRecords.map(r => ({
            day: new Date(r.date).getDate(),
            checkIns: r.check_ins,
            checkOuts: r.check_outs,
          }))}
          onImport={async (entries) => {
            const batch = entries.map(e => ({
              date: `${currentWeek.getFullYear()}-${String(currentWeek.getMonth() + 1).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`,
              checkIns: e.checkIns,
              checkOuts: e.checkOuts,
            }));
            await upsertOccupancyBatch(batch);
          }}
        />

        {/* Criteria Config Dialog */}
        <CriteriaConfigDialog
          open={showCriteriaConfig}
          onOpenChange={setShowCriteriaConfig}
          criteria={criteria}
          isLoading={criteriaLoading}
          onToggle={upsertCriteria}
          onSeedDefaults={seedDefaults}
        />

        {/* Conflict Resolution Dialog (post-publication edits) */}
        <ConflictResolutionDialog
          open={showConflictDialog}
          onOpenChange={(open) => {
            setShowConflictDialog(open);
            if (!open) setPendingPostPubShift(null);
          }}
          conflict={pendingPostPubShift?.conflictInfo ?? null}
          employees={employees.map(e => ({
            id: e.id,
            name: e.name,
            currentShift: shiftBlocks.find(
              s => s.employeeId === e.id &&
              pendingPostPubShift &&
              format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') ===
              format(pendingPostPubShift.shift.date instanceof Date ? pendingPostPubShift.shift.date : new Date(pendingPostPubShift.shift.date), 'yyyy-MM-dd')
            )?.name,
          }))}
          onSwap={async (partnerId) => {
            if (!pendingPostPubShift) return;
            const { shift } = pendingPostPubShift;
            const dateKey = format(shift.date instanceof Date ? shift.date : new Date(shift.date), 'yyyy-MM-dd');
            // Swap: apply new shift for requester; give requester's old shift to partner
            const partnerCurrentShift = shiftBlocks.find(
              s => s.employeeId === partnerId &&
              format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') === dateKey
            );
            setShiftBlocksWithHistory(currentShifts => {
              const filtered = currentShifts.filter(
                s => !(s.employeeId === shift.employeeId && format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') === dateKey) &&
                     !(s.employeeId === partnerId && format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') === dateKey)
              );
              const newBlocks = [...filtered, shift];
              if (partnerCurrentShift) {
                newBlocks.push({ ...partnerCurrentShift, id: crypto.randomUUID(), employeeId: shift.employeeId });
              }
              return newBlocks;
            });
            await logEdit({
              employeeId: shift.employeeId,
              shiftDate: dateKey,
              previousCode: pendingPostPubShift.conflictInfo.currentCode,
              newCode: shift.name,
              changeType: 'swap',
              reason: `Intercambio con empleado ${partnerId}`,
            });
            setPendingPostPubShift(null);
          }}
          onForceMajeure={async (reason) => {
            if (!pendingPostPubShift) return;
            const { shift } = pendingPostPubShift;
            const dateKey = format(shift.date instanceof Date ? shift.date : new Date(shift.date), 'yyyy-MM-dd');
            setShiftBlocksWithHistory(currentShifts => {
              const filtered = currentShifts.filter(
                s => !(s.employeeId === shift.employeeId && format(s.date instanceof Date ? s.date : new Date(s.date), 'yyyy-MM-dd') === dateKey)
              );
              return [...filtered, shift];
            });
            persistShiftToSupabase(shift).catch(console.error);
            await logEdit({
              employeeId: shift.employeeId,
              shiftDate: dateKey,
              previousCode: pendingPostPubShift.conflictInfo.currentCode,
              newCode: shift.name,
              changeType: 'force_majeure',
              reason,
            });
            setPendingPostPubShift(null);
          }}
          onDismiss={() => {
            setPendingPostPubShift(null);
          }}
        />

        {/* SMART+IA Suggestions Panel */}
        <SmartSuggestionsPanel
          open={showSmartSuggestions}
          onOpenChange={setShowSmartSuggestions}
          suggestions={smartSuggestions}
          onAccept={acceptSuggestion}
          onDismiss={dismissSuggestion}
          onClearAll={clearSmartSuggestions}
        />
    </TooltipProvider>
  );
}