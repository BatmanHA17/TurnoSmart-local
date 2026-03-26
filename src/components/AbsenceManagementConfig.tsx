import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { 
  CalendarMinus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  Plus,
  Settings,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react";

interface AbsenceManagementConfigProps {
  onBack?: () => void;
}

export const AbsenceManagementConfig = ({ onBack }: AbsenceManagementConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAbsenceManagement, setEnableAbsenceManagement] = useState(true);

  const handleSave = async () => {
    const config = {
      enableAbsenceManagement
    };
    
    const success = await saveConfiguration("absence-management", config);
    if (success && onBack) {
      onBack();
    }
  };
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarMinus className="h-6 w-6 text-primary" />
          Gestión de Ausencias en Turnos
        </h2>
        <p className="text-muted-foreground">
          Gestiona las ausencias directamente desde la aplicación de turnos para un proceso más ágil y unificado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Funcionalidades Principales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Plus className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Agregar Ausencias</h4>
                <p className="text-sm text-muted-foreground">
                  Usuarios con permiso "Crear ausencias" pueden agregar ausencias desde la página de turnos
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Seleccionar turno o celda del empleado</li>
                  <li>• Completar detalles de la ausencia</li>
                  <li>• Enviar solicitud directamente</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Aprobar/Rechazar Ausencias</h4>
                <p className="text-sm text-muted-foreground">
                  Managers pueden revisar solicitudes pendientes sin salir de la vista de turnos
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Seleccionar celdas con ausencias pendientes</li>
                  <li>• Aprobar o rechazar con la misma interfaz</li>
                  <li>• Proporcionar motivo en caso de rechazo</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Eliminar Ausencias</h4>
                <p className="text-sm text-muted-foreground">
                  Usuarios con permisos pueden eliminar ausencias aprobadas
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Seleccionar celda con ausencia aprobada</li>
                  <li>• El turno vuelve automáticamente a estado borrador</li>
                  <li>• Se puede volver a publicar el turno</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Comportamiento de Turnos y Ausencias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Estado de Cobertura
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Los turnos que se superpongan a una ausencia aprobada pasarán automáticamente al estado de cobertura, siendo visibles solo para managers.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50 border-green-200">
                Aprobada
              </Badge>
              <span className="text-sm">Ausencia permanente, turnos en cobertura</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-yellow-50 border-yellow-200">
                Pendiente
              </Badge>
              <span className="text-sm">Esperando aprobación del manager</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-gray-50 border-gray-200">
                Borrador
              </Badge>
              <span className="text-sm">Turno normal, visible para empleados</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Casos de Uso Ejemplo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Aprobar Solicitud de Ausencia</h4>
              <p className="text-sm text-muted-foreground">
                Empleada solicita ausencia → Manager revisa y aprueba → Turnos pasan a estado cobertura
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Editar Ausencia Aprobada</h4>
              <p className="text-sm text-muted-foreground">
                Manager extiende ausencia → Modifica desde turnos → Período actualizado se refleja inmediatamente
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium">Eliminar Ausencia</h4>
              <p className="text-sm text-muted-foreground">
                Manager elimina ausencia → Turnos vuelven a borrador → Visibles nuevamente para empleado
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Agregar Nueva Ausencia</h4>
              <p className="text-sm text-muted-foreground">
                Manager asigna ausencia → Selecciona política → Si hay turnos, pasan a cobertura
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-absence-management">Habilitar gestión de ausencias en turnos</Label>
                <p className="text-sm text-muted-foreground">
                  Permite gestionar ausencias directamente desde la vista de turnos
                </p>
              </div>
              <Switch id="enable-absence-management" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-coverage-state">Estado automático de cobertura</Label>
                <p className="text-sm text-muted-foreground">
                  Los turnos con ausencias aprobadas pasan automáticamente a cobertura
                </p>
              </div>
              <Switch id="auto-coverage-state" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-absence-details">Mostrar detalles de ausencia en turnos</Label>
                <p className="text-sm text-muted-foreground">
                  Visualizar tipo y duración de ausencia en las celdas de turnos
                </p>
              </div>
              <Switch id="show-absence-details" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quick-approval">Aprobación rápida</Label>
                <p className="text-sm text-muted-foreground">
                  Permite aprobar/rechazar ausencias con un solo clic
                </p>
              </div>
              <Switch id="quick-approval" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notificaciones de cambios</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones cuando cambien estados de ausencias
                </p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">Guardar</Button>
            <Button variant="outline">Restablecer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};