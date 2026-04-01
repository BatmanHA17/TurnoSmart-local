import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw } from "lucide-react";
import { format, eachDayOfInterval, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { getStatusCodes } from "@/services/database";
import type { Employee, StatusCode } from "@/types/database";
import type { DateRange } from "./GoTurnoSmartManual";

interface GoTurnoStep3ShiftAssignmentProps {
  dateRange: DateRange;
  selectedEmployees: Employee[];
  onValidationChange?: (isValid: boolean) => void;
}

interface ShiftAssignment {
  employeeId: string;
  date: string;
  statusCode: string;
  startTime: string;
}

export const GoTurnoStep3ShiftAssignment = forwardRef<
  { getAssignments: () => ShiftAssignment[] },
  GoTurnoStep3ShiftAssignmentProps
>(({ 
  dateRange, 
  selectedEmployees,
  onValidationChange
}, ref) => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCode[]>([]);
  const [customTimeInputs, setCustomTimeInputs] = useState<Record<string, boolean>>({});
  const [lockedFreeDays, setLockedFreeDays] = useState<Record<string, boolean>>({});
  
  const timeSlots = [
    "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
    "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    loadStatusCodes();
    initializeAssignments();
  }, [dateRange, selectedEmployees]);

  const loadStatusCodes = async () => {
    try {
      const codes = await getStatusCodes();
      setStatusCodes(codes);
    } catch (error) {
      console.error("Error loading status codes:", error);
    }
  };

  const initializeAssignments = () => {
    const initialDays = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
    const initialAssignments: ShiftAssignment[] = [];

    selectedEmployees.forEach(employee => {
      initialDays.forEach(day => {
        initialAssignments.push({
          employeeId: employee.id,
          date: format(day, "yyyy-MM-dd"),
          statusCode: "D", // Día de descanso por defecto
          startTime: "" // Sin horario por defecto
        });
      });
    });

    setAssignments(initialAssignments);
  };

  // Códigos que requieren horario (L - Día libre NO requiere horario)
  const codesRequiringTime = ["C", "X", "XB"];

  const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

  // Función para reequilibrar automáticamente la semana laboral (5 días trabajo, 2 días libres)
  const rebalanceWeeklySchedule = (updatedAssignments: ShiftAssignment[], employeeId: string, customLockedFreeDays?: Record<string, boolean>) => {
    const employeeAssignments = updatedAssignments.filter(a => a.employeeId === employeeId);
    const locksToUse = customLockedFreeDays || lockedFreeDays;

    // Contar días de trabajo y libres
    const workDays = employeeAssignments.filter(a => ["X", "XB", "C"].includes(a.statusCode));
    const freeDaysAll = employeeAssignments.filter(a => a.statusCode === "D");

    // Respetar los días libres marcados por el usuario (bloqueados)
    const candidateFreeDays = freeDaysAll.filter(day => !locksToUse[`${employeeId}-${day.date}`]);

    // Si hay menos de 5 días de trabajo, buscar un horario existente para completar
    if (workDays.length < 5 && freeDaysAll.length > 2) {
      const existingWorkTime = workDays.find(a => a.startTime !== "")?.startTime || "";
      const existingWorkCode = workDays.find(a => ["X", "XB"].includes(a.statusCode))?.statusCode || "X";

      if (existingWorkTime) {
        // Convertir días libres (no bloqueados) a días de trabajo hasta completar 5 días,
        // dejando siempre como mínimo 2 días libres en total
        const maxConvertible = Math.min(5 - workDays.length, Math.max(0, freeDaysAll.length - 2));
        let converted = 0;
        for (let i = 0; i < candidateFreeDays.length && converted < maxConvertible; i++) {
          const dayToConvert = candidateFreeDays[i];
          const assignmentIndex = updatedAssignments.findIndex(
            a => a.employeeId === employeeId && a.date === dayToConvert.date
          );
          if (assignmentIndex !== -1) {
            updatedAssignments[assignmentIndex] = {
              ...updatedAssignments[assignmentIndex],
              statusCode: existingWorkCode,
              startTime: existingWorkTime
            };
            converted++;
          }
        }
      }
    }

    return updatedAssignments;
  };

  const updateAssignment = (employeeId: string, date: string, field: keyof ShiftAssignment, value: string) => {
    const key = `${employeeId}-${date}`;
    
    setAssignments(prev => {
      const updated = prev.map(assignment => {
        if (assignment.employeeId === employeeId && assignment.date === date) {
          // Si se cambia el código de estado, resetear el horario si requiere tiempo
          if (field === "statusCode") {
            const newStartTime = (value === "D" || codesRequiringTime.includes(value)) ? "" : assignment.startTime;
            return { ...assignment, [field]: value, startTime: newStartTime };
          }
          // Si se selecciona "custom", activar el input personalizado
          if (field === "startTime" && value === "custom") {
            setCustomTimeInputs(prev => ({ ...prev, [key]: true }));
            return { ...assignment, startTime: "" };
          }
          // Si se añade un horario, NO establecer automáticamente el código de presencia
          if (field === "startTime" && value !== "" && value !== "custom") {
            return { ...assignment, [field]: value };
          }
          return { ...assignment, [field]: value };
        }
        return assignment;
      });
      
      // Si se añade un horario, preestablecerlo para los siguientes 4 días de trabajo
      if (field === "startTime" && value !== "" && value !== "custom") {
        const updatedWithNextDays = [...updated];
        const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
        const currentDateIndex = sortedDays.findIndex(day => format(day, "yyyy-MM-dd") === date);
        
        if (currentDateIndex !== -1) {
          let workDaysCount = 0;
          for (let i = currentDateIndex + 1; i < sortedDays.length && workDaysCount < 4; i++) {
            const nextDate = format(sortedDays[i], "yyyy-MM-dd");
            const nextAssignmentIndex = updatedWithNextDays.findIndex(
              a => a.employeeId === employeeId && a.date === nextDate
            );
            
            if (nextAssignmentIndex !== -1) {
              const nextAssignment = updatedWithNextDays[nextAssignmentIndex];
              // Solo preestablecer si es día libre (L) para convertirlo en trabajo
              if (nextAssignment.statusCode === "D") {
                updatedWithNextDays[nextAssignmentIndex] = {
                  ...nextAssignment,
                  startTime: value,
                  statusCode: "X"
                };
                workDaysCount++;
              }
            }
          }
        }

        // Aplicar reequilibrio automático después de preestablecer horarios
        const finalUpdated = rebalanceWeeklySchedule(updatedWithNextDays, employeeId);

        // Notificar cambio de validación
        if (onValidationChange) {
          const isValid = finalUpdated.every(assignment =>
            !codesRequiringTime.includes(assignment.statusCode) ||
            (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
          );
          onValidationChange(isValid);
        }

        return finalUpdated;
      }

      // Aplicar reequilibrio automático para cambios de estado (como D - descanso)
      if (field === "statusCode") {
        // Preparar el nuevo estado de bloqueos de días libres
        const newLockedFreeDays = { ...lockedFreeDays };
        if (value === "D") {
          newLockedFreeDays[key] = true;
        } else {
          delete newLockedFreeDays[key];
        }
        
        // Actualizar estado inmediatamente
        setLockedFreeDays(newLockedFreeDays);
        
        // Hacer el rebalanceo usando el nuevo estado de bloqueos
        const rebalanced = rebalanceWeeklySchedule(updated, employeeId, newLockedFreeDays);
        
        // Notificar cambio de validación
        if (onValidationChange) {
          setTimeout(() => {
            const isValid = rebalanced.every(assignment => 
              !codesRequiringTime.includes(assignment.statusCode) || 
              (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
            );
            onValidationChange(isValid);
          }, 0);
        }
        
        return rebalanced;
      }
      
      // Notificar cambio de validación para otros casos
      if (onValidationChange) {
        const isValid = updated.every(assignment => 
          !codesRequiringTime.includes(assignment.statusCode) || 
          (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
        );
        onValidationChange(isValid);
      }
      
      return updated;
    });
  };

  const handleCustomTimeChange = (employeeId: string, date: string, value: string) => {
    const key = `${employeeId}-${date}`;
    
    // Si se añade un horario personalizado, NO establecer automáticamente el código de presencia
    if (value !== "") {
      setAssignments(prev => {
        const updated = prev.map(assignment => 
          assignment.employeeId === employeeId && assignment.date === date
            ? { ...assignment, startTime: value }
            : assignment
        );

        // Preestablecer horario para los siguientes 4 días de trabajo
        const updatedWithNextDays = [...updated];
        const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
        const currentDateIndex = sortedDays.findIndex(day => format(day, "yyyy-MM-dd") === date);
        
        if (currentDateIndex !== -1) {
          let workDaysCount = 0;
          for (let i = currentDateIndex + 1; i < sortedDays.length && workDaysCount < 4; i++) {
            const nextDate = format(sortedDays[i], "yyyy-MM-dd");
            const nextAssignmentIndex = updatedWithNextDays.findIndex(
              a => a.employeeId === employeeId && a.date === nextDate
            );
            
            if (nextAssignmentIndex !== -1) {
              const nextAssignment = updatedWithNextDays[nextAssignmentIndex];
              // Solo preestablecer si es día libre (L) para convertirlo en trabajo
              if (nextAssignment.statusCode === "D") {
                updatedWithNextDays[nextAssignmentIndex] = {
                  ...nextAssignment,
                  startTime: value,
                  statusCode: "X"
                };
                workDaysCount++;
              }
            }
          }
        }

        // Aplicar reequilibrio automático después de preestablecer horarios
        const finalUpdated = rebalanceWeeklySchedule(updatedWithNextDays, employeeId);

        return finalUpdated;
      });
    } else {
      updateAssignment(employeeId, date, "startTime", value);
    }
    
    // Si el input está vacío, mantener el modo custom activo
    if (value === "") {
      setCustomTimeInputs(prev => ({ ...prev, [key]: true }));
    }
  };

  const handleKeyDown = (employeeId: string, date: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const assignment = getAssignment(employeeId, date);
      
      // Validar y notificar cambios cuando se presiona Enter
      if (assignment?.startTime && assignment.startTime.trim() !== "" && onValidationChange) {
        const isValid = assignments.every(assignment => 
          !codesRequiringTime.includes(assignment.statusCode) || 
          (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
        );
        onValidationChange(isValid);
      }

      // Navegar al siguiente campo (simular Tab)
      e.preventDefault();
      const currentTarget = e.target as HTMLInputElement;
      
      // Encontrar todos los inputs de tiempo personalizados
      const allTimeInputs = document.querySelectorAll('input[placeholder="Ej: 10:35"]');
      const currentIndex = Array.from(allTimeInputs).indexOf(currentTarget);
      
      if (currentIndex !== -1 && currentIndex < allTimeInputs.length - 1) {
        // Enfocar el siguiente input
        const nextInput = allTimeInputs[currentIndex + 1] as HTMLInputElement;
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const getAssignment = (employeeId: string, date: string): ShiftAssignment | undefined => {
    return assignments.find(a => a.employeeId === employeeId && a.date === date);
  };

  const getStatusCodeColor = (code: string): string => {
    const statusCode = statusCodes.find(sc => sc.code === code);
    return statusCode?.color || "#6b7280";
  };

  // Exponer funciones a través del ref
  useImperativeHandle(ref, () => ({
    getAssignments: () => assignments
  }));

  const validateAllAssignments = () => {
    return assignments.every(assignment => 
      !codesRequiringTime.includes(assignment.statusCode) || 
      (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
    );
  };

  const resetEmployeeToFree = (employeeId: string) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.employeeId === employeeId
          ? { ...assignment, statusCode: "D", startTime: "" }
          : assignment
      )
    );

    // Limpiar inputs personalizados para este empleado
    setCustomTimeInputs(prev => {
      const updated = { ...prev };
      days.forEach(day => {
        const key = `${employeeId}-${format(day, "yyyy-MM-dd")}`;
        delete updated[key];
      });
      return updated;
    });

    // Limpiar bloqueos de días libres para este empleado
    setLockedFreeDays(prev => {
      const updated = { ...prev };
      days.forEach(day => {
        const key = `${employeeId}-${format(day, "yyyy-MM-dd")}`;
        delete updated[key];
      });
      return updated;
    });

    // Notificar cambio de validación
    if (onValidationChange) {
      // Después del reset todos los días libres serán válidos
      setTimeout(() => {
        onValidationChange(true); // Los días libres no requieren horario
      }, 0);
    }
  };

  // Función para clasificar horarios por franja
  const getTimeSlot = (time: string): 'mañana' | 'tarde' | 'noche' | null => {
    if (!time) return null;
    
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Mañana: 6:00 a 15:59 (360 a 959 minutos)
    if (totalMinutes >= 360 && totalMinutes < 960) return 'mañana';
    // Tarde: 16:00 a 23:59 (960 a 1439 minutos)  
    if (totalMinutes >= 960 && totalMinutes < 1440) return 'tarde';
    // Noche: 0:00 a 5:59 (0 a 359 minutos)
    if (totalMinutes >= 0 && totalMinutes < 360) return 'noche';
    
    return null;
  };

  // Calcular promedios de presencialidad por franja horaria
  const calculatePresenceByTimeSlot = () => {
    const presenceByDay = { mañana: 0, tarde: 0, noche: 0 };
    const totalDays = days.length;

    days.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayAssignments = assignments.filter(a => a.date === dateKey && (a.statusCode === "X" || a.statusCode === "XB"));
      
      const morningCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'mañana').length;
      const afternoonCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'tarde').length;
      const nightCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'noche').length;
      
      presenceByDay.mañana += morningCount;
      presenceByDay.tarde += afternoonCount;
      presenceByDay.noche += nightCount;
    });

    return {
      mañana: totalDays > 0 ? (presenceByDay.mañana / totalDays).toFixed(1) : '0.0',
      tarde: totalDays > 0 ? (presenceByDay.tarde / totalDays).toFixed(1) : '0.0',
      noche: totalDays > 0 ? (presenceByDay.noche / totalDays).toFixed(1) : '0.0'
    };
  };

  const presenceAverages = calculatePresenceByTimeSlot();

  // Agrupar empleados por horas de contrato
  const employeesByHours = selectedEmployees.reduce((acc, employee) => {
    const hours = employee.contract_hours;
    if (!acc[hours]) acc[hours] = [];
    acc[hours].push(employee);
    return acc;
  }, {} as Record<number, Employee[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Paso 3: Asignación de Turnos
        </CardTitle>
        <CardDescription>
          Configura los horarios y códigos de estado para cada empleado y día
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {Object.entries(employeesByHours)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([hours, employees]) => (
              <div key={hours} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-lg">Personal de {hours} horas</h4>
                  <Badge variant="outline">{employees.length} empleados</Badge>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Empleado</TableHead>
                        {days.map(day => (
                          <TableHead key={format(day, "yyyy-MM-dd")} className="text-center min-w-[120px]">
                            <div className="flex flex-col">
                              <span className="text-xs font-normal text-muted-foreground">
                                {dayNames[getDay(day)]}
                              </span>
                              <span className="font-medium">
                                {format(day, "d/M", { locale: es })}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(employee => (
                        <TableRow key={employee.id}>
                           <TableCell>
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="font-medium">{employee.name}</p>
                                 <p className="text-xs text-muted-foreground">{employee.category}</p>
                               </div>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => resetEmployeeToFree(employee.id)}
                                 className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                 title="Restaurar todos los días como libres"
                               >
                                 <RotateCcw className="h-3 w-3" />
                               </Button>
                             </div>
                           </TableCell>
                          {days.map(day => {
                            const dateKey = format(day, "yyyy-MM-dd");
                            const assignment = getAssignment(employee.id, dateKey);
                            
                            return (
                              <TableCell key={dateKey} className="p-2">
                                <div className="space-y-2">
                                   <Select
                                     value={assignment?.statusCode || "D"}
                                     onValueChange={(value) => updateAssignment(employee.id, dateKey, "statusCode", value)}
                                   >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-background">
                                      {statusCodes.map(code => (
                                        <SelectItem key={code.code} value={code.code}>
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: code.color }}
                                            />
                                            {code.code} - {code.description}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                    {codesRequiringTime.includes(assignment?.statusCode || "D") && (
                                      <>
                                        {customTimeInputs[`${employee.id}-${dateKey}`] ? (
                                           <Input
                                             value={assignment?.startTime || ""}
                                             onChange={(e) => handleCustomTimeChange(employee.id, dateKey, e.target.value)}
                                             onKeyDown={(e) => handleKeyDown(employee.id, dateKey, e)}
                                             placeholder="Ej: 10:35"
                                             className="h-8 text-xs"
                                           />
                                        ) : (
                                          <Select
                                            value={assignment?.startTime || ""}
                                            onValueChange={(value) => updateAssignment(employee.id, dateKey, "startTime", value)}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Añadir Horario" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-background border shadow-lg">
                                              <SelectItem value="custom" className="cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-primary">✏️</span>
                                                  Horario personalizado...
                                                </div>
                                              </SelectItem>
                                              {timeSlots.map(time => (
                                                <SelectItem key={time} value={time} className="cursor-pointer">
                                                  {time}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </>
                                    )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
        </div>

        {/* Resumen de estadísticas */}
        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{selectedEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Empleados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{days.length}</p>
                <p className="text-sm text-muted-foreground">Días</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{presenceAverages.mañana}</p>
                <p className="text-sm text-muted-foreground">Presencialidad Media Mañana</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{presenceAverages.tarde}</p>
                <p className="text-sm text-muted-foreground">Presencialidad Media Tarde</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{presenceAverages.noche}</p>
                <p className="text-sm text-muted-foreground">Presencialidad Media Noche</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {assignments.filter(a => a.statusCode === "D").length}
                </p>
                <p className="text-sm text-muted-foreground">Días Libres</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
});