import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import {
  ShiftForAnalytics,
  WeekdayDistribution,
  WeekendComparison,
  AbsenceByType,
  ShiftTimeDistribution,
  calculateWeekdayDistribution,
  calculateWeekendComparison,
  calculateAbsencesByType,
  calculateShiftTimeDistribution,
  calculateEmployeeAbsences,
} from "@/utils/shiftAnalytics";

interface AbsenceRequest {
  id: string;
  colaborador_id: string;
  employee_name: string;
  leave_type: string;
  status: string;
  submitted_date: string;
}

interface EmployeeRequestStats {
  employeeId: string;
  employeeName: string;
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface AnalyticsDateParams {
  mode: 'relative' | 'specific';
  monthsBack?: number;
  specificMonth?: number; // 0-11
  specificYear?: number;
}

export function useShiftAnalytics(params: AnalyticsDateParams | number = { mode: 'relative', monthsBack: 3 }) {
  // Support legacy number parameter for backwards compatibility
  const normalizedParams: AnalyticsDateParams = typeof params === 'number' 
    ? { mode: 'relative', monthsBack: params }
    : params;

  const { org: currentOrg } = useCurrentOrganization();
  const [shifts, setShifts] = useState<ShiftForAnalytics[]>([]);
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (normalizedParams.mode === 'specific' && 
        normalizedParams.specificMonth !== undefined && 
        normalizedParams.specificYear !== undefined) {
      // Specific month mode: from 1st to last day of that month
      const targetDate = new Date(normalizedParams.specificYear, normalizedParams.specificMonth, 1);
      return {
        startDate: startOfMonth(targetDate),
        endDate: endOfMonth(targetDate)
      };
    } else {
      // Relative mode (current behavior)
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(new Date(), normalizedParams.monthsBack || 3));
      return { startDate, endDate };
    }
  }, [normalizedParams.mode, normalizedParams.monthsBack, normalizedParams.specificMonth, normalizedParams.specificYear]);

  useEffect(() => {
    if (!currentOrg?.org_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { startDate, endDate } = dateRange;

        // Fetch shifts
        const { data: shiftsData, error: shiftsError } = await supabase
          .from("calendar_shifts")
          .select(`
            id,
            employee_id,
            date,
            start_time,
            end_time,
            shift_name,
            notes,
            colaboradores!inner(nombre, apellidos)
          `)
          .eq("org_id", currentOrg.org_id)
          .gte("date", format(startDate, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"));

        if (shiftsError) throw shiftsError;

        const formattedShifts: ShiftForAnalytics[] = (shiftsData || []).map((s: any) => ({
          id: s.id,
          employeeId: s.employee_id,
          employeeName: `${s.colaboradores?.nombre || ""} ${s.colaboradores?.apellidos || ""}`.trim(),
          date: s.date,
          startTime: s.start_time,
          endTime: s.end_time,
          shiftName: s.shift_name,
          absenceCode: extractAbsenceCode(s.shift_name),
        }));

        setShifts(formattedShifts);

        // Fetch absence requests (tabla puede no existir en cloud aún)
        try {
          const { data: requestsData, error: requestsError } = await supabase
            .from("absence_requests")
            .select("id, colaborador_id, employee_name, leave_type, status, submitted_date")
            .eq("org_id", currentOrg.org_id)
            .gte("submitted_date", format(startDate, "yyyy-MM-dd"))
            .lte("submitted_date", format(endDate, "yyyy-MM-dd"));

          if (!requestsError) {
            setAbsenceRequests(requestsData || []);
          } else {
            console.warn("absence_requests table not available:", requestsError.message);
            setAbsenceRequests([]);
          }
        } catch {
          // Table doesn't exist yet in production — graceful degradation
          setAbsenceRequests([]);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Error al cargar datos de analítica");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentOrg?.org_id, dateRange]);

  const weekdayDistribution = useMemo(() => calculateWeekdayDistribution(shifts), [shifts]);
  const weekendComparison = useMemo(() => calculateWeekendComparison(shifts), [shifts]);
  const absencesByType = useMemo(() => calculateAbsencesByType(shifts), [shifts]);
  const shiftTimeDistribution = useMemo(() => calculateShiftTimeDistribution(shifts), [shifts]);
  const employeeAbsences = useMemo(() => calculateEmployeeAbsences(shifts), [shifts]);

  const requestStats = useMemo((): EmployeeRequestStats[] => {
    const statsMap = new Map<string, EmployeeRequestStats>();

    absenceRequests.forEach((req) => {
      if (!statsMap.has(req.colaborador_id)) {
        statsMap.set(req.colaborador_id, {
          employeeId: req.colaborador_id,
          employeeName: req.employee_name,
          totalRequests: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        });
      }

      const stat = statsMap.get(req.colaborador_id)!;
      stat.totalRequests++;
      if (req.status === "approved") stat.approved++;
      else if (req.status === "pending") stat.pending++;
      else if (req.status === "rejected") stat.rejected++;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalRequests - a.totalRequests);
  }, [absenceRequests]);

  return {
    loading,
    error,
    dateRange,
    shifts,
    weekdayDistribution,
    weekendComparison,
    absencesByType,
    shiftTimeDistribution,
    employeeAbsences,
    requestStats,
  };
}

function extractAbsenceCode(shiftName: string): string | null {
  const upperName = shiftName?.toUpperCase() || "";
  const codes = ["V", "E", "P", "F", "H", "S", "C", "D", "X", "XB"];
  for (const code of codes) {
    if (upperName === code || upperName.startsWith(code + " ")) {
      return code;
    }
  }
  if (upperName.includes("LIBRE") || upperName.includes("DESCANSO") || upperName === "D") return "D";
  if (upperName.includes("VACACION")) return "V";
  if (upperName.includes("ENFERM")) return "E";
  return null;
}
