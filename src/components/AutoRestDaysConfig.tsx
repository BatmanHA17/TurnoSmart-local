import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Info, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AutoRestDaysConfigProps {
  onBack?: () => void;
}

export function AutoRestDaysConfig({ onBack }: AutoRestDaysConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [isAutoRestEnabled, setIsAutoRestEnabled] = useState(false);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(2);
  const [isConsecutive, setIsConsecutive] = useState(true);

  const handleSave = async () => {
    const success = await saveConfiguration("auto-rest-days", {
      isAutoRestEnabled,
      restDaysPerWeek,
      isConsecutive
    });
    
    if (success) {
      onBack?.();
    }
  };

  return (
    <div className="space-y-8">{/* Removed duplicate header and padding */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Días de Descanso Automáticos</h1>
        <p className="text-muted-foreground">
          Configure las políticas de descanso para garantizar el cumplimiento de la normativa laboral española.
        </p>
      </div>

      {/* What are automatic rest days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            ¿Qué son los días de descanso automáticos?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los días de descanso automáticos te permiten establecer cuántos días libres debe tener una persona a la semana. 
            Esta funcionalidad ayuda a planificar los turnos de forma eficiente y garantiza que estos días no se descuenten 
            del saldo de vacaciones.
          </p>
          
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Ejemplo:</strong> Si configuras 2 días de descanso por semana y una persona solicita una semana completa 
              de vacaciones (de lunes a domingo), solo se descontarán 5 días de su saldo, en lugar de 7.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Descanso</CardTitle>
          <CardDescription>
            Configure las reglas automáticas para la asignación de días de descanso según la normativa española.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Activar días de descanso automáticos</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la asignación automática de días libres según las reglas configuradas.
              </p>
            </div>
            <Switch
              checked={isAutoRestEnabled}
              onCheckedChange={setIsAutoRestEnabled}
            />
          </div>

          <Separator />

          {/* Rest days per week */}
          <div className="space-y-3">
            <Label className="text-base">Días de descanso por semana</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1"
                max="3"
                value={restDaysPerWeek}
                onChange={(e) => setRestDaysPerWeek(Number(e.target.value))}
                className="w-20"
                disabled={!isAutoRestEnabled}
              />
              <Badge variant="outline">
                Normativa española: Mínimo 2 días consecutivos
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Según la legislación laboral española, los trabajadores deben tener un mínimo de 2 días de descanso 
              consecutivos por semana.
            </p>
          </div>

          <Separator />

          {/* Consecutive days */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Días consecutivos obligatorios</Label>
              <p className="text-sm text-muted-foreground">
                Los días libres deben ser consecutivos según la normativa laboral española.
              </p>
            </div>
            <Switch
              checked={isConsecutive}
              onCheckedChange={setIsConsecutive}
              disabled={!isAutoRestEnabled}
            />
          </div>

          <Separator />

          {/* Vacation impact */}
          <div className="space-y-3">
            <Label className="text-base">Impacto en contadores de vacaciones</Label>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm">Los días de descanso NO se descuentan del saldo de vacaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Se aplica a todos los empleados con contratos estándar</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* When to use */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cuándo usar los días de descanso automáticos?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Recomendado cuando:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Quieres evitar introducir manualmente los días de descanso</li>
                <li>• Las personas solicitan vacaciones futuras sin turnos planificados</li>
                <li>• Necesitas cumplir automáticamente con la normativa laboral</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Beneficios:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cumplimiento automático de la ley laboral española</li>
                <li>• Optimización automática de recursos</li>
                <li>• Reducción de errores manuales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isAutoRestEnabled} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}