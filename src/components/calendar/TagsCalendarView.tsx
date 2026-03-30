import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  absenceCode?: string;
}

interface TagChipProps {
  shift: ShiftBlock;
}

function getTagFromShift(shift: ShiftBlock): { code: string; className: string } {
  if (shift.type === "absence") {
    const code = shift.absenceCode
      ? shift.absenceCode.substring(0, 2).toUpperCase()
      : "A";
    return { code, className: "bg-red-100 text-red-700 border-red-200" };
  }

  const name = (shift.name || "").toLowerCase();

  if (name.includes("mañana") || name.includes("morning") || name.includes("m ") || name === "m") {
    return { code: "M", className: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  if (name.includes("tarde") || name.includes("afternoon") || name.includes("t ") || name === "t") {
    return { code: "T", className: "bg-orange-100 text-orange-700 border-orange-200" };
  }
  if (name.includes("noche") || name.includes("night") || name.includes("n ") || name === "n") {
    return { code: "N", className: "bg-purple-100 text-purple-700 border-purple-200" };
  }
  if (name.includes("vac") || name.includes("libre")) {
    return { code: "V", className: "bg-green-100 text-green-700 border-green-200" };
  }

  // Generic: use first 2 chars of shift name or color-derived tag
  const code = shift.name ? shift.name.substring(0, 2).toUpperCase() : "?";
  return { code, className: "bg-gray-100 text-gray-700 border-gray-200" };
}

function TagChip({ shift }: TagChipProps) {
  const { code, className } = getTagFromShift(shift);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full border text-[9px] font-semibold leading-none select-none cursor-default",
            "px-1.5 py-0.5 min-w-[20px] h-[16px]",
            className
          )}
        >
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[9px]">
        {shift.name || "Turno"}
        {shift.startTime && shift.endTime
          ? ` · ${shift.startTime}–${shift.endTime}`
          : ""}
      </TooltipContent>
    </Tooltip>
  );
}

export function TagsCalendarView() {
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
          absenceCode: isAbsence ? shift.shift_name : undefined,
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
                  </tr>
                </thead>

                <tbody>
                  {sortedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b hover:bg-muted/20"
                    >
                      {/* Employee name column */}
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

                      {/* Tag cells */}
                      {biWeekDays.map((day, index) => {
                        const shifts = getShiftsForCell(employee.id, day);
                        const isToday = isSameDay(day, new Date());

                        return (
                          <td
                            key={format(day, "yyyy-MM-dd")}
                            className={cn(
                              "p-0.5 text-center align-middle min-h-[38px] w-[90px] min-w-[90px]",
                              isToday && "bg-primary/5",
                              index === 6 && "border-r-2 border-primary/30"
                            )}
                          >
                            {shifts.length > 0 ? (
                              <div className="flex flex-wrap gap-0.5 justify-center items-center py-1">
                                {shifts.map((shift) => (
                                  <TagChip key={shift.id} shift={shift} />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/40">
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
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
