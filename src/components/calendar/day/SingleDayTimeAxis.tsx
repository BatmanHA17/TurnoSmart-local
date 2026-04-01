import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SLOT_MINUTES } from "@/constants/dayCalendar";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";

interface SingleDayTimeAxisProps {
  selectedDate: Date;
  shifts: ShiftBlockDay[];
}

export function SingleDayTimeAxis({ selectedDate, shifts }: SingleDayTimeAxisProps) {
  // Calcular empleados únicos trabajando en el día (excluyendo ausencias - siguiendo lógica de GoogleCalendarStyle)
  const uniqueEmployeesCount = useMemo(() => {
    const dayKey = format(selectedDate, "yyyy-MM-dd");
    const dayShifts = shifts.filter(s => s.date === dayKey);
    
    // Contar EMPLEADOS ÚNICOS trabajando por día (excluyendo ausencias tipo 'D', 'rest', etc)
    const workingShifts = dayShifts.filter(shift => {
      // Excluir ausencias (nombre "Descanso Semanal" en shift_name)
      if (shift.shift_name === "Descanso Semanal") {
        return false;
      }
      // Solo contar turnos con horario (start_time y end_time)
      return shift.start_time && shift.end_time;
    });
    
    const uniqueEmployees = new Set(workingShifts.map(shift => shift.employee_id));
    return uniqueEmployees.size;
  }, [selectedDate, shifts]);

  // Calculate employees working per hour
  const occupancyByHour = useMemo(() => {
    const occupancy = Array(24).fill(0);
    const dayKey = format(selectedDate, "yyyy-MM-dd");
    const dayShifts = shifts.filter(s => s.date === dayKey);
    
    // Count employees per hour
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = hour * 60;
      const hourEnd = (hour + 1) * 60;
      
      dayShifts.forEach(shift => {
        const shiftStartMinutes = shift.slotStart * SLOT_MINUTES;
        const shiftEndMinutes = shift.slotEnd * SLOT_MINUTES;
        
        // Check if shift overlaps with this hour
        if (shiftStartMinutes < hourEnd && shiftEndMinutes > hourStart) {
          occupancy[hour]++;
        }
      });
    }
    
    return occupancy;
  }, [selectedDate, shifts]);

  // Calculate current time position (only if selected date is today)
  const nowPosition = useMemo(() => {
    const now = new Date();
    const isToday = format(now, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    
    if (!isToday) return null;
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const percentage = (totalMinutes / (24 * 60)) * 100;
    
    return percentage;
  }, [selectedDate]);

  // Find max occupancy for visual scaling
  const maxOccupancy = useMemo(() => Math.max(...occupancyByHour, 1), [occupancyByHour]);

  return (
    <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
      {/* Time labels (01:00 - 23:00) positioned on divider lines */}
      <div className="relative h-14">
        <div className="absolute inset-0 flex">
          {/* 24 hours - grid background */}
          {Array.from({ length: 24 }).map((_, hour) => (
            <div
              key={hour}
              className="flex-1 relative"
            >
              {/* Vertical line only from label position down */}
              <div className="absolute right-0 top-[38px] bottom-0 w-px bg-border/20" />
              {/* 30-minute subtick */}
              <div className="absolute left-1/2 top-[38px] bottom-0 w-px bg-border/10" />
            </div>
          ))}
        </div>
        
        {/* Time labels positioned on dividers (skip 00:00, start from 01:00) */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 24 }).map((_, hour) => {
            // Skip the first one (00:00) and show labels from 01:00 onwards
            if (hour === 0) return <div key={hour} className="flex-1" />;
            
            return (
              <div key={hour} className="flex-1 relative">
                <span className="absolute -left-[18px] bottom-1 text-xs text-muted-foreground font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
