import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DateRange } from "./GoTurnoSmartManual";

interface GoTurnoStep1DateSelectionProps {
  dateRange: DateRange | null;
  onDateRangeChange: (dateRange: DateRange | null) => void;
}

export const GoTurnoStep1DateSelection = ({ 
  dateRange, 
  onDateRangeChange 
}: GoTurnoStep1DateSelectionProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.endDate);
  const [selectingEndDate, setSelectingEndDate] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!startDate || selectingEndDate) {
      // Si no hay fecha de inicio o estamos seleccionando fecha de fin
      if (!startDate) {
        // Primera selección - establecer como fecha de inicio
        setStartDate(date);
        setEndDate(undefined);
        setSelectingEndDate(true);
        onDateRangeChange(null);
        
        // Auto-close start popover on mobile
        if (isMobile) {
          setStartPopoverOpen(false);
          // Auto-open end popover for smooth UX
          setTimeout(() => setEndPopoverOpen(true), 100);
        }
      } else {
        // Segunda selección - establecer como fecha de fin
        const finalEndDate = date < startDate ? startDate : date;
        setEndDate(finalEndDate);
        setSelectingEndDate(false);
        onDateRangeChange({ startDate, endDate: finalEndDate });
        
        // Auto-close all popovers on mobile when both dates are selected
        if (isMobile) {
          setEndPopoverOpen(false);
          setStartPopoverOpen(false);
        }
      }
    } else {
      // Si ya tenemos ambas fechas, reiniciar el proceso
      setStartDate(date);
      setEndDate(undefined);
      setSelectingEndDate(true);
      onDateRangeChange(null);
      
      // Auto-close start popover on mobile
      if (isMobile) {
        setStartPopoverOpen(false);
        setTimeout(() => setEndPopoverOpen(true), 100);
      }
    }
  };

  const clearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectingEndDate(false);
    setStartPopoverOpen(false);
    setEndPopoverOpen(false);
    onDateRangeChange(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Paso 1: Selección de Fechas
        </CardTitle>
        <CardDescription>
          Selecciona el período para el que deseas crear el turno público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mobile-friendly date selection summary */}
        {isMobile && dateRange && (
          <div 
            className="p-3 bg-primary/5 rounded-lg border cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => {
              setSelectingEndDate(false);
              setStartPopoverOpen(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Período seleccionado</p>
                <p className="text-xs text-muted-foreground">
                  {format(dateRange.startDate, "dd/MM/yyyy", { locale: es })} - {format(dateRange.endDate, "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Inicio</label>
            <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    // If dates are already selected, reset to edit mode
                    if (dateRange) {
                      setSelectingEndDate(false);
                    }
                  }}
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs md:text-sm",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  {startDate ? (
                    <span className="truncate">
                      {isMobile 
                        ? format(startDate, "dd/MM/yyyy", { locale: es })
                        : format(startDate, "PPP", { locale: es })
                      }
                    </span>
                  ) : (
                    <span className="truncate">Selecciona fecha de inicio</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectingEndDate ? undefined : startDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Fin</label>
            <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!startDate}
                  onClick={() => {
                    // If both dates are already selected, allow editing end date
                    if (dateRange && startDate) {
                      setSelectingEndDate(true);
                    }
                  }}
                  className={cn(
                    "w-full justify-start text-left font-normal text-xs md:text-sm",
                    !endDate && "text-muted-foreground",
                    !startDate && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  {endDate ? (
                    <span className="truncate">
                      {isMobile 
                        ? format(endDate, "dd/MM/yyyy", { locale: es })
                        : format(endDate, "PPP", { locale: es })
                      }
                    </span>
                  ) : selectingEndDate ? (
                    <span className="text-green-600 truncate">Selecciona fecha de fin</span>
                  ) : (
                    <span className="truncate">Selecciona fecha de fin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectingEndDate ? endDate : undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Desktop date range summary */}
        {!isMobile && dateRange && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Período Seleccionado
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Desde <strong>{format(dateRange.startDate, "PPP", { locale: es })}</strong> hasta{" "}
              <strong>{format(dateRange.endDate, "PPP", { locale: es })}</strong>
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Total de días: {Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}
            </p>
          </div>
        )}

        {(startDate || endDate) && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={clearDates} size="sm">
              Limpiar fechas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};