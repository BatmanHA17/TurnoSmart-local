import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useEquityAnalytics } from "@/hooks/useEquityAnalytics";
import { AnalyticsDateSelector } from "./AnalyticsDateSelector";
import {
  BarChart3,
  Scale,
  Moon,
  Palmtree,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Color palette ──────────────────────────────────────────────────────
const COLORS = {
  morning: "#eab308",   // yellow-500
  afternoon: "#f97316", // orange-500
  night: "#6366f1",     // indigo-500
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  muted: "#94a3b8",
};

// ─── Main Component ─────────────────────────────────────────────────────
export function EquityAnalyticsDashboard() {
  const { org: currentOrg } = useCurrentOrganization();
  const [dateMode, setDateMode] = useState<"relative" | "specific">("relative");
  const [monthsBack, setMonthsBack] = useState(3);
  const [specificMonth, setSpecificMonth] = useState(new Date().getMonth());
  const [specificYear, setSpecificYear] = useState(new Date().getFullYear());

  const analytics = useEquityAnalytics(currentOrg?.org_id);

  const handleSpecificChange = (month: number, year: number) => {
    setSpecificMonth(month);
    setSpecificYear(year);
  };

  if (analytics.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando equidad...</span>
      </div>
    );
  }

  const nonNightEmployees = analytics.employees.filter(
    (e) => e.role !== "NIGHT_SHIFT_AGENT"
  );

  // ── Data for grouped bar chart (Row 2) ──
  const equityBarData = nonNightEmployees.map((e) => ({
    name: e.name.split(" ")[0], // first name for brevity
    fullName: e.name,
    M: e.morningCount,
    T: e.afternoonCount,
    N: e.nightCount,
  }));

  // ── Data for FDS bar chart (Row 3 right) ──
  const fdsData = nonNightEmployees.map((e) => ({
    name: e.name.split(" ")[0],
    fullName: e.name,
    fds: e.weekendWorkedCount,
  }));
  const maxFds = Math.max(...fdsData.map((d) => d.fds), 1);
  const minFds = Math.min(...fdsData.map((d) => d.fds));

  // ── Status dot color ──
  const statusColor = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Equidad y Balance HR</h2>
            <p className="text-xs text-muted-foreground">
              Visión global de fairness, rotación nocturna y saldos
            </p>
          </div>
        </div>
        <AnalyticsDateSelector
          mode={dateMode}
          monthsBack={monthsBack}
          specificMonth={specificMonth}
          specificYear={specificYear}
          onModeChange={setDateMode}
          onRelativeChange={setMonthsBack}
          onSpecificChange={handleSpecificChange}
        />
      </div>

      {analytics.error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-2">
            <p className="text-xs text-destructive">{analytics.error}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Row 1: KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Card 1: Equidad M/T/N */}
        <Card className="bg-muted/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Equidad M/T/N
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${statusColor[analytics.equityStatus]}`}
              />
              <span className="text-lg font-bold">
                {analytics.maxMtnDeviation === 0 ? "Perfecta" : `\u00b1${analytics.maxMtnDeviation}`}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {analytics.equityStatus === "green"
                ? "Desviacion aceptable"
                : analytics.equityStatus === "amber"
                ? "Revisar balance"
                : "Desequilibrio alto"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Noches rotacion */}
        <Card className="bg-muted/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Noches rotacion
              </span>
            </div>
            <span className="text-lg font-bold">
              {analytics.nextNightRotation ?? "N/A"}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Siguiente en rotacion nocturna
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Vacaciones pendientes */}
        <Card className="bg-muted/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Palmtree className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Vacaciones pendientes
              </span>
            </div>
            <span className="text-lg font-bold">
              {analytics.lowestVacationEmployee
                ? analytics.lowestVacationEmployee.split(" ")[0]
                : "N/A"}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Menor ratio V: {Math.round(analytics.lowestVacationRatio * 100)}%
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Dias debidos */}
        <Card className="bg-muted/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Dias debidos
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-lg font-bold">{analytics.totalPendingDB}</span>
                <span className="text-[10px] text-muted-foreground ml-1">DB</span>
              </div>
              <div>
                <span className="text-lg font-bold">{analytics.totalPendingDG}</span>
                <span className="text-[10px] text-muted-foreground ml-1">DG</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Balance pendiente equipo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Equity Grouped Bar Chart ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Distribucion M/T/N por empleado (ratio mensual)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {equityBarData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Sin datos de equidad disponibles
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={equityBarData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      M: "Mananas",
                      T: "Tardes",
                      N: "Noches",
                    };
                    return [value, labels[name] || name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) => {
                    const labels: Record<string, string> = {
                      M: "Manana",
                      T: "Tarde",
                      N: "Noche",
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="M" fill={COLORS.morning} radius={[2, 2, 0, 0]} />
                <Bar dataKey="T" fill={COLORS.afternoon} radius={[2, 2, 0, 0]} />
                <Bar dataKey="N" fill={COLORS.night} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Row 3: Night Coverage Table + Weekend Bar Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: Night Coverage */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4 text-muted-foreground" />
              Cobertura Nocturna
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {analytics.nightCoverage.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin datos de cobertura nocturna
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5 font-medium">Empleado</th>
                      <th className="text-center py-1.5 font-medium">Coberturas</th>
                      <th className="text-right py-1.5 font-medium">Ultima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.nightCoverage.map((nc, i) => (
                      <tr
                        key={nc.employeeId}
                        className={`border-b last:border-0 ${i === 0 ? "bg-indigo-50 dark:bg-indigo-950/20" : ""}`}
                      >
                        <td className="py-1.5">
                          {nc.employeeName}
                          {i === 0 && (
                            <span className="ml-1.5 text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded">
                              SIGUIENTE
                            </span>
                          )}
                        </td>
                        <td className="text-center py-1.5 font-mono">
                          {nc.coverageCount}
                        </td>
                        <td className="text-right py-1.5 text-muted-foreground">
                          {nc.lastCoverageDate
                            ? format(new Date(nc.lastCoverageDate + "T00:00:00"), "d MMM", {
                                locale: es,
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Weekend Worked */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">
              Fines de Semana Trabajados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {fdsData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin datos de fines de semana
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fdsData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={70}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value: number) => [value, "FDS trabajados"]}
                  />
                  <Bar dataKey="fds" radius={[0, 4, 4, 0]}>
                    {fdsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.fds === maxFds
                            ? COLORS.red
                            : entry.fds === minFds
                            ? COLORS.green
                            : COLORS.muted
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Vacation Progress + DB/DG Balance ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: Vacation Progress */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palmtree className="h-4 w-4 text-muted-foreground" />
              Progreso Vacaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {nonNightEmployees.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin empleados
              </p>
            ) : (
              nonNightEmployees.map((e) => {
                const ratio = e.vacationDaysUsed / 30;
                const percent = Math.min(Math.round(ratio * 100), 100);
                // Expected progress: current month / 12
                const expectedRatio = (new Date().getMonth() + 1) / 12;
                let barColor = "bg-green-500";
                if (ratio < expectedRatio * 0.5) barColor = "bg-red-500";
                else if (ratio < expectedRatio * 0.8) barColor = "bg-amber-500";

                return (
                  <div key={e.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{e.name.split(" ")[0]}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {e.vacationDaysUsed}/30 dias
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: DB/DG Balance Table */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Balance DB/DG
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {nonNightEmployees.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sin empleados
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1.5 font-medium">Empleado</th>
                      <th className="text-center py-1.5 font-medium">DB</th>
                      <th className="text-center py-1.5 font-medium">DG</th>
                      <th className="text-center py-1.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonNightEmployees.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-1.5">{e.name.split(" ")[0]}</td>
                        <td className="text-center py-1.5 font-mono">
                          {e.dbBalance > 0 ? (
                            <span className="text-amber-600 font-semibold">{e.dbBalance}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-center py-1.5 font-mono">
                          {e.dgBalance > 0 ? (
                            <span className="text-amber-600 font-semibold">{e.dgBalance}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-center py-1.5 font-mono font-semibold">
                          {e.dbBalance + e.dgBalance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Monthly Trend Line Chart ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">
            Evolucion temporal M/T/N (equipo)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {analytics.monthlyTrends.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Sin datos historicos
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="morning"
                  name="Manana"
                  stroke={COLORS.morning}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="afternoon"
                  name="Tarde"
                  stroke={COLORS.afternoon}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="night"
                  name="Noche"
                  stroke={COLORS.night}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
