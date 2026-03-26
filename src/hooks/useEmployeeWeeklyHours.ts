import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfWeek, endOfWeek, format, parseISO, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

interface DayHours {
  date: string;
  day: string;
  hours: number;
  isLibre: boolean;
}

interface WeeklyHoursData {
  totalHours: number;
  hoursWorkedUntilToday: number;
  targetHours: number;
  remainingHours: number;
  dailyHours: DayHours[];
  nextLibreDay: { date: string; daysUntil: number } | null;
}

export const useEmployeeWeeklyHours = (selectedDate?: Date) => {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the date to avoid infinite loops
  const memoizedDate = useMemo(() => selectedDate || new Date(), [selectedDate]);
  const dateKey = useMemo(() => format(memoizedDate, 'yyyy-MM-dd'), [memoizedDate]);

  useEffect(() => {
    let mounted = true;
    const fetchWeeklyHours = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get colaborador from user
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (!profile?.email) {
          throw new Error('Perfil no encontrado');
        }

        const { data: colaborador } = await supabase
          .from('colaboradores')
          .select('id, tiempo_trabajo_semanal')
          .eq('email', profile.email)
          .single();

        if (!colaborador) {
          throw new Error('Colaborador no encontrado');
        }

        const weekStart = startOfWeek(memoizedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(memoizedDate, { weekStartsOn: 1 });

        // Fetch shifts for the week
        const { data: shifts, error: shiftsError } = await supabase
          .from('calendar_shifts')
          .select('date, start_time, end_time, shift_name')
          .eq('employee_id', colaborador.id)
          .gte('date', format(weekStart, 'yyyy-MM-dd'))
          .lte('date', format(weekEnd, 'yyyy-MM-dd'))
          .order('date', { ascending: true });

        if (shiftsError) throw shiftsError;

        // Create daily hours array
        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const dailyHours: DayHours[] = daysOfWeek.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayShifts = shifts?.filter(s => s.date === dayStr) || [];
          
          let hours = 0;
          let isLibre = false;

          // Si no hay turnos para este día, se considera libre
          if (dayShifts.length === 0) {
            isLibre = true;
          } else {
            dayShifts.forEach(shift => {
              // Detectar días libres por shift_name
              if (shift.shift_name === 'L' || shift.shift_name === 'Libre') {
                isLibre = true;
              } 
              // O si el turno existe pero no tiene horarios (también es día libre)
              else if (!shift.start_time || !shift.end_time) {
                isLibre = true;
              }
              // Si tiene horarios, calcular horas
              else {
                const [startHour, startMin] = shift.start_time.split(':').map(Number);
                const [endHour, endMin] = shift.end_time.split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                hours += (endMinutes - startMinutes) / 60;
              }
            });
          }

          return {
            date: dayStr,
            day: format(day, 'EEE dd', { locale: es }).toUpperCase(),
            hours: Math.round(hours * 10) / 10,
            isLibre
          };
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total de horas trabajadas HASTA HOY (inclusive)
        const hoursWorkedUntilToday = dailyHours
          .filter(d => parseISO(d.date) <= today)
          .reduce((sum, day) => sum + day.hours, 0);

        // Total de horas de toda la semana
        const totalHours = dailyHours.reduce((sum, day) => sum + day.hours, 0);

        const targetHours = colaborador.tiempo_trabajo_semanal || 40;

        // Horas pendientes = horas totales programadas - horas trabajadas hasta hoy
        const remainingHours = Math.max(0, totalHours - hoursWorkedUntilToday);

        // Find next libre day
        const futureDays = dailyHours.filter(d => {
          const dayDate = parseISO(d.date);
          return dayDate >= new Date() && d.isLibre;
        });
        
        const nextLibreDay = futureDays.length > 0 
          ? {
              date: futureDays[0].date,
              daysUntil: Math.ceil((parseISO(futureDays[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }
          : null;

        if (mounted) setData({
          totalHours: Math.round(totalHours * 10) / 10,
          hoursWorkedUntilToday: Math.round(hoursWorkedUntilToday * 10) / 10,
          targetHours,
          remainingHours: Math.round(remainingHours * 10) / 10,
          dailyHours,
          nextLibreDay
        });
      } catch (err: any) {
        if (import.meta.env.DEV) console.error('[useEmployeeWeeklyHours]', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWeeklyHours();
    return () => { mounted = false; };
  }, [user?.id, dateKey]);

  return { data, loading, error };
};
