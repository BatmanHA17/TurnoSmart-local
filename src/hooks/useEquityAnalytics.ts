import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────
export interface EquityEmployee {
  id: string;
  name: string;
  role: string;
  fechaInicio: string | null;
  morningCount: number;
  afternoonCount: number;
  nightCount: number;
  weekendWorkedCount: number;
  dbBalance: number;
  dgBalance: number;
  nightCoverageCount: number;
  vacationDaysUsed: number;
}

export interface NightCoverageEntry {
  employeeId: string;
  employeeName: string;
  coverageCount: number;
  lastCoverageDate: string | null;
}

export interface MonthlyTrend {
  month: string; // "2026-01"
  label: string; // "Ene 2026"
  morning: number;
  afternoon: number;
  night: number;
}

export interface EquityAnalyticsData {
  loading: boolean;
  error: string | null;
  employees: EquityEmployee[];
  nightCoverage: NightCoverageEntry[];
  monthlyTrends: MonthlyTrend[];
  // Computed KPIs
  equityStatus: "green" | "amber" | "red";
  maxMtnDeviation: number;
  nextNightRotation: string | null;
  lowestVacationEmployee: string | null;
  lowestVacationRatio: number;
  totalPendingDB: number;
  totalPendingDG: number;
}

// ─── Hook ───────────────────────────────────────────────────────────────
export function useEquityAnalytics(orgId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawEquity, setRawEquity] = useState<any[]>([]);
  const [rawColaboradores, setRawColaboradores] = useState<any[]>([]);
  const [rawShifts, setRawShifts] = useState<any[]>([]);

  // Fetch data
  useEffect(() => {
    if (!orgId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch colaboradores
        const { data: colabs, error: colabErr } = await supabase
          .from("colaboradores")
          .select("id, nombre, apellidos, fecha_inicio_contrato, engine_role, department, status")
          .eq("org_id", orgId)
          .in("status", ["activo", "active"]);

        if (colabErr) throw colabErr;
        setRawColaboradores(colabs || []);

        // 2. Fetch equity data (all periods)
        const { data: equity, error: eqErr } = await supabase
          .from("employee_equity")
          .select("*")
          .eq("organization_id", orgId)
          .order("period_end", { ascending: false });

        if (eqErr) throw eqErr;
        setRawEquity(equity || []);

        // 3. Fetch calendar_shifts for monthly breakdown (last 6 months)
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 6));
        const { data: shifts, error: shiftErr } = await supabase
          .from("calendar_shifts")
          .select("id, employee_id, date, shift_name, start_time, end_time")
          .eq("org_id", orgId)
          .gte("date", format(sixMonthsAgo, "yyyy-MM-dd"))
          .lte("date", format(endOfMonth(new Date()), "yyyy-MM-dd"));

        if (shiftErr) throw shiftErr;
        setRawShifts(shifts || []);
      } catch (err) {
        console.error("Error fetching equity analytics:", err);
        setError("Error al cargar datos de equidad");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [orgId]);

  // Build employee map (excluding Night Agent)
  const colaboradorMap = useMemo(() => {
    const map = new Map<string, { name: string; role: string; fechaInicio: string | null }>();
    for (const c of rawColaboradores) {
      const name = `${c.nombre || ""}${c.apellidos ? " " + c.apellidos : ""}`.trim() || "Sin nombre";
      const role = (c.engine_role || "").toUpperCase();
      map.set(c.id, { name, role, fechaInicio: c.fecha_inicio_contrato });
    }
    return map;
  }, [rawColaboradores]);

  // Filter out NIGHT_SHIFT_AGENT ids
  const nightAgentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, info] of colaboradorMap) {
      if (info.role === "NIGHT_SHIFT_AGENT") ids.add(id);
    }
    return ids;
  }, [colaboradorMap]);

  // Aggregate equity per employee (latest period)
  const employees = useMemo((): EquityEmployee[] => {
    const latestByEmp = new Map<string, any>();
    for (const eq of rawEquity) {
      if (!latestByEmp.has(eq.employee_id)) {
        latestByEmp.set(eq.employee_id, eq);
      }
    }

    // Also compute vacation days from shifts
    const vacDays = new Map<string, number>();
    for (const s of rawShifts) {
      const sn = (s.shift_name || "").toUpperCase();
      if (sn === "V" || sn.startsWith("V ") || sn.includes("VACACION")) {
        vacDays.set(s.employee_id, (vacDays.get(s.employee_id) || 0) + 1);
      }
    }

    const result: EquityEmployee[] = [];
    for (const [empId, info] of colaboradorMap) {
      const eq = latestByEmp.get(empId);
      result.push({
        id: empId,
        name: info.name,
        role: info.role,
        fechaInicio: info.fechaInicio,
        morningCount: eq?.morning_count ?? 0,
        afternoonCount: eq?.afternoon_count ?? 0,
        nightCount: eq?.night_count ?? 0,
        weekendWorkedCount: eq?.weekend_worked_count ?? 0,
        dbBalance: eq?.db_balance ?? 0,
        dgBalance: eq?.dg_balance ?? 0,
        nightCoverageCount: eq?.night_coverage_count ?? 0,
        vacationDaysUsed: vacDays.get(empId) || 0,
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [colaboradorMap, rawEquity, rawShifts]);

  // Night coverage: who covered night agent rest, sorted ascending
  const nightCoverage = useMemo((): NightCoverageEntry[] => {
    const coverMap = new Map<string, { count: number; lastDate: string | null }>();

    for (const s of rawShifts) {
      if (nightAgentIds.has(s.employee_id)) continue;
      const sn = (s.shift_name || "").toUpperCase();
      if (sn === "N" || sn.startsWith("N ") || sn === "NOCHE") {
        const existing = coverMap.get(s.employee_id) || { count: 0, lastDate: null };
        existing.count += 1;
        if (!existing.lastDate || s.date > existing.lastDate) {
          existing.lastDate = s.date;
        }
        coverMap.set(s.employee_id, existing);
      }
    }

    const entries: NightCoverageEntry[] = [];
    for (const [empId, data] of coverMap) {
      const info = colaboradorMap.get(empId);
      if (!info || info.role === "NIGHT_SHIFT_AGENT") continue;
      entries.push({
        employeeId: empId,
        employeeName: info.name,
        coverageCount: data.count,
        lastCoverageDate: data.lastDate,
      });
    }

    return entries.sort((a, b) => a.coverageCount - b.coverageCount);
  }, [rawShifts, nightAgentIds, colaboradorMap]);

  // Monthly trends (last 6 months, team totals)
  const monthlyTrends = useMemo((): MonthlyTrend[] => {
    const monthMap = new Map<string, { morning: number; afternoon: number; night: number }>();
    const MONTH_LABELS: Record<number, string> = {
      0: "Ene", 1: "Feb", 2: "Mar", 3: "Abr", 4: "May", 5: "Jun",
      6: "Jul", 7: "Ago", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dic",
    };

    for (const s of rawShifts) {
      if (nightAgentIds.has(s.employee_id)) continue;
      const sn = (s.shift_name || "").toUpperCase();
      const monthKey = s.date?.substring(0, 7); // "2026-01"
      if (!monthKey) continue;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { morning: 0, afternoon: 0, night: 0 });
      }
      const entry = monthMap.get(monthKey)!;

      if (sn === "M" || sn.startsWith("M ") || sn === "MANANA" || sn === "MAÑANA") {
        entry.morning += 1;
      } else if (sn === "T" || sn.startsWith("T ") || sn === "TARDE") {
        entry.afternoon += 1;
      } else if (sn === "N" || sn.startsWith("N ") || sn === "NOCHE") {
        entry.night += 1;
      }
    }

    const sorted = Array.from(monthMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([key, data]) => {
      const [y, m] = key.split("-").map(Number);
      return {
        month: key,
        label: `${MONTH_LABELS[m - 1]} ${y}`,
        ...data,
      };
    });
  }, [rawShifts, nightAgentIds]);

  // ─── Computed KPIs ──────────────────────────────────────────────────
  const equityKpis = useMemo(() => {
    const nonNight = employees.filter((e) => e.role !== "NIGHT_SHIFT_AGENT");

    // M/T/N deviation
    let maxDeviation = 0;
    if (nonNight.length > 1) {
      const mornings = nonNight.map((e) => e.morningCount);
      const afternoons = nonNight.map((e) => e.afternoonCount);
      const nights = nonNight.map((e) => e.nightCount);

      const spread = (arr: number[]) => Math.max(...arr) - Math.min(...arr);
      maxDeviation = Math.max(spread(mornings), spread(afternoons), spread(nights));
    }

    let equityStatus: "green" | "amber" | "red" = "green";
    if (maxDeviation > 5) equityStatus = "red";
    else if (maxDeviation > 3) equityStatus = "amber";

    // Next night rotation
    const nextNightRotation = nightCoverage.length > 0 ? nightCoverage[0].employeeName : null;

    // Lowest vacation ratio
    let lowestVacationEmployee: string | null = null;
    let lowestVacationRatio = 1;
    for (const e of nonNight) {
      const ratio = e.vacationDaysUsed / 30;
      if (ratio < lowestVacationRatio) {
        lowestVacationRatio = ratio;
        lowestVacationEmployee = e.name;
      }
    }

    // Total pending DB/DG
    const totalPendingDB = nonNight.reduce((sum, e) => sum + e.dbBalance, 0);
    const totalPendingDG = nonNight.reduce((sum, e) => sum + e.dgBalance, 0);

    return {
      equityStatus,
      maxMtnDeviation: maxDeviation,
      nextNightRotation,
      lowestVacationEmployee,
      lowestVacationRatio,
      totalPendingDB,
      totalPendingDG,
    };
  }, [employees, nightCoverage]);

  return {
    loading,
    error,
    employees,
    nightCoverage,
    monthlyTrends,
    ...equityKpis,
  };
}
