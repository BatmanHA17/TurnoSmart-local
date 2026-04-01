import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Users, Calendar, Coffee, Clock, Trash2, AlertTriangle } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isWeekend,
  isToday,
  parseISO,
  addDays,
  isSameMonth
} from "date-fns";
import { es } from "date-fns/locale";
import { AdvancedShiftDialog } from "./AdvancedShiftDialog";
import { ShiftSelectorPopup } from "./ShiftSelectorPopup";
import { UnifiedCalendarHeader } from "./calendar/UnifiedCalendarHeader";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useCalendarEmployeeFilter } from "@/hooks/useCalendarEmployeeFilter";
import { useEmployeeSortOrder, getManualOrderKey } from "@/hooks/useEmployeeSortOrder";

import { cn } from "@/lib/utils";
import { getSavedShifts } from "@/store/savedShiftsStore";
import { CleanShiftsDialog } from "./CleanShiftsDialog";
import { defaultAbsenceShifts, getCustomAbsences, CUSTOM_ABSENCES_KEY } from "./FavoritesArea";
import { useFavoriteShifts } from "@/hooks/useFavoriteShifts";
import { CustomAbsence } from "./CreateAbsenceDialog";
import { useMonthAudit } from "@/hooks/useShiftAudit";
import { ShiftForAudit } from "@/utils/shiftAudit";
import { AuditCellHighlight, EmployeeViolationBadge } from "@/components/audit";
import { AuditViolationTooltip } from "@/components/audit/AuditViolationTooltip";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  workingHours: string;
  contractHours?: number;
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
  absenceCode?: string;
  hasBreak?: boolean;
  breaks?: any[];
  notes?: string;
}

// Días de la semana abreviados
const WEEKDAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

// Códigos de turno según nueva leyenda
// Horarios: M (Mañana), T (Tarde), P (Partido), N (Noche)
// Ausencias: L, V, E, P, C, F, G, DG
const getShiftCode = (shift: ShiftBlock): { letter: string; time?: string } => {
  if (shift.type === 'absence') {
    if (shift.absenceCode) {
      const code = shift.absenceCode.toUpperCase();
      if (code === 'DG' || code.includes('DESCANSO GUARDIA')) return { letter: 'DG' };
      return { letter: code.slice(0, 1) };
    }
    if (shift.name) {
      const name = shift.name.toLowerCase();
      if (name.includes('descanso guardia')) return { letter: 'DG' };
      if (name.includes('guardia')) return { letter: 'G' };
      if (name.includes('libre') || name.includes('descanso')) return { letter: 'D' };
      if (name.includes('vacacion')) return { letter: 'V' };
      if (name.includes('baja') || name.includes('enferm')) return { letter: 'E' };
      if (name.includes('permiso')) return { letter: 'P' };
      if (name.includes('curso') || name.includes('formacion')) return { letter: 'C' };
      if (name.includes('festivo') || name.includes('falta')) return { letter: 'F' };
      return { letter: shift.name.charAt(0).toUpperCase() };
    }
    return { letter: 'D' };
  }
  
  // Para turnos con horario: M (Mañana), T (Tarde), P (Partido), N (Noche)
  if (shift.startTime) {
    const startHour = parseInt(shift.startTime.split(':')[0], 10);
    const startMinutes = shift.startTime.slice(0, 5);
    
    // Detectar turno partido (jornada partida típica 09:00-17:00 con pausa)
    if (shift.name?.toLowerCase().includes('partido')) {
      return { letter: 'P', time: startMinutes };
    }
    
    // Noche: 18:00-04:59
    if (startHour >= 18 || startHour < 5) {
      return { letter: 'N', time: startMinutes };
    }
    // Mañana: 05:00-11:59
    if (startHour >= 5 && startHour < 12) {
      return { letter: 'M', time: startMinutes };
    }
    // Tarde: 12:00-17:59
    if (startHour >= 12 && startHour < 18) {
      return { letter: 'T', time: startMinutes };
    }
  }
  
  return { letter: 'X' };
};

export function MonthlyCalendarView() {
  const { org: currentOrg } = useCurrentOrganization();
  const { user } = useAuth();
  const { role } = useUserRoleCanonical();
  const isEmployee = role === 'EMPLOYEE';
  const canEdit = !isEmployee;
  
  // Hook para favoritos sincronizado
  const { favoriteShifts } = useFavoriteShifts();
  
  // Estado para ausencias personalizadas
  const [customAbsences, setCustomAbsences] = useState<CustomAbsence[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 🆕 Hook para sincronizar filtro de empleados eliminados entre vistas
  const { filteredEmployees } = useCalendarEmployeeFilter(employees, currentOrg?.org_id || null);

  // 🆕 Hook para sincronizar ordenamiento entre TODAS las vistas
  const { sortedEmployees } = useEmployeeSortOrder(filteredEmployees, currentOrg?.org_id);

  const [shiftBlocks, setShiftBlocks] = useState<ShiftBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<ShiftBlock | null>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showShiftPopup, setShowShiftPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const employeesContainerRef = useRef<HTMLDivElement>(null);

  // Cargar y sincronizar ausencias personalizadas
  useEffect(() => {
    const loadCustomAbsences = () => {
      setCustomAbsences(getCustomAbsences());
    };
    
    loadCustomAbsences();
    
    // Listener para sincronización en tiempo real
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CUSTOM_ABSENCES_KEY) {
        loadCustomAbsences();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Combinar ausencias para la leyenda
  const allAbsenceShifts = useMemo(() => {
    const customShifts = customAbsences.map(ca => ({
      id: ca.id,
      name: ca.name,
      code: ca.code,
      color: ca.color,
      isCustom: true
    }));
    
    const defaultShifts = defaultAbsenceShifts.map(ds => ({
      id: ds.id,
      name: ds.name,
      code: ds.id.split('-')[0],
      color: ds.color,
      isCustom: false
    }));
    
    return [...defaultShifts, ...customShifts];
  }, [customAbsences]);

  // Horarios favoritos (filtrar ausencias)
  const workShifts = useMemo(() => {
    return favoriteShifts.filter(s => s.accessType !== 'absence');
  }, [favoriteShifts]);

  // Días del mes (completando la última semana)
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    
    // Completar la última semana hasta el domingo
    const lastDayOfWeek = getDay(endMonth); // 0 = domingo, 6 = sábado
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    const end = addDays(endMonth, daysToAdd);
    
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 🔄 SINCRONIZADO CON GoogleCalendarStyle - MISMA CONSULTA EXACTA
  const loadColaboradores = useCallback(async () => {
    try {
      if (!currentOrg?.org_id) {
        console.warn('No hay org_id disponible para cargar colaboradores');
        setLoading(false);
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
        console.error('Error cargando colaboradores:', error);
        setLoading(false);
        return;
      }

      
      if (data && data.length > 0) {
        const mappedEmployees: Employee[] = data.map(colaborador => ({
          id: colaborador.id,
          name: `${colaborador.nombre} ${colaborador.apellidos}`,
          role: colaborador.tipo_contrato || 'Empleado',
          department: 'General',
          workingHours: colaborador.tiempo_trabajo_semanal ? `${colaborador.tiempo_trabajo_semanal}h` : '40h',
          contractHours: colaborador.tiempo_trabajo_semanal || 40,
          startDate: colaborador.fecha_inicio_contrato || undefined
        }));
        
        // Recuperar orden manual si existe (scoped por org)
        const savedManualOrder = localStorage.getItem(getManualOrderKey(currentOrg?.org_id));
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
          } catch (error) {
            console.error('Error parsing manual order:', error);
          }
        }
        
        setEmployees(finalEmployees);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error en loadColaboradores:', error);
      setLoading(false);
    }
  }, [currentOrg?.org_id]);

  // Cargar colaboradores cuando currentOrg esté disponible
  useEffect(() => {
    if (!currentOrg?.org_id) {
      return;
    }
    loadColaboradores();
  }, [currentOrg?.org_id, loadColaboradores]);

  // 🔄 Escuchar cambios en el orden manual de empleados desde localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getManualOrderKey(currentOrg?.org_id) && currentOrg?.org_id) {
        loadColaboradores();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentOrg?.org_id, loadColaboradores]);

  // 🔄 SINCRONIZADO CON GoogleCalendarStyle - CARGA DE TURNOS
  const loadShiftsFromSupabase = useCallback(async (employeeIds: string[]) => {
    try {
      if (!currentOrg?.org_id || employeeIds.length === 0) return;

      // Calcular el rango real de días mostrados (incluyendo días del mes siguiente)
      const endMonth = endOfMonth(currentDate);
      const lastDayOfWeek = getDay(endMonth);
      const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
      const extendedEnd = addDays(endMonth, daysToAdd);

      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(extendedEnd, 'yyyy-MM-dd');

      const { data: shifts, error } = await supabase
        .from('calendar_shifts')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .gte('date', start)
        .lte('date', end);

      if (error) {
        console.error('Error cargando turnos:', error);
        return;
      }

      if (shifts && shifts.length > 0) {
        const savedShifts = await getSavedShifts();
        
        const mappedShifts: ShiftBlock[] = shifts.map(shift => {
          const savedShift = savedShifts.find(s => s.name === shift.shift_name);
          
          // Detectar ausencias
          const ABSENCE_NAMES = ['Descanso', 'Libre', 'Vacaciones', 'Enfermo', 'Falta', 'Permiso', 'Baja', 'Curso', 'Horas Sindicales', 'Sancionado', 'Banquetes'];
          const isAbsenceByName = ABSENCE_NAMES.some(name => 
            shift.shift_name?.toLowerCase().includes(name.toLowerCase())
          );
          const isAbsenceByTime = !shift.start_time && !shift.end_time;
          const isAbsenceByTimeRange = shift.start_time === '00:00:00' && shift.end_time === '23:59:00';
          const isAbsence = savedShift?.accessType === 'absence' || isAbsenceByName || isAbsenceByTime || isAbsenceByTimeRange;
          
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
            hasBreak: savedShift?.hasBreak || !!shift.break_duration || false,
          };
        });
        
        setShiftBlocks(mappedShifts);
      } else {
        setShiftBlocks([]);
      }
    } catch (error) {
      console.error('Error en loadShiftsFromSupabase:', error);
    }
  }, [currentOrg?.org_id, currentDate]);

  // Recargar turnos cuando cambien los empleados o el mes
  useEffect(() => {
    if (employees.length > 0 && currentOrg?.org_id) {
      loadShiftsFromSupabase(employees.map(e => e.id));
    }
  }, [employees, currentDate, currentOrg?.org_id, loadShiftsFromSupabase]);

  // Obtener turnos para un empleado y día
  const getShiftsForCell = useCallback((employeeId: string, day: Date) => {
    return shiftBlocks.filter(s => 
      s.employeeId === employeeId && 
      isSameDay(s.date, day)
    );
  }, [shiftBlocks]);

  // Calcular estadísticas mensuales para un empleado
  const getMonthlyStats = useCallback((employeeId: string) => {
    const employeeShifts = shiftBlocks.filter(s => s.employeeId === employeeId);
    
    let totalHours = 0;
    let absenceDays = 0;
    let workDays = 0;
    
    employeeShifts.forEach(shift => {
      if (shift.type === 'absence') {
        absenceDays++;
      } else if (shift.startTime && shift.endTime) {
        workDays++;
        const today = new Date().toISOString().split('T')[0];
        const startDateTime = parseISO(`${today}T${shift.startTime}`);
        const endDateTime = parseISO(`${today}T${shift.endTime}`);
        let startHour = startDateTime.getHours() + startDateTime.getMinutes() / 60;
        let endHour = endDateTime.getHours() + endDateTime.getMinutes() / 60;
        let duration = endHour - startHour;
        if (duration < 0) duration += 24;
        totalHours += duration;
      }
    });
    
    return { totalHours: Math.round(totalHours), absenceDays, workDays };
  }, [shiftBlocks]);

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
        contractHours: employee?.contractHours || 40
      };
    });
  }, [shiftBlocks, employees]);

  // Hook de auditoría
  const {
    auditResult,
    isAuditing,
    runAudit,
    getViolationsForCell,
    getViolationsForEmployee,
    getMaxSeverityForCell
  } = useMonthAudit(shiftsForAudit, currentDate, currentOrg?.org_id);

  // Estadísticas del día
  const getDayStats = useCallback((day: Date) => {
    const dayShifts = shiftBlocks.filter(s => isSameDay(s.date, day));
    const presencial = dayShifts.filter(s => s.type !== 'absence').length;
    const libres = dayShifts.filter(s => s.name?.toLowerCase().includes('libre')).length;
    return { presencial, libres, total: dayShifts.length };
  }, [shiftBlocks]);

  // Navegación
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Click en celda vacía
  const handleCellClick = (employee: Employee, day: Date, event: React.MouseEvent) => {
    if (!canEdit) return;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({ x: rect.left, y: rect.bottom });
    setSelectedEmployee(employee);
    setSelectedDate(day);
    setShowShiftPopup(true);
  };

  // Click en turno existente
  const handleShiftClick = (shift: ShiftBlock, employee: Employee) => {
    setSelectedShift(shift);
    setSelectedEmployee(employee);
    setShowShiftDialog(true);
  };

  // Sincronizar scroll vertical
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (employeesContainerRef.current && scrollContainerRef.current) {
      if (e.currentTarget === scrollContainerRef.current) {
        employeesContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop;
      }
    }
  };

  // Loading state
  if (loading && employees.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Unificado - Idéntico en todas las vistas */}
      <div className="flex-shrink-0 border-b bg-card px-4">
        <UnifiedCalendarHeader
          viewMode="month"
          selectedDate={currentDate}
          onDateChange={setCurrentDate}
          onSave={() => {}}
          onPrint={() => window.print()}
          onExport={() => {}}
          onClean={() => setShowCleanDialog(true)}
          onOpenSettings={() => {}}
          onDelete={() => {}}
          canEdit={canEdit}
          auditResult={auditResult}
          isAuditing={isAuditing}
          onRefreshAudit={runAudit}
          employeeCount={employees.length}
          dayCount={monthDays.length}
        />
      </div>

      {/* Grid del calendario */}
      <div className="flex-1 overflow-hidden flex">
        {/* Panel izquierdo - Empleados (sticky) - IDÉNTICO al estilo semanal */}
        <div className="flex-shrink-0 w-[200px] border-r bg-card flex flex-col">
          {/* Header de empleados */}
          <div className="h-[52px] border-b flex items-center px-3 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Empleado</span>
          </div>
          
          {/* Lista de empleados - scroll sincronizado */}
          <div 
            ref={employeesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {sortedEmployees.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No hay empleados disponibles
              </div>
            ) : (
              sortedEmployees.map((employee) => {
                const stats = getMonthlyStats(employee.id);
                const contractHours = employee.contractHours || 40;
                const monthlyContractHours = contractHours * 4;
                const difference = stats.totalHours - monthlyContractHours;
                
                // Obtener violaciones del empleado para el badge
                const employeeViolations = getViolationsForEmployee(employee.id);
                const employeeMaxSeverity = employeeViolations.length > 0 
                  ? (employeeViolations.some(v => v.severity === 'error') ? 'error' 
                    : employeeViolations.some(v => v.severity === 'warning') ? 'warning' : 'info')
                  : null;
                
                return (
                  <div 
                    key={employee.id}
                    className={cn(
                      "h-[44px] px-3 flex items-center justify-between border-b group",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Nombre con badge de violaciones */}
                      <div className="flex items-center gap-1">
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <div className="text-xs font-medium truncate cursor-default">
                              {employee.name}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <div className="space-y-1">
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-xs text-muted-foreground">{employee.role}</div>
                              <div className="text-xs">Contrato: {employee.workingHours}/sem</div>
                              {employeeViolations.length > 0 && (
                                <div className="text-xs text-destructive">
                                  ⚠️ {employeeViolations.length} problema{employeeViolations.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        {employeeMaxSeverity && (
                          <EmployeeViolationBadge 
                            count={employeeViolations.length} 
                            maxSeverity={employeeMaxSeverity as 'error' | 'warning' | 'info'} 
                          />
                        )}
                      </div>
                      
                      {/* Estadísticas */}
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {stats.totalHours}h
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>{stats.workDays}d</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className={difference > 0 ? "text-red-500" : difference < 0 ? "text-amber-500" : "text-green-600"}>
                          {difference >= 0 ? '+' : ''}{difference}h
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Grid de días (scrollable) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          onScroll={handleScroll}
        >
          <div style={{ width: `${monthDays.length * 42}px` }}>
            {/* Header de días */}
            <div className="h-[52px] flex border-b sticky top-0 bg-card z-10">
              {monthDays.map((day, index) => {
                const dayOfWeek = getDay(day);
                const weekend = isWeekend(day);
                const today = isToday(day);
                const stats = getDayStats(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-[42px] flex-shrink-0 flex flex-col items-center justify-center border-r",
                      weekend && "bg-muted/40",
                      today && "bg-primary/10",
                      !isCurrentMonth && "bg-muted/60 opacity-60"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-medium leading-none",
                      weekend ? "text-muted-foreground" : "text-foreground",
                      today && "text-primary",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {WEEKDAY_LABELS[dayOfWeek]}
                    </span>
                    <span className={cn(
                      "text-xs font-semibold leading-none mt-1",
                      today && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]",
                      !isCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {stats.presencial > 0 && (
                      <span className="text-[8px] text-green-600 leading-none mt-1">
                        {stats.presencial}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Filas de empleados */}
            {sortedEmployees.map((employee) => (
              <div key={employee.id} className="flex border-b h-[44px]">
                {monthDays.map((day, dayIndex) => {
                  const shifts = getShiftsForCell(employee.id, day);
                  const weekend = isWeekend(day);
                  const today = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const shift = shifts[0];
                  const shiftCode = shift ? getShiftCode(shift) : null;
                  
                  // Obtener violaciones de auditoría para esta celda
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const cellViolations = getViolationsForCell(employee.id, dateStr);
                  const cellSeverity = getMaxSeverityForCell(employee.id, dateStr);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "w-[42px] flex-shrink-0 border-r p-0.5 cursor-pointer relative group",
                        "hover:bg-muted/30 transition-colors",
                        weekend && "bg-muted/20",
                        today && "bg-primary/5",
                        !isCurrentMonth && "bg-muted/40 opacity-70"
                      )}
                      onClick={(e) => {
                        if (shifts.length === 0) {
                          handleCellClick(employee, day, e);
                        } else {
                          handleShiftClick(shifts[0], employee);
                        }
                      }}
                    >
                      <AuditCellHighlight severity={cellSeverity} className="h-full">
                        {shift && shiftCode ? (
                          <AuditViolationTooltip violations={cellViolations}>
                            <div
                              className={cn(
                                "w-full h-full rounded flex flex-col items-center justify-center",
                                "transition-all cursor-pointer relative overflow-hidden",
                                !canEdit ? 'cursor-default' : 'hover:ring-1 hover:ring-primary/50'
                              )}
                              style={{
                                backgroundColor: shift.type === 'absence' 
                                  ? shift.color 
                                  : `${shift.color}40`,
                              }}
                            >
                              {/* Letra del turno */}
                              <span className={cn(
                                "text-[11px] font-bold leading-none",
                                shift.type === 'absence' ? "text-white drop-shadow-sm" : "text-gray-800"
                              )}>
                                {shiftCode.letter}
                              </span>
                              
                              {/* Hora de inicio para turnos con horario */}
                              {shiftCode.time && (
                                <span className="text-[7px] text-gray-600 leading-none mt-0.5 bg-white/90 rounded px-0.5">
                                  {shiftCode.time}
                                </span>
                              )}
                              
                              {/* Indicador de descanso */}
                              {shift.hasBreak && (
                                <Coffee className="absolute bottom-0.5 right-0.5 h-2 w-2 text-amber-700" />
                              )}
                              
                              {/* Indicador de violación */}
                              {cellViolations.length > 0 && (
                                <div className={cn(
                                  "absolute top-0 right-0 w-2 h-2 rounded-full",
                                  cellSeverity === 'error' && "bg-destructive",
                                  cellSeverity === 'warning' && "bg-amber-500",
                                  cellSeverity === 'info' && "bg-primary"
                                )} />
                              )}
                            </div>
                          </AuditViolationTooltip>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">+</span>
                            </div>
                          </div>
                        )}
                      </AuditCellHighlight>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda dinámica sincronizada con Favoritos */}
      <div className="flex-shrink-0 border-t bg-card px-4 py-3">
        <div className="flex items-center gap-4 text-xs flex-wrap">
          {/* Ausencias - sincronizadas con FavoritesArea */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <span className="text-muted-foreground font-semibold text-[11px]">Ausencias:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {allAbsenceShifts.map((absence) => (
                <div 
                  key={absence.id} 
                  className="flex items-center gap-1" 
                  title={absence.name}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: absence.color }}
                  />
                  <span className="text-[10px] text-foreground/80">{absence.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Separador vertical */}
          {workShifts.length > 0 && <div className="h-8 w-px bg-border/60" />}
          
          {/* Mis Horarios - sincronizados con FavoritesArea */}
          {workShifts.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground font-semibold text-[11px]">Mis horarios:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {workShifts.map((shift) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center gap-1" 
                    title={`${shift.name}${shift.startTime && shift.endTime ? ` (${shift.startTime}-${shift.endTime})` : ''}`}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: shift.color }}
                    />
                    <span className="text-[10px] text-foreground/80">{shift.name}</span>
                    {shift.startTime && shift.endTime && (
                      <span className="text-[9px] text-muted-foreground">{shift.startTime}-{shift.endTime}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showShiftDialog && selectedShift && selectedEmployee && (
        <AdvancedShiftDialog
          isOpen={showShiftDialog}
          onClose={() => {
            setShowShiftDialog(false);
            setSelectedShift(null);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          date={selectedShift.date}
          editingShift={{
            id: selectedShift.id,
            name: selectedShift.name,
            startTime: selectedShift.startTime,
            endTime: selectedShift.endTime,
            color: selectedShift.color,
            type: selectedShift.type,
          }}
          onShiftAssigned={() => {
            setShowShiftDialog(false);
            setSelectedShift(null);
            setSelectedEmployee(null);
            // Recargar turnos
            loadShiftsFromSupabase(employees.map(e => e.id));
          }}
        />
      )}

      {showShiftPopup && selectedEmployee && selectedDate && (
        <ShiftSelectorPopup
          isOpen={showShiftPopup}
          onClose={() => {
            setShowShiftPopup(false);
            setSelectedEmployee(null);
            setSelectedDate(null);
          }}
          position={popupPosition}
          onShiftSelected={() => {
            setShowShiftPopup(false);
            setSelectedEmployee(null);
            setSelectedDate(null);
            // Recargar turnos
            loadShiftsFromSupabase(employees.map(e => e.id));
          }}
          onAdvancedOptions={() => {
            setShowShiftPopup(false);
            setShowShiftDialog(true);
          }}
        />
      )}

      {/* Diálogo de limpieza de turnos */}
      <CleanShiftsDialog
        open={showCleanDialog}
        onOpenChange={setShowCleanDialog}
        currentDate={currentDate}
        employees={employees}
        onSuccess={() => loadShiftsFromSupabase(employees.map(e => e.id))}
      />
    </div>
  );
}
