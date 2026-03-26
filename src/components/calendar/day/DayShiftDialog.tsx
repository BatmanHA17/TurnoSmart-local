import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftBlockDay } from "@/hooks/useDayCalendarData";
import { Trash2, Clock, Info } from "lucide-react";
import { isOvernightShift } from "@/utils/shiftOvernight";
import { SHIFT_TYPES, getShiftType, shiftRequiresTime } from "@/constants/shiftTypes";
import { Badge } from "@/components/ui/badge";

interface DayShiftDialogProps {
  shift: ShiftBlockDay | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (shiftId: string, updates: Partial<ShiftBlockDay>) => Promise<void>;
  onDelete: (shiftId: string) => Promise<void>;
}

export function DayShiftDialog({
  shift,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: DayShiftDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ShiftBlockDay>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!shift) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_duration: shift.break_duration || "",
      notes: shift.notes || "",
      color: shift.color
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(shift.id, editData);
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error updating shift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este turno?")) return;
    
    setIsSaving(true);
    try {
      await onDelete(shift.id);
      onClose();
    } catch (error) {
      console.error("Error deleting shift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isOvernight = shift.start_time && shift.end_time 
    ? isOvernightShift(shift.start_time, shift.end_time)
    : false;

  const currentShiftType = getShiftType(shift.shift_name);
  const requiresTime = editData.shift_name ? shiftRequiresTime(editData.shift_name) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Editar turno" : "Detalles del turno"}
            {isOvernight && (
              <Badge variant="secondary">Nocturno</Badge>
            )}
            {currentShiftType && (
              <Badge 
                variant="outline"
                style={{ backgroundColor: currentShiftType.color + '20', borderColor: currentShiftType.color }}
              >
                {currentShiftType.code}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isEditing ? (
            <>
              <div>
                <Label className="text-muted-foreground">Empleado</Label>
                <p className="text-sm font-medium">{shift.employee_name}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Tipo de turno</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{shift.shift_name}</p>
                  {currentShiftType && (
                    <span className="text-xs text-muted-foreground">
                      ({currentShiftType.description})
                    </span>
                  )}
                </div>
              </div>

              {shift.start_time && shift.end_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {shift.start_time} - {shift.end_time}
                  </span>
                  {shift.break_duration && (
                    <span className="text-xs text-muted-foreground">
                      (Descanso: {shift.break_duration})
                    </span>
                  )}
                </div>
              )}

              {shift.notes && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="text-sm">{shift.notes}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <Label>Tipo de turno</Label>
                <Select
                  value={editData.shift_name || ""}
                  onValueChange={(value) => {
                    const shiftType = getShiftType(value);
                    setEditData({ 
                      ...editData, 
                      shift_name: value,
                      color: shiftType?.color || editData.color
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SHIFT_TYPES).map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="font-medium">{type.code}</span>
                          <span className="text-muted-foreground">- {type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editData.shift_name && getShiftType(editData.shift_name) && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {getShiftType(editData.shift_name)?.description}
                  </p>
                )}
              </div>

              {requiresTime && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Hora inicio</Label>
                      <Input
                        type="time"
                        value={editData.start_time || ""}
                        onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Hora fin</Label>
                      <Input
                        type="time"
                        value={editData.end_time || ""}
                        onChange={(e) => setEditData({ ...editData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descanso</Label>
                    <Input
                      placeholder="ej: 30min"
                      value={editData.break_duration || ""}
                      onChange={(e) => setEditData({ ...editData, break_duration: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Notas</Label>
                <Input
                  value={editData.notes || ""}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
                <Button onClick={handleEdit}>
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
