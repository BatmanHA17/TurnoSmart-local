import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfWeek, getISOWeek } from "date-fns";

export interface DateRange {
  start: string; // yyyy-MM-dd
  end: string;   // yyyy-MM-dd
}

export interface TopEmployee {
  id: string;
  name: string;
  hours: number;
}

export interface WeeklyTrendEntry {
  week: string;
  shifts: number;
  absences: number;
}

export interface ProductivityMetrics {
  totalShifts: number;
  shiftsPerEmployee: Record<string, number>;
  shiftsPerDay: Record<string, number>;
  coverageByDay: Record<string, number>;
  absenceRate: number;
  topEmployeesByHours: TopEmployee[];
  shiftTypeDistribution: Record<string, number>;
  weeklyTrend: WeeklyTrendEntry[];
}

interface RawShift {
  id: string;
  employee_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  shift_name: string;
  colaboradores: {
    nombre: string;
    apellidos: string;
  } | null;
}

const ABSENCE_CODES = new Set(["V", "E", "P", "F", "H", "S", "C", "D", "X", "XB"]);

function isAbsenceShift(shiftName: string): boolean {
  const upper = (shiftName || "").toUpperCase().trim();
  if (ABSENCE_CODES.has(upper)) return true;
  if (upper.includes("LIBRE") || upper.includes("DESCANSO") || upper.includes("VACACION") || upper.includes("ENFERM")) return true;
  return false;
}

function calcHours(startTime: string | null, endTime: string | null): number {
  if (!startTime || !endTime) return 8; // default fallback
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60; // overnight
  return Math.max(0, (end - start) / 60);
}

function weekKey(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    return `W${getISOWeek(d)} ${format(weekStart, "dd/MM")}`;
  } catch {
    return dateStr.slice(0, 7);
  }
}

export function useProductivityMetrics(orgId: string | null | undefined, dateRange: DateRange) {
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    totalShifts: 0,
    shiftsPerEmployee: {},
    shiftsPerDay: {},
    coverageByDay: {},
    absenceRate: 0,
    topEmployeesByHours: [],
    shiftTypeDistribution: {},
    weeklyTrend: [],
  });
  const [loading, setLoading] = useState(false);
  const [rawShifts, setRawShifts] = useState<RawShift[]>([]);

  useEffect(() => {
    if (!orgId || !dateRange.start || !dateRange.end) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("calendar_shifts")
          .select(`
            id,
            employee_id,
            date,
            start_time,
            end_time,
            shift_name,
            colaboradores(nombre, apellidos)
          `)
          .eq("org_id", orgId)
          .gte("date", dateRange.start)
          .lte("date", dateRange.end)
          .order("date", { ascending: true });

        if (error) throw error;

        const shifts: RawShift[] = (data || []).map((s: any) => ({
          id: s.id,
          employee_id: s.employee_id,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          shift_name: s.shift_name ?? "",
          colaboradores: s.colaboradores ?? null,
        }));

        setRawShifts(shifts);

        // --- Compute metrics ---
        const shiftsPerEmployee: Record<string, number> = {};
        const shiftsPerDay: Record<string, number> = {};
        const coverageByDay: Record<string, Set<string>> = {};
        const hoursPerEmployee: Record<string, { id: string; name: string; hours: number }> = {};
        const shiftTypeDistribution: Record<string, number> = {};
        const weeklyTrendMap: Record<string, { shifts: number; absences: number }> = {};

        let absenceCount = 0;

        for (const s of shifts) {
          const name = `${s.colaboradores?.nombre ?? ""} ${s.colaboradores?.apellidos ?? ""}`.trim() || s.employee_id;
          const isAbsence = isAbsenceShift(s.shift_name);
          const hours = isAbsence ? 0 : calcHours(s.start_time, s.end_time);
          const shiftType = s.shift_name ? s.shift_name.toUpperCase().trim() : "SIN NOMBRE";
          const wk = weekKey(s.date);

          // shifts per employee
          shiftsPerEmployee[s.employee_id] = (shiftsPerEmployee[s.employee_id] ?? 0) + 1;

          // shifts per day
          shiftsPerDay[s.date] = (shiftsPerDay[s.date] ?? 0) + 1;

          // coverage by day (unique employees per day)
          if (!coverageByDay[s.date]) coverageByDay[s.date] = new Set();
          coverageByDay[s.date].add(s.employee_id);

          // hours per employee
          if (!hoursPerEmployee[s.employee_id]) {
            hoursPerEmployee[s.employee_id] = { id: s.employee_id, name, hours: 0 };
          }
          hoursPerEmployee[s.employee_id].hours += hours;

          // shift type distribution
          shiftTypeDistribution[shiftType] = (shiftTypeDistribution[shiftType] ?? 0) + 1;

          // weekly trend
          if (!weeklyTrendMap[wk]) weeklyTrendMap[wk] = { shifts: 0, absences: 0 };
          weeklyTrendMap[wk].shifts++;
          if (isAbsence) {
            weeklyTrendMap[wk].absences++;
            absenceCount++;
          }
        }

        // Convert coverageByDay sets → counts
        const coverageByDayCount: Record<string, number> = {};
        for (const [day, empSet] of Object.entries(coverageByDay)) {
          coverageByDayCount[day] = empSet.size;
        }

        // Top 10 employees by hours
        const topEmployeesByHours = Object.values(hoursPerEmployee)
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 10);

        // Weekly trend sorted
        const weeklyTrend: WeeklyTrendEntry[] = Object.entries(weeklyTrendMap)
          .map(([week, v]) => ({ week, ...v }));

        const absenceRate = shifts.length > 0 ? (absenceCount / shifts.length) * 100 : 0;

        setMetrics({
          totalShifts: shifts.length,
          shiftsPerEmployee,
          shiftsPerDay,
          coverageByDay: coverageByDayCount,
          absenceRate,
          topEmployeesByHours,
          shiftTypeDistribution,
          weeklyTrend,
        });
      } catch (err) {
        console.error("useProductivityMetrics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId, dateRange.start, dateRange.end]);

  const exportCSV = useCallback(() => {
    if (rawShifts.length === 0) return;

    const headers = ["ID", "Empleado", "Fecha", "Hora Inicio", "Hora Fin", "Tipo Turno", "Horas", "Es Ausencia"];
    const rows = rawShifts.map((s) => {
      const name = `${s.colaboradores?.nombre ?? ""} ${s.colaboradores?.apellidos ?? ""}`.trim();
      const isAbsence = isAbsenceShift(s.shift_name);
      const hours = isAbsence ? 0 : calcHours(s.start_time, s.end_time);
      return [
        s.id,
        name,
        s.date,
        s.start_time ?? "",
        s.end_time ?? "",
        s.shift_name ?? "",
        hours.toFixed(2),
        isAbsence ? "Sí" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productividad_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rawShifts, dateRange]);

  return { metrics, loading, exportCSV };
}
