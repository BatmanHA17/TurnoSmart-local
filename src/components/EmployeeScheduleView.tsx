import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { format, startOfWeek, addDays, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { labelRange, getTimePositionPercent, segmentShiftAcrossMidnight, type ShiftSegment } from "@/utils/time";
import { HourScale } from "@/components/HourScale";
import { UnifiedCalendarHeader } from "@/components/calendar/UnifiedCalendarHeader";
import { useCalendarPublishState } from "@/hooks/useCalendarPublishState";
import { toast } from "@/hooks/use-toast";
import { EmployeeCalendarColumn } from "@/components/calendar/EmployeeCalendarColumn";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, UserPlus, Grid3X3, Star, AlertTriangle } from "lucide-react";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useWeekAudit } from "@/hooks/useShiftAudit";
import { AuditViolationTooltip } from "@/components/audit/AuditViolationTooltip";
import { EmployeeViolationBadge } from "@/components/audit";
import { CleanShiftsDialog } from "./CleanShiftsDialog";

interface ScheduleShift {
  id: string;
  shift_name: string;
  start_time: string | null;
  end_time: string | null;
  break_duration: string | null;
  color: string;
  date: string;
  employee_id: string;
  employee_name: string;
  employee_avatar?: string;
  display_range: string; // "HH:MM – HH:MM", "Descanso", "—"
}

interface DayStats {
  date: Date;
  employeesCount: number;
}

/**
 * Interfaz para turnos renderizables en el timeline.
 * Incluye segmentos (para split de medianoche) y metadatos del empleado.
 */
interface RenderableShift {
  segment: ShiftSegment;
  shift_name: string;
  break_duration: string | null;
  color: string;
  employee_id: string;
  employee_name: string;
  employee_avatar?: string;
  display_range: string;
}

export function EmployeeScheduleView() {
  const { user } = useAuth();
  const { org: currentOrg } = useCurrentOrganization();
  const { role } = useUserRoleCanonical();
  const isEmployee = role === 'EMPLOYEE';
  const navigate = useNavigate();
  const [currentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  // Punto 2: Por defecto siempre aparece en current day
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortByTime, setSortByTime] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Publishing state
  const { 
    publishState, 
    publishCalendar, 
    unpublishCalendar, 
    canPublish, 
    isPublished, 
    isDraft 
  } = useCalendarPublishState(currentWeekStart);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const today = new Date();

  useEffect(() => {
    if (currentOrg) {
      setSelectedOrgId(currentOrg.org_id);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchWeekShifts();
      fetchColaboradores();
    }
  }, [selectedDate, selectedOrgId]);

  const fetchWeekShifts = async () => {
    if (!selectedOrgId) return;
    
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const { data: shiftsData, error } = await supabase
        .from('calendar_shifts')
        .select(`
          id,
          shift_name,
          start_time,
          end_time,
          break_duration,
          color,
          date,
          employee_id,
          colaboradores!inner(nombre, apellidos, avatar_url)
        `)
        .eq('org_id', selectedOrgId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const formattedShifts: ScheduleShift[] = (shiftsData || []).map((shift: any) => {
        const nombre = shift.colaboradores?.nombre;
        const apellidos = shift.colaboradores?.apellidos;
        const employeeName = [nombre, apellidos].filter(Boolean).join(' ') || 'Sin asignar';
        
        // Detectar si es descanso (sin horas O shift_name incluye "Descanso")
        const isRest = !shift.start_time || 
                       !shift.end_time || 
                       (shift.shift_name && shift.shift_name.toLowerCase().includes('descanso'));
        
        const displayRange = isRest 
          ? 'Descanso' 
          : labelRange(shift.start_time, shift.end_time) ?? '—';
        
        return {
          id: shift.id,
          shift_name: shift.shift_name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_duration: shift.break_duration,
          color: shift.color,
          date: shift.date,
          employee_id: shift.employee_id,
          employee_name: employeeName,
          employee_avatar: shift.colaboradores?.avatar_url,
          display_range: displayRange,
        };
      });

      setShifts(formattedShifts);

      // Calculate daily stats
      const stats: DayStats[] = weekDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayShifts = formattedShifts.filter(s => s.date === dayStr);
        const uniqueEmployees = new Set(dayShifts.map(s => s.employee_id));
        
        return {
          date: day,
          employeesCount: uniqueEmployees.size,
        };
      });

      // Stats removed - not needed for day view
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColaboradores = async () => {
    if (!selectedOrgId) return;

    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('org_id', selectedOrgId)
      .eq('status', 'activo');
    
    if (error) {
      console.error('Error cargando colaboradores:', error);
      return;
    }
    
    setColaboradores(data || []);
  };

  // Removed week navigation handlers - now using date navigation from toolbar

  const getTodayShifts = () => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return shifts.filter(s => s.date === selectedDateStr);
  };

  // Get current hour and minute for highlighting and current time line
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Calculate current time position as percentage (0-100%)
  const getCurrentTimePosition = (): number => {
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = currentHour * 60 + currentMinute;
    return (currentMinutes / totalMinutesInDay) * 100;
  };
  
  const currentTimePosition = getCurrentTimePosition();

  const getTimePosition = (time: string | null): number => {
    const pos = getTimePositionPercent(time);
    return pos ?? 0; // fallback 0% si null
  };

  const getShiftWidth = (startTime: string | null, endTime: string | null): number => {
    const start = getTimePosition(startTime);
    const end = getTimePosition(endTime);
    
    // Si alguno es inválido (0%), devolver 0
    if (start === 0 && end === 0) return 0;
    
    return Math.abs(end - start);
  };

  const todayShifts = getTodayShifts();
  
  // Helper functions
  const getContractHours = (employeeId: string): number => {
    const colaborador = colaboradores.find(c => c.id === employeeId);
    return colaborador?.tiempo_trabajo_semanal || 40;
  };

  const getEmployeeEmail = (employeeId: string): string | undefined => {
    return colaboradores.find(c => c.id === employeeId)?.email;
  };

  const isCurrentUser = (employeeId: string): boolean => {
    const email = getEmployeeEmail(employeeId);
    return email === user?.email;
  };

  const navigateToColaborador = (employeeId: string) => {
    navigate(`/colaboradores/${employeeId}`);
  };

  const navigateToAbsences = (employeeId: string) => {
    navigate(`/colaboradores/${employeeId}/absences`);
  };

  const removeEmployee = (employeeId: string, employeeName: string) => {
    toast({
      title: "Función en desarrollo",
      description: `La eliminación de ${employeeName} del calendario estará disponible próximamente`
    });
  };
  
  // Calcular horas reales de un empleado
  const calculateRealHours = (employeeId: string): number => {
    const employeeShifts = shifts.filter(s => s.employee_id === employeeId);
    let totalMinutes = 0;
    
    employeeShifts.forEach(shift => {
      if (shift.start_time && shift.end_time) {
        const [startHour, startMin] = shift.start_time.split(':').map(Number);
        const [endHour, endMin] = shift.end_time.split(':').map(Number);
        
        let startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;
        
        // Handle overnight shifts
        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60;
        }
        
        totalMinutes += (endMinutes - startMinutes);
        
        // Subtract break duration if exists
        if (shift.break_duration) {
          const breakMatch = shift.break_duration.match(/(\d+)/);
          if (breakMatch) {
            totalMinutes -= parseInt(breakMatch[1]);
          }
        }
      }
    });
    
    return Math.round(totalMinutes / 60);
  };
  
  /**
   * Convierte turnos de hoy en segmentos renderizables.
   * Aplica split de medianoche automáticamente.
   */
  const renderableShifts: RenderableShift[] = todayShifts.flatMap(shift => {
    // Si es descanso (sin horas), genera un segmento completo (0% a 100%) para el timeline
    if (!shift.start_time || !shift.end_time) {
      return [{
        segment: {
          segmentId: `${shift.id}-rest`,
          shiftId: shift.id,
          start_time: '00:00',
          end_time: '23:59',
          label: '',
          isFirstSegment: true
        },
        shift_name: shift.shift_name,
        break_duration: shift.break_duration,
        color: shift.color,
        employee_id: shift.employee_id,
        employee_name: shift.employee_name,
        employee_avatar: shift.employee_avatar,
        display_range: shift.display_range,
      }];
    }
    
    const { segments } = segmentShiftAcrossMidnight(
      shift.id,
      shift.start_time,
      shift.end_time
    );
    
    return segments.map(segment => ({
      segment,
      shift_name: shift.shift_name,
      break_duration: shift.break_duration,
      color: shift.color,
      employee_id: shift.employee_id,
      employee_name: shift.employee_name,
      employee_avatar: shift.employee_avatar,
      display_range: shift.display_range,
    }));
  });

  // Transformar turnos para auditoría
  const shiftsForAudit = useMemo(() => {
    return shifts.map(shift => ({
      id: shift.id,
      employeeId: shift.employee_id,
      employeeName: shift.employee_name,
      date: shift.date,
      shiftName: shift.shift_name,
      startTime: shift.start_time,
      endTime: shift.end_time,
      isAbsence: shift.display_range === 'Descanso' || !shift.start_time,
      absenceCode: shift.shift_name === 'Descanso' || shift.shift_name === 'D' ? 'D' :
                   shift.shift_name === 'Vacaciones' || shift.shift_name === 'V' ? 'V' :
                   shift.shift_name === 'Enfermedad' || shift.shift_name === 'E' ? 'E' : undefined,
      contractHours: getContractHours(shift.employee_id)
    }));
  }, [shifts, colaboradores]);

  // Hook de auditoría para la semana actual
  const {
    auditResult,
    violations,
    isAuditing,
    runAudit,
    getViolationsForEmployee,
    getMaxSeverityForCell
  } = useWeekAudit(shiftsForAudit, currentWeekStart, selectedOrgId || undefined);

  // Publish handlers
  const handlePublish = async () => {
    try {
      const success = await publishCalendar(shifts, []);
      if (success) {
        toast({
          title: "Calendario publicado",
          description: `El calendario del ${format(selectedDate, "dd/MM/yyyy")} ha sido publicado.`
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Error al publicar",
        description: "No se pudo publicar el calendario.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleUnpublish = async () => {
    try {
      const success = await unpublishCalendar();
      if (success) {
        toast({
          title: "Calendario despublicado",
          description: "El calendario ha vuelto a estado borrador."
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Error al despublicar",
        description: "No se pudo despublicar el calendario.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Get unique employee IDs from today's shifts
  const employeeIds = Array.from(new Set(todayShifts.map(s => s.employee_id)));
  
  // Filter employees based on search term
  const filteredEmployees = employeeIds.filter(empId => {
    const emp = todayShifts.find(s => s.employee_id === empId);
    if (!emp) return false;
    const fullName = `${emp.employee_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Sort employees by earliest shift time
  const sortedEmployeeIds = useMemo(() => {
    if (!sortByTime) return filteredEmployees;
    
    return [...filteredEmployees].sort((aId, bId) => {
      const shiftsA = todayShifts.filter(s => s.employee_id === aId && s.start_time);
      const shiftsB = todayShifts.filter(s => s.employee_id === bId && s.start_time);
      
      if (shiftsA.length === 0 && shiftsB.length === 0) return 0;
      if (shiftsA.length === 0) return 1;
      if (shiftsB.length === 0) return -1;
      
      const earliestA = shiftsA.reduce((min, s) => 
        s.start_time! < min ? s.start_time! : min, shiftsA[0].start_time!
      );
      const earliestB = shiftsB.reduce((min, s) => 
        s.start_time! < min ? s.start_time! : min, shiftsB[0].start_time!
      );
      
      return earliestA.localeCompare(earliestB);
    });
  }, [filteredEmployees, todayShifts, sortByTime]);

  return (
    <div className="space-y-3">
      {/* Header Unificado - Idéntico en todas las vistas */}
      <UnifiedCalendarHeader
        viewMode="day"
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        hasUnsavedChanges={false}
        onSave={() => {}}
        onPrint={() => window.print()}
        onExport={() => {}}
        onOpenSettings={() => {}}
        onDelete={() => {}}
        canEdit={!isEmployee}
        isPublished={isPublished}
        isDraft={isDraft}
        canPublish={canPublish}
        isPublishing={publishState.isPublishing}
        publishedAt={publishState.published_at}
        version={publishState.version}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        auditResult={auditResult}
        isAuditing={isAuditing}
        onRefreshAudit={runAudit}
        onClean={() => setShowCleanDialog(true)}
        employeeCount={sortedEmployeeIds.length}
        dayCount={1}
      />

      {/* Main calendar card */}
      <Card className="p-3">
        {/* Header Row con título y controles */}
        <div className="flex mb-1">
          {/* Columna izquierda: Título + Controles */}
          <div className="w-20 flex-shrink-0 border-b pb-2">
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center justify-between w-full">
                <div className="text-[8px] sm:text-[9px] font-medium text-muted-foreground">
                  Personas / Día
                </div>
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    {/* Botón ordenar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted/50 rounded-md"
                          onClick={() => setSortByTime(!sortByTime)}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ordenar empleados</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Botón añadir empleados */}
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

                    {/* Toggle Time Slots Button */}
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

                    {/* Favorites Button */}
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
                          onClick={() => setShowFavorites(!showFavorites)}
                        >
                          <Star className={`h-3 w-3 ${showFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-[9px]">Favoritos</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          {/* HourScale alineado con el timeline */}
          <div className="flex-1 overflow-x-auto border-b pb-2">
            <div className="min-w-[1200px]">
              <HourScale
                shifts={todayShifts}
                currentHour={currentHour}
                title=""
              />
            </div>
          </div>
        </div>

        {/* Today's schedule - Flex layout con columna fija + timeline scrollable */}
        {todayShifts.length > 0 && (
          <div>
            {/* LAYOUT: Flex horizontal */}
            <div className="flex border-t overflow-hidden">
              {/* IZQUIERDA: Columna fija de empleados */}
              <div className="w-20 flex-shrink-0 border-r bg-background">
                {sortedEmployeeIds.map(employeeId => {
                  const employeeShifts = todayShifts.filter(s => s.employee_id === employeeId);
                  const employee = employeeShifts[0];
                  const contractHours = getContractHours(employeeId);
                  const realHours = calculateRealHours(employeeId);
                  const difference = realHours - contractHours;
                  
                  // Violaciones del empleado
                  const employeeViolations = getViolationsForEmployee(employeeId);
                  const hasViolations = employeeViolations.length > 0;
                  const maxSeverity = employeeViolations.some(v => v.severity === 'error') ? 'error' :
                                     employeeViolations.some(v => v.severity === 'warning') ? 'warning' : null;
                  
                  return (
                    <div key={`emp-${employeeId}`} className="h-16 border-b p-2 relative">
                      <div className="flex items-start gap-1">
                        <div className="flex-1">
                          <EmployeeCalendarColumn
                            employee={{
                              id: employeeId,
                              name: employee.employee_name || '',
                              email: getEmployeeEmail(employeeId),
                              avatar: employee.employee_avatar
                            }}
                            weeklyStats={{
                              contractHours: contractHours,
                              realHours: realHours,
                              absenceHours: 0,
                              difference: difference
                            }}
                            hasCompliance={realHours > contractHours}
                            canEdit={true}
                            isCurrentUser={isCurrentUser(employeeId)}
                            onNavigateToProfile={() => navigateToColaborador(employeeId)}
                            onNavigateToAbsences={() => navigateToAbsences(employeeId)}
                            onRemove={() => removeEmployee(employeeId, employee.employee_name || '')}
                          />
                        </div>
                        {hasViolations && (
                          <EmployeeViolationBadge 
                            count={employeeViolations.length} 
                            maxSeverity={maxSeverity || undefined}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* DERECHA: Timeline scrollable horizontalmente */}
              <div className="flex-1 overflow-x-auto relative">
                <div className="min-w-[1200px] relative">
                  {/* Current time indicator line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ 
                      left: `${currentTimePosition}%`,
                    }}
                  >
                    {/* Red dot at the top */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  
                  {sortedEmployeeIds.map(employeeId => {
                    const employeeShifts = todayShifts.filter(s => s.employee_id === employeeId);
                    const hasRestDay = employeeShifts.some(s => !s.start_time || !s.end_time);
                    const employeeRenderableShifts = renderableShifts.filter(
                      rs => rs.employee_id === employeeId
                    );
                    
                    return (
                      <div key={`timeline-${employeeId}`} className="h-16 relative border-b p-2">
                        <HourGridLines />
                        
                        {employeeRenderableShifts.map(rs => {
                          const isRestDay = rs.display_range === 'Descanso';
                          
                          // Rest day: full-width gray bar
                          if (isRestDay) {
                            return (
                              <div
                                key={rs.segment.segmentId}
                                className="absolute left-0 right-0 rounded-md px-3 py-2 text-xs font-medium z-20 bg-slate-200/90 text-gray-900 flex items-center justify-center"
                                style={{
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                <span className="truncate">Descanso semanal (1 día)</span>
                              </div>
                            );
                          }
                          
                          // Regular shift with timeline positioning
                          const startPos = getTimePosition(rs.segment.start_time);
                          const width = getShiftWidth(rs.segment.start_time, rs.segment.end_time);
                          
                          if (width === 0) return null;
                          
                          return (
                            <div
                              key={rs.segment.segmentId}
                              className="absolute rounded-md px-3 py-2 text-xs font-medium text-white z-20"
                              style={{
                                left: `${startPos}%`,
                                width: `${width}%`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: rs.color,
                              }}
                            >
                              <div className="truncate">
                                {rs.display_range} {rs.segment.label && `${rs.segment.label} `}
                                ({rs.break_duration || "0'"}) {rs.shift_name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Cargando horarios...
          </div>
        )}

        {!loading && todayShifts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay turnos programados para hoy
          </div>
        )}
      </Card>
      
      {/* Clean Dialog */}
      <CleanShiftsDialog
        open={showCleanDialog}
        onOpenChange={setShowCleanDialog}
        currentDate={selectedDate}
        employees={sortedEmployeeIds.map(id => {
          const shift = shifts.find(s => s.employee_id === id);
          return { id, name: shift?.employee_name || id };
        })}
        onSuccess={() => {
          // Reload shifts after cleaning
          fetchWeekShifts();
        }}
      />
    </div>
  );
}

function HourGridLines() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {hours.map(h => (
        <div
          key={h}
          className="absolute top-0 bottom-0 w-px bg-gray-200/40"
          style={{ left: `${(h / 24) * 100}%` }}
        />
      ))}
    </div>
  );
}
