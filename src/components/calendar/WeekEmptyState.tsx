import { format, getWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface WeekEmptyStateProps {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onWeekChange: (date: Date) => void;
  weekDays: Date[];
}

export function WeekEmptyState({
  currentWeek,
  onPreviousWeek,
  onNextWeek,
  onWeekChange,
  weekDays
}: WeekEmptyStateProps) {
  const weekNumber = getWeek(currentWeek, { locale: es, weekStartsOn: 1 });
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  const weekRange = `${format(firstDay, "d MMM", { locale: es })} - ${format(lastDay, "d MMM yyyy", { locale: es })}`;

  return (
    <Card className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-muted/5">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Week Number Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="text-lg px-4 py-2 font-normal">
            S.{weekNumber}
          </Badge>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="font-medium text-base hover:bg-muted/50"
              >
                {weekRange}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentWeek}
                onSelect={(date) => date && onWeekChange(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextWeek}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days Display */}
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className="font-medium uppercase text-[10px] mb-1">
                {format(day, "EEEEE", { locale: es })}
              </div>
              <div className="text-sm">
                {format(day, "d", { locale: es })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State Icon & Message */}
        <div className="space-y-4 pt-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted/30 p-6">
              <CalendarOff className="h-12 w-12 text-muted-foreground/40" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-foreground">
              El horario aún no ha sido publicado
            </h3>
            <p className="text-sm text-muted-foreground">
              No hay turnos programados para esta semana
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
