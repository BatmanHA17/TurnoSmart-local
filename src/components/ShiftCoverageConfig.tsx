import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Plus, Users, Copy, MousePointer, Settings, Eye, Trash2, Edit, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ShiftCoverageConfigProps {
  onBack?: () => void;
}

export function ShiftCoverageConfig({ onBack }: ShiftCoverageConfigProps = {}) {
  const { saveConfiguration } = useConfigurationState();
  const [enableCoverage, setEnableCoverage] = useState(true);
  const [allowDragDrop, setAllowDragDrop] = useState(true);
  const [enablePatternStorage, setEnablePatternStorage] = useState(true);
  const [maxCopyPeriod, setMaxCopyPeriod] = useState("3");
  const [autoPublish, setAutoPublish] = useState(false);
  const [defaultEmployeesPerShift, setDefaultEmployeesPerShift] = useState("1");

  const handleSave = async () => {
    const config = {
      enableCoverage,
      allowDragDrop,
      enablePatternStorage,
      maxCopyPeriod,
      autoPublish,
      defaultEmployeesPerShift
    };
    
    const success = await saveConfiguration("shift-coverage", config);
    if (success && onBack) {
      onBack();
    }
  };

  const coverageFeatures = [
    {
      title: "Concepto de turno vacío",
      description: "Crear turnos sin asignar empleados específicos para planificación posterior",
      icon: Plus,
      benefit: "Permite planificación estructurada antes de asignación"
    },
    {
      title: "Turnos semanales completos",
      description: "Crear todos los turnos necesarios durante una semana de forma sistemática",
      icon: Settings,
      benefit: "Garantiza cobertura completa sin huecos"
    },
    {
      title: "Patrones de semana",
      description: "Guardar plantillas (semana normal, ocupada, baja) para reutilizar",
      icon: Star,
      benefit: "Ahorra tiempo en planificación recurrente"
    },
    {
      title: "Asignación masiva",
      description: "Asignar turnos a múltiples empleados de forma individual o masiva",
      icon: Users,
      benefit: "Flexibilidad en métodos de asignación"
    }
  ];

  const creationSteps = [
    {
      step: 1,
      title: "Acceder a Cobertura",
      description: "Ir a 'Turnos' en barra lateral → clic en ícono 'Cobertura'",
      detail: "Aparecerá la 'Sección de Cobertura'"
    },
    {
      step: 2,
      title: "Crear turno",
      description: "Pasar ratón sobre celda deseada → clic en botón (+)",
      detail: "Se abre ventana modal de configuración"
    },
    {
      step: 3,
      title: "Configurar turno",
      description: "Establecer número de empleados y elegir tipo de turno",
      detail: "Nuevo desde cero o seleccionar horario guardado"
    },
    {
      step: 4,
      title: "Completar información",
      description: "Llenar datos requeridos y guardar",
      detail: "Se pueden crear turnos ilimitados"
    }
  ];

  const assignmentMethods = [
    {
      method: "Arrastrar y Soltar",
      description: "Arrastrando el turno directamente a la celda del empleado",
      steps: ["Seleccionar turno creado", "Arrastrar hacia empleado", "Soltar en celda destino"],
      icon: MousePointer
    },
    {
      method: "Asignación por Menú",
      description: "Usando el menú contextual del turno",
      steps: [
        "Pasar ratón sobre (#) del turno",
        "Clic en tres puntos",
        "Seleccionar 'Asignar empleados'",
        "Elegir empleados y guardar"
      ],
      icon: Users
    }
  ];

  const managementOptions = [
    {
      action: "Mostrar detalles",
      description: "Ver información completa del turno de cobertura",
      icon: Eye
    },
    {
      action: "Editar",
      description: "Modificar configuración del turno existente",
      icon: Edit
    },
    {
      action: "Borrar",
      description: "Eliminar turno de cobertura del sistema",
      icon: Trash2
    }
  ];

  // handleSave ya está definido arriba

  return (
    <div className="space-y-8">{/* Removed duplicate header */}

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Cobertura de Turnos</h1>
        <p className="text-muted-foreground">
          Optimiza los horarios de turnos y asegúrate de que estén completamente cubiertos con planificación anticipada.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Optimización de Cobertura de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La cobertura de turnos te permite crear la distribución de turnos necesarios para luego asignarlos 
            a los empleados de forma eficiente, garantizando que todos los horarios estén completamente cubiertos.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                  <IconComponent className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✓ {feature.benefit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Creating Coverage Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Crear Turnos de Cobertura
          </CardTitle>
          <CardDescription>
            Proceso paso a paso para configurar turnos de cobertura en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {creationSteps.map((step) => (
              <div key={step.step} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{step.step}</Badge>
                  <h4 className="font-medium text-sm">{step.title}</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  <p className="text-xs bg-muted/50 p-2 rounded border-l-2 border-l-primary/30">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Alert>
            <Star className="h-4 w-4" />
            <AlertDescription>
              <strong>Flexibilidad:</strong> Puedes crear tantos turnos como quieras para garantizar 
              cobertura completa en todos los horarios requeridos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Assignment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Métodos de Asignación de Turnos
          </CardTitle>
          <CardDescription>
            Dos formas flexibles de asignar turnos de cobertura a empleados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignmentMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{method.method}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  <div className="space-y-2">
                    {method.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-0.5">{stepIndex + 1}</Badge>
                        <p className="text-xs text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Management Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            Gestión de Turnos de Cobertura
          </CardTitle>
          <CardDescription>
            Opciones disponibles para administrar turnos de cobertura existentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Acceso:</strong> Pasar ratón sobre (#) del turno → clic en tres puntos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {managementOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <IconComponent className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{option.action}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Recuerda hacer clic en "Publicar horario" cada vez que 
              termines de editar o agregar un turno para que los cambios sean visibles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Copy Coverage Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-teal-500" />
            Copiar Períodos de Cobertura
          </CardTitle>
          <CardDescription>
            Reutiliza patrones de turnos existentes aplicándolos a diferentes períodos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Copia cualquier período de turnos no asignados existentes y vuelve a aplicarlos 
            fácilmente a otro período para ahorrar tiempo en planificación.
          </p>
          
          <div className="space-y-4">
            <h4 className="font-medium">Proceso de Copia:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">Paso 1-3</Badge>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Selección</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Clic en "Copiar período"</li>
                    <li>• Elegir "Cobertura"</li>
                    <li>• Especificar período (máx 3 meses)</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">Paso 4</Badge>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Configuración</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Clic en "Siguiente"</li>
                    <li>• Indicar fecha de inicio</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">Paso 5</Badge>
                <div className="text-sm space-y-1">
                  <p className="font-medium">Aplicación</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Clic en "Copiar"</li>
                    <li>• Verificar aplicación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Cobertura</CardTitle>
          <CardDescription>
            Configure las opciones para optimizar la gestión de cobertura de turnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable coverage */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Habilitar cobertura de turnos</Label>
              <p className="text-sm text-muted-foreground">
                Activa la funcionalidad completa de gestión de cobertura de turnos.
              </p>
            </div>
            <Switch
              checked={enableCoverage}
              onCheckedChange={setEnableCoverage}
            />
          </div>

          <Separator />

          {/* Drag and drop */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Permitir arrastrar y soltar</Label>
              <p className="text-sm text-muted-foreground">
                Habilita la asignación de turnos mediante arrastrar y soltar.
              </p>
            </div>
            <Switch
              checked={allowDragDrop}
              onCheckedChange={setAllowDragDrop}
              disabled={!enableCoverage}
            />
          </div>

          <Separator />

          {/* Pattern storage */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Almacenamiento de patrones</Label>
              <p className="text-sm text-muted-foreground">
                Permite guardar y reutilizar patrones de semanas (normal, ocupada, baja).
              </p>
            </div>
            <Switch
              checked={enablePatternStorage}
              onCheckedChange={setEnablePatternStorage}
              disabled={!enableCoverage}
            />
          </div>

          <Separator />

          {/* Max copy period */}
          <div className="space-y-3">
            <Label className="text-base">Período máximo de copia (meses)</Label>
            <Select value={maxCopyPeriod} onValueChange={setMaxCopyPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mes</SelectItem>
                <SelectItem value="2">2 meses</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Límite máximo para copiar períodos de cobertura.
            </p>
          </div>

          <Separator />

          {/* Default employees per shift */}
          <div className="space-y-3">
            <Label className="text-base">Empleados por turno (predeterminado)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={defaultEmployeesPerShift}
              onChange={(e) => setDefaultEmployeesPerShift(e.target.value)}
              className="w-24"
              disabled={!enableCoverage}
            />
            <p className="text-sm text-muted-foreground">
              Número predeterminado de empleados al crear nuevos turnos de cobertura.
            </p>
          </div>

          <Separator />

          {/* Auto publish */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Publicación automática</Label>
              <p className="text-sm text-muted-foreground">
                Publica automáticamente los horarios al completar asignaciones.
              </p>
            </div>
            <Switch
              checked={autoPublish}
              onCheckedChange={setAutoPublish}
              disabled={!enableCoverage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!enableCoverage} className="bg-black hover:bg-black/90 text-white">
          Guardar
        </Button>
      </div>
    </div>
  );
}