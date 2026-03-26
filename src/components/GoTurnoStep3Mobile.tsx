import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { getStatusCodes } from "@/services/database";
import { MobileShiftCard } from "./MobileShiftCard";
import { ShiftControlPanel } from "./ShiftControlPanel";
import { validateShiftAssignments, rebalanceWeeklySchedule } from "@/utils/shiftValidation";
import type { Employee, StatusCode } from "@/types/database";
import type { DateRange } from "./GoTurnoSmartManual";

interface GoTurnoStep3MobileProps {
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

export const GoTurnoStep3Mobile = forwardRef<
  { getAssignments: () => ShiftAssignment[] },
  GoTurnoStep3MobileProps
>(({ dateRange, selectedEmployees, onValidationChange }, ref) => {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCode[]>([]);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(0);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
  const currentEmployee = selectedEmployees[currentEmployeeIndex];
  const currentDay = days[currentDayIndex];

  useEffect(() => {
    loadStatusCodes();
    initializeAssignments();
    // Auto-focus al primer empleado y primer día
    setCurrentEmployeeIndex(0);
    setCurrentDayIndex(0);
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
    const initialAssignments: ShiftAssignment[] = [];

    selectedEmployees.forEach(employee => {
      days.forEach(day => {
        initialAssignments.push({
          employeeId: employee.id,
          date: format(day, "yyyy-MM-dd"),
          statusCode: "L",
          startTime: ""
        });
      });
    });

    setAssignments(initialAssignments);
  };

  const updateAssignment = (employeeId: string, date: string, field: keyof ShiftAssignment, value: string) => {
    setAssignments(prev => {
      const updated = prev.map(assignment => {
        if (assignment.employeeId === employeeId && assignment.date === date) {
          if (field === "statusCode") {
            const newStartTime = value === "L" ? "" : assignment.startTime;
            return { ...assignment, [field]: value, startTime: newStartTime };
          }
          if (field === "startTime" && value !== "") {
            return { ...assignment, [field]: value, statusCode: "X" };
          }
          return { ...assignment, [field]: value };
        }
        return assignment;
      });

      // Aplicar rebalanceo automático
      if (field === "startTime" && value !== "") {
        const rebalanced = rebalanceWeeklySchedule(updated, employeeId, days);
        if (onValidationChange) {
          const isValid = validateShiftAssignments(rebalanced);
          onValidationChange(isValid);
        }
        return rebalanced;
      }

      if (onValidationChange) {
        const isValid = validateShiftAssignments(updated);
        onValidationChange(isValid);
      }

      return updated;
    });
  };

  const getAssignment = (employeeId: string, date: string): ShiftAssignment | undefined => {
    return assignments.find(a => a.employeeId === employeeId && a.date === date);
  };

  const navigateEmployee = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentEmployeeIndex > 0) {
      setCurrentEmployeeIndex(prev => prev - 1);
      setCurrentDayIndex(0); // Reset to first day
    } else if (direction === 'next' && currentEmployeeIndex < selectedEmployees.length - 1) {
      setCurrentEmployeeIndex(prev => prev + 1);
      setCurrentDayIndex(0); // Reset to first day
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1);
    } else if (direction === 'next' && currentDayIndex < days.length - 1) {
      setCurrentDayIndex(prev => prev + 1);
    }
  };

  const quickSetTime = (time: string) => {
    if (currentEmployee && currentDay) {
      const dateKey = format(currentDay, "yyyy-MM-dd");
      updateAssignment(currentEmployee.id, dateKey, "startTime", time);
    }
  };

  // Exponer funciones a través del ref
  useImperativeHandle(ref, () => ({
    getAssignments: () => assignments
  }));

  if (!currentEmployee || !currentDay) {
    return null;
  }

  const currentAssignment = getAssignment(currentEmployee.id, format(currentDay, "yyyy-MM-dd"));

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Asignación de Turnos</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentEmployeeIndex + 1}/{selectedEmployees.length}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            Configura horarios para cada empleado
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Navegación de Empleados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateEmployee('prev')}
              disabled={currentEmployeeIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center flex-1">
              <p className="font-medium text-sm">{currentEmployee.name}</p>
              <p className="text-xs text-muted-foreground">{currentEmployee.category}</p>
              <p className="text-xs text-muted-foreground">{currentEmployee.contract_hours}h</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateEmployee('next')}
              disabled={currentEmployeeIndex === selectedEmployees.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjeta de Turno Principal */}
      <MobileShiftCard
        employee={currentEmployee}
        day={currentDay}
        assignment={currentAssignment}
        statusCodes={statusCodes}
        onUpdate={updateAssignment}
      />

      {/* Panel de Control */}
      <ShiftControlPanel
        onQuickSetTime={quickSetTime}
        onNavigateDay={navigateDay}
        currentDayIndex={currentDayIndex}
        totalDays={days.length}
        currentDay={currentDay}
      />

      {/* Resumen Compacto */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{selectedEmployees.length}</p>
              <p className="text-xs text-muted-foreground">Empleados</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{days.length}</p>
              <p className="text-xs text-muted-foreground">Días</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">
                {assignments.filter(a => a.statusCode === "X" || a.statusCode === "XB").length}
              </p>
              <p className="text-xs text-muted-foreground">Presenciales</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

GoTurnoStep3Mobile.displayName = "GoTurnoStep3Mobile";