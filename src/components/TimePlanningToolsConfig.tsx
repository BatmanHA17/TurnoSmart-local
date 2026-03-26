import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, FileText, Users, Settings, Plus, MoreHorizontal, Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TimePlanningToolsConfigProps {
  onBack?: () => void;
}

export function TimePlanningToolsConfig({ onBack }: TimePlanningToolsConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [defaultPlanningTool, setDefaultPlanningTool] = useState("contract-hours");
  const [allowVersionManagement, setAllowVersionManagement] = useState(true);
  const [allowPastDates, setAllowPastDates] = useState(true);
  const [autoApplyChanges, setAutoApplyChanges] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);

  const planningTools = [
    {
      id: "shift-management",
      title: "Gestión de Turnos",
      description: "Permite crear y gestionar turnos para empleados, asegurando cobertura completa y organización clara.",
      icon: Users,
      features: [
        "Creación de turnos rotativos",
        "Visión general de quién trabaja y cuándo",
        "Prevención de conflictos de organización",
        "Planificación por períodos determinados"
      ],
      example: "Turnos rotativos de mañana, tarde y noche para personal de hotel"
    },
    {
      id: "work-schedules",
      title: "Horarios Laborales",
      description: "Crear y asignar horarios de trabajo según las necesidades de la empresa, fijos o flexibles.",
      icon: Clock,
      features: [
        "Horarios fijos (ej: 9:00-18:00)",
        "Horarios flexibles con horas mínimas",
        "Configuración por días de la semana",
        "Adaptación a necesidades específicas"
      ],
      example: "Lunes a viernes 9:00-18:00 o flexible con 8 horas diarias"
    },
    {
      id: "contract-hours",
      title: "Horas de Contrato",
      description: "Establece días y cantidad de horas semanales esperadas según el contrato del empleado.",
      icon: FileText,
      features: [
        "Control basado en horas contractuales",
        "Cálculo automático de horas mensuales",
        "Integración con nóminas",
        "Seguimiento de cumplimiento contractual"
      ],
      example: "40 horas semanales según contrato estándar de 8 horas diarias"
    }
  ];

  const handleSave = async () => {
    const success = await saveConfiguration("time-planning-tools", {
      defaultPlanningTool,
      allowVersionManagement,
      allowPastDates,
      autoApplyChanges,
      requireApproval
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-8">{/* Removed duplicate padding and header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Herramientas de Planificación del Tiempo</h1>
        <p className="text-muted-foreground">
          Configure las herramientas que permiten asignar y gestionar el método de control horario de cada empleado.
        </p>
      </div>

      {/* Overview */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Las herramientas de planificación determinan cómo los empleados registran sus horas de trabajo, 
          asegurando el cumplimiento de la normativa laboral y el procesamiento preciso de las nóminas.
        </AlertDescription>
      </Alert>

      {/* Planning Tools Overview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Herramientas Disponibles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {planningTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Card key={tool.id} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Características:</h4>
                    <ul className="space-y-1">
                      {tool.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Ejemplo:</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {tool.example}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Access Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Dónde Encontrar las Herramientas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">1</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ir a "Organización" en la barra lateral</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">2</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Abrir el perfil de un empleado</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">3</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ir a la pestaña "Planificación del tiempo"</p>
              </div>
            </div>
          </div>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              Los empleados también pueden ver sus versiones de planificación del tiempo en la sección "Mi perfil".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Version Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Gestión de Versiones de Planificación
          </CardTitle>
          <CardDescription>
            Configure cómo se manejan las diferentes versiones de planificación del tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creating new versions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold">Crear Nueva Versión</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Útil cuando los empleados cambian de horarios (ej: de horario fijo a turnos rotativos).
              </p>
              <div className="pl-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "+"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar herramienta de planificación</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir fecha de vigencia</p>
                    <p className="text-xs text-muted-foreground">
                      Debe ser posterior al inicio del contrato (pasado o futuro)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Crear nueva versión"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Managing existing versions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MoreHorizontal className="h-4 w-4 text-orange-500" />
                <h4 className="font-semibold">Gestionar Versiones Existentes</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Cambiar fechas o eliminar versiones de planificación.
              </p>
              <div className="pl-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pasar el ratón sobre la versión</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "(...)"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar opción:</p>
                    <ul className="text-xs text-muted-foreground ml-2">
                      <li>• Cambiar fecha de versión</li>
                      <li>• Eliminar versión de planificación</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Configure las opciones globales para las herramientas de planificación del tiempo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default planning tool */}
          <div className="space-y-3">
            <Label className="text-base">Herramienta de planificación predeterminada</Label>
            <Select value={defaultPlanningTool} onValueChange={setDefaultPlanningTool}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar herramienta predeterminada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract-hours">Horas de Contrato</SelectItem>
                <SelectItem value="work-schedules">Horarios Laborales</SelectItem>
                <SelectItem value="shift-management">Gestión de Turnos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Cada usuario tendrá esta planificación configurada por defecto basada en las horas del contrato.
            </p>
          </div>

          <Separator />

          {/* Version management options */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir gestión de versiones</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la creación, modificación y eliminación de versiones de planificación.
              </p>
            </div>
            <Switch
              checked={allowVersionManagement}
              onCheckedChange={setAllowVersionManagement}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir fechas en el pasado</Label>
              <p className="text-sm text-muted-foreground">
                Permite crear versiones con fechas de vigencia anteriores a la fecha actual.
              </p>
            </div>
            <Switch
              checked={allowPastDates}
              onCheckedChange={setAllowPastDates}
              disabled={!allowVersionManagement}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Aplicar cambios automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Los cambios en la planificación se aplican inmediatamente sin requerir confirmación.
              </p>
            </div>
            <Switch
              checked={autoApplyChanges}
              onCheckedChange={setAutoApplyChanges}
              disabled={!allowVersionManagement}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Requerir aprobación para cambios</Label>
              <p className="text-sm text-muted-foreground">
                Los cambios en la planificación requieren aprobación antes de aplicarse.
              </p>
            </div>
            <Switch
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
              disabled={!allowVersionManagement || autoApplyChanges}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}