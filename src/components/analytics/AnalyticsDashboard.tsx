import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useShiftAnalytics } from "@/hooks/useShiftAnalytics";
import { WeekdayDistributionTable } from "./WeekdayDistributionTable";
import { WeekendComparisonCard } from "./WeekendComparisonCard";
import { AbsencesByTypeTable } from "./AbsencesByTypeTable";
import { ShiftTimesTable } from "./ShiftTimesTable";
import { RequestsStatsCard } from "./RequestsStatsCard";
import { AnalyticsDateSelector } from "./AnalyticsDateSelector";
import { BarChart3, Download, Calendar, Users, TrendingUp, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AnalyticsDashboard() {
  const [dateMode, setDateMode] = useState<'relative' | 'specific'>('relative');
  const [monthsBack, setMonthsBack] = useState(3);
  const [specificMonth, setSpecificMonth] = useState(new Date().getMonth());
  const [specificYear, setSpecificYear] = useState(new Date().getFullYear());
  
  const {
    loading,
    error,
    dateRange,
    weekdayDistribution,
    weekendComparison,
    absencesByType,
    shiftTimeDistribution,
    requestStats,
  } = useShiftAnalytics({
    mode: dateMode,
    monthsBack,
    specificMonth,
    specificYear,
  });

  const totalShifts = weekdayDistribution.reduce((acc, emp) => acc + emp.total, 0);
  const totalEmployees = weekdayDistribution.length;
  const totalWeekends = weekendComparison.reduce((acc, emp) => acc + emp.totalFinesSemana, 0);
  const totalAbsences = absencesByType.reduce((acc, item) => acc + item.count, 0);

  const handleSpecificChange = (month: number, year: number) => {
    setSpecificMonth(month);
    setSpecificYear(year);
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">Analítica del equipo</h2>
            {dateRange && (
              <p className="text-xs text-muted-foreground">
                {format(dateRange.startDate, "d MMM", { locale: es })} - {format(dateRange.endDate, "d MMM yyyy", { locale: es })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnalyticsDateSelector
            mode={dateMode}
            monthsBack={monthsBack}
            specificMonth={specificMonth}
            specificYear={specificYear}
            onModeChange={setDateMode}
            onRelativeChange={setMonthsBack}
            onSpecificChange={handleSpecificChange}
          />
          
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="h-3 w-3" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Compact KPI Row */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-muted/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Turnos</span>
              </div>
              <span className="text-lg font-bold">{loading ? "—" : totalShifts.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Empleados</span>
              </div>
              <span className="text-lg font-bold">{loading ? "—" : totalEmployees}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Fines sem.</span>
              </div>
              <span className="text-lg font-bold">{loading ? "—" : totalWeekends}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Ausencias</span>
              </div>
              <span className="text-lg font-bold">{loading ? "—" : totalAbsences}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-2">
            <p className="text-xs text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tables Grid - Compact 2x3 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <WeekdayDistributionTable data={weekdayDistribution} loading={loading} />
        <WeekendComparisonCard data={weekendComparison} loading={loading} />
        <AbsencesByTypeTable data={absencesByType} loading={loading} />
        <ShiftTimesTable data={shiftTimeDistribution} loading={loading} />
        <RequestsStatsCard data={requestStats} loading={loading} />
      </div>
    </div>
  );
}
