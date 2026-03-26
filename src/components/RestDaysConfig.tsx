import { useState } from "react";
import { ArrowLeft, Calendar, Plus, Trash2, Clock, Users, AlertTriangle, Copy, Edit3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface RestDaysConfigProps {
  onBack?: () => void;
}

export const RestDaysConfig = ({ onBack }: RestDaysConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAutoRestDays, setEnableAutoRestDays] = useState(true);
  const [copyRestDaysWithWeek, setCopyRestDaysWithWeek] = useState(true);
  const [allowBulkDelete, setAllowBulkDelete] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(true);
  const [defaultRestDaysPerWeek, setDefaultRestDaysPerWeek] = useState("2");
  const [vacationPolicyType, setVacationPolicyType] = useState("workdays");

  const handleSave = async () => {
    const config = {
      enableAutoRestDays,
      copyRestDaysWithWeek,
      allowBulkDelete,
      showDeleteConfirmation,
      defaultRestDaysPerWeek,
      vacationPolicyType
    };
    
    const success = await saveConfiguration("rest-days", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Gestión de Días de Descanso</h2>
          <p className="text-muted-foreground">
            Aprende cómo agregar y gestionar días de descanso en los turnos
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Cómo agregar días de descanso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Cómo Agregar Días de Descanso
            </CardTitle>
            <CardDescription>
              Proceso paso a paso para agregar días de descanso a los turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Ir a Turnos</p>
                  <p className="text-sm text-muted-foreground">En la barra del menú lateral, selecciona la sección Turnos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Seleccionar días</p>
                  <p className="text-sm text-muted-foreground">Selecciona el día o días donde quieres agregar días de descanso</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Hacer clic en (+)</p>
                  <p className="text-sm text-muted-foreground">Haz clic en el ícono de agregar (+)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">4</Badge>
                <div>
                  <p className="font-medium">Seleccionar "Agregar días de descanso"</p>
                  <p className="text-sm text-muted-foreground">Elige la opción específica de días de descanso</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">5</Badge>
                <div>
                  <p className="font-medium">Publicar calendario</p>
                  <p className="text-sm text-muted-foreground">El día de descanso se suma a la tabla. Haz clic en "Publicar el calendario"</p>
                </div>
              </div>
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Opciones adicionales:</strong> También puedes incluir días de descanso en plantillas 
                o durante la configuración en el perfil del empleado para ahorrar tiempo.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Cómo eliminar días de descanso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Cómo Eliminar Días de Descanso
            </CardTitle>
            <CardDescription>
              Métodos para eliminar días de descanso existentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Eliminación Individual</h4>
                <p className="text-sm text-muted-foreground">
                  Coloca el ratón sobre el día de descanso específico y haz clic en el ícono de la papelera 
                  para eliminar ese día únicamente.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Eliminación Múltiple</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Selecciona los días de descanso que quieres eliminar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Haz clic en el ícono de "Eliminar"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Confirma la eliminación de los días de descanso
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consideraciones importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Consideraciones Importantes
            </CardTitle>
            <CardDescription>
              Aspectos clave a tener en cuenta al gestionar días de descanso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Copy className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">Copiar Semana</p>
                  <p className="text-sm text-muted-foreground">
                    Al hacer clic en "Copiar semana", se copiarán también los días de descanso que hayan sido publicados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <p className="font-medium">Eliminación Múltiple</p>
                  <p className="text-sm text-muted-foreground">
                    Al seleccionar varios días de descanso y turnos y hacer clic en "Eliminar", 
                    también se eliminarán los días de descanso.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Edit3 className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">Editar Turnos</p>
                  <p className="text-sm text-muted-foreground">
                    Al seleccionar varios días de descanso y turnos y hacer clic en "Editar turnos", 
                    solo se editarán los turnos (no los días de descanso).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium">Política de Vacaciones</p>
                  <p className="text-sm text-muted-foreground">
                    Cuando el día de descanso se planifica por turnos y un empleado coge vacaciones 
                    con política de "días laborables", el día de descanso no se descuenta del contador de días festivos.
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <strong>Ejemplo:</strong> Un empleado con derecho a 2 días de descanso semanal y política 
                    basada en días laborables. Si pide una semana libre, solo se descontarán 5 días de su tiempo libre total.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configuración de Días de Descanso
            </CardTitle>
            <CardDescription>
              Personaliza el comportamiento de los días de descanso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-rest-days">Días de descanso automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Asignar automáticamente días de descanso según las políticas de la empresa
                  </p>
                </div>
                <Switch
                  id="auto-rest-days"
                  checked={enableAutoRestDays}
                  onCheckedChange={setEnableAutoRestDays}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="copy-rest-days">Copiar días de descanso con semana</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir días de descanso al copiar una semana completa
                  </p>
                </div>
                <Switch
                  id="copy-rest-days"
                  checked={copyRestDaysWithWeek}
                  onCheckedChange={setCopyRestDaysWithWeek}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bulk-delete">Permitir eliminación múltiple</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar la selección y eliminación de múltiples días de descanso
                  </p>
                </div>
                <Switch
                  id="bulk-delete"
                  checked={allowBulkDelete}
                  onCheckedChange={setAllowBulkDelete}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="delete-confirmation">Confirmación de eliminación</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar ventana de confirmación antes de eliminar días de descanso
                  </p>
                </div>
                <Switch
                  id="delete-confirmation"
                  checked={showDeleteConfirmation}
                  onCheckedChange={setShowDeleteConfirmation}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="default-rest-days">Días de descanso por semana por defecto</Label>
                <Select value={defaultRestDaysPerWeek} onValueChange={setDefaultRestDaysPerWeek}>
                  <SelectTrigger id="default-rest-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="2">2 días (estándar)</SelectItem>
                    <SelectItem value="3">3 días</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Número de días de descanso semanales asignados automáticamente
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="vacation-policy">Política de vacaciones</Label>
                <Select value={vacationPolicyType} onValueChange={setVacationPolicyType}>
                  <SelectTrigger id="vacation-policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workdays">Días laborables</SelectItem>
                    <SelectItem value="calendar">Días naturales</SelectItem>
                    <SelectItem value="shifts">Turnos programados</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Tipo de política para el cálculo de vacaciones y días libres
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-black hover:bg-black/90 text-white">
                Guardar
              </Button>
              <Button variant="outline">
                Restablecer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};