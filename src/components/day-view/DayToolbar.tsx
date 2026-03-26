import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useState } from "react";

interface DayToolbarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function DayToolbar({ selectedDate, onDateChange, onZoomIn, onZoomOut }: DayToolbarProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  return (
    <div className="flex items-center gap-3 p-3 border-b bg-background">
      {/* Navegación de fecha */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevDay}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
        >
          Hoy
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextDay}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Date Picker */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setShowCalendar(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1" />

      {/* Controles de zoom */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
