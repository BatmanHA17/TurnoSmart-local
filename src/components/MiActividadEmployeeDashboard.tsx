import { Clock, CalendarClock, Coffee } from "lucide-react";
import { KPICard } from "@/components/mi-actividad/KPICard";
import { WeeklyHoursChart } from "@/components/mi-actividad/WeeklyHoursChart";
import { UpcomingAbsencesCard } from "@/components/mi-actividad/UpcomingAbsencesCard";
import { RemindersCard } from "@/components/mi-actividad/RemindersCard";
import { useEmployeeWeeklyHours } from "@/hooks/useEmployeeWeeklyHours";
import { useEmployeeUpcomingAbsences } from "@/hooks/useEmployeeUpcomingAbsences";
import { useEmployeeReminders } from "@/hooks/useEmployeeReminders";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export const MiActividadEmployeeDashboard = () => {
  const navigate = useNavigate();
  const { displayName } = useUserProfile();
  const { data: weeklyData, loading: loadingHours } = useEmployeeWeeklyHours();
  const { absences, loading: loadingAbsences } = useEmployeeUpcomingAbsences();
  const { reminders, loading: loadingReminders } = useEmployeeReminders();

  const nextLibreText = weeklyData?.nextLibreDay 
    ? `${format(parseISO(weeklyData.nextLibreDay.date), "EEEE d", { locale: es })}`
    : "No programado";

  const nextLibreSubtitle = weeklyData?.nextLibreDay
    ? weeklyData.nextLibreDay.daysUntil === 0 
      ? "¡Hoy!"
      : weeklyData.nextLibreDay.daysUntil === 1
        ? "Mañana"
        : `En ${weeklyData.nextLibreDay.daysUntil} días`
    : "Esta semana";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-notion-blue-bg/40 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-notion-purple-bg/30 rounded-full blur-[140px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Contenido principal */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2">
            Mi actividad
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Resumen de tu semana laboral, {displayName}
          </p>
        </div>

        {/* KPIs superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
          {loadingHours ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
          <KPICard
            icon={Clock}
            label="Horas trabajadas"
            value={`${weeklyData?.hoursWorkedUntilToday || 0}h`}
            subtitle={`${weeklyData?.totalHours || 0}h programadas esta semana`}
            colorClass="text-notion-blue-text"
            iconBgClass="bg-notion-blue-bg"
            className="animate-fade-in"
            style={{ animationDelay: '100ms' } as any}
          />
              
              <KPICard
                icon={CalendarClock}
                label="Horas pendientes"
                value={`${weeklyData?.remainingHours || 0}h`}
                subtitle="restantes esta semana"
                colorClass="text-notion-orange-text"
                iconBgClass="bg-notion-orange-bg"
                className="animate-fade-in"
                style={{ animationDelay: '200ms' } as any}
              />
              
              <KPICard
                icon={Coffee}
                label="Próximo día libre"
                value={nextLibreText}
                subtitle={nextLibreSubtitle}
                colorClass="text-notion-green-text"
                iconBgClass="bg-notion-green-bg"
                onClick={() => navigate('/turnosmart')}
                className="animate-fade-in"
                style={{ animationDelay: '300ms' } as any}
              />
            </>
          )}
        </div>

        {/* Gráfico de horas */}
        {!loadingHours && weeklyData && (
          <div className="mb-8 lg:mb-10 animate-fade-in" style={{ animationDelay: '400ms' } as any}>
            <WeeklyHoursChart 
              dailyHours={weeklyData.dailyHours}
              targetHours={weeklyData.targetHours}
            />
          </div>
        )}

        {/* Grid inferior: Ausencias y Recordatorios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="animate-fade-in" style={{ animationDelay: '500ms' } as any}>
            <UpcomingAbsencesCard 
              absences={absences}
              loading={loadingAbsences}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '600ms' } as any}>
            <RemindersCard 
              reminders={reminders}
              loading={loadingReminders}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
