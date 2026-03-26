import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Clock, Users, Calendar, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LaborPoliciesConfigProps {
  onBack: () => void;
}

export const LaborPoliciesConfig = ({ onBack }: LaborPoliciesConfigProps) => {
  const { saveConfiguration, getConfiguration } = useConfigurationState();
  const existingConfig = getConfiguration("labor-policies") || {};
  
  const [config, setConfig] = useState({
    weeklyHours: existingConfig.weeklyHours || 40,
    maxDailyHours: existingConfig.maxDailyHours || 9,
    minRestHours: existingConfig.minRestHours || 12,
    consecutiveRestDays: existingConfig.consecutiveRestDays || true,
    vacationDays: existingConfig.vacationDays || 48,
    maxConsecutiveWorkDays: existingConfig.maxConsecutiveWorkDays || 6,
    nightShiftBonus: existingConfig.nightShiftBonus || 25,
    enableAlerts: existingConfig.enableAlerts || true,
    strictCompliance: existingConfig.strictCompliance || true,
  });

  const handleSave = async () => {
    await saveConfiguration("labor-policies", config);
    onBack();
  };

  return (
    <div className="min-h-screen bg-background">
      <ConfigurationHeader
        title="Políticas Laborales"
        description="Configure las políticas laborales según el convenio de hostelería de Las Palmas"
        onBack={onBack}
        showBackButton={true}
      />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta configuración se basa en el convenio colectivo de hostelería de Las Palmas y la normativa laboral española vigente.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Jornada Laboral
            </CardTitle>
            <CardDescription>
              Configure los límites de horas de trabajo según la normativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Horas semanales máximas</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  value={config.weeklyHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, weeklyHours: parseInt(e.target.value) }))}
                  min="30"
                  max="50"
                />
                <p className="text-sm text-muted-foreground">Actualmente: 40 horas semanales</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxDailyHours">Horas diarias máximas</Label>
                <Input
                  id="maxDailyHours"
                  type="number"
                  value={config.maxDailyHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxDailyHours: parseInt(e.target.value) }))}
                  min="6"
                  max="12"
                />
                <p className="text-sm text-muted-foreground">Máximo legal: 9 horas ordinarias + 2 horas extra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Descansos y Vacaciones
            </CardTitle>
            <CardDescription>
              Configure los períodos de descanso obligatorios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minRestHours">Descanso mínimo entre jornadas (horas)</Label>
                <Input
                  id="minRestHours"
                  type="number"
                  value={config.minRestHours}
                  onChange={(e) => setConfig(prev => ({ ...prev, minRestHours: parseInt(e.target.value) }))}
                  min="8"
                  max="24"
                />
                <p className="text-sm text-muted-foreground">Mínimo legal: 12 horas</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vacationDays">Días de vacaciones anuales</Label>
                <Input
                  id="vacationDays"
                  type="number"
                  value={config.vacationDays}
                  onChange={(e) => setConfig(prev => ({ ...prev, vacationDays: parseInt(e.target.value) }))}
                  min="22"
                  max="60"
                />
                <p className="text-sm text-muted-foreground">Convenio hostelería: 30 días + 18 días festivos = 48 días</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConsecutiveWorkDays">Máximo días consecutivos de trabajo</Label>
                <Input
                  id="maxConsecutiveWorkDays"
                  type="number"
                  value={config.maxConsecutiveWorkDays}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxConsecutiveWorkDays: parseInt(e.target.value) }))}
                  min="5"
                  max="12"
                />
                <p className="text-sm text-muted-foreground">Recomendado: máximo 6 días consecutivos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nightShiftBonus">Incremento turno nocturno (%)</Label>
                <Input
                  id="nightShiftBonus"
                  type="number"
                  value={config.nightShiftBonus}
                  onChange={(e) => setConfig(prev => ({ ...prev, nightShiftBonus: parseInt(e.target.value) }))}
                  min="0"
                  max="50"
                />
                <p className="text-sm text-muted-foreground">Incremento salarial para turnos nocturnos (22:00-06:00)</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Días libres consecutivos obligatorios</Label>
                  <p className="text-sm text-muted-foreground">
                    Los dos días libres semanales deben ser consecutivos
                  </p>
                </div>
                <Switch
                  checked={config.consecutiveRestDays}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, consecutiveRestDays: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cumplimiento y Alertas
            </CardTitle>
            <CardDescription>
              Configure las alertas de cumplimiento normativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activar alertas de cumplimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir avisos cuando se incumplan las políticas laborales
                  </p>
                </div>
                <Switch
                  checked={config.enableAlerts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cumplimiento estricto</Label>
                  <p className="text-sm text-muted-foreground">
                    Bloquear la creación de turnos que incumplan las políticas
                  </p>
                </div>
                <Switch
                  checked={config.strictCompliance}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, strictCompliance: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Guardar Configuración
          </Button>
          <Button variant="outline" onClick={onBack}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};