import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ShiftData {
  id: string;
  employee_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  break_duration?: string;
  color: string;
  date: string;
  slotStart: number;
  slotEnd: number;
  isOvernight: boolean;
}

export function useDayData(selectedDate: Date, orgId: string) {
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      if (!orgId) {
        setShifts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        const { data, error: fetchError } = await supabase
          .from("calendar_shifts")
          .select("*")
          .eq("org_id", orgId)
          .eq("date", dateStr);

        if (fetchError) throw fetchError;

        // Transformar datos
        const transformed = (data || []).map(shift => {
          const [startHour, startMin] = shift.start_time.split(':').map(Number);
          const [endHour, endMin] = shift.end_time.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          let endMinutes = endHour * 60 + endMin;
          
          const isOvernight = endMinutes <= startMinutes;
          if (isOvernight) {
            endMinutes += 24 * 60;
          }

          return {
            ...shift,
            slotStart: Math.floor(startMinutes / 15),
            slotEnd: Math.ceil(endMinutes / 15),
            isOvernight
          };
        });

        setShifts(transformed);
        setError(null);
      } catch (err) {
        console.error("Error fetching day shifts:", err);
        setError(err as Error);
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [selectedDate, orgId]);

  return { shifts, loading, error };
}
