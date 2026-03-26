import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Users, Coffee } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface ShiftBulkActionsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployees: Set<string>;
  selectedDays: Set<string>;
  employees: any[];
  weekDays: Date[];
  onBulkAssign: (data: any) => void;
}

export function ShiftBulkActions({ 
  isOpen, 
  onClose, 
  selectedEmployees, 
  selectedDays, 
  employees, 
  weekDays,
  onBulkAssign 
}: ShiftBulkActionsProps) {
  const [actionType, setActionType] = useState<"assign" | "rest">("assign");
  const [shiftTemplate, setShiftTemplate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [addBreaks, setAddBreaks] = useState(false);
  const [breakDuration, setBreakDuration] = useState("30");

  if (!isOpen) return null;

  const selectedEmployeeNames = employees
    .filter(emp => selectedEmployees.has(emp.id))
    .map(emp => emp.name);

  const selectedDayNames = weekDays
    .filter((_, index) => selectedDays.has(format(weekDays[index], "yyyy-MM-dd")))
    .map(day => format(day, "EEE d", { locale: es }));

  const handleBulkAction = () => {
    if (selectedEmployees.size === 0 && selectedDays.size === 0) {
      toast.error("Selecciona empleados o días para continuar");
      return;
    }

    const bulkData = {
      type: actionType,
      employees: Array.from(selectedEmployees),
      days: Array.from(selectedDays),
      shiftData: actionType === "assign" ? {
        template: shiftTemplate,
        startTime,
        endTime,
        addBreaks,
        breakDuration: addBreaks ? breakDuration : null
      } : null
    };

    onBulkAssign(bulkData);
    toast.success(
      actionType === "assign" 
        ? `Turnos asignados a ${selectedEmployees.size} empleados en ${selectedDays.size} días`
        : `Días de descanso añadidos a ${selectedEmployees.size} empleados en ${selectedDays.size} días`
    );
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-96 max-h-[80vh] overflow-y-auto bg-background border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Acciones en lote</h3>
            <p className="text-xs text-muted-foreground">
              Aplica cambios a múltiples empleados y días de una vez
            </p>
          </div>

          {/* Action Type Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Tipo de acción</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={actionType === "assign" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActionType("assign")}
              >
                <Clock className="h-3 w-3 mr-1" />
                Asignar turnos
              </Button>
              <Button
                variant={actionType === "rest" ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActionType("rest")}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Días de descanso
              </Button>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Selección actual</Label>
            <div className="bg-muted/30 p-3 rounded-lg space-y-2">
              {selectedEmployees.size > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="h-3 w-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">
                      {selectedEmployees.size} empleado{selectedEmployees.size > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedEmployeeNames.slice(0, 3).join(', ')}
                      {selectedEmployeeNames.length > 3 && ` y ${selectedEmployeeNames.length - 3} más`}
                    </div>
                  </div>
                </div>
              )}
              {selectedDays.size > 0 && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-3 w-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">
                      {selectedDays.size} día{selectedDays.size > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedDayNames.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {actionType === "assign" && (
            <div className="space-y-3">
              {/* Shift Template */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Plantilla de turno</Label>
                <Select value={shiftTemplate} onValueChange={setShiftTemplate}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Turno mañana (09:00 - 17:00)</SelectItem>
                    <SelectItem value="afternoon">Turno tarde (14:00 - 22:00)</SelectItem>
                    <SelectItem value="night">Turno noche (22:00 - 06:00)</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shiftTemplate === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Hora inicio</Label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-8 px-2 text-xs border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Hora fin</Label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-8 px-2 text-xs border rounded-md"
                    />
                  </div>
                </div>
              )}

              {/* Breaks */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addBreaks"
                  checked={addBreaks}
                  onCheckedChange={(checked) => setAddBreaks(checked === true)}
                />
                <Label htmlFor="addBreaks" className="text-xs">
                  Añadir pausas automáticamente
                </Label>
              </div>

              {addBreaks && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Duración de pausa</Label>
                  <Select value={breakDuration} onValueChange={setBreakDuration}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleBulkAction}
            >
              {actionType === "assign" ? "Asignar turnos" : "Añadir descansos"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}