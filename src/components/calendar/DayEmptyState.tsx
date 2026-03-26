import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getWeek, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DayEmptyStateProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DayEmptyState({
  currentDate,
  onDateChange,
}: DayEmptyStateProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekNumber = getWeek(currentDate, { locale: es, weekStartsOn: 1 });
  
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  const weekRange = `${format(firstDay, "d MMM", { locale: es })} - ${format(lastDay, "d MMM yyyy", { locale: es })}`;

  const handlePreviousWeek = () => {
    onDateChange(subDays(currentDate, 7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(currentDate, 7));
  };

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
            onClick={handlePreviousWeek}
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
                selected={currentDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
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
