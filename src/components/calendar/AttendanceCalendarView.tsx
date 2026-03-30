import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, HelpCircle } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, getWeek } from "date-fns";
import { es } from "date-fns/locale";
import { UnifiedCalendarHeader } from "./UnifiedCalendarHeader";
import { WeekEmptyState } from "./WeekEmptyState";
import { cn } from "@/lib/utils";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useCalendarEmployeeFilter } from "@/hooks/useCalendarEmployeeFilter";
import { useEmployeeSortOrder } from "@/hooks/useEmployeeSortOrder";
import { getSavedShifts } from "@/store/savedShiftsStore";

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
}

type AttendanceStatus = "present" | "absent" | "unknown";

function getAttendanceStatus(
  shifts: ShiftBlock[]
): AttendanceStatus {
  if (shifts.length === 0) return "unknown";
  const hasAbsence = shifts.some((s) => s.type === "absence");
  if (hasAbsence) return "absent";
  return "present";
}

interface AttendanceCellProps {
  status: AttendanceStatus;
  shiftNames?: string[];
}

function AttendanceCell({ status, shiftNames = [] }: AttendanceCellProps) {
  const label =
    status === "present"
      ? `Presente${shiftNames.length ? ": " + shiftNames.join(", ") : ""}`
      : status === "absent"
      ? `Ausente${shiftNames.length ? ": " + shiftNames.join(", ") : ""}`
      : "Sin programar";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-center w-full h-full min-h-[38px] cursor-default",
            status === "present" && "bg-green-50",
            status === "absent" && "bg-red-50",
            status === "unknown" && "bg-transparent"
          )}
        >
          {status === "present" && (
            <Check className="h-3.5 w-3.5 text-green-600" strokeWidth={2.5} />
          )}
          {status === "absent" && (
            <X className="h-3.5 w-3.5 text-red-500" strokeWidth={2.5} />
          )}
          {status === "unknown" && (
            <HelpCircle className="h-3 w-3 text-muted-foreground/30" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[9px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AttendanceCalendarView() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRoleCanonical();
  const isEmployee = role === "EMPLOYEE";
  const canEdit = !isEmployee;
  const { org: currentOrg } = useCurrentOrganization();

  const [shiftBlocks, setShiftBlocks] = useState<ShiftBlock[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const biWeekDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(weekStart, i)),
    [weekStart.getTime()]
  );

  const week1Number = getWeek(weekStart, { weekStartsOn: 1 });
  const week2Number = getWeek(addDays(weekStart, 7), { weekStartsOn: 1 });

  const { filteredEmployees } = useCalendarEmployeeFilter(
    employees,
    currentOrg?.org_id || null
  );
  const { sortedEmployees } = useEmployeeSortOrder(filteredEmployees);

  const goToPreviousBiWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextBiWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  const loadShiftsFromSupabase = useCallback(
    async (employeeIds: string[]) => {
      if (!currentOrg?.org_id) return;

      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const biWeekEndStr = format(addDays(weekStart, 13), "yyyy-MM-dd");

      const { data: shifts, error } = await supabase
        .from("calendar_shifts")
        .select("*")
        .eq("org_id", currentOrg.org_id)
        .gte("date", weekStartStr)
        .lte("date", biWeekEndStr);

      if (error || !shifts) return;

      const savedShifts = await getSavedShifts();
      const ABSENCE_NAMES = [
        "Libre", "Vacaciones", "Enfermo", "Falta", "Permiso",
        "Baja", "Curso", "Horas Sindicales", "Sancionado",
      ];

      const mapped: ShiftBlock[] = shifts.map((shift) => {
        const saved = savedShifts.find((s) => s.name === shift.shift_name);
        const isAbsenceByName = ABSENCE_NAMES.some((n) =>
          shift.shift_name.toLowerCase().includes(n.toLowerCase())
        );
        const isAbsenceByTime = !shift.start_time && !shift.end_time;
        const isAbsence =
          saved?.accessType === "absence" || isAbsenceByName || isAbsenceByTime;

        return {
          id: shift.id,
          employeeId: shift.employee_id,
          date: new Date(shift.date),
          startTime: isAbsence ? undefined : shift.start_time,
          endTime: isAbsence ? undefined : shift.end_time,
          type: isAbsence ? "absence" : "morning",
          color: shift.color || saved?.color || "#86efac",
          name: saved?.name || shift.shift_name,
        };
      });

      setShiftBlocks(mapped);
    },
    [currentOrg?.org_id, weekStart.getTime()]
  );

  const loadColaboradores = useCallback(async () => {
    if (!currentOrg?.org_id) {
      setIsLoadingData(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("colaboradores")
      .select(
        "id, nombre, apellidos, tiempo_trabajo_semanal, tipo_contrato, fecha_inicio_contrato, fecha_fin_contrato"
      )
      .eq("org_id", currentOrg.org_id)
      .or(
        `status.eq.activo,and(status.eq.inactivo,fecha_fin_contrato.gte.${today})`
      )
      .order("nombre", { ascending: true });

    if (error || !data) {
      setIsLoadingData(false);
      return;
    }

    const mapped: Employee[] = data.map((c) => ({
      id: c.id,
      name: `${c.nombre} ${c.apellidos}`,
      role: c.tipo_contrato || "Empleado",
      department: "General",
      workingHours: c.tiempo_trabajo_semanal
        ? `0h/${c.tiempo_trabajo_semanal}h`
        : "0h/40h",
      startDate: c.fecha_inicio_contrato || undefined,
    }));

    setEmployees(mapped);
    await loadShiftsFromSupabase(mapped.map((e) => e.id));
    setIsLoadingData(false);
  }, [currentOrg?.org_id, loadShiftsFromSupabase]);

  useEffect(() => {
    if (!currentOrg?.org_id) return;
    loadColaboradores();
  }, [currentOrg?.org_id]);

  useEffect(() => {
    if (currentOrg?.org_id && employees.length > 0) {
      loadShiftsFromSupabase(employees.map((e) => e.id));
    }
  }, [currentWeek, currentOrg?.org_id]);

  const getShiftsForCell = (employeeId: string, date: Date): ShiftBlock[] =>
    shiftBlocks.filter(
      (s) => s.employeeId === employeeId && isSameDay(s.date, date)
    );

  // Summary: count present/absent per day across all employees
  const daySummary = useMemo(() => {
    return biWeekDays.map((day) => {
      let present = 0;
      let absent = 0;
      sortedEmployees.forEach((emp) => {
        const shifts = getShiftsForCell(emp.id, day);
        const status = getAttendanceStatus(shifts);
        if (status === "present") present++;
        else if (status === "absent") absent++;
      });
      return { present, absent };
    });
  }, [shiftBlocks, sortedEmployees, biWeekDays]);

  // Summary: count present days per employee in the biweek
  const employeePresentDays = useMemo(() => {
    const map: Record<string, number> = {};
    sortedEmployees.forEach((emp) => {
      map[emp.id] = biWeekDays.filter((day) => {
        const shifts = getShiftsForCell(emp.id, day);
        return getAttendanceStatus(shifts) === "present";
      }).length;
    });
    return map;
  }, [shiftBlocks, sortedEmployees, biWeekDays]);

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-3">
        <UnifiedCalendarHeader
          viewMode="biweek"
          selectedDate={currentWeek}
          onDateChange={setCurrentWeek}
          canEdit={canEdit}
          employeeCount={sortedEmployees.length}
          dayCount={14}
        />

        {employees.length === 0 ? (
          <WeekEmptyState
            currentWeek={currentWeek}
            onPreviousWeek={goToPreviousBiWeek}
            onNextWeek={goToNextBiWeek}
            onWeekChange={(date) =>
              setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }))
            }
            weekDays={biWeekDays.slice(0, 7)}
          />
        ) : (
          <Card className="overflow-hidden relative flex-1 min-h-0 flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full min-w-[1350px] border-collapse h-full">
                <thead>
                  {/* Day header */}
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 bg-muted/50 z-10 py-2 px-1 text-left text-xs font-medium w-[90px] min-w-[90px] max-w-[90px] border-r">
                      <div className="flex flex-col items-start gap-1">
                        <div className="text-[7px] text-muted-foreground/60 font-medium">
                          S.{week1Number} – S.{week2Number}
                        </div>
                        <span className="text-[8px] sm:text-[9px]">
                          Personas / Día
                        </span>
                      </div>
                    </th>
                    {biWeekDays.map((day, index) => {
                      const isToday = isSameDay(day, new Date());
                      const isWeekend =
                        day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <th
                          key={format(day, "yyyy-MM-dd")}
                          className={cn(
                            "py-1 px-0.5 text-center text-[9px] sm:text-[10px] font-medium w-[90px] min-w-[90px]",
                            isToday && "bg-primary/10",
                            isWeekend && "bg-muted/30",
                            index === 6 && "border-r-2 border-primary/30"
                          )}
                        >
                          <div className="flex flex-col items-center gap-0">
                            <span
                              className={cn(
                                "uppercase",
                                isToday && "text-primary font-bold"
                              )}
                            >
                              {format(day, "EEE", { locale: es })}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] sm:text-xs",
                                isToday &&
                                  "bg-primary text-primary-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    {/* Summary column header */}
                    <th className="py-1 px-0.5 text-center text-[9px] font-medium w-[50px] min-w-[50px] border-l">
                      Días
                    </th>
                  </tr>

                  {/* Daily summary row */}
                  <tr className="bg-muted/20 border-b">
                    <td className="sticky left-0 bg-muted/20 z-10 py-1 px-1 border-r text-[8px] text-muted-foreground font-medium">
                      Resumen
                    </td>
                    {daySummary.map((summary, index) => {
                      const day = biWeekDays[index];
                      return (
                        <td
                          key={format(day, "yyyy-MM-dd")}
                          className={cn(
                            "py-0.5 text-center text-[8px]",
                            index === 6 && "border-r-2 border-primary/30"
                          )}
                        >
                          <div className="flex flex-col items-center gap-0">
                            <span className="text-green-600 font-medium">
                              {summary.present}✓
                            </span>
                            <span className="text-red-500 font-medium">
                              {summary.absent}✗
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="border-l" />
                  </tr>
                </thead>

                <tbody>
                  {sortedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b hover:bg-muted/20"
                    >
                      {/* Employee column */}
                      <td className="sticky left-0 bg-background z-10 py-1 px-1 border-r w-[90px] min-w-[90px] max-w-[90px]">
                        <div
                          className="text-[10px] sm:text-[11px] font-medium text-foreground truncate cursor-pointer hover:text-primary"
                          onClick={() =>
                            navigate(
                              `/colaboradores/${employee.id}/profile`
                            )
                          }
                        >
                          {employee.name}
                        </div>
                      </td>

                      {/* Attendance cells */}
                      {biWeekDays.map((day, index) => {
                        const shifts = getShiftsForCell(employee.id, day);
                        const status = getAttendanceStatus(shifts);
                        const isToday = isSameDay(day, new Date());
                        const shiftNames = shifts.map((s) => s.name || "Turno").filter(Boolean);

                        return (
                          <td
                            key={format(day, "yyyy-MM-dd")}
                            className={cn(
                              "p-0 text-center w-[90px] min-w-[90px] min-h-[38px]",
                              isToday && "ring-1 ring-inset ring-primary/20",
                              index === 6 && "border-r-2 border-primary/30"
                            )}
                          >
                            <AttendanceCell
                              status={status}
                              shiftNames={shiftNames}
                            />
                          </td>
                        );
                      })}

                      {/* Employee summary: days present */}
                      <td className="py-1 px-1 text-center text-[9px] font-medium border-l text-green-600">
                        {employeePresentDays[employee.id] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
