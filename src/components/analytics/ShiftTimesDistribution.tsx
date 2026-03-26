import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShiftTimeDistribution } from "@/utils/shiftAnalytics";
import { Sun, Sunset, Moon } from "lucide-react";

interface ShiftTimesDistributionProps {
  data: ShiftTimeDistribution[];
  loading?: boolean;
}

export function ShiftTimesDistributionChart({ data, loading }: ShiftTimesDistributionProps) {
  if (loading) {
    return (
      <Card className="col-span-full">
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

  // Take top 8 employees for readability
  const chartData = data.slice(0, 8).map((emp) => ({
    name: emp.employeeName.split(" ")[0], // First name only
    fullName: emp.employeeName,
    Mañanas: emp.mananas,
    Tardes: emp.tardes,
    Noches: emp.noches,
  }));

  const totals = data.reduce(
    (acc, emp) => ({
      mananas: acc.mananas + emp.mananas,
      tardes: acc.tardes + emp.tardes,
      noches: acc.noches + emp.noches,
    }),
    { mananas: 0, tardes: 0, noches: 0 }
  );

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Distribución de turnos</CardTitle>
            <CardDescription className="text-sm">Mañanas, tardes y noches por empleado</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              {totals.mananas}
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="h-3.5 w-3.5 text-orange-500" />
              {totals.tardes}
            </span>
            <span className="flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              {totals.noches}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Mañanas" stackId="a" fill="hsl(45, 93%, 47%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Tardes" stackId="a" fill="hsl(24, 95%, 53%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Noches" stackId="a" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
