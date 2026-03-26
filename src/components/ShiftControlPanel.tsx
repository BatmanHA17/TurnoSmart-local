import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, getDay } from "date-fns";
import { es } from "date-fns/locale";

interface ShiftControlPanelProps {
  onQuickSetTime: (time: string) => void;
  onNavigateDay: (direction: 'prev' | 'next') => void;
  currentDayIndex: number;
  totalDays: number;
  currentDay: Date;
}

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const quickTimes = [
  { label: "Mañana", time: "09:00" },
  { label: "Tarde", time: "16:30" },
  { label: "Noche", time: "22:00" }
];

export const ShiftControlPanel = ({
  onQuickSetTime,
  onNavigateDay,
  currentDayIndex,
  totalDays,
  currentDay
}: ShiftControlPanelProps) => {
  return (
    <div className="space-y-3">
      {/* Navegación de días */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateDay('prev')}
              disabled={currentDayIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                {currentDayIndex + 1} de {totalDays}
              </p>
              <p className="text-sm font-medium">
                {dayNames[getDay(currentDay)]} {format(currentDay, "d/M", { locale: es })}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateDay('next')}
              disabled={currentDayIndex === totalDays - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Horarios rápidos */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Horarios rápidos</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {quickTimes.map(({ label, time }) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                onClick={() => onQuickSetTime(time)}
                className="h-9 text-xs"
              >
                <div className="text-center">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};