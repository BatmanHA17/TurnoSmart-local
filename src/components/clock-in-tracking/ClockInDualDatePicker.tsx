import * as React from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { esStrings } from "@/i18n/es";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ClockInDualDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function ClockInDualDatePicker({ value, onChange, className }: ClockInDualDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [leftMonth, setLeftMonth] = React.useState(new Date(2025, 8)); // September 2025
  const [rightMonth, setRightMonth] = React.useState(new Date(2025, 9)); // October 2025

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onChange(range);
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

  const handlePreviousMonth = () => {
    const newLeft = addMonths(leftMonth, -1);
    const newRight = addMonths(rightMonth, -1);
    setLeftMonth(newLeft);
    setRightMonth(newRight);
  };

  const handleNextMonth = () => {
    const newLeft = addMonths(leftMonth, 1);
    const newRight = addMonths(rightMonth, 1);
    setLeftMonth(newLeft);
    setRightMonth(newRight);
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* From Date */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-40 justify-start text-left font-normal px-3 py-2 h-10",
              "border-gray-300 bg-white hover:bg-gray-50",
              "text-gray-700 text-sm"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {value.from ? format(value.from, "dd/MM/yyyy") : "01/09/2025"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 shadow-lg border border-gray-200" 
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <div className="bg-white rounded-lg p-4">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                className="p-2 h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-8">
                <h3 className="text-sm font-medium text-gray-900">
                  {esStrings.septiembreCalendario} 2025
                </h3>
                <h3 className="text-sm font-medium text-gray-900">
                  {esStrings.octubreCalendario} 2025
                </h3>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="p-2 h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Dual Calendar */}
            <div className="flex gap-4">
              {/* Left Calendar - September */}
              <Calendar
                mode="range"
                selected={value}
                onSelect={handleSelect}
                month={leftMonth}
                locale={es}
                className="p-0 pointer-events-auto"
                classNames={{
                  months: "flex space-x-4",
                  month: "space-y-4",
                  caption: "hidden", // Hide default caption
                  caption_label: "text-sm font-medium",
                  nav: "hidden", // Hide default navigation
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "h-8 w-8"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                    "text-gray-900"
                  ),
                  day_range_start: "day-range-start bg-green-600 text-white hover:bg-green-700",
                  day_range_middle: "aria-selected:bg-green-100 aria-selected:text-green-900",
                  day_range_end: "day-range-end bg-green-600 text-white hover:bg-green-700",
                  day_selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-600 focus:text-white",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-gray-400 opacity-50",
                  day_disabled: "text-gray-400 opacity-50",
                  day_hidden: "invisible",
                }}
                showOutsideDays={false}
                numberOfMonths={1}
              />

              {/* Right Calendar - October */}
              <Calendar
                mode="range"
                selected={value}
                onSelect={handleSelect}
                month={rightMonth}
                locale={es}
                className="p-0 pointer-events-auto"
                classNames={{
                  months: "flex space-x-4",
                  month: "space-y-4",
                  caption: "hidden", // Hide default caption
                  caption_label: "text-sm font-medium",
                  nav: "hidden", // Hide default navigation
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "h-8 w-8"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                    "text-gray-900"
                  ),
                  day_range_start: "day-range-start bg-green-600 text-white hover:bg-green-700",
                  day_range_middle: "aria-selected:bg-green-100 aria-selected:text-green-900",
                  day_range_end: "day-range-end bg-green-600 text-white hover:bg-green-700",
                  day_selected: "bg-green-600 text-white hover:bg-green-700 focus:bg-green-600 focus:text-white",
                  day_today: "bg-gray-100 text-gray-900",
                  day_outside: "text-gray-400 opacity-50",
                  day_disabled: "text-gray-400 opacity-50",
                  day_hidden: "invisible",
                }}
                showOutsideDays={false}
                numberOfMonths={1}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Arrow separator */}
      <div className="text-gray-400">
        <ChevronRight className="w-4 h-4" />
      </div>

      {/* To Date - Display Only */}
      <Button
        variant="outline"
        className={cn(
          "w-40 justify-start text-left font-normal px-3 py-2 h-10",
          "border-gray-300 bg-white",
          "text-gray-700 text-sm pointer-events-none"
        )}
        disabled
      >
        <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
        <span>
          {value.to ? format(value.to, "dd/MM/yyyy") : "31/10/2025"}
        </span>
      </Button>
    </div>
  );
}