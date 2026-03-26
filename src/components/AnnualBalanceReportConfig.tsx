import { useState } from "react";
import { ArrowLeft, Download, Settings, Users, Calendar, Clock, FileBarChart, Filter, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface AnnualBalanceReportConfigProps {
  onBack?: () => void;
}

export const AnnualBalanceReportConfig = ({ onBack }: AnnualBalanceReportConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAnnualBalance, setEnableAnnualBalance] = useState(true);
  const [autoGenerateReports, setAutoGenerateReports] = useState(false);
  const [includeShiftsData, setIncludeShiftsData] = useState(true);
  const [includeTimeTrackingData, setIncludeTimeTrackingData] = useState(true);
  const [defaultWeeklyHours, setDefaultWeeklyHours] = useState("40");
  const [defaultAnnualHours, setDefaultAnnualHours] = useState("1760");
  const [reportFrequency, setReportFrequency] = useState("monthly");
  const [defaultFilterBy, setDefaultFilterBy] = useState("team");

  const handleSave = async () => {
    const config = {
      enableAnnualBalance,
      autoGenerateReports,
      includeShiftsData,
      includeTimeTrackingData,
      defaultWeeklyHours,
      defaultAnnualHours,
      reportFrequency,
      defaultFilterBy
    };
    
    const success = await saveConfiguration("annual-balance-report", config);
    if (success && onBack) {
      onBack();
    }
  };

  const configurationSteps = [
    {
      number: 1,
      title: "Ir a Organización",
      description: "En la barra lateral, hacer clic en Organización",
      icon: Building
    },
    {
      number: 2,
      title: "Abrir perfil del empleado",
      description: "Seleccionar la persona en cuestión",
      icon: Users
    },
    {
      number: 3,
      title: "Acceder a Contratos",
      description: "Ir a la sección de Contratos del empleado",
      icon: FileBarChart
    },
    {
      number: 4,
      title: "Modificar condiciones",
      description: "Hacer clic en tres puntos y seleccionar 'Modificar condiciones'",
      icon: Settings
    },
    {
      number: 5,
      title: "Configurar horario laboral",
      description: "Establecer máximo de horas legales anuales y semanales",
      icon: Clock
    }
  ];

  const exportFromShifts = [
    {
      step: 1,
      text: "En la barra lateral, ir a Turnos"
    },
    {
      step: 2,
      text: "Hacer clic en el icono de configuración (esquina superior derecha)"
    },
    {
      step: 3,
      text: "Hacer clic en 'Exportar balance anual'"
    },
    {
      step: 4,
      text: "Seleccionar filtro por equipo o ubicación"
    },
    {
      step: 5,
      text: "Elegir una semana específica del año"
    },
    {
      step: 6,
      text: "Hacer clic en Guardar"
    }
  ];

  const exportFromTimeTracking = [
    {
      step: 1,
      text: "En la barra lateral, ir a Control horario"
    },
    {
      step: 2,
      text: "Hacer clic en (...) en la esquina superior derecha"
    },
    {
      step: 3,
      text: "Hacer clic en 'Descargar balance anual'"
    },
    {
      step: 4,
      text: "Seleccionar filtro por equipo o ubicación"
    },
    {
      step: 5,
      text: "Elegir una semana específica del año"
    },
    {
      step: 6,
      text: "Hacer clic en Guardar"
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
          <h2 className="text-2xl font-bold">Informes de Balance Anual</h2>
          <p className="text-muted-foreground">
            Gestione eficazmente las horas laborales y determine balances de empleados
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-blue-600" />
              Balance Anual de Horas
            </CardTitle>
            <CardDescription>
              Proporciona datos necesarios para determinar si los empleados deben horas a la empresa o viceversa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El informe de balance anual incluye información de control horario para facilitar una comparación 
              entre las horas planificadas y las horas realmente registradas, junto con una comparación con el 
              máximo de horas que la persona debe trabajar por ley.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Comparación</h4>
                <p className="text-xs text-muted-foreground">Horas planificadas vs registradas</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Cumplimiento</h4>
                <p className="text-xs text-muted-foreground">Versus máximo legal de horas</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Periodicidad</h4>
                <p className="text-xs text-muted-foreground">Datos semanales, mensuales o anuales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración previa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Configuración de Horas Semanales y Anuales
            </CardTitle>
            <CardDescription>
              Configuración necesaria antes de exportar el balance anual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Requisito previo:</strong> Es necesario establecer las horas semanales y anuales 
                dentro de las condiciones del convenio de los empleados antes de exportar el balance.
              </AlertDescription>
            </Alert>

            {configurationSteps.map((step, index) => {
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
                  {index < configurationSteps.length - 1 && (
                    <div className="flex-shrink-0 w-px bg-border h-8 mt-8"></div>
                  )}
                </div>
              );
            })}

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Valores clave a configurar:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Máximo de horas semanales:</strong> Máximo legal permitido por semana</li>
                <li>• <strong>Máximo de horas anuales:</strong> Máximo legal permitido por año</li>
                <li>• Estos datos se utilizarán para calcular el balance anual</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Exportación desde Turnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Exportar desde Turnos
            </CardTitle>
            <CardDescription>
              Proceso para descargar el balance anual desde la gestión de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {exportFromShifts.map((item, index) => (
                <div key={item.step} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">{item.step}</Badge>
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exportación desde Control Horario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Exportar desde Control Horario
            </CardTitle>
            <CardDescription>
              Proceso para descargar el balance anual desde el control horario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {exportFromTimeTracking.map((item, index) => (
                <div key={item.step} className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">{item.step}</Badge>
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contenido de la exportación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Contenido de la Exportación
            </CardTitle>
            <CardDescription>
              Información incluida en el informe de balance anual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Información de Control Horario</h4>
                <p className="text-sm text-muted-foreground">
                  Comparación entre horas planificadas y horas realmente registradas, 
                  junto con comparación del máximo de horas legales.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Datos Acumulados</h4>
                <p className="text-sm text-muted-foreground">
                  Información con carácter semanal, mensual o anual según configuración.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Filtros Aplicables</h4>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Por equipo</Badge>
                  <Badge variant="secondary">Por ubicación</Badge>
                  <Badge variant="secondary">Combinación de ambos</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Informes de Balance
            </CardTitle>
            <CardDescription>
              Personaliza la generación y exportación de informes anuales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-annual-balance">Habilitar informes de balance anual</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir la generación y exportación de informes de balance
                  </p>
                </div>
                <Switch
                  id="enable-annual-balance"
                  checked={enableAnnualBalance}
                  onCheckedChange={setEnableAnnualBalance}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-generate">Generación automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Generar informes automáticamente según la frecuencia configurada
                  </p>
                </div>
                <Switch
                  id="auto-generate"
                  checked={autoGenerateReports}
                  onCheckedChange={setAutoGenerateReports}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-shifts">Incluir datos de turnos</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir información de gestión de turnos en los informes
                  </p>
                </div>
                <Switch
                  id="include-shifts"
                  checked={includeShiftsData}
                  onCheckedChange={setIncludeShiftsData}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-time-tracking">Incluir datos de control horario</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir información de control horario en los informes
                  </p>
                </div>
                <Switch
                  id="include-time-tracking"
                  checked={includeTimeTrackingData}
                  onCheckedChange={setIncludeTimeTrackingData}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-weekly-hours">Horas semanales por defecto</Label>
                  <Input
                    id="default-weekly-hours"
                    type="number"
                    value={defaultWeeklyHours}
                    onChange={(e) => setDefaultWeeklyHours(e.target.value)}
                    placeholder="40"
                  />
                  <p className="text-sm text-muted-foreground">
                    Horas semanales estándar para nuevos empleados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-annual-hours">Horas anuales por defecto</Label>
                  <Input
                    id="default-annual-hours"
                    type="number"
                    value={defaultAnnualHours}
                    onChange={(e) => setDefaultAnnualHours(e.target.value)}
                    placeholder="1760"
                  />
                  <p className="text-sm text-muted-foreground">
                    Horas anuales estándar para nuevos empleados
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="report-frequency">Frecuencia de informes automáticos</Label>
                <Select value={reportFrequency} onValueChange={setReportFrequency}>
                  <SelectTrigger id="report-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="annually">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Con qué frecuencia generar informes automáticamente
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="default-filter">Filtro por defecto</Label>
                <Select value={defaultFilterBy} onValueChange={setDefaultFilterBy}>
                  <SelectTrigger id="default-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Por equipo</SelectItem>
                    <SelectItem value="location">Por ubicación</SelectItem>
                    <SelectItem value="both">Equipo y ubicación</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Filtro predeterminado para la exportación de informes
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