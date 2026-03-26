import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachWeekOfInterval,
  eachDayOfInterval,
  addMonths,
  subMonths
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CleanShiftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  employees: { id: string; name: string }[];
  onSuccess?: () => void;
}

type CleanMode = "month" | "weeks" | "days";

export function CleanShiftsDialog({ 
  open, 
  onOpenChange, 
  currentDate,
  employees,
  onSuccess 
}: CleanShiftsDialogProps) {
  const { currentOrg } = useCurrentOrganization();
  
  const [cleanMode, setCleanMode] = useState<CleanMode>("month");
  const [selectedMonth, setSelectedMonth] = useState<Date>(currentDate);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<{ count: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Generar semanas del mes seleccionado
  const weeksOfMonth = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    
    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      // Solo ajustar inicio si es antes del mes, pero NUNCA truncar el final (L-D completo)
      const actualStart = weekStart < start ? start : weekStart;
      
      return {
        index: index + 1,
        start: actualStart,
        end: weekEnd, // Siempre incluir domingo completo
        label: `Semana ${index + 1} (${format(actualStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM', { locale: es })})`
      };
    });
  }, [selectedMonth]);

  // Calcular rango de fechas según el modo
  const getDateRange = (): { start: string; end: string } | { dates: string[] } | null => {
    if (cleanMode === "month") {
      return {
        start: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
        end: format(endOfMonth(selectedMonth), 'yyyy-MM-dd')
      };
    }
    
    if (cleanMode === "weeks" && selectedWeeks.length > 0) {
      const selectedWeekData = weeksOfMonth.filter(w => selectedWeeks.includes(w.index));
      if (selectedWeekData.length === 0) return null;
      
      const allDates: string[] = [];
      selectedWeekData.forEach(week => {
        const days = eachDayOfInterval({ start: week.start, end: week.end });
        days.forEach(day => allDates.push(format(day, 'yyyy-MM-dd')));
      });
      
      return { dates: allDates };
    }
    
    if (cleanMode === "days" && selectedDays.length > 0) {
      return { dates: selectedDays.map(d => format(d, 'yyyy-MM-dd')) };
    }
    
    return null;
  };

  // Calcular preview
  const calculatePreview = async () => {
    if (!currentOrg?.org_id) return;
    
    const range = getDateRange();
    if (!range) {
      setPreview(null);
      return;
    }

    try {
      let query = supabase
        .from('calendar_shifts')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', currentOrg.org_id);

      if ('start' in range && 'end' in range) {
        query = query.gte('date', range.start).lte('date', range.end);
      } else if ('dates' in range) {
        query = query.in('date', range.dates);
      }

      if (selectedEmployeeId !== "all") {
        query = query.eq('employee_id', selectedEmployeeId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error calculating preview:', error);
        return;
      }

      setPreview({ count: count || 0 });
    } catch (error) {
      console.error('Error in calculatePreview:', error);
    }
  };

  // Ejecutar limpieza
  const handleClean = async () => {
    if (!currentOrg?.org_id) return;
    
    const range = getDateRange();
    if (!range) {
      toast.error("Selecciona las fechas a limpiar");
      return;
    }

    setIsProcessing(true);
    
    try {
      let query = supabase
        .from('calendar_shifts')
        .delete()
        .eq('org_id', currentOrg.org_id);

      if ('start' in range && 'end' in range) {
        query = query.gte('date', range.start).lte('date', range.end);
      } else if ('dates' in range) {
        query = query.in('date', range.dates);
      }

      if (selectedEmployeeId !== "all") {
        query = query.eq('employee_id', selectedEmployeeId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error cleaning shifts:', error);
        toast.error("Error al limpiar turnos");
        return;
      }

      toast.success(`${preview?.count || 0} turnos eliminados correctamente`);
      onSuccess?.();
      onOpenChange(false);
      setShowConfirm(false);
    } catch (error) {
      console.error('Error in handleClean:', error);
      toast.error("Error inesperado al limpiar turnos");
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle semana
  const toggleWeek = (weekIndex: number) => {
    setSelectedWeeks(prev => 
      prev.includes(weekIndex) 
        ? prev.filter(w => w !== weekIndex)
        : [...prev, weekIndex]
    );
  };

  // Reset al cambiar modo
  useEffect(() => {
    setSelectedWeeks([]);
    setSelectedDays([]);
    setPreview(null);
  }, [cleanMode]);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setSelectedMonth(currentDate);
      setCleanMode("month");
      setSelectedWeeks([]);
      setSelectedDays([]);
      setSelectedEmployeeId("all");
      setPreview(null);
      setShowConfirm(false);
    }
  }, [open, currentDate]);

  const canCalculate = cleanMode === "month" || 
    (cleanMode === "weeks" && selectedWeeks.length > 0) ||
    (cleanMode === "days" && selectedDays.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Limpiar Turnos
          </DialogTitle>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4">
            {/* Modo de limpieza */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Qué deseas limpiar?</Label>
              <RadioGroup value={cleanMode} onValueChange={(v) => setCleanMode(v as CleanMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month" id="month" />
                  <Label htmlFor="month" className="cursor-pointer">Mes completo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weeks" id="weeks" />
                  <Label htmlFor="weeks" className="cursor-pointer">Semanas específicas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="days" id="days" />
                  <Label htmlFor="days" className="cursor-pointer">Días específicos</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Selector de mes (para modos month y weeks) */}
            {(cleanMode === "month" || cleanMode === "weeks") && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Seleccionar mes</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex items-center justify-between p-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                      >
                        ←
                      </Button>
                      <span className="font-medium capitalize">
                        {format(selectedMonth, 'MMMM yyyy', { locale: es })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                      >
                        →
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      onSelect={(date) => date && setSelectedMonth(date)}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Selector de semanas */}
            {cleanMode === "weeks" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Seleccionar semanas</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                  {weeksOfMonth.map(week => (
                    <div key={week.index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`week-${week.index}`}
                        checked={selectedWeeks.includes(week.index)}
                        onCheckedChange={() => toggleWeek(week.index)}
                      />
                      <Label htmlFor={`week-${week.index}`} className="cursor-pointer text-sm">
                        {week.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de días específicos */}
            {cleanMode === "days" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Seleccionar días</Label>
                <Calendar
                  mode="multiple"
                  selected={selectedDays}
                  onSelect={(days) => setSelectedDays(days || [])}
                  locale={es}
                  className="rounded-md border"
                />
                {selectedDays.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedDays.slice(0, 5).map(day => (
                      <Badge key={day.toISOString()} variant="secondary" className="text-xs">
                        {format(day, 'd MMM', { locale: es })}
                      </Badge>
                    ))}
                    {selectedDays.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedDays.length - 5} más
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Filtro de empleados */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Empleados afectados</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {preview && (
              <div className={cn(
                "p-3 rounded-md border",
                preview.count > 0 ? "bg-destructive/10 border-destructive/30" : "bg-muted"
              )}>
                <p className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Se eliminarán <strong>{preview.count}</strong> turnos
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Confirmación */
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">¿Estás seguro?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta acción eliminará <strong>{preview?.count || 0} turnos</strong> de forma permanente. 
                    Esta operación no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!showConfirm ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={calculatePreview}
                disabled={!canCalculate}
              >
                Calcular
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowConfirm(true)}
                disabled={!preview || preview.count === 0}
              >
                Limpiar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Volver
              </Button>
              <Button 
                variant="destructive"
                onClick={handleClean}
                disabled={isProcessing}
              >
                {isProcessing ? "Eliminando..." : `Eliminar ${preview?.count || 0} turnos`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
