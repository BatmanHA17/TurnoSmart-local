import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WeekendComparison } from "@/utils/shiftAnalytics";
import { TrendingUp, TrendingDown } from "lucide-react";

interface WeekendComparisonCardProps {
  data: WeekendComparison[];
  loading?: boolean;
}

export function WeekendComparisonCard({ data, loading }: WeekendComparisonCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgWeekends = data.length > 0 
    ? Math.round(data.reduce((acc, emp) => acc + emp.totalFinesSemana, 0) / data.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Fines de semana</CardTitle>
        <CardDescription className="text-sm">
          Comparativa de sábados y domingos trabajados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {data.slice(0, 10).map((emp, index) => {
              const diff = emp.totalFinesSemana - avgWeekends;
              const isAboveAvg = diff > 0;
              
              return (
                <div
                  key={emp.employeeId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-none">{emp.employeeName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {emp.sabados} sáb · {emp.domingos} dom
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isAboveAvg ? "destructive" : "secondary"}
                      className="text-xs font-normal"
                    >
                      {emp.totalFinesSemana}
                    </Badge>
                    {diff !== 0 && (
                      <span className={`flex items-center text-xs ${isAboveAvg ? "text-destructive" : "text-green-600"}`}>
                        {isAboveAvg ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(diff)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {avgWeekends > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Media del equipo: <span className="font-medium text-foreground">{avgWeekends} fines de semana</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
