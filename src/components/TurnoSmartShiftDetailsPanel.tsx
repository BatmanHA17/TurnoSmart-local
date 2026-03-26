import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Edit, Clock, User, Calendar, MapPin, FileText, Coffee } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TurnoSmartShiftDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shift: any;
  employee: any;
  onEdit: (shift: any) => void;
}

export function TurnoSmartShiftDetailsPanel({
  isOpen,
  onClose,
  shift,
  employee,
  onEdit
}: TurnoSmartShiftDetailsPanelProps) {
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
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Panel deslizante desde la derecha - Estilo TurnoSmart */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{shift.name || "Turno sin nombre"}</h3>
            <p className="text-xs text-gray-500">
              {format(new Date(shift.date), "EEEE, d MMMM yyyy", { locale: es })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto h-full pb-20">
          {/* Employee Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-xs font-medium">Empleado</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
              <div className="text-xs text-gray-500">{employee.role}</div>
              <div className="text-xs text-gray-500">{employee.department}</div>
            </div>
          </div>

          <Separator />

          {/* Schedule Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Horario</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">Hora de inicio:</span>
                <span className="text-xs font-medium text-gray-900">{shift.startTime || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">Hora de fin:</span>
                <span className="text-xs font-medium text-gray-900">{shift.endTime || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500">Duración:</span>
                <span className="text-xs font-medium text-gray-900">{calculateDuration()}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          {(shift.type || shift.isAdditionalTime || shift.hasBreak) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600">Características</div>
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
            </>
          )}

          {/* Break Info */}
          {(shift.breakType || shift.breakDuration) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Coffee className="h-4 w-4" />
                  <span className="text-xs font-medium">Pausas</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  {shift.breakType && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Tipo:</span> {shift.breakType}
                    </div>
                  )}
                  {shift.breakDuration && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Duración:</span> {shift.breakDuration} min
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
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-medium">Ubicación</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  {shift.organization && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Organización:</span> {shift.organization}
                    </div>
                  )}
                  {shift.department && (
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Departamento:</span> {shift.department}
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
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">Notas</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-700">{shift.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            className="w-full"
            onClick={() => onEdit(shift)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar turno
          </Button>
        </div>
      </div>
    </>
  );
}