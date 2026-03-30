import { useState, useRef, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Coffee, FileText, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShiftBlock } from "@/utils/calendarShiftUtils";

interface MobileWeekViewProps {
  weekStart?: Date;
  shifts: ShiftBlock[];
  employeeId?: string;
}

const DAY_NAMES_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function formatTimeRange(startTime?: string, endTime?: string): string {
  if (!startTime) return "Sin horario";
  if (!endTime) return startTime;
  return `${startTime} – ${endTime}`;
}

function getShiftTypeLabel(type: ShiftBlock["type"]): string {
  switch (type) {
    case "morning":
      return "Mañana";
    case "afternoon":
      return "Tarde";
    case "night":
      return "Noche";
    case "absence":
      return "Ausencia";
    default:
      return type;
  }
}

function getShiftTypeVariant(
  type: ShiftBlock["type"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "morning":
      return "default";
    case "afternoon":
      return "secondary";
    case "night":
      return "outline";
    case "absence":
      return "destructive";
    default:
      return "default";
  }
}

export function MobileWeekView({ weekStart, shifts, employeeId }: MobileWeekViewProps) {
  const referenceDate = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = getWeekDays(referenceDate);

  // Start on today if it falls in this week, else Monday
  const todayIndex = days.findIndex((d) => isToday(d));
  const [selectedIndex, setSelectedIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

      // Only register horizontal swipes (more horizontal than vertical)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
        if (deltaX < 0) {
          // Swipe left → next day
          setSelectedIndex((prev) => Math.min(prev + 1, 6));
        } else {
          // Swipe right → previous day
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    []
  );

  const selectedDay = days[selectedIndex];

  const shiftsForDay = shifts.filter(
    (s) =>
      isSameDay(s.date instanceof Date ? s.date : new Date(s.date), selectedDay) &&
      (employeeId ? s.employeeId === employeeId : true)
  );

  const workShifts = shiftsForDay.filter((s) => s.type !== "absence");
  const absenceShifts = shiftsForDay.filter((s) => s.type === "absence");

  return (
    <div className="flex flex-col h-full">
      {/* Day selector strip */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-border bg-background sticky top-0 z-10">
        {days.map((day, i) => {
          const active = i === selectedIndex;
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[52px] min-w-[40px] rounded-xl transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : today
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
              aria-label={format(day, "EEEE d MMMM", { locale: es })}
            >
              <span className="text-[10px] font-medium uppercase">{DAY_NAMES_SHORT[i]}</span>
              <span className={cn("text-base font-bold leading-none mt-0.5", active && "text-primary-foreground")}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      <div
        className="flex-1 overflow-auto px-4 py-4 space-y-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Date heading */}
        <p className="text-sm font-semibold text-muted-foreground capitalize">
          {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
        </p>

        {/* No shifts empty state */}
        {shiftsForDay.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <CalendarX className="h-10 w-10 opacity-40" />
            <p className="text-sm">Sin turnos este día</p>
          </div>
        )}

        {/* Work shifts */}
        {workShifts.map((shift) => (
          <Card key={shift.id} className="overflow-hidden">
            <div
              className="h-1.5"
              style={{ backgroundColor: shift.color || "hsl(var(--primary))" }}
            />
            <CardContent className="p-4 space-y-3">
              {/* Time range */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xl font-bold">
                  {formatTimeRange(shift.startTime, shift.endTime)}
                </span>
              </div>

              {/* Shift type badge + name */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getShiftTypeVariant(shift.type)}>
                  {getShiftTypeLabel(shift.type)}
                </Badge>
                {shift.name && (
                  <span className="text-sm text-muted-foreground">{shift.name}</span>
                )}
              </div>

              {/* Break info */}
              {shift.hasBreak && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Coffee className="h-3.5 w-3.5" />
                  <span>
                    {shift.breakDuration
                      ? `Descanso: ${shift.breakDuration}`
                      : shift.totalBreakTime
                      ? `Descanso: ${shift.totalBreakTime} min`
                      : "Con descanso"}
                  </span>
                </div>
              )}

              {/* Notes */}
              {shift.notes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground border-t pt-2">
                  <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{shift.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Absence cards */}
        {absenceShifts.map((shift) => (
          <Card key={shift.id} className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Ausencia</Badge>
                {shift.absenceCode && (
                  <span className="text-sm font-medium">{shift.absenceCode}</span>
                )}
              </div>
              {shift.name && (
                <p className="text-sm text-muted-foreground">{shift.name}</p>
              )}
              {shift.notes && (
                <p className="text-xs text-muted-foreground border-t pt-2">{shift.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
