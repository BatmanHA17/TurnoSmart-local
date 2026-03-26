import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { ArrowLeft, Zap, Clock, TrendingUp, AlertTriangle, Shield, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface OvertimeRulesConfigProps {
  onBack?: () => void;
}

export const OvertimeRulesConfig = ({ onBack }: OvertimeRulesConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableOvertimeTracking, setEnableOvertimeTracking] = useState(true);
  const [weeklyOvertimeThreshold, setWeeklyOvertimeThreshold] = useState(40);
  const [dailyOvertimeThreshold, setDailyOvertimeThreshold] = useState(8);
  const [overtimeCalculationMethod, setOvertimeCalculationMethod] = useState("weekly_threshold");
  const [compensationMethod, setCompensationMethod] = useState("time_bank");
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(2);
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);
  const [enableOvertimeAlerts, setEnableOvertimeAlerts] = useState(true);
  const [maxConsecutiveOvertimeHours, setMaxConsecutiveOvertimeHours] = useState(12);
  const [mandatoryRestAfterOvertime, setMandatoryRestAfterOvertime] = useState(11);

  const handleSave = async () => {
    const success = await saveConfiguration("overtime-rules", {
      enableOvertimeTracking,
      weeklyOvertimeThreshold,
      dailyOvertimeThreshold,
      overtimeCalculationMethod,
      compensationMethod,
      autoApprovalLimit,
      requireManagerApproval,
      enableOvertimeAlerts,
      maxConsecutiveOvertimeHours,
      mandatoryRestAfterOvertime
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
          <h2 className="text-2xl font-bold">Normativas de Horas Extra</h2>
          <p className="text-muted-foreground">
            Configure reglas para gestión y cálculo de horas extraordinarias según normativa española
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Normativa de Horas Extraordinarias
            </CardTitle>
            <CardDescription>
              Marco legal y regulaciones aplicables en España
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Normativa española:</strong> Las horas extraordinarias no pueden exceder de 80 horas al año, 
                salvo para prevenir o reparar siniestros y otros daños extraordinarios y urgentes.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-sm">Límite Anual</h4>
                </div>
                <p className="text-xs text-muted-foreground">Máximo 80 horas extraordinarias por año</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-sm">Compensación</h4>
                </div>
                <p className="text-xs text-muted-foreground">Por tiempo equivalente de descanso o retribución</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-sm">Voluntariedad</h4>
                </div>
                <p className="text-xs text-muted-foreground">Deben ser voluntarias salvo excepciones legales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Umbrales de Horas Extra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Umbrales para Horas Extraordinarias
            </CardTitle>
            <CardDescription>
              Configure cuándo se consideran horas extraordinarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weekly-threshold">Umbral semanal (horas)</Label>
                <Input
                  id="weekly-threshold"
                  type="number"
                  value={weeklyOvertimeThreshold}
                  onChange={(e) => setWeeklyOvertimeThreshold(Number(e.target.value))}
                  min="35"
                  max="50"
                />
                <p className="text-sm text-muted-foreground">
                  Horas semanales a partir de las cuales se consideran extraordinarias
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-threshold">Umbral diario (horas)</Label>
                <Input
                  id="daily-threshold"
                  type="number"
                  value={dailyOvertimeThreshold}
                  onChange={(e) => setDailyOvertimeThreshold(Number(e.target.value))}
                  min="6"
                  max="12"
                />
                <p className="text-sm text-muted-foreground">
                  Horas diarias a partir de las cuales se consideran extraordinarias
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calculation-method">Método de cálculo</Label>
              <Select value={overtimeCalculationMethod} onValueChange={setOvertimeCalculationMethod}>
                <SelectTrigger id="calculation-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly_threshold">Por umbral semanal</SelectItem>
                  <SelectItem value="daily_threshold">Por umbral diario</SelectItem>
                  <SelectItem value="both_thresholds">Ambos umbrales (el más restrictivo)</SelectItem>
                  <SelectItem value="contract_hours">Exceso sobre horas contractuales</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Método para determinar cuándo una hora se considera extraordinaria
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Compensación y Gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Compensación y Gestión
            </CardTitle>
            <CardDescription>
              Configure cómo se gestionan y compensan las horas extraordinarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="compensation-method">Método de compensación predeterminado</Label>
              <Select value={compensationMethod} onValueChange={setCompensationMethod}>
                <SelectTrigger id="compensation-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_bank">Banco de tiempo (descanso equivalente)</SelectItem>
                  <SelectItem value="monetary">Compensación monetaria</SelectItem>
                  <SelectItem value="mixed">Mixto (según preferencia empleado)</SelectItem>
                  <SelectItem value="manager_decision">Decisión del responsable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Forma predeterminada de compensar las horas extraordinarias
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="auto-approval">Límite de aprobación automática (horas)</Label>
                <Input
                  id="auto-approval"
                  type="number"
                  value={autoApprovalLimit}
                  onChange={(e) => setAutoApprovalLimit(Number(e.target.value))}
                  min="0"
                  max="8"
                />
                <p className="text-sm text-muted-foreground">
                  Horas extra que se aprueban automáticamente sin supervisión
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-approval">Requiere aprobación del responsable</Label>
                  <p className="text-sm text-muted-foreground">
                    Solicitar aprobación para horas extraordinarias
                  </p>
                </div>
                <Switch
                  id="require-approval"
                  checked={requireManagerApproval}
                  onCheckedChange={setRequireManagerApproval}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Límites de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Límites de Seguridad Laboral
            </CardTitle>
            <CardDescription>
              Configure límites para proteger la salud y seguridad de los empleados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max-consecutive">Máximo horas consecutivas con extras</Label>
                <Input
                  id="max-consecutive"
                  type="number"
                  value={maxConsecutiveOvertimeHours}
                  onChange={(e) => setMaxConsecutiveOvertimeHours(Number(e.target.value))}
                  min="8"
                  max="16"
                />
                <p className="text-sm text-muted-foreground">
                  Máximo de horas de trabajo consecutivas incluyendo extraordinarias
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mandatory-rest">Descanso obligatorio después de extras (horas)</Label>
                <Input
                  id="mandatory-rest"
                  type="number"
                  value={mandatoryRestAfterOvertime}
                  onChange={(e) => setMandatoryRestAfterOvertime(Number(e.target.value))}
                  min="8"
                  max="24"
                />
                <p className="text-sm text-muted-foreground">
                  Horas de descanso mínimas después de realizar horas extraordinarias
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-alerts">Alertas automáticas de horas extra</Label>
                <p className="text-sm text-muted-foreground">
                  Generar alertas cuando se superen los límites configurados
                </p>
              </div>
              <Switch
                id="enable-alerts"
                checked={enableOvertimeAlerts}
                onCheckedChange={setEnableOvertimeAlerts}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Active o desactive el sistema de gestión de horas extraordinarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-tracking">Habilitar seguimiento de horas extra</Label>
                <p className="text-sm text-muted-foreground">
                  Activar el sistema automático de detección y gestión de horas extraordinarias
                </p>
              </div>
              <Switch
                id="enable-tracking"
                checked={enableOvertimeTracking}
                onCheckedChange={setEnableOvertimeTracking}
              />
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Ejemplo de configuración hostelería:</h4>
              <div className="space-y-1 text-sm">
                <p>• <strong>Umbral semanal:</strong> 40 horas (convenio hostelería)</p>
                <p>• <strong>Umbral diario:</strong> 8 horas</p>
                <p>• <strong>Compensación:</strong> Banco de tiempo preferente</p>
                <p>• <strong>Límite anual:</strong> 80 horas extraordinarias</p>
                <p>• <strong>Aprobación:</strong> Requerida para más de 2 horas</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-black hover:bg-black/90 text-white">
                Guardar
              </Button>
              <Button variant="outline" onClick={() => {
                setEnableOvertimeTracking(true);
                setWeeklyOvertimeThreshold(40);
                setDailyOvertimeThreshold(8);
                setOvertimeCalculationMethod("weekly_threshold");
                setCompensationMethod("time_bank");
                setAutoApprovalLimit(2);
                setRequireManagerApproval(true);
                setEnableOvertimeAlerts(true);
                setMaxConsecutiveOvertimeHours(12);
                setMandatoryRestAfterOvertime(11);
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