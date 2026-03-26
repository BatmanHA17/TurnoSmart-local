import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

export interface ShiftBlockDay {
  id: string;
  employee_id: string;
  employee_name: string;
  shift_name: string;
  date: string;
  start_time: string;
  end_time: string;
  break_duration?: string;
  color: string;
  notes?: string;
  slotStart: number;
  slotEnd: number;
  isOvernight: boolean;
}

export function useDayCalendarData(selectedDate: Date, orgId: string) {
  const [shifts, setShifts] = useState<ShiftBlockDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchShifts = async () => {
      if (!orgId) {
        setShifts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const dateStr = format(selectedDate, "yyyy-MM-dd");
        
        const { data, error: fetchError } = await supabase
          .from("calendar_shifts")
          .select(`
            id,
            employee_id,
            shift_name,
            date,
            start_time,
            end_time,
            break_duration,
            color,
            notes,
            colaboradores (
              nombre,
              apellidos
            )
          `)
          .eq("org_id", orgId)
          .eq("date", dateStr)
          .order("start_time", { ascending: true });

        if (fetchError) throw fetchError;

        // Transform data to ShiftBlockDay format
        const transformedShifts: ShiftBlockDay[] = (data || []).map((shift: any) => {
          const startMinutes = timeToMinutes(shift.start_time || "00:00");
          const endMinutes = timeToMinutes(shift.end_time || "23:59");
          
          // Slots de 30 minutos (48 slots por día)
          const slotStart = Math.floor(startMinutes / 30);
          const slotEnd = Math.floor(endMinutes / 30);
          
          const isOvernight = endMinutes < startMinutes;

          return {
            id: shift.id,
            employee_id: shift.employee_id,
            employee_name: shift.colaboradores 
              ? `${shift.colaboradores.nombre} ${shift.colaboradores.apellidos}`
              : "Empleado",
            shift_name: shift.shift_name,
            date: shift.date,
            start_time: shift.start_time || "00:00",
            end_time: shift.end_time || "23:59",
            break_duration: shift.break_duration,
            color: shift.color || "#86efac",
            notes: shift.notes,
            slotStart,
            slotEnd: isOvernight ? 48 : slotEnd, // Si es overnight, va hasta el final del día (slot 48)
            isOvernight
          };
        });

        setShifts(transformedShifts);
      } catch (err: any) {
        console.error("Error fetching day shifts:", err);
        setError(err.message);
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [selectedDate, orgId, refreshKey]);

  const refresh = () => setRefreshKey(prev => prev + 1);

  return { shifts, loading, error, refresh };
}

// Helper: Convert time string "HH:MM" to minutes
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Hook for fetching week data (7 days)
export function useWeekCalendarData(selectedDate: Date, orgId: string) {
  const [shiftsByDay, setShiftsByDay] = useState<Record<string, ShiftBlockDay[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchWeekShifts = async () => {
      if (!orgId) {
        setShiftsByDay({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate week range (Monday to Sunday)
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        
        const startDateStr = format(weekStart, "yyyy-MM-dd");
        const endDateStr = format(weekEnd, "yyyy-MM-dd");
        
        const { data, error: fetchError } = await supabase
          .from("calendar_shifts")
          .select(`
            id,
            employee_id,
            shift_name,
            date,
            start_time,
            end_time,
            break_duration,
            color,
            notes,
            colaboradores (
              nombre,
              apellidos
            )
          `)
          .eq("org_id", orgId)
          .gte("date", startDateStr)
          .lte("date", endDateStr)
          .order("start_time", { ascending: true });

        if (fetchError) throw fetchError;

        // Group shifts by day
        const grouped: Record<string, ShiftBlockDay[]> = {};
        
        (data || []).forEach((shift: any) => {
          const startMinutes = timeToMinutes(shift.start_time || "00:00");
          const endMinutes = timeToMinutes(shift.end_time || "23:59");
          
          // Slots de 30 minutos (48 slots por día)
          const slotStart = Math.floor(startMinutes / 30);
          const slotEnd = Math.floor(endMinutes / 30);
          
          const isOvernight = endMinutes < startMinutes;

          const transformedShift: ShiftBlockDay = {
            id: shift.id,
            employee_id: shift.employee_id,
            employee_name: shift.colaboradores 
              ? `${shift.colaboradores.nombre} ${shift.colaboradores.apellidos}`
              : "Empleado",
            shift_name: shift.shift_name,
            date: shift.date,
            start_time: shift.start_time || "00:00",
            end_time: shift.end_time || "23:59",
            break_duration: shift.break_duration,
            color: shift.color || "#86efac",
            notes: shift.notes,
            slotStart,
            slotEnd: isOvernight ? 48 : slotEnd, // Si es overnight, va hasta el final del día (slot 48)
            isOvernight
          };

          if (!grouped[shift.date]) {
            grouped[shift.date] = [];
          }
          grouped[shift.date].push(transformedShift);
        });

        setShiftsByDay(grouped);
      } catch (err: any) {
        console.error("Error fetching week shifts:", err);
        setError(err.message);
        setShiftsByDay({});
      } finally {
        setLoading(false);
      }
    };

    fetchWeekShifts();
  }, [selectedDate, orgId, refreshKey]);

  const refresh = () => setRefreshKey(prev => prev + 1);

  return { shiftsByDay, loading, error, refresh };
}
