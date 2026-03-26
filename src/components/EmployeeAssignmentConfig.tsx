import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  Target,
  Settings,
  Zap,
  Shield,
  BarChart3,
  Calendar
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface EmployeeAssignmentConfigProps {
  onBack?: () => void;
}

export const EmployeeAssignmentConfig = ({ onBack }: EmployeeAssignmentConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAutoAssignment, setEnableAutoAssignment] = useState(true);
  const [assignmentMethod, setAssignmentMethod] = useState("fair_distribution");
  const [considerPreferences, setConsiderPreferences] = useState(true);
  const [respectAvailability, setRespectAvailability] = useState(true);
  const [checkConflicts, setCheckConflicts] = useState(true);
  const [notifyChanges, setNotifyChanges] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(false);

  const handleSave = async () => {
    const config = {
      enableAutoAssignment,
      assignmentMethod,
      considerPreferences,
      respectAvailability,
      checkConflicts,
      notifyChanges,
      requireConfirmation
    };
    
    const success = await saveConfiguration("employee-assignment", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Asignación de Empleados
        </h2>
        <p className="text-muted-foreground">
          Configure reglas para asignar empleados a turnos automáticamente, considerando disponibilidad, preferencias y equidad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Ventajas de la Asignación Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Eficiencia Mejorada</h4>
                <p className="text-sm text-blue-800">
                  Reduzca el tiempo dedicado a asignaciones manuales y minimice errores
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Asignación rápida basada en criterios</li>
                  <li>• Reducción de conflictos de horarios</li>
                  <li>• Distribución equitativa automática</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Distribución Equitativa</h4>
                <p className="text-sm text-green-800">
                  Asegure que la carga de trabajo se distribuya de manera justa entre empleados
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Balance de horas trabajadas</li>
                  <li>• Rotación de turnos difíciles</li>
                  <li>• Consideración de preferencias</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Cumplimiento de Políticas</h4>
                <p className="text-sm text-purple-800">
                  Garantice el cumplimiento automático de políticas laborales y regulaciones
                </p>
                <ul className="text-sm text-purple-700 space-y-1 mt-2">
                  <li>• Respeto de límites de horas</li>
                  <li>• Días de descanso obligatorios</li>
                  <li>• Validación de disponibilidad</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Métodos de Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Distribución Equitativa
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                Distribuye los turnos de manera que todos los empleados tengan cargas de trabajo similares
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Balance de horas semanales</li>
                <li>• Rotación de turnos premium</li>
                <li>• Consideración de histórico</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Basado en Preferencias
              </h4>
              <p className="text-sm text-green-800 mb-2">
                Prioriza las preferencias de horarios y disponibilidad de empleados
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Horarios preferidos por empleado</li>
                <li>• Disponibilidad declarada</li>
                <li>• Peticiones especiales</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rotación Automática
              </h4>
              <p className="text-sm text-purple-800 mb-2">
                Rota automáticamente a los empleados entre diferentes tipos de turnos
              </p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Turnos mañana/tarde/noche</li>
                <li>• Fines de semana rotativos</li>
                <li>• Turnos especiales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-auto-assignment">Habilitar asignación automática</Label>
                <p className="text-sm text-muted-foreground">
                  Activar la asignación automática de empleados a turnos
                </p>
              </div>
              <Switch 
                id="enable-auto-assignment" 
                checked={enableAutoAssignment}
                onCheckedChange={setEnableAutoAssignment}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Método de asignación predeterminado</Label>
              <Select value={assignmentMethod} onValueChange={setAssignmentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fair_distribution">Distribución equitativa</SelectItem>
                  <SelectItem value="preferences_based">Basado en preferencias</SelectItem>
                  <SelectItem value="automatic_rotation">Rotación automática</SelectItem>
                  <SelectItem value="seniority_based">Basado en antigüedad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="consider-preferences">Considerar preferencias</Label>
                <p className="text-sm text-muted-foreground">
                  Tener en cuenta las preferencias de horarios de empleados
                </p>
              </div>
              <Switch 
                id="consider-preferences" 
                checked={considerPreferences}
                onCheckedChange={setConsiderPreferences}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="respect-availability">Respetar disponibilidad</Label>
                <p className="text-sm text-muted-foreground">
                  No asignar turnos fuera de la disponibilidad declarada
                </p>
              </div>
              <Switch 
                id="respect-availability" 
                checked={respectAvailability}
                onCheckedChange={setRespectAvailability}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="check-conflicts">Verificar conflictos</Label>
                <p className="text-sm text-muted-foreground">
                  Verificar automáticamente conflictos de horarios
                </p>
              </div>
              <Switch 
                id="check-conflicts" 
                checked={checkConflicts}
                onCheckedChange={setCheckConflicts}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-changes">Notificar cambios</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones de asignaciones automáticas
                </p>
              </div>
              <Switch 
                id="notify-changes" 
                checked={notifyChanges}
                onCheckedChange={setNotifyChanges}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-confirmation">Requerir confirmación</Label>
                <p className="text-sm text-muted-foreground">
                  Requerir confirmación antes de aplicar asignaciones
                </p>
              </div>
              <Switch 
                id="require-confirmation" 
                checked={requireConfirmation}
                onCheckedChange={setRequireConfirmation}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
              Guardar
            </Button>
            <Button variant="outline">Restablecer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};