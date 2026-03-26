import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Plus, Clock, Palette, Coffee, Users, Settings, Eye, Info, Repeat } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RotatingShiftsConfigProps {
  onBack?: () => void;
}

export function RotatingShiftsConfig({ onBack }: RotatingShiftsConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [enableRotatingShifts, setEnableRotatingShifts] = useState(true);
  const [defaultPatternLength, setDefaultPatternLength] = useState("weekly");
  const [allowCustomBreaks, setAllowCustomBreaks] = useState(true);
  const [autoAssignColors, setAutoAssignColors] = useState(true);
  const [requireWorkLocation, setRequireWorkLocation] = useState(false);

  const shiftPatterns = [
    {
      name: "Mañana",
      time: "09:00 - 13:00",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      name: "Tarde", 
      time: "14:00 - 18:00",
      color: "bg-orange-100 text-orange-800 border-orange-200"
    },
    {
      name: "Noche",
      time: "18:00 - 22:00", 
      color: "bg-purple-100 text-purple-800 border-purple-200"
    }
  ];

  const breakTypes = [
    {
      type: "Flexible",
      description: "Permite la pausa en cualquier momento durante el turno",
      icon: Clock
    },
    {
      type: "Semi-flexible", 
      description: "Permite la pausa dentro de un período de tiempo especificado",
      icon: Settings
    },
    {
      type: "Fijo",
      description: "Pausa en un momento y duración específicos",
      icon: Coffee
    }
  ];

  const handleSave = async () => {
    const config = {
      enableRotatingShifts,
      defaultPatternLength,
      allowCustomBreaks,
      autoAssignColors,
      requireWorkLocation
    };
    
    const success = await saveConfiguration("rotating-shifts", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-8">{/* Removed duplicate header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Turnos Rotativos</h1>
        <p className="text-muted-foreground">
          Configure turnos que siguen patrones específicos semanales o quincenales en bucle continuo.
        </p>
      </div>

      {/* What are rotating shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-500" />
            ¿Qué son los Turnos Rotativos?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los turnos rotativos son ideales para gestionar turnos tradicionales que siguen patrones específicos, 
            que pueden ser semanales o quincenales, y una vez cubierto todo el patrón, se repite en un bucle continuo.
          </p>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Ventaja:</strong> Este tipo de gestión de turnos es particularmente útil para fines de 
              planificación y programación, especialmente en industrias como la hotelera que requieren cobertura 24/7.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Ejemplo de patrón rotativo:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {shiftPatterns.map((pattern, index) => (
                <div key={index} className={`p-2 rounded border ${pattern.color}`}>
                  <div className="font-medium">{pattern.name}</div>
                  <div className="text-xs">{pattern.time}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Where to find */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            Dónde Encontrar Turnos Rotativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">1</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ir a "Turnos" en la barra lateral</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">2</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Hacer clic en el ícono de tres puntos (esquina superior derecha)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">3</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Hacer clic en "Configuración de Horarios"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs">4</Badge>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ir a la pestaña "Turnos rotativos"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creating rotating shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            Cómo Crear Turnos Rotativos
          </CardTitle>
          <CardDescription>
            Proceso paso a paso para configurar nuevos patrones de turnos rotativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creation steps */}
            <div className="space-y-4">
              <h4 className="font-semibold">Pasos de Creación:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "+ Nuevo turno"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Agregar nombre del horario</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Agregar horario"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Dar nombre al horario</p>
                    <p className="text-xs text-muted-foreground">
                      Para identificarlo fácilmente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir etiqueta de color</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">6</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Establecer horario de trabajo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">7</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Enviar"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration options */}
            <div className="space-y-4">
              <h4 className="font-semibold">Opciones de Configuración:</h4>
              <div className="space-y-3">
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Plus className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Múltiples períodos por día</p>
                    <p className="text-xs text-muted-foreground">
                      Usar botón "+" para agregar más turnos en un día
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Coffee className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Días de descanso</p>
                    <p className="text-xs text-muted-foreground">
                      Usar ícono de papelera para agregar día libre
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Días vacíos</p>
                    <p className="text-xs text-muted-foreground">
                      Dejar el día vacío para no asignar turno
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adding breaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-orange-500" />
            Agregar Pausas a Turnos Rotativos
          </CardTitle>
          <CardDescription>
            Configure descansos dentro de los turnos rotativos con diferentes tipos de flexibilidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Prerequisito:</strong> Asegúrate de haber definido previamente las configuraciones de 
              descanso para tu empresa en la sección de "Configuración de tiempo".
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Break addition steps */}
            <div className="space-y-4">
              <h4 className="font-semibold">Pasos para Agregar Pausas:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Abrir horario de turnos rotativos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Posicionar cursor en el turno</p>
                    <p className="text-xs text-muted-foreground">
                      Hacer clic en tres puntos → "Agregar pausa"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar pausa de la lista</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir tipo de flexibilidad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Añadir pausa"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">6</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Completar configuración</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Break types */}
            <div className="space-y-4">
              <h4 className="font-semibold">Tipos de Pausas:</h4>
              <div className="space-y-3">
                {breakTypes.map((breakType, index) => {
                  const IconComponent = breakType.icon;
                  return (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <IconComponent className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{breakType.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {breakType.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigning rotating shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Asignar Turnos Rotativos
          </CardTitle>
          <CardDescription>
            Proceso para asignar patrones de turnos rotativos a empleados específicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Pasos de Asignación:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ir a "Turnos" en la barra lateral</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "+"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir "Agregar turno rotativo"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar el turno rotativo</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">5</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar horario de inicio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">6</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar período de tiempo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">7</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Elegir lugar y área de trabajo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">8</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar empleados y "Agregar"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Recuerda publicar el calendario para que sea visible para los empleados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Horarios Rotativos</CardTitle>
          <CardDescription>
            Configure las opciones globales para la gestión de turnos rotativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable rotating shifts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Habilitar turnos rotativos</Label>
              <p className="text-sm text-muted-foreground">
                Activa la funcionalidad completa de gestión de turnos rotativos.
              </p>
            </div>
            <Switch
              checked={enableRotatingShifts}
              onCheckedChange={setEnableRotatingShifts}
            />
          </div>

          <Separator />

          {/* Default pattern length */}
          <div className="space-y-3">
            <Label className="text-base">Longitud de patrón predeterminada</Label>
            <Select value={defaultPatternLength} onValueChange={setDefaultPatternLength}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar longitud de patrón" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal (7 días)</SelectItem>
                <SelectItem value="biweekly">Quincenal (14 días)</SelectItem>
                <SelectItem value="monthly">Mensual (30 días)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Define la duración predeterminada para nuevos patrones de turnos rotativos.
            </p>
          </div>

          <Separator />

          {/* Custom breaks */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir pausas personalizadas</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la adición de pausas flexibles, semi-flexibles y fijas a los turnos.
              </p>
            </div>
            <Switch
              checked={allowCustomBreaks}
              onCheckedChange={setAllowCustomBreaks}
              disabled={!enableRotatingShifts}
            />
          </div>

          <Separator />

          {/* Auto assign colors */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Asignación automática de colores</Label>
              <p className="text-sm text-muted-foreground">
                Asigna automáticamente colores distintivos a diferentes tipos de turnos.
              </p>
            </div>
            <Switch
              checked={autoAssignColors}
              onCheckedChange={setAutoAssignColors}
              disabled={!enableRotatingShifts}
            />
          </div>

          <Separator />

          {/* Require work location */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Requerir ubicación de trabajo</Label>
              <p className="text-sm text-muted-foreground">
                Hace obligatorio especificar lugar y área de trabajo al asignar turnos.
              </p>
            </div>
            <Switch
              checked={requireWorkLocation}
              onCheckedChange={setRequireWorkLocation}
              disabled={!enableRotatingShifts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!enableRotatingShifts} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}