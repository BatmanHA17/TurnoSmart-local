import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Moon, Clock, Calendar, AlertCircle, Info, Settings, Eye, Coffee, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NightShiftConfigProps {
  onBack?: () => void;
}

export function NightShiftConfig({ onBack }: NightShiftConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const navigate = useNavigate();
  const [enableNightShifts, setEnableNightShifts] = useState(true);
  const [hourRecordingMethod, setHourRecordingMethod] = useState("start-day");
  const [autoSplitBreaks, setAutoSplitBreaks] = useState(true);
  const [showSplitView, setShowSplitView] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState("");

  const recordingOptions = [
    {
      value: "start-day",
      title: "El día en que comenzó el turno",
      description: "Todas las horas se registrarán el mismo día, sin importar cuándo termine el turno.",
      example: "Turno de 22:00 a 06:00 → todas las horas registradas el primer día",
      icon: Clock
    },
    {
      value: "calendar-date",
      title: "A la fecha de calendario",
      description: "Las horas aparecerán en los días a los que pertenecen según el calendario.",
      example: "Turno de 22:00 a 06:00 → 2 horas en el primer día, 6 horas en el segundo día",
      icon: Calendar
    }
  ];

  const considerations = [
    {
      title: "Descansos después de medianoche",
      description: "Si un empleado realiza un descanso después de las 12:00, este se dividirá en dos días.",
      icon: Coffee,
      type: "warning"
    },
    {
      title: "Turnos de más de 24 horas",
      description: "Si un turno dura más de 24 horas después de las 12:00, aparecerá distribuido en múltiples días.",
      icon: Clock,
      type: "info"
    },
    {
      title: "Horas trabajadas no afectadas",
      description: "No se suman ni restan horas adicionales, las horas simplemente se dividen en días diferentes.",
      icon: CheckCircle,
      type: "success"
    }
  ];

  const handleSave = async () => {
    const success = await saveConfiguration("night-shifts", {
      enableNightShifts,
      hourRecordingMethod,
      autoSplitBreaks,
      showSplitView,
      effectiveDate
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-8">{/* Removed duplicate header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Turnos Nocturnos</h1>
        <p className="text-muted-foreground">
          Configure cómo registrar las horas de turnos que cruzan la medianoche y abarcan múltiples días.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            Flexibilidad en el Registro de Turnos Nocturnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Con esta configuración tienes la flexibilidad de elegir si considerar un turno como perteneciente 
            al día de inicio o al día calendario en el que se trabaja. Esta decisión afecta cómo se visualizan 
            y calculan las horas en reportes y planificación.
          </p>
        </CardContent>
      </Card>

      {/* Configuration Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-500" />
            Cómo Configurar Turnos Nocturnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">1</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ir a "Configuración" en la barra lateral</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">2</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">En "Tiempo", hacer clic en "Control de horario"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">3</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Desplazarse hasta encontrar "Turnos de noche"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">4</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Elegir la opción que mejor se adapte</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">5</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Hacer clic en "Aplicar" y seleccionar fecha efectiva</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Method Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opciones de Registro de Horas</CardTitle>
          <CardDescription>
            Selecciona cómo quieres que se registren las horas de los turnos nocturnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={hourRecordingMethod} onValueChange={setHourRecordingMethod}>
            <div className="space-y-4">
              {recordingOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <Label htmlFor={option.value} className="text-base font-medium cursor-pointer">
                          {option.title}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      <div className="bg-muted/50 p-3 rounded border-l-4 border-l-primary/30">
                        <p className="text-sm font-medium">Ejemplo:</p>
                        <p className="text-sm text-muted-foreground">{option.example}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Important Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Consideraciones Importantes
          </CardTitle>
          <CardDescription>
            Aspectos clave a tener en cuenta al configurar turnos nocturnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {considerations.map((consideration, index) => {
              const IconComponent = consideration.icon;
              const bgColor = consideration.type === "warning" ? "bg-orange-50 dark:bg-orange-950/20" :
                             consideration.type === "success" ? "bg-green-50 dark:bg-green-950/20" :
                             "bg-blue-50 dark:bg-blue-950/20";
              const iconColor = consideration.type === "warning" ? "text-orange-500" :
                               consideration.type === "success" ? "text-green-500" :
                               "text-blue-500";
              
              return (
                <div key={index} className={`p-4 rounded-lg ${bgColor}`}>
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{consideration.title}</h4>
                      <p className="text-xs text-muted-foreground">{consideration.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Cuando realices una edición, afectará solo a los turnos futuros. 
              No puedes editar una fecha de entrada en vigor en el pasado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Display in Shift Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-500" />
            Visualización en Gestión de Turnos
          </CardTitle>
          <CardDescription>
            Cómo se muestran los turnos nocturnos según la configuración elegida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar date view */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold">Divididos por Fecha de Calendario</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Los turnos nocturnos se mostrarán en ambos días del calendario.
                </p>
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-2">Ejemplo: Turno 22:00 - 06:00</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded border border-blue-200">
                      <div className="font-medium">Lunes</div>
                      <div>22:00 - 00:00</div>
                      <div className="text-muted-foreground">2 horas</div>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded border border-blue-200">
                      <div className="font-medium">Martes</div>
                      <div>00:00 - 06:00</div>
                      <div className="text-muted-foreground">6 horas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Start day view */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold">Día de Inicio del Turno</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Los turnos nocturnos se mostrarán solo en el primer día.
                </p>
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-2">Ejemplo: Turno 22:00 - 06:00</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded border border-green-200">
                      <div className="font-medium">Lunes</div>
                      <div>22:00 - 06:00 +1d</div>
                      <div className="text-muted-foreground">8 horas total</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 opacity-50">
                      <div className="font-medium">Martes</div>
                      <div>Sin registro</div>
                      <div className="text-muted-foreground">0 horas</div>
                    </div>
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
          <CardTitle>Opciones de Configuración</CardTitle>
          <CardDescription>
            Configure las opciones avanzadas para la gestión de turnos nocturnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable night shifts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Habilitar gestión de turnos nocturnos</Label>
              <p className="text-sm text-muted-foreground">
                Activa la funcionalidad especial para manejar turnos que cruzan la medianoche.
              </p>
            </div>
            <Switch
              checked={enableNightShifts}
              onCheckedChange={setEnableNightShifts}
            />
          </div>

          <Separator />

          {/* Auto split breaks */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">División automática de descansos</Label>
              <p className="text-sm text-muted-foreground">
                Divide automáticamente los descansos que cruzan la medianoche en dos días.
              </p>
            </div>
            <Switch
              checked={autoSplitBreaks}
              onCheckedChange={setAutoSplitBreaks}
              disabled={!enableNightShifts}
            />
          </div>

          <Separator />

          {/* Show split view */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Mostrar vista dividida en calendario</Label>
              <p className="text-sm text-muted-foreground">
                Muestra visualmente cómo se dividen los turnos nocturnos en el calendario.
              </p>
            </div>
            <Switch
              checked={showSplitView}
              onCheckedChange={setShowSplitView}
              disabled={!enableNightShifts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!enableNightShifts} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}