import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DayHours {
  date: string;
  day: string;
  hours: number;
  isLibre: boolean;
}

interface WeeklyHoursChartProps {
  dailyHours: DayHours[];
  targetHours: number;
}

export const WeeklyHoursChart = ({ dailyHours, targetHours }: WeeklyHoursChartProps) => {
  const dailyTarget = targetHours / 5; // Assuming 5 working days

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Horas trabajadas esta semana</CardTitle>
        <p className="text-sm text-muted-foreground">
          Seguimiento diario vs objetivo semanal
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyHours} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis 
              dataKey="day" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Horas', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                padding: '0.75rem'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                if (name === 'hours') return [`${value}h`, 'Trabajadas'];
                return [value, name];
              }}
            />
            <ReferenceLine 
              y={dailyTarget} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: `Objetivo: ${dailyTarget}h/día`,
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 12
              }}
            />
            <Bar 
              dataKey="hours" 
              fill="hsl(212, 95%, 68%)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
