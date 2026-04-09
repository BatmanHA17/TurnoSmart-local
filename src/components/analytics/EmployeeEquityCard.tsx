import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Sun, Sunset, Moon, Calendar, Scale, Gift, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EquityRow {
  employee_id: string;
  morning_count: number;
  afternoon_count: number;
  night_count: number;
  weekend_worked_count: number;
  night_coverage_count: number;
  db_balance: number | null;
  dg_balance: number | null;
  period_start: string;
  period_end: string;
}

interface EmployeeEquityCardProps {
  colaboradorId: string;
}

interface EquityData {
  own: EquityRow | null;
  teamAvg: {
    morning: number;
    afternoon: number;
    night: number;
    weekends: number;
    nightCoverage: number;
  };
  teamCount: number;
  vacationDays: number;
  monthsActive: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function monthsBetween(start: string, now: Date): number {
  const d = new Date(start);
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth());
  return Math.max(months, 1);
}

function perMonth(count: number, months: number): string {
  return (count / months).toFixed(1);
}

type BalanceStatus = "balanced" | "slight" | "notable";

function getBalanceStatus(
  own: number,
  avg: number,
  months: number
): { status: BalanceStatus; diff: number } {
  const ownPM = own / months;
  const avgPM = avg / months;
  const diff = ownPM - avgPM;
  const absDiff = Math.abs(diff);
  if (absDiff <= 0.5) return { status: "balanced", diff };
  if (absDiff <= 1.5) return { status: "slight", diff };
  return { status: "notable", diff };
}

function vacationPace(now: Date): number {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const totalDays =
    (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const elapsed =
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round((elapsed / totalDays) * 30);
}

function vacationColor(taken: number, recommended: number): string {
  const ratio = taken / Math.max(recommended, 1);
  if (ratio >= 0.8 && ratio <= 1.3) return "text-green-600";
  if (ratio >= 0.5) return "text-amber-600";
  return "text-red-500";
}

function vacationBarColor(taken: number, recommended: number): string {
  const ratio = taken / Math.max(recommended, 1);
  if (ratio >= 0.8 && ratio <= 1.3) return "bg-green-500";
  if (ratio >= 0.5) return "bg-amber-500";
  return "bg-red-400";
}

// ─── Custom hook ────────────────────────────────────────────────────────────

function useEmployeeEquity(
  colaboradorId: string,
  orgId?: string
): { data: EquityData | null; loading: boolean } {
  const [data, setData] = useState<EquityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!colaboradorId || !orgId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      try {
        // 1. All equity rows for this org (latest period per employee)
        const { data: allEquity } = await supabase
          .from("employee_equity")
          .select(
            "employee_id, morning_count, afternoon_count, night_count, weekend_worked_count, night_coverage_count, db_balance, dg_balance, period_start, period_end"
          )
          .eq("organization_id", orgId)
          .order("period_end", { ascending: false });

        // Keep only the latest row per employee
        const latestByEmployee = new Map<string, EquityRow>();
        for (const row of (allEquity as EquityRow[] | null) ?? []) {
          if (!latestByEmployee.has(row.employee_id)) {
            latestByEmployee.set(row.employee_id, row);
          }
        }

        const own = latestByEmployee.get(colaboradorId) ?? null;

        // Team averages (all employees)
        const allRows = Array.from(latestByEmployee.values());
        const teamCount = allRows.length || 1;
        const teamAvg = {
          morning: allRows.reduce((s, r) => s + r.morning_count, 0) / teamCount,
          afternoon:
            allRows.reduce((s, r) => s + r.afternoon_count, 0) / teamCount,
          night: allRows.reduce((s, r) => s + r.night_count, 0) / teamCount,
          weekends:
            allRows.reduce((s, r) => s + r.weekend_worked_count, 0) / teamCount,
          nightCoverage:
            allRows.reduce((s, r) => s + r.night_coverage_count, 0) / teamCount,
        };

        // 2. Vacation days (shift_name = 'V') for this employee this year
        const yearStart = `${new Date().getFullYear()}-01-01`;
        const yearEnd = `${new Date().getFullYear()}-12-31`;
        const { count: vacationCount } = await supabase
          .from("calendar_shifts")
          .select("id", { count: "exact", head: true })
          .eq("employee_id", colaboradorId)
          .eq("org_id", orgId)
          .eq("shift_name", "V")
          .gte("date", yearStart)
          .lte("date", yearEnd);

        // 3. Months active — from colaborador fecha_inicio_contrato
        const { data: colabData } = await supabase
          .from("colaboradores" as any)
          .select("fecha_inicio_contrato")
          .eq("id", colaboradorId)
          .single();

        const now = new Date();
        const months = colabData?.fecha_inicio_contrato
          ? monthsBetween((colabData as any).fecha_inicio_contrato, now)
          : 6; // fallback

        if (!cancelled) {
          setData({
            own,
            teamAvg,
            teamCount,
            vacationDays: vacationCount ?? 0,
            monthsActive: months,
          });
        }
      } catch (err) {
        console.error("EmployeeEquityCard: fetch error", err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [colaboradorId, orgId]);

  return { data, loading };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Scale;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function ShiftBalanceSection({
  own,
  teamAvg,
  months,
}: {
  own: EquityRow;
  teamAvg: EquityData["teamAvg"];
  months: number;
}) {
  const ownTotal = own.morning_count + own.afternoon_count + own.night_count;
  const avgTotal = teamAvg.morning + teamAvg.afternoon + teamAvg.night;

  const ownData = [
    {
      name: "Tus turnos",
      M: own.morning_count,
      T: own.afternoon_count,
      N: own.night_count,
    },
    {
      name: "Media equipo",
      M: Math.round(teamAvg.morning),
      T: Math.round(teamAvg.afternoon),
      N: Math.round(teamAvg.night),
    },
  ];

  // Determine worst imbalance
  const nightStatus = getBalanceStatus(
    own.night_count,
    teamAvg.night,
    months
  );
  const afternoonStatus = getBalanceStatus(
    own.afternoon_count,
    teamAvg.afternoon,
    months
  );
  const morningStatus = getBalanceStatus(
    own.morning_count,
    teamAvg.morning,
    months
  );

  let overallStatus: BalanceStatus = "balanced";
  let imbalanceText = "";
  for (const [label, st] of [
    ["noches", nightStatus],
    ["tardes", afternoonStatus],
    ["mananas", morningStatus],
  ] as [string, { status: BalanceStatus; diff: number }][]) {
    if (st.status === "notable") {
      overallStatus = "notable";
      const sign = st.diff > 0 ? "+" : "";
      imbalanceText = `Ligero desequilibrio en ${label} (${sign}${st.diff.toFixed(1)}/mes vs media)`;
      break;
    }
    if (st.status === "slight" && overallStatus !== "notable") {
      overallStatus = "slight";
      const sign = st.diff > 0 ? "+" : "";
      imbalanceText = `Ligero desequilibrio en ${label} (${sign}${st.diff.toFixed(1)}/mes vs media)`;
    }
  }

  return (
    <div>
      <SectionHeader icon={Scale} title="Tu equilibrio" />

      {/* Summary text */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Tus turnos:</span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Sun className="h-3 w-3 text-amber-500" />
            {perMonth(own.morning_count, months)}
          </span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Sunset className="h-3 w-3 text-orange-500" />
            {perMonth(own.afternoon_count, months)}
          </span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Moon className="h-3 w-3 text-indigo-500" />
            {perMonth(own.night_count, months)}
          </span>
          /mes
        </div>
        <div>
          <span className="font-medium text-foreground">Media equipo:</span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Sun className="h-3 w-3 text-amber-500" />
            {perMonth(teamAvg.morning, months)}
          </span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Sunset className="h-3 w-3 text-orange-500" />
            {perMonth(teamAvg.afternoon, months)}
          </span>{" "}
          <span className="inline-flex items-center gap-0.5">
            <Moon className="h-3 w-3 text-indigo-500" />
            {perMonth(teamAvg.night, months)}
          </span>
          /mes
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-32 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ownData}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="M"
              stackId="a"
              fill="hsl(45, 93%, 47%)"
              name="Mananas"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="T"
              stackId="a"
              fill="hsl(24, 95%, 53%)"
              name="Tardes"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="N"
              stackId="a"
              fill="hsl(239, 84%, 67%)"
              name="Noches"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status indicator */}
      <div
        className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-md ${
          overallStatus === "balanced"
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : overallStatus === "slight"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        }`}
      >
        {overallStatus === "balanced" ? (
          <>
            <span>&#10003;</span> Equilibrado
          </>
        ) : (
          <>
            <span>&#9888;</span> {imbalanceText}
          </>
        )}
      </div>
    </div>
  );
}

function NightsAndWeekendsSection({
  own,
  teamAvg,
}: {
  own: EquityRow;
  teamAvg: EquityData["teamAvg"];
}) {
  const metrics = [
    {
      label: "Noches del Auditor cubiertas",
      own: own.night_coverage_count,
      avg: Math.round(teamAvg.nightCoverage * 10) / 10,
    },
    {
      label: "Fines de semana trabajados",
      own: own.weekend_worked_count,
      avg: Math.round(teamAvg.weekends * 10) / 10,
    },
  ];

  return (
    <div>
      <SectionHeader icon={Moon} title="Noches y fines de semana" />
      <div className="space-y-3">
        {metrics.map((m) => {
          const maxVal = Math.max(m.own, m.avg, 1);
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{m.label}</span>
                <span className="font-medium text-foreground">
                  {m.own}{" "}
                  <span className="text-muted-foreground font-normal">
                    (media: {m.avg})
                  </span>
                </span>
              </div>
              <div className="flex gap-1 items-center">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{
                      width: `${Math.min((m.own / maxVal) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/30 transition-all"
                    style={{
                      width: `${Math.min((m.avg / maxVal) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>Tu</span>
                <span>Media equipo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VacationsSection({ vacationDays }: { vacationDays: number }) {
  const now = new Date();
  const recommended = vacationPace(now);
  const pct = Math.round((vacationDays / 30) * 100);
  const colorClass = vacationColor(vacationDays, recommended);
  const barBg = vacationBarColor(vacationDays, recommended);

  return (
    <div>
      <SectionHeader icon={Gift} title="Tus vacaciones" />
      <div className="text-xs text-muted-foreground mb-2">
        Disfrutados:{" "}
        <span className={`font-semibold ${colorClass}`}>
          {vacationDays} de 30 dias naturales ({pct}%)
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full ${barBg} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="font-medium">
          Ritmo recomendado: {recommended} dias a esta fecha
        </span>
        <span>30</span>
      </div>
    </div>
  );
}

function DaysOwedSection({
  db,
  dg,
}: {
  db: number;
  dg: number;
}) {
  if (db === 0 && dg === 0) return null;

  return (
    <div>
      <SectionHeader icon={Calendar} title="Dias a tu favor" />
      <div className="space-y-2">
        {dg > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center font-bold text-purple-700 dark:text-purple-400 text-sm">
              {dg}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {dg === 1
                  ? "dia debido por guardia (DG)"
                  : `dias debidos por guardia (DG)`}
              </p>
              <p className="text-muted-foreground">
                Pendientes de disfrutar por guardias realizadas
              </p>
            </div>
          </div>
        )}
        {db > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center font-bold text-blue-700 dark:text-blue-400 text-sm">
              {db}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {db === 1
                  ? "dia debido por horas extra (DB)"
                  : `dias debidos por horas extra (DB)`}
              </p>
              <p className="text-muted-foreground">
                Acumulados por exceso de jornada (+8h = +1 dia)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function EmployeeEquityCard({ colaboradorId }: EmployeeEquityCardProps) {
  const { org } = useCurrentOrganization();
  const { data, loading } = useEmployeeEquity(colaboradorId, org?.id);

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-36" />
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.own) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            Equidad de turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Info className="h-4 w-4" />
            <span>
              Aun no hay datos de equidad disponibles. Se generaran con tu
              proximo cuadrante.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { own, teamAvg, vacationDays, monthsActive } = data;
  const db = own.db_balance ?? 0;
  const dg = own.dg_balance ?? 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5 text-muted-foreground" />
          Equidad de turnos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tu posicion respecto al equipo. TurnoSmart busca que todos trabajen de
          forma equilibrada.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Shift balance */}
        <ShiftBalanceSection
          own={own}
          teamAvg={teamAvg}
          months={monthsActive}
        />

        <hr className="border-border/50" />

        {/* Section 2: Nights & weekends */}
        <NightsAndWeekendsSection own={own} teamAvg={teamAvg} />

        <hr className="border-border/50" />

        {/* Section 3: Vacations */}
        <VacationsSection vacationDays={vacationDays} />

        {/* Section 4: Days owed (conditional) */}
        {(db > 0 || dg > 0) && (
          <>
            <hr className="border-border/50" />
            <DaysOwedSection db={db} dg={dg} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
