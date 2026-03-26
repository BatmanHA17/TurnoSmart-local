import { useState } from "react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { ArrowLeft, Clock, Settings, TrendingUp, Users, Calendar, AlertCircle, Info, Plus, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface HoursBankConfigProps {
  onBack?: () => void;
}

export const HoursBankConfig = ({ onBack }: HoursBankConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableHoursBank, setEnableHoursBank] = useState(true);
  const [showInShiftsView, setShowInShiftsView] = useState(true);
  const [autoCalculation, setAutoCalculation] = useState(true);
  const [baselineReference, setBaselineReference] = useState("planned_hours");
  const [calculationFrequency, setCalculationFrequency] = useState("daily");
  const [resetFrequency, setResetFrequency] = useState("monthly");
  const [expectedHoursMethod, setExpectedHoursMethod] = useState("contract");
  const [defaultCompensationMethod, setDefaultCompensationMethod] = useState("hours_bank");

  const handleSave = async () => {
    const success = await saveConfiguration("hours-bank", {
      enableHoursBank,
      showInShiftsView,
      autoCalculation,
      baselineReference,
      calculationFrequency,
      resetFrequency,
      expectedHoursMethod,
      defaultCompensationMethod
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  const compensationMethods = [
    {
      id: "hours_bank",
      title: "Banco de Horas",
      description: "El tiempo registrado se transfiere al contador del banco de horas",
      icon: Clock
    },
    {
      id: "time_off",
      title: "Tiempo Libre",
      description: "El tiempo registrado se transfiere al contador de tiempo libre",
      icon: Calendar
    },
    {
      id: "payroll",
      title: "Nómina",
      description: "El tiempo registrado está disponible para compensación manual de nómina",
      icon: TrendingUp
    }
  ];

  const expectedHoursMethods = [
    {
      id: "contract",
      title: "Horas de Contrato",
      description: "Total de horas de trabajo pactadas en el contrato del empleado"
    },
    {
      id: "work_schedule",
      title: "Horarios de Trabajo",
      description: "Patrón de trabajo recurrente definido para cada empleado"
    },
    {
      id: "shifts",
      title: "Turnos",
      description: "Horas esperadas planificadas asignando turnos específicos"
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
          <h2 className="text-2xl font-bold">Banco de Horas</h2>
          <p className="text-muted-foreground">
            Optimiza la programación de turnos con un sistema de Banco de Horas para mejorar eficiencia y flexibilidad
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              ¿Qué es el Banco de Horas?
            </CardTitle>
            <CardDescription>
              Sistema de gestión de tiempo que optimiza la planificación y compensa diferencias horarias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El Banco de Horas funciona como un saldo que representa el total de horas extras acumuladas 
              por un empleado. Permite ver el saldo en la vista de gestión de turnos y ayuda a los managers 
              a tomar decisiones de planificación más informadas, comparando el tiempo programado con el tiempo real trabajado.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Flexibilidad</h4>
                <p className="text-xs text-muted-foreground">Especialmente beneficioso para planificación estacional</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Automatización</h4>
                <p className="text-xs text-muted-foreground">Se actualiza automáticamente según configuración</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Transparencia</h4>
                <p className="text-xs text-muted-foreground">Visible directamente en la gestión de turnos</p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Cálculo automático:</strong> BOH = Tiempo trabajado + vacaciones pagadas - contrato / 
                BOH = Tiempo trabajado - (planificado - vacaciones pagadas)
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Configuración del punto de referencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Configuración del Punto de Referencia
            </CardTitle>
            <CardDescription>
              Establece cómo se calculan las horas extras para el banco de horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Punto de referencia para cálculo de horas extras:</Label>
              
              <RadioGroup value={baselineReference} onValueChange={setBaselineReference}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="planned_hours" id="planned_hours" />
                  <Label htmlFor="planned_hours" className="cursor-pointer">
                    <span className="font-medium">Horas Planificadas</span> (predeterminado)
                    <p className="text-sm text-muted-foreground">
                      Compara las horas trabajadas con las horas programadas en la herramienta de planificación
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contract_hours" id="contract_hours" />
                  <Label htmlFor="contract_hours" className="cursor-pointer">
                    <span className="font-medium">Horas de Contrato</span>
                    <p className="text-sm text-muted-foreground">
                      Compara las horas trabajadas con las horas definidas en el contrato del empleado
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Ejemplos de cálculo:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Horas planificadas seleccionadas:</strong>
                  <br />Planificado: 8h | Trabajado: 9h → +1 hora en Banco de Horas
                </div>
                <div>
                  <strong>Horas de contrato seleccionadas:</strong>
                  <br />Contrato: 8h | Planificado: 10h | Trabajado: 9h → +1 hora en Banco de Horas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frecuencia de cálculo y reinicio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Frecuencia de Cálculo y Reinicio
            </CardTitle>
            <CardDescription>
              Configura cuándo se calculan y reinician los saldos del banco de horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="calculation-frequency">Frecuencia de cálculo de horas extras</Label>
                <Select value={calculationFrequency} onValueChange={setCalculationFrequency}>
                  <SelectTrigger id="calculation-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Con qué frecuencia se calculan y agregan las horas extras al banco
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-frequency">Frecuencia de reinicio del banco</Label>
                <Select value={resetFrequency} onValueChange={setResetFrequency}>
                  <SelectTrigger id="reset-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">A diario</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="annually">Anual</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Cuándo se restablece el contador del banco de horas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horas de trabajo esperadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Horas de Trabajo Esperadas
            </CardTitle>
            <CardDescription>
              Define cómo establecer las horas esperadas para cada empleado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para calcular correctamente el saldo del Banco de Horas, es fundamental definir cuántas horas 
                se espera que trabaje cada empleado. Este valor es el que el sistema utiliza para comparar 
                con las horas reales registradas.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label className="text-base font-medium">Método para definir horas esperadas:</Label>
              
              <RadioGroup value={expectedHoursMethod} onValueChange={setExpectedHoursMethod}>
                {expectedHoursMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="cursor-pointer">
                      <span className="font-medium">{method.title}</span>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de compensación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Métodos de Compensación
            </CardTitle>
            <CardDescription>
              Configura cómo se compensan las horas extras acumuladas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Método de compensación predeterminado:</Label>
              
              <RadioGroup value={defaultCompensationMethod} onValueChange={setDefaultCompensationMethod}>
                {compensationMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div key={method.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="cursor-pointer flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <span className="font-medium">{method.title}</span>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Reglas Personalizadas
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Crea reglas personalizadas para un seguimiento y compensación más precisos. 
                Las reglas personalizadas siempre anulan la regla base.
              </p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Regla de Horas Extras
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dónde encontrarlo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Dónde Encontrar el Banco de Horas
            </CardTitle>
            <CardDescription>
              Ubicaciones donde puedes consultar los saldos del banco de horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Vista de Gestión de Turnos</p>
                  <p className="text-sm text-muted-foreground">
                    En la barra lateral ir a Turnos → Localizar el valor del Banco de Horas para cada empleado
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Enlace Directo a Asistencia</p>
                  <p className="text-sm text-muted-foreground">
                    Hacer clic en el valor del Banco de Horas para abrir un enlace directo a la página de Asistencia del empleado
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Saldo Detallado en Asistencia</p>
                  <p className="text-sm text-muted-foreground">
                    Revisar las horas acumuladas a lo largo del tiempo con vista detallada de transferencias
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración general */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración General del Banco de Horas
            </CardTitle>
            <CardDescription>
              Personaliza el comportamiento del sistema de banco de horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-hours-bank">Habilitar Banco de Horas</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar el sistema de banco de horas para la gestión de turnos
                  </p>
                </div>
                <Switch
                  id="enable-hours-bank"
                  checked={enableHoursBank}
                  onCheckedChange={setEnableHoursBank}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-in-shifts">Mostrar en vista de turnos</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar el saldo del banco de horas en la gestión de turnos
                  </p>
                </div>
                <Switch
                  id="show-in-shifts"
                  checked={showInShiftsView}
                  onCheckedChange={setShowInShiftsView}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-calculation">Cálculo automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Actualizar automáticamente el saldo según la configuración
                  </p>
                </div>
                <Switch
                  id="auto-calculation"
                  checked={autoCalculation}
                  onCheckedChange={setAutoCalculation}
                />
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

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">¿De dónde proviene el valor del Banco de Horas?</h4>
                <p className="text-sm text-muted-foreground">
                  Proviene del módulo de Asistencia y se basa en las horas registradas versus 
                  las horas esperadas para cada empleado.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-1">¿Puedo cambiar la frecuencia de restablecimiento?</h4>
                <p className="text-sm text-muted-foreground">
                  Sí, en Configuración → Control horario → Categorías de tiempo de trabajo, 
                  puedes establecer la frecuencia de reinicio (mensual, anual o nunca).
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-1">¿Necesito activar esta función?</h4>
                <p className="text-sm text-muted-foreground">
                  No, está disponible de forma predeterminada para todas las empresas que utilizan 
                  Gestión de Turnos y Asistencia con Banco de Horas habilitado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};