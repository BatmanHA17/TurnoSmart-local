import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  User, 
  Calendar, 
  Coffee, 
  MapPin, 
  FileText, 
  Edit, 
  Trash2, 
  Copy,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ShiftDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
  employee: any;
  onEdit: (shift: any) => void;
  onDelete: (shiftId: string) => void;
  onDuplicate: (shift: any) => void;
}

export function ShiftDetailsPanel({
  isOpen,
  onClose,
  shift,
  employee,
  onEdit,
  onDelete,
  onDuplicate
}: ShiftDetailsProps) {
  if (!isOpen || !shift || !employee) return null;

  const calculateDuration = () => {
    if (!shift.startTime || !shift.endTime) return "N/A";
    
    const start = new Date(`2000-01-01 ${shift.startTime}`);
    const end = new Date(`2000-01-01 ${shift.endTime}`);
    
    let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (duration < 0) {
      duration += 24; // Handle overnight shifts
    }
    
    return `${duration.toFixed(1)}h`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <Card 
        className="w-80 max-h-[80vh] overflow-y-auto bg-background border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">{shift.name || "Turno sin nombre"}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(shift.date), "EEEE, d MMMM yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(shift)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onDuplicate(shift)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(shift.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Employee Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Empleado</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="text-sm font-medium">{employee.name}</div>
              <div className="text-xs text-muted-foreground">{employee.role}</div>
              <div className="text-xs text-muted-foreground">{employee.department}</div>
            </div>
          </div>

          <Separator />

          {/* Schedule Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Horario</span>
            </div>
            
            <div className="ml-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Inicio:</span>
                <span className="text-xs font-medium">{shift.startTime || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Fin:</span>
                <span className="text-xs font-medium">{shift.endTime || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Duración:</span>
                <span className="text-xs font-medium">{calculateDuration()}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {shift.type && (
                <Badge variant="secondary" className="text-xs">
                  {shift.type === "morning" ? "Mañana" : 
                   shift.type === "afternoon" ? "Tarde" : 
                   shift.type === "night" ? "Noche" : shift.type}
                </Badge>
              )}
              {shift.isAdditionalTime && (
                <Badge variant="outline" className="text-xs">
                  Tiempo adicional
                </Badge>
              )}
              {shift.hasBreak && (
                <Badge variant="outline" className="text-xs">
                  <Coffee className="h-2 w-2 mr-1" />
                  Con pausas
                </Badge>
              )}
            </div>
          </div>

          {/* Break Info */}
          {(shift.breakType || shift.breakDuration) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Pausas</span>
                </div>
                <div className="ml-6 space-y-1">
                  {shift.breakType && (
                    <div className="text-xs text-muted-foreground">
                      Tipo: {shift.breakType}
                    </div>
                  )}
                  {shift.breakDuration && (
                    <div className="text-xs text-muted-foreground">
                      Duración: {shift.breakDuration} min
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Location */}
          {(shift.organization || shift.department) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Ubicación</span>
                </div>
                <div className="ml-6 space-y-1">
                  {shift.organization && (
                    <div className="text-xs text-muted-foreground">
                      Organización: {shift.organization}
                    </div>
                  )}
                  {shift.department && (
                    <div className="text-xs text-muted-foreground">
                      Departamento: {shift.department}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {shift.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Notas</span>
                </div>
                <div className="ml-6">
                  <p className="text-xs text-muted-foreground">{shift.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onEdit(shift)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}