import { useMemo } from "react";
import { SLOT_MINUTES, TOTAL_SLOTS_PER_DAY } from "@/constants/dayCalendar";
import { format } from "date-fns";

interface DayTimeAxisProps {
  zoom?: 30 | 60;
  showNowLine?: boolean;
  currentTime?: Date;
}

export function DayTimeAxis({ 
  zoom = 60, 
  showNowLine = false,
  currentTime = new Date()
}: DayTimeAxisProps) {
  const timeSlots = useMemo(() => {
    const slots = [];
    const displayInterval = zoom / SLOT_MINUTES; // Cada cuántos slots mostrar label
    
    for (let i = 0; i < TOTAL_SLOTS_PER_DAY; i++) {
      const hours = Math.floor((i * SLOT_MINUTES) / 60);
      const minutes = (i * SLOT_MINUTES) % 60;
      const shouldDisplay = i % displayInterval === 0;
      
      slots.push({
        index: i,
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        hours,
        minutes,
        shouldDisplay
      });
    }
    
    return slots;
  }, [zoom]);

  // Calculate "now" position if showing now line
  const nowPosition = useMemo(() => {
    if (!showNowLine) return null;
    
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const slotIndex = totalMinutes / SLOT_MINUTES;
    const percentage = (slotIndex / TOTAL_SLOTS_PER_DAY) * 100;
    
    return percentage;
  }, [showNowLine, currentTime]);

  return (
    <div className="sticky top-0 z-20 bg-background border-b">
      {/* Time labels */}
      <div className="relative h-12 flex">
        {timeSlots.map((slot) => (
          <div
            key={slot.index}
            className="flex-1 border-r border-border/50 text-center relative"
            style={{ minWidth: '40px' }}
          >
            {slot.shouldDisplay && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {slot.time}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Now line indicator */}
      {showNowLine && nowPosition !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          style={{ left: `${nowPosition}%` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-red-500" />
        </div>
      )}
    </div>
  );
}
