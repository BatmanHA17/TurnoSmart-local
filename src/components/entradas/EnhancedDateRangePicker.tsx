import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, isAfter, isBefore, isEqual, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { designTokens } from "@/design-tokens";
import { esStrings } from "@/i18n/es";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface EnhancedDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function EnhancedDateRangePicker({ value, onChange, className }: EnhancedDateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(new Date());

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onChange(range);
    }
  };

  const handlePresetClick = (preset: "last15" | "next15") => {
    const today = startOfDay(new Date());
    
    if (preset === "last15") {
      onChange({
        from: addDays(today, -14),
        to: today,
      });
    } else {
      onChange({
        from: today,
        to: addDays(today, 14),
      });
    }
  };

  const formatDisplayText = () => {
    if (value.from && value.to) {
      return `${format(value.from, "dd/MM/yyyy")} - ${format(value.to, "dd/MM/yyyy")}`;
    }
    if (value.from) {
      return format(value.from, "dd/MM/yyyy");
    }
    return "Seleccionar fechas";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "text-sm text-muted-foreground hover:text-foreground",
              "font-normal justify-start p-0 h-auto",
              "transition-colors duration-200"
            )}
          >
            {formatDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 shadow-lg" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Calendario doble */}
            <div className="flex">
              <Calendar
                mode="range"
                selected={value}
                onSelect={handleSelect}
                numberOfMonths={2}
                month={month}
                onMonthChange={setMonth}
                locale={es}
                className={cn(
                  "p-3 pointer-events-auto",
                  "[&_.rdp-months]:flex [&_.rdp-months]:gap-8",
                  "[&_.rdp-month]:min-w-[280px]",
                  // Estilos para el rango seleccionado
                  "[&_.rdp-day_range_start]:bg-green-600 [&_.rdp-day_range_start]:text-white",
                  "[&_.rdp-day_range_end]:bg-green-600 [&_.rdp-day_range_end]:text-white", 
                  "[&_.rdp-day_range_middle]:bg-green-100 [&_.rdp-day_range_middle]:text-green-900",
                  // Hover states
                  "[&_.rdp-day:hover]:bg-gray-100",
                  "[&_.rdp-day_selected:hover]:bg-green-700",
                  // Headers
                  "[&_.rdp-caption]:text-sm [&_.rdp-caption]:font-medium [&_.rdp-caption]:mb-4",
                  "[&_.rdp-nav_button]:w-8 [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:rounded-md",
                  "[&_.rdp-nav_button]:hover:bg-gray-100",
                  // Días de la semana
                  "[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-gray-500",
                  "[&_.rdp-head_cell]:w-10 [&_.rdp-head_cell]:h-10",
                  // Días
                  "[&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-day]:text-sm",
                  "[&_.rdp-day]:rounded-md [&_.rdp-day]:transition-colors",
                  "[&_.rdp-day]:hover:bg-gray-100 [&_.rdp-day]:focus:bg-gray-100",
                  // Estilos responsive
                  "max-w-fit"
                )}
                modifiers={{
                  range_start: value.from ? [value.from] : [],
                  range_end: value.to ? [value.to] : [],
                  range_middle: value.from && value.to ? (date: Date) => {
                    return isAfter(date, value.from!) && isBefore(date, value.to!);
                  } : [],
                }}
                modifiersStyles={{
                  range_start: { 
                    backgroundColor: designTokens.colors.calendarRangeStart,
                    color: 'white',
                    fontWeight: '600'
                  },
                  range_end: { 
                    backgroundColor: designTokens.colors.calendarRangeStart,
                    color: 'white', 
                    fontWeight: '600'
                  },
                  range_middle: { 
                    backgroundColor: designTokens.colors.calendarRange + '20',
                    color: designTokens.colors.calendarRangeStart
                  },
                }}
              />
            </div>
            
            {/* Presets */}
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs font-medium rounded-full px-4 py-2",
                  "border-gray-200 hover:bg-gray-50",
                  "transition-colors duration-200"
                )}
                onClick={() => handlePresetClick("last15")}
              >
                {esStrings.ultimosQuinceDias}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs font-medium rounded-full px-4 py-2",
                  "border-gray-200 hover:bg-gray-50",
                  "transition-colors duration-200"
                )}
                onClick={() => handlePresetClick("next15")}
              >
                {esStrings.proximosQuinceDias}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}