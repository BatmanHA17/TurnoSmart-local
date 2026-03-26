import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Users, Clock, Mail, AlertCircle, Eye, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShiftEditDeleteConfigProps {
  onBack?: () => void;
}

export function ShiftEditDeleteConfig({ onBack }: ShiftEditDeleteConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [allowBulkEdit, setAllowBulkEdit] = useState(true);
  const [allowBulkDelete, setAllowBulkDelete] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [autoNotifyChanges, setAutoNotifyChanges] = useState(true);
  const [trackRevisions, setTrackRevisions] = useState(true);

  const handleSave = async () => {
    const success = await saveConfiguration("shift-edit-delete", {
      allowBulkEdit,
      allowBulkDelete,
      requireConfirmation,
      autoNotifyChanges,
      trackRevisions
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-8">{/* Removed duplicate header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Edición y Eliminación de Turnos</h1>
        <p className="text-muted-foreground">
          Configure las opciones para editar y eliminar turnos de manera eficiente y segura.
        </p>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Una vez publicado el horario de turnos, no se pueden editar ni eliminar los turnos, 
          salvo que se despublique primero. Solo así es posible hacer modificaciones.
        </AlertDescription>
      </Alert>

      {/* Editing Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            Proceso de Edición de Turnos
          </CardTitle>
          <CardDescription>
            Pasos para modificar turnos existentes antes de la publicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Flujo de Edición:</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">1</Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Acceder a los turnos</p>
                  <p className="text-xs text-muted-foreground">
                    Seleccionar el turno o turnos que deseas editar (se pueden seleccionar varios)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">2</Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Hacer clic en "Editar turno"</p>
                  <p className="text-xs text-muted-foreground">
                    Ubicado típicamente en la esquina superior derecha
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">3</Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Realizar los cambios necesarios</p>
                  <p className="text-xs text-muted-foreground">
                    Modificar horarios, ubicaciones o detalles del turno
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">4</Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Hacer clic en "Editar"</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmar los cambios realizados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs">5</Badge>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Hacer clic en "Publicar horario"</p>
                  <p className="text-xs text-muted-foreground">
                    Finalizar y notificar los cambios a los empleados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deletion Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Proceso de Eliminación de Turnos
          </CardTitle>
          <CardDescription>
            Métodos para eliminar turnos específicos o en lotes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Specific deletion */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <h4 className="font-semibold">Eliminar Turnos Específicos</h4>
              </div>
              <div className="pl-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar los turnos</p>
                    <p className="text-xs text-muted-foreground">
                      Elegir los turnos específicos que deseas eliminar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Eliminar"</p>
                    <p className="text-xs text-muted-foreground">
                      Confirmar la eliminación de los turnos seleccionados
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk deletion */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <h4 className="font-semibold">Eliminación por Lotes</h4>
              </div>
              <div className="pl-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Hacer clic en "Eliminar"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Añadir franja horaria</p>
                    <p className="text-xs text-muted-foreground">
                      Especificar el período de tiempo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seleccionar empleados</p>
                    <p className="text-xs text-muted-foreground">
                      Elegir las personas afectadas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-xs">4</Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Confirmar eliminación</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Consequences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            Qué Sucede Tras Publicar
          </CardTitle>
          <CardDescription>
            Consecuencias y efectos de publicar un horario de turnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Notificaciones Automáticas</p>
                <p className="text-xs text-muted-foreground">
                  Los empleados reciben correo electrónico o notificación push y pueden ver su horario al iniciar sesión.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Registro de Jornada</p>
                <p className="text-xs text-muted-foreground">
                  Si está activado, el horario sirve como base para calcular horas estimadas vs. reales trabajadas.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Finalización del Horario</p>
                <p className="text-xs text-muted-foreground">
                  Se establece oficialmente el horario y se comunica a todo el equipo.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Restricción de Edición</p>
                <p className="text-xs text-muted-foreground">
                  Una vez publicado, NO se puede editar ni eliminar sin despublicar primero.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Edición y Eliminación</CardTitle>
          <CardDescription>
            Configure las opciones para el manejo de turnos en su sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bulk operations */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir edición en lotes</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la selección y edición de múltiples turnos simultáneamente.
              </p>
            </div>
            <Switch
              checked={allowBulkEdit}
              onCheckedChange={setAllowBulkEdit}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir eliminación en lotes</Label>
              <p className="text-sm text-muted-foreground">
                Permite eliminar turnos de múltiples empleados en un período específico.
              </p>
            </div>
            <Switch
              checked={allowBulkDelete}
              onCheckedChange={setAllowBulkDelete}
            />
          </div>

          <Separator />

          {/* Confirmation requirements */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Requerir confirmación para eliminaciones</Label>
              <p className="text-sm text-muted-foreground">
                Solicita confirmación adicional antes de eliminar turnos.
              </p>
            </div>
            <Switch
              checked={requireConfirmation}
              onCheckedChange={setRequireConfirmation}
            />
          </div>

          <Separator />

          {/* Auto notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Notificaciones automáticas de cambios</Label>
              <p className="text-sm text-muted-foreground">
                Envía notificaciones automáticas cuando se publican cambios en turnos.
              </p>
            </div>
            <Switch
              checked={autoNotifyChanges}
              onCheckedChange={setAutoNotifyChanges}
            />
          </div>

          <Separator />

          {/* Revision tracking */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Seguimiento de revisiones</Label>
              <p className="text-sm text-muted-foreground">
                Mantiene un historial de todos los cambios realizados en los turnos.
              </p>
            </div>
            <Switch
              checked={trackRevisions}
              onCheckedChange={setTrackRevisions}
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