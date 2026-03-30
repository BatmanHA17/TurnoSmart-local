import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart3,
  Users,
  CalendarCheck,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useProductivityMetrics, DateRange } from "@/hooks/useProductivityMetrics";
import { MetricCard } from "@/components/productivity/MetricCard";
import { ShiftBarChart } from "@/components/productivity/ShiftBarChart";
import { ShiftTypeDonut } from "@/components/productivity/ShiftTypeDonut";
import { EmployeeHoursTable, EmployeeRow } from "@/components/productivity/EmployeeHoursTable";

// ---- Period helpers ----
type PeriodKey = "this_week" | "last_week" | "this_month" | "last_month" | "custom";

function periodToRange(period: PeriodKey, customStart: string, customEnd: string): DateRange {
  const today = new Date();
  switch (period) {
    case "this_week":
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "last_week": {
      const lw = subWeeks(today, 1);
      return {
        start: format(startOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(lw, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    case "this_month":
      return {
        start: format(startOfMonth(today), "yyyy-MM-dd"),
        end: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    case "last_month": {
      const lm = subMonths(today, 1);
      return {
        start: format(startOfMonth(lm), "yyyy-MM-dd"),
        end: format(endOfMonth(lm), "yyyy-MM-dd"),
      };
    }
    default:
      return { start: customStart, end: customEnd };
  }
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  this_week: "Esta semana",
  last_week: "Semana pasada",
  this_month: "Este mes",
  last_month: "Mes anterior",
  custom: "Personalizado",
};

// ---- Component ----
export default function Productividad() {
  const { org, loading: orgLoading } = useCurrentOrganization();
  const { isManager, loading: roleLoading } = useUserRoleCanonical();

  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [customStart, setCustomStart] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [customEnd, setCustomEnd] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const dateRange = useMemo(
    () => periodToRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const orgId = org?.id ?? null;
  const { metrics, loading, exportCSV } = useProductivityMetrics(orgId, dateRange);

  useEffect(() => {
    document.title = "Productividad – TurnoSmart";
  }, []);

  // Access control
  if (!orgLoading && !roleLoading && !isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Derived data for charts ---

  // Bar chart: turnos por día (last 14 or all days in range)
  const barChartData = useMemo(() => {
    const entries = Object.entries(metrics.shiftsPerDay).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, value]) => ({
      label: format(new Date(date + "T00:00:00"), "dd/MM", { locale: es }),
      value,
      max: Math.max(...Object.values(metrics.shiftsPerDay), 1),
    }));
  }, [metrics.shiftsPerDay]);

  // Table: employee rows from topEmployeesByHours
  const employeeRows: EmployeeRow[] = useMemo(() => {
    return metrics.topEmployeesByHours.map((e) => ({
      id: e.id,
      name: e.name,
      scheduledHours: 0, // contract hours not in calendar_shifts — shows "—"
      actualHours: e.hours,
      shiftCount: metrics.shiftsPerEmployee[e.id] ?? 0,
      absenceCount: 0,   // absence count needs separate query; omitted here
    }));
  }, [metrics.topEmployeesByHours, metrics.shiftsPerEmployee]);

  // Active employees count
  const activeEmployees = Object.keys(metrics.shiftsPerEmployee).length;

  // Avg hours per employee
  const totalHours = metrics.topEmployeesByHours.reduce((s, e) => s + e.hours, 0);
  const avgHours = activeEmployees > 0 ? totalHours / activeEmployees : 0;

  // Export all CSV (reuses hook)
  const handleExportAll = () => {
    exportCSV();
  };

  // Export single employee row as CSV
  const handleExportRow = (employeeId: string) => {
    const emp = employeeRows.find((e) => e.id === employeeId);
    if (!emp) return;
    const headers = ["Empleado", "Turnos", "Horas", "Ausencias"];
    const row = [emp.name, emp.shiftCount, emp.actualHours.toFixed(2), emp.absenceCount].join(",");
    const csv = [headers.join(","), row].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empleado_${emp.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoadingAll = orgLoading || roleLoading || loading;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Dashboard de Productividad
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Métricas del equipo — {org?.name ?? ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={isLoadingAll || metrics.totalShifts === 0}
            className="gap-2 self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Period selector */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2 items-center">
              {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
              {period === "custom" && (
                <div className="flex items-center gap-2 ml-2">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 w-36 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">→</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 w-36 text-sm"
                  />
                </div>
              )}
              <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                {dateRange.start} → {dateRange.end}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton / empty state */}
        {isLoadingAll ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 h-24 animate-pulse bg-muted rounded-lg" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Metric cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Turnos"
                value={metrics.totalShifts.toLocaleString("es")}
                subtitle={`${dateRange.start} → ${dateRange.end}`}
                icon={CalendarCheck}
              />
              <MetricCard
                title="Empleados Activos"
                value={activeEmployees}
                subtitle="con al menos 1 turno"
                icon={Users}
              />
              <MetricCard
                title="Tasa de Ausencias"
                value={`${metrics.absenceRate.toFixed(1)}%`}
                subtitle="del total de registros"
                icon={AlertCircle}
                trend={
                  metrics.absenceRate > 0
                    ? { value: metrics.absenceRate, positive: metrics.absenceRate < 10 }
                    : undefined
                }
              />
              <MetricCard
                title="Media Horas/Empleado"
                value={`${avgHours.toFixed(1)}h`}
                subtitle="turnos trabajados"
                icon={Clock}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Turnos por día</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {barChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Sin turnos en el período seleccionado
                    </p>
                  ) : (
                    <ShiftBarChart data={barChartData} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribución de tipos de turno</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ShiftTypeDonut data={metrics.shiftTypeDistribution} />
                </CardContent>
              </Card>
            </div>

            {/* Weekly trend */}
            {metrics.weeklyTrend.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tendencia semanal</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ShiftBarChart
                    data={metrics.weeklyTrend.map((w) => ({
                      label: w.week,
                      value: w.shifts,
                      max: Math.max(...metrics.weeklyTrend.map((x) => x.shifts), 1),
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {/* Employee table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Horas por empleado (Top {employeeRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmployeeHoursTable
                  employees={employeeRows}
                  onExportRow={handleExportRow}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
