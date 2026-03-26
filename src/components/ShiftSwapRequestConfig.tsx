import { useState } from "react";
import { ArrowLeft, Smartphone, Users, MessageSquare, Bell, CheckCircle, XCircle, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ShiftSwapRequestConfigProps {
  onBack?: () => void;
}

export const ShiftSwapRequestConfig = ({ onBack }: ShiftSwapRequestConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableShiftSwap, setEnableShiftSwap] = useState(true);
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [swapDeadlineHours, setSwapDeadlineHours] = useState("24");
  const [maxPendingRequests, setMaxPendingRequests] = useState("1");

  const handleSave = async () => {
    const config = {
      enableShiftSwap,
      requireManagerApproval,
      allowComments,
      enableNotifications,
      swapDeadlineHours,
      maxPendingRequests
    };
    
    const success = await saveConfiguration("shift-swap-request", config);
    if (success && onBack) {
      onBack();
    }
  };

  const steps = [
    {
      number: 1,
      title: "Abrir la aplicación móvil",
      description: "Los empleados acceden desde la app móvil de la empresa",
      icon: Smartphone
    },
    {
      number: 2,
      title: "Ir a la sección 'Turnos'",
      description: "Navegar hasta la gestión de turnos en la aplicación",
      icon: Calendar
    },
    {
      number: 3,
      title: "Seleccionar el turno",
      description: "Elegir el turno que se desea intercambiar y hacer clic en 'Solicitar cambio'",
      icon: CheckCircle
    },
    {
      number: 4,
      title: "Elegir un compañero",
      description: "Seleccionar de la lista de compañeros disponibles con quien intercambiar",
      icon: Users
    },
    {
      number: 5,
      title: "Agregar comentario",
      description: "Opcionalmente añadir una explicación del motivo del cambio",
      icon: MessageSquare
    },
    {
      number: 6,
      title: "Notificación al compañero",
      description: "El compañero recibe una notificación para aprobar o rechazar",
      icon: Bell
    },
    {
      number: 7,
      title: "Aprobación del manager",
      description: "Si el compañero acepta, el manager revisa y decide sobre el cambio",
      icon: CheckCircle
    },
    {
      number: 8,
      title: "Decisión final",
      description: "Se actualiza automáticamente la planificación si se aprueba",
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Solicitudes de Cambio de Turno</h2>
          <p className="text-muted-foreground">
            Gestiona fácilmente los intercambios de turnos entre empleados con aprobación supervisada
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Cambios de Turno Colaborativos
            </CardTitle>
            <CardDescription>
              Facilita la flexibilidad entre equipos y mejora el equilibrio vida-trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Con esta funcionalidad, los empleados pueden solicitar cambios de turno entre compañeros 
              directamente desde la aplicación móvil. Esto facilita la flexibilidad dentro de los equipos, 
              agiliza la gestión de horarios y garantiza que todos los cambios se controlen y aprueben 
              a través de la plataforma.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Flexibilidad</h4>
                <p className="text-xs text-muted-foreground">Permite a los empleados gestionar sus horarios</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Control</h4>
                <p className="text-xs text-muted-foreground">Los managers mantienen supervisión completa</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Transparencia</h4>
                <p className="text-xs text-muted-foreground">Seguimiento en tiempo real del estado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proceso paso a paso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-600" />
              Proceso de Solicitud de Cambio
            </CardTitle>
            <CardDescription>
              Guía detallada del proceso completo de intercambio de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.number} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{step.number}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-shrink-0 w-px bg-border h-8 mt-8"></div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Estados y resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Estados y Resultados
            </CardTitle>
            <CardDescription>
              Qué sucede después de enviar una solicitud de cambio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pendiente
                </Badge>
                <div>
                  <p className="font-medium text-sm">Esperando aprobación</p>
                  <p className="text-sm text-muted-foreground">
                    Ambos empleados ven el estado como "Pendiente" hasta que el manager tome una decisión.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Aprobado
                </Badge>
                <div>
                  <p className="font-medium text-sm">Cambio confirmado</p>
                  <p className="text-sm text-muted-foreground">
                    La planificación se actualiza automáticamente con indicadores visuales. 
                    Ambos empleados reciben notificación.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Rechazado
                </Badge>
                <div>
                  <p className="font-medium text-sm">Solicitud denegada</p>
                  <p className="text-sm text-muted-foreground">
                    No se realizan cambios en la planificación. Los empleados reciben notificación del rechazo.
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
              <Bell className="h-5 w-5 text-amber-600" />
              Consideraciones Importantes
            </CardTitle>
            <CardDescription>
              Reglas y limitaciones del sistema de cambios de turno
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Una solicitud a la vez:</strong> Solo se puede realizar una solicitud de cambio de turno simultáneamente</li>
                  <li>• <strong>Aprobación obligatoria:</strong> Los managers deben aprobar todas las solicitudes antes de que surtan efecto</li>
                  <li>• <strong>Seguimiento transparente:</strong> Los empleados pueden monitorear el estado de sus solicitudes en tiempo real</li>
                  <li>• <strong>Control completo:</strong> Los managers conservan el control total de la planilla mientras permiten flexibilidad</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Configuración de Cambios de Turno
            </CardTitle>
            <CardDescription>
              Personaliza el comportamiento del sistema de intercambios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-shift-swap">Habilitar cambios de turno</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que los empleados soliciten intercambios de turnos
                  </p>
                </div>
                <Switch
                  id="enable-shift-swap"
                  checked={enableShiftSwap}
                  onCheckedChange={setEnableShiftSwap}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-manager-approval">Requerir aprobación del manager</Label>
                  <p className="text-sm text-muted-foreground">
                    Los managers deben aprobar todos los cambios de turno
                  </p>
                </div>
                <Switch
                  id="require-manager-approval"
                  checked={requireManagerApproval}
                  onCheckedChange={setRequireManagerApproval}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-comments">Permitir comentarios</Label>
                  <p className="text-sm text-muted-foreground">
                    Los empleados pueden agregar motivos en las solicitudes
                  </p>
                </div>
                <Switch
                  id="allow-comments"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-notifications">Notificaciones automáticas</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones sobre cambios de estado
                  </p>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={setEnableNotifications}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="swap-deadline">Límite de tiempo para solicitudes</Label>
                <Select value={swapDeadlineHours} onValueChange={setSwapDeadlineHours}>
                  <SelectTrigger id="swap-deadline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 horas antes</SelectItem>
                    <SelectItem value="4">4 horas antes</SelectItem>
                    <SelectItem value="8">8 horas antes</SelectItem>
                    <SelectItem value="24">24 horas antes</SelectItem>
                    <SelectItem value="48">48 horas antes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Tiempo mínimo antes del turno para solicitar cambios
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="max-pending">Máximo de solicitudes pendientes</Label>
                <Select value={maxPendingRequests} onValueChange={setMaxPendingRequests}>
                  <SelectTrigger id="max-pending">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 solicitud</SelectItem>
                    <SelectItem value="2">2 solicitudes</SelectItem>
                    <SelectItem value="3">3 solicitudes</SelectItem>
                    <SelectItem value="5">5 solicitudes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Número máximo de solicitudes pendientes por empleado
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