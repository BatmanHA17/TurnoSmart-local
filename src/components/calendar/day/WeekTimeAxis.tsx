import { useMemo } from "react";
import { format, isSameDay, getWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { SLOT_MINUTES } from "@/constants/dayCalendar";

interface WeekTimeAxisProps {
  weekDays: Date[];
  shifts: ShiftBlockDay[];
}

export function WeekTimeAxis({ weekDays, shifts }: WeekTimeAxisProps) {
  // Calculate week number
  const weekNumber = useMemo(() => {
    return getWeek(weekDays[0], { weekStartsOn: 1, firstWeekContainsDate: 4 });
  }, [weekDays]);

  // Calculate employees working per hour for each day
  const occupancyByDayHour = useMemo(() => {
    const occupancy: Record<string, number[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      occupancy[dayKey] = Array(24).fill(0);
      
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
            occupancy[dayKey][hour]++;
          }
        });
      }
    });
    
    return occupancy;
  }, [weekDays, shifts]);

  // Calculate current time position
  const nowPosition = useMemo(() => {
    const now = new Date();
    const todayIndex = weekDays.findIndex(day => isSameDay(day, now));
    
    if (todayIndex === -1) return null;
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Position within the week (0-100%)
    const dayPercentage = (todayIndex / 7) * 100;
    const hourPercentage = (totalMinutes / (24 * 60)) * (100 / 7);
    
    return dayPercentage + hourPercentage;
  }, [weekDays]);

  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      {/* Row 1: Week number + Day badges */}
      <div className="flex h-10 border-b border-border/30">
        <div className="w-64 flex items-center px-4 border-r border-border">
          <Badge variant="outline" className="text-xs font-semibold">
            S.{weekNumber}
          </Badge>
        </div>
        
        <div className="flex-1 flex">
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day, new Date());
            const dayKey = format(day, "yyyy-MM-dd");
            
            return (
              <div
                key={dayKey}
                className="flex-1 flex items-center justify-center border-r border-border relative"
              >
                {/* Day separator line */}
                {index > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black dark:bg-white z-10" />
                )}
                
                <Badge 
                  variant={isToday ? "default" : "outline"} 
                  className="text-xs font-medium"
                >
                  {format(day, "EEE. dd", { locale: es }).toUpperCase()}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Time labels (00:00 - 23:00 for each day) */}
      <div className="flex h-12 border-b border-border/30">
        <div className="w-64 border-r border-border" />
        
        <div className="flex-1 flex">
          {weekDays.map((day, dayIndex) => {
            const dayKey = format(day, "yyyy-MM-dd");
            
            return (
              <div key={dayKey} className="flex-1 flex relative">
                {/* Day separator line */}
                {dayIndex > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black dark:bg-white z-10" />
                )}
                
                {/* 24 hours */}
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="flex-1 flex items-center justify-center border-r border-border/20"
                  >
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {hour.toString().padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Occupancy indicators */}
      <div className="flex h-8 border-b border-border/30">
        <div className="w-64 border-r border-border" />
        
        <div className="flex-1 flex">
          {weekDays.map((day, dayIndex) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const occupancy = occupancyByDayHour[dayKey] || Array(24).fill(0);
            
            return (
              <div key={dayKey} className="flex-1 flex relative">
                {/* Day separator line */}
                {dayIndex > 0 && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black dark:bg-white z-10" />
                )}
                
                {/* Occupancy numbers */}
                {occupancy.map((count, hour) => (
                  <div
                    key={hour}
                    className="flex-1 flex items-center justify-center border-r border-border/20"
                  >
                    <span className="text-xs text-primary font-medium">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current time red line */}
      {nowPosition !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          style={{ left: `calc(256px + ${nowPosition}%)` }}
        >
          <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
        </div>
      )}
    </div>
  );
}