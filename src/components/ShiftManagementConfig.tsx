import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, CheckCircle, Settings, Zap, Target, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShiftManagementConfigProps {
  onBack?: () => void;
}

export function ShiftManagementConfig({ onBack }: ShiftManagementConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [isShiftManagementEnabled, setIsShiftManagementEnabled] = useState(false);
  const [autoAssignEmployees, setAutoAssignEmployees] = useState(false);
  const [enableRestDays, setEnableRestDays] = useState(true);
  const [enableVersionControl, setEnableVersionControl] = useState(true);

  const handleSave = async () => {
    const success = await saveConfiguration("shift-management", {
      isShiftManagementEnabled,
      autoAssignEmployees,
      enableRestDays,
      enableVersionControl
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  const advantages = [
    {
      icon: Clock,
      title: "Optimización de Procesos",
      description: "Facilita la gestión y asignación de turnos, ahorrando tiempo y esfuerzo significativo mientras garantiza personal suficiente."
    },
    {
      icon: Zap,
      title: "Eficiencia Mejorada",
      description: "Automatiza tareas relacionadas con la gestión de horarios, permitiendo crear y asignar turnos rápidamente."
    },
    {
      icon: Target,
      title: "Precisión Mejorada",
      description: "Reduce el riesgo de errores e inconsistencias que pueden impactar significativamente los resultados del negocio."
    },
    {
      icon: MessageSquare,
      title: "Mejor Comunicación",
      description: "Mejora la colaboración entre empleados, manteniéndolos organizados y reduciendo malentendidos sobre horarios."
    }
  ];

  return (
    <div className="space-y-8">{/* Removed duplicate header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Turnos</h1>
        <p className="text-muted-foreground">
          Configure la herramienta de gestión de turnos para optimizar la programación de empleados y mejorar la eficiencia operativa.
        </p>
      </div>

      {/* Advantages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Ventajas de la Gestión de Turnos
          </CardTitle>
          <CardDescription>
            Beneficios clave de implementar la herramienta de gestión de turnos en su organización.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advantages.map((advantage, index) => {
              const IconComponent = advantage.icon;
              return (
                <div key={index} className="flex gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">{advantage.title}</h4>
                    <p className="text-sm text-muted-foreground">{advantage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Gestión de Horarios
          </CardTitle>
          <CardDescription>
            Active y configure las opciones para la gestión automatizada de turnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Shift Management */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Activar Gestión de Turnos</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la herramienta completa de gestión de turnos con todas sus funcionalidades.
              </p>
            </div>
            <Switch
              checked={isShiftManagementEnabled}
              onCheckedChange={setIsShiftManagementEnabled}
            />
          </div>

          <Separator />

          {/* Auto-assign employees */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Asignación Automática de Empleados</Label>
              <p className="text-sm text-muted-foreground">
                Permite la asignación automática de empleados a turnos según disponibilidad y configuraciones.
              </p>
            </div>
            <Switch
              checked={autoAssignEmployees}
              onCheckedChange={setAutoAssignEmployees}
              disabled={!isShiftManagementEnabled}
            />
          </div>

          <Separator />

          {/* Rest days integration */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Integración con Días de Descanso</Label>
              <p className="text-sm text-muted-foreground">
                Aplica automáticamente las políticas de días de descanso al asignar turnos.
              </p>
            </div>
            <Switch
              checked={enableRestDays}
              onCheckedChange={setEnableRestDays}
              disabled={!isShiftManagementEnabled}
            />
          </div>

          <Separator />

          {/* Version control */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Control de Versiones de Planificación</Label>
              <p className="text-sm text-muted-foreground">
                Permite crear nuevas versiones o actualizar versiones existentes de planificación.
              </p>
            </div>
            <Switch
              checked={enableVersionControl}
              onCheckedChange={setEnableVersionControl}
              disabled={!isShiftManagementEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Assignment Process */}
      <Card>
        <CardHeader>
          <CardTitle>Proceso de Añadir Empleados</CardTitle>
          <CardDescription>
            Flujos de trabajo para incorporar empleados al sistema de gestión de turnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First time users */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Primera vez usando Turnos</h4>
              </div>
              <div className="pl-7 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ir a Turnos en la barra lateral</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Asignar personas a turnos"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar personas y fecha de entrada en vigor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir si aplicar días de descanso (opcional)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Añadir personas"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing users */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                <h4 className="font-semibold">Si ya utilizas Turnos</h4>
              </div>
              <div className="pl-7 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ir a Turnos en la barra lateral</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Desplazarse y seleccionar "Añadir personas"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir "Añadir empleados/as"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar personas y fecha efectiva</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Añadir personas"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Alternativa:</strong> También puedes agregar empleados desde sus perfiles individuales accediendo a 
              Organización → Seleccionar persona → Planificación de tiempo → Gestión de turnos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isShiftManagementEnabled} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}
