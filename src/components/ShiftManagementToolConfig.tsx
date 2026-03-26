import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  Target,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Settings,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ShiftManagementToolConfigProps {
  onBack?: () => void;
}

export const ShiftManagementToolConfig = ({ onBack }: ShiftManagementToolConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableShiftManagement, setEnableShiftManagement] = useState(true);
  const [autoRestDays, setAutoRestDays] = useState(true);
  const [assignmentMethod, setAssignmentMethod] = useState("individual");
  const [versionControl, setVersionControl] = useState(true);
  const [effectiveDateValidation, setEffectiveDateValidation] = useState(true);
  const [restDaysConfig, setRestDaysConfig] = useState("consecutive");

  const handleSave = async () => {
    const config = {
      enableShiftManagement,
      autoRestDays,
      assignmentMethod,
      versionControl,
      effectiveDateValidation,
      restDaysConfig
    };
    
    const success = await saveConfiguration("shift-management-tool", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Herramienta de Gestión de Turnos
        </h2>
        <p className="text-muted-foreground">
          Asigne y gestione turnos para su personal de manera eficiente, simplificando la distribución y organización de horarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ventajas de Utilizar Herramientas de Gestión de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Proceso de Programación Optimizado</h4>
                <p className="text-sm text-blue-800">
                  Facilita la gestión y asignación de turnos, ahorrando tiempo significativo y esfuerzo
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Automatización del proceso de programación</li>
                  <li>• Asegurar personal suficiente para necesidades del negocio</li>
                  <li>• Reducción drástica del tiempo de gestión</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Aumento de Eficiencia y Productividad</h4>
                <p className="text-sm text-green-800">
                  Automatiza tareas de gestión de horarios de empleados para mayor eficiencia
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Creación y asignación rápida de turnos</li>
                  <li>• Automatización de tareas repetitivas</li>
                  <li>• Optimización de recursos humanos</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Mayor Precisión</h4>
                <p className="text-sm text-purple-800">
                  Reduce riesgo de errores e inconsistencias que impactan los resultados del negocio
                </p>
                <ul className="text-sm text-purple-700 space-y-1 mt-2">
                  <li>• Minimización de errores humanos</li>
                  <li>• Consistencia en programación</li>
                  <li>• Impacto positivo en rentabilidad</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50/50">
              <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">Mejor Comunicación y Colaboración</h4>
                <p className="text-sm text-orange-800">
                  Ayuda a empleados a mantenerse organizados y reduce malentendidos
                </p>
                <ul className="text-sm text-orange-700 space-y-1 mt-2">
                  <li>• Reducción de turnos perdidos</li>
                  <li>• Claridad en horarios asignados</li>
                  <li>• Mejor organización del equipo</li>
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
            Cómo Agregar Empleados a Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Primera Vez en Turnos
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                  <span>Barra lateral → Turnos</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                  <span>Clic en "Asignar empleados a turnos"</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                  <span>Seleccionar empleados y fecha efectiva</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                  <span>Elegir si aplicar días de descanso (opcional)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
                  <span>Clic en "Agregar empleados"</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Ya Utilizando Turnos
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                  <span>Barra lateral → Turnos</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                  <span>Desplazarse y elegir "Agregar empleados"</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                  <span>Seleccionar empleados y fecha efectiva</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                  <span>Elegir si aplicar días de descanso (opcional)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
                  <span>Clic en "Agregar empleados"</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Desde Perfiles de Empleados
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                  <span>Barra lateral → Empleados → Abrir perfil</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                  <span>Abrir pestaña "Planificación de tiempo"</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                  <span>En herramienta de planificación → "Gestión de turnos"</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                  <span>Agregar días de descanso si es necesario</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
                  <span>Enviar → Elegir versión de planificación</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Planificación Efectiva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Requisito Esencial
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Para planificar turnos efectivamente, es esencial agregar empleados primero. 
              Sin empleados asignados al sistema de gestión de turnos, no se pueden crear horarios.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Empleados Asignados</h4>
                <p className="text-sm text-muted-foreground">
                  Empleados agregados al sistema de gestión de turnos y listos para programación
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Días de Descanso Configurados</h4>
                <p className="text-sm text-muted-foreground">
                  Días libres aplicados según normativa y preferencias del empleado
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Versión de Planificación</h4>
                <p className="text-sm text-muted-foreground">
                  Opción de cambiar o crear nueva versión de planificación según necesidades
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Herramienta de Gestión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-shift-management">Habilitar gestión de turnos</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar la herramienta principal de gestión de turnos
                  </p>
                </div>
                <Switch 
                  id="enable-shift-management" 
                  checked={enableShiftManagement}
                  onCheckedChange={setEnableShiftManagement}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-rest-days">Aplicar días de descanso automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Aplicar días libres por defecto al agregar empleados
                  </p>
                </div>
                <Switch 
                  id="auto-rest-days" 
                  checked={autoRestDays}
                  onCheckedChange={setAutoRestDays}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Método predeterminado de asignación</Label>
                <Select value={assignmentMethod} onValueChange={setAssignmentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Asignación individual</SelectItem>
                    <SelectItem value="bulk">Asignación masiva</SelectItem>
                    <SelectItem value="profile">Desde perfiles</SelectItem>
                    <SelectItem value="automatic">Automática</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Método preferido para asignar empleados a turnos
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="version-control">Control de versiones de planificación</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir crear y cambiar entre versiones de planificación
                  </p>
                </div>
                <Switch 
                  id="version-control" 
                  checked={versionControl}
                  onCheckedChange={setVersionControl}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="effective-date-validation">Validación de fecha efectiva</Label>
                  <p className="text-sm text-muted-foreground">
                    Validar que las fechas efectivas sean coherentes
                  </p>
                </div>
                <Switch 
                  id="effective-date-validation" 
                  checked={effectiveDateValidation}
                  onCheckedChange={setEffectiveDateValidation}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Configuración de días de descanso</Label>
                <Select value={restDaysConfig} onValueChange={setRestDaysConfig}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consecutive">Días consecutivos</SelectItem>
                    <SelectItem value="distributed">Días distribuidos</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="none">Sin restricción</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Configuración por defecto para días de descanso
                </p>
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