import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { WeekdayDistribution } from "@/utils/shiftAnalytics";

interface WeekdayDistributionChartProps {
  data: WeekdayDistribution[];
  loading?: boolean;
}

const WEEKDAY_LABELS = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

export function WeekdayDistributionChart({ data, loading }: WeekdayDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for the chart - show total per weekday across all employees
  const weekdayTotals = {
    lunes: 0,
    martes: 0,
    miercoles: 0,
    jueves: 0,
    viernes: 0,
    sabado: 0,
    domingo: 0,
  };

  data.forEach((emp) => {
    weekdayTotals.lunes += emp.lunes;
    weekdayTotals.martes += emp.martes;
    weekdayTotals.miercoles += emp.miercoles;
    weekdayTotals.jueves += emp.jueves;
    weekdayTotals.viernes += emp.viernes;
    weekdayTotals.sabado += emp.sabado;
    weekdayTotals.domingo += emp.domingo;
  });

  const chartData = Object.entries(weekdayTotals).map(([day, value]) => ({
    day: WEEKDAY_LABELS[day as keyof typeof WEEKDAY_LABELS],
    turnos: value,
    isWeekend: day === "sabado" || day === "domingo",
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Distribución por día</CardTitle>
        <CardDescription className="text-sm">Turnos trabajados por día de la semana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="turnos" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isWeekend ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    fillOpacity={entry.isWeekend ? 0.7 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
