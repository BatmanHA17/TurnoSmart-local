import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { ArrowLeft, Clock, Target, AlertTriangle, Shield, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface WorkHoursConfigProps {
  onBack?: () => void;
}

export const WorkHoursConfig = ({ onBack }: WorkHoursConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(40);
  const [maxDailyHours, setMaxDailyHours] = useState(8);
  const [minRestBetweenShifts, setMinRestBetweenShifts] = useState(12);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(6);
  const [overtimeThreshold, setOvertimeThreshold] = useState(40);
  const [enableOvertimeAlerts, setEnableOvertimeAlerts] = useState(true);
  const [enableRestTimeValidation, setEnableRestTimeValidation] = useState(true);
  const [automaticBreaks, setAutomaticBreaks] = useState(true);
  const [breakDuration, setBreakDuration] = useState(30);
  const [workTimeCalculationMethod, setWorkTimeCalculationMethod] = useState("net_hours");

  const handleSave = async () => {
    const success = await saveConfiguration("work-hours", {
      maxWeeklyHours,
      maxDailyHours,
      minRestBetweenShifts,
      maxConsecutiveDays,
      overtimeThreshold,
      enableOvertimeAlerts,
      enableRestTimeValidation,
      automaticBreaks,
      breakDuration,
      workTimeCalculationMethod
    });
    
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
          <h2 className="text-2xl font-bold">Horas de Trabajo</h2>
          <p className="text-muted-foreground">
            Configure límites de horas semanales y regulaciones laborales según normativa española
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Límites de Horas Laborales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Límites de Horas Laborales
            </CardTitle>
            <CardDescription>
              Configure los límites máximos de horas según la normativa laboral española
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Normativa española:</strong> Jornada máxima de 40 horas semanales y 8 horas diarias. 
                Descanso mínimo de 12 horas entre jornadas y máximo 6 días consecutivos de trabajo.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max-weekly-hours">Horas máximas semanales</Label>
                <Input
                  id="max-weekly-hours"
                  type="number"
                  value={maxWeeklyHours}
                  onChange={(e) => setMaxWeeklyHours(Number(e.target.value))}
                  min="1"
                  max="60"
                />
                <p className="text-sm text-muted-foreground">
                  Límite semanal según contrato (normalmente 40 horas)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-daily-hours">Horas máximas diarias</Label>
                <Input
                  id="max-daily-hours"
                  type="number"
                  value={maxDailyHours}
                  onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                  min="1"
                  max="12"
                />
                <p className="text-sm text-muted-foreground">
                  Límite diario de horas laborales (normalmente 8 horas)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-rest-between-shifts">Descanso mínimo entre turnos (horas)</Label>
                <Input
                  id="min-rest-between-shifts"
                  type="number"
                  value={minRestBetweenShifts}
                  onChange={(e) => setMinRestBetweenShifts(Number(e.target.value))}
                  min="8"
                  max="24"
                />
                <p className="text-sm text-muted-foreground">
                  Tiempo mínimo entre el final de un turno y el inicio del siguiente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-consecutive-days">Días consecutivos máximos</Label>
                <Input
                  id="max-consecutive-days"
                  type="number"
                  value={maxConsecutiveDays}
                  onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                  min="1"
                  max="14"
                />
                <p className="text-sm text-muted-foreground">
                  Máximo de días seguidos sin descanso (normalmente 6 días)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Horas Extra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Gestión de Horas Extra
            </CardTitle>
            <CardDescription>
              Configure reglas para el cálculo y gestión de horas extraordinarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="overtime-threshold">Umbral para horas extra (horas semanales)</Label>
              <Input
                id="overtime-threshold"
                type="number"
                value={overtimeThreshold}
                onChange={(e) => setOvertimeThreshold(Number(e.target.value))}
                min="35"
                max="50"
              />
              <p className="text-sm text-muted-foreground">
                A partir de cuántas horas semanales se consideran horas extraordinarias
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-overtime-alerts">Alertas de horas extra</Label>
                <p className="text-sm text-muted-foreground">
                  Generar alertas automáticas cuando se excedan los límites de horas
                </p>
              </div>
              <Switch
                id="enable-overtime-alerts"
                checked={enableOvertimeAlerts}
                onCheckedChange={setEnableOvertimeAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Validaciones y Descansos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Validaciones y Descansos
            </CardTitle>
            <CardDescription>
              Configure validaciones automáticas y gestión de descansos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-rest-validation">Validación de tiempos de descanso</Label>
                <p className="text-sm text-muted-foreground">
                  Verificar automáticamente que se respeten los tiempos mínimos de descanso
                </p>
              </div>
              <Switch
                id="enable-rest-validation"
                checked={enableRestTimeValidation}
                onCheckedChange={setEnableRestTimeValidation}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="automatic-breaks">Descansos automáticos</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir automáticamente descansos en turnos largos
                </p>
              </div>
              <Switch
                id="automatic-breaks"
                checked={automaticBreaks}
                onCheckedChange={setAutomaticBreaks}
              />
            </div>

            {automaticBreaks && (
              <div className="space-y-2">
                <Label htmlFor="break-duration">Duración del descanso (minutos)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  min="15"
                  max="60"
                />
                <p className="text-sm text-muted-foreground">
                  Duración estándar del descanso para turnos de más de 6 horas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Método de Cálculo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Método de Cálculo de Tiempo de Trabajo
            </CardTitle>
            <CardDescription>
              Define cómo se calculan las horas trabajadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calculation-method">Método de cálculo</Label>
              <Select value={workTimeCalculationMethod} onValueChange={setWorkTimeCalculationMethod}>
                <SelectTrigger id="calculation-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_hours">Horas netas (excluyendo descansos)</SelectItem>
                  <SelectItem value="gross_hours">Horas brutas (incluyendo descansos)</SelectItem>
                  <SelectItem value="productive_hours">Horas productivas (solo tiempo de trabajo)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Método para calcular el tiempo total trabajado en cada turno
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alertas de Cumplimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertas de Cumplimiento Laboral
            </CardTitle>
            <CardDescription>
              Configure alertas para detectar posibles incumplimientos de la normativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> El sistema generará alertas automáticas cuando detecte:
                <ul className="list-disc ml-4 mt-2">
                  <li>Exceso de horas semanales o diarias</li>
                  <li>Descanso insuficiente entre turnos</li>
                  <li>Demasiados días consecutivos sin descanso</li>
                  <li>Incumplimiento de días libres obligatorios</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Ejemplo de configuración hostelería:</h4>
              <div className="space-y-1 text-sm">
                <p>• <strong>Horas semanales:</strong> 40 horas (convenio hostelería)</p>
                <p>• <strong>Horas diarias:</strong> 8 horas máximo</p>
                <p>• <strong>Descanso entre turnos:</strong> 12 horas mínimo</p>
                <p>• <strong>Días consecutivos:</strong> 6 días máximo</p>
                <p>• <strong>Días libres:</strong> 2 días consecutivos por semana</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-black hover:bg-black/90 text-white">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => {
                setMaxWeeklyHours(40);
                setMaxDailyHours(8);
                setMinRestBetweenShifts(12);
                setMaxConsecutiveDays(6);
                setOvertimeThreshold(40);
                setEnableOvertimeAlerts(true);
                setEnableRestTimeValidation(true);
                setAutomaticBreaks(true);
                setBreakDuration(30);
                setWorkTimeCalculationMethod("net_hours");
              }}>
                Restablecer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};