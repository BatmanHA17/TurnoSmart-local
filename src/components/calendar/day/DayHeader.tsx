import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { ViewModeSelector } from "@/components/calendar/ViewModeSelector";
import { cn } from "@/lib/utils";

interface DayHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function DayHeader({
  selectedDate,
  onDateChange,
  selectedOrgId,
  onOrgChange,
  searchTerm,
  onSearchChange
}: DayHeaderProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };


  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: View Mode & Organization Selector */}
        <div className="flex items-center gap-3">
          <ViewModeSelector />
          <OrganizationFilter
            value={selectedOrgId}
            onChange={onOrgChange}
            variant="select"
            className="w-[220px]"
          />
        </div>

        {/* Center: Day Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={handleToday}
            className="h-9"
          >
            Hoy
          </Button>

          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[160px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "dd/MM/yyyy")
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setShowCalendar(false);
                  }
                }}
                locale={es}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-[200px] pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
