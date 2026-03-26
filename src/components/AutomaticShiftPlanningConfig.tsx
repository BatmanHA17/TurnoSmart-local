import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { 
  Zap, 
  Settings2, 
  Shield, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Target,
  Crown
} from "lucide-react";

interface AutomaticShiftPlanningConfigProps {
  onBack?: () => void;
}

export const AutomaticShiftPlanningConfig = ({ onBack }: AutomaticShiftPlanningConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAutomaticPlanning, setEnableAutomaticPlanning] = useState(true);

  const handleSave = async () => {
    const config = {
      enableAutomaticPlanning
    };
    
    const success = await saveConfiguration("automatic-shift-planning", config);
    if (success && onBack) {
      onBack();
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Volver
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Planificación Automática de Turnos
          </h2>
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <Crown className="h-3 w-3 mr-1" />
            Enterprise
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Genere horarios de trabajo justos y compatibles automáticamente, reduciendo el esfuerzo manual y previniendo errores legales.
        </p>
      </div>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Crown className="h-5 w-5" />
            Funcionalidad Enterprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 text-sm">
            La planificación automática de turnos está disponible exclusivamente para planes Enterprise. 
            Esta funcionalidad avanzada permite generar horarios semanales optimizados con solo unos clics, 
            considerando automáticamente la legislación laboral, límites contractuales y disponibilidad de empleados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Proceso de Configuración (3 Pasos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Definir Reglas de Programación</h4>
                <p className="text-sm text-blue-800">
                  Configure las reglas en el contrato de cada empleado para garantizar cumplimiento legal
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Organización → Perfil de empleado → Contrato</li>
                  <li>• Establecer horas de contrato</li>
                  <li>• Máximo de horas diarias</li>
                  <li>• Horas mínimas de descanso entre jornadas (ej: 12h en España)</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">Establecer Necesidades de Cobertura</h4>
                <p className="text-sm text-green-800">
                  Defina cuántas personas se necesitan por rol durante la semana
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Turnos → Botón Cobertura</li>
                  <li>• Seleccionar lugar de trabajo</li>
                  <li>• Definir número de personas por puesto</li>
                  <li>• Seleccionar horarios guardados por rol</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-purple-900">Ejecutar Programador Automático</h4>
                <p className="text-sm text-purple-800">
                  Asigne turnos según reglas y cobertura definidas
                </p>
                <ul className="text-sm text-purple-700 space-y-1 mt-2">
                  <li>• Sección Cobertura → Programar automáticamente</li>
                  <li>• Seleccionar reglas a aplicar</li>
                  <li>• Elegir empleados a incluir</li>
                  <li>• Ejecutar y publicar turnos</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Revisión del Horario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Después de ejecutar la planificación automática, revise los resultados en la vista de Cobertura.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Turnos Completamente Asignados</h4>
                <p className="text-sm text-muted-foreground">
                  Turnos que han sido asignados exitosamente a empleados disponibles
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Turnos Sin Asignar</h4>
                <p className="text-sm text-muted-foreground">
                  Pueden ocurrir por falta de empleados disponibles o restricciones contractuales
                </p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Insuficientes empleados disponibles</li>
                  <li>• Restricciones de reglas u horarios contractuales</li>
                  <li>• Realizar ajustes manuales según necesidad</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mejores Prácticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Contratos Actualizados</h4>
                <p className="text-sm text-muted-foreground">
                  Mantenga todos los contratos con horas acordadas y tiempos de descanso precisos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Verificación Periódica</h4>
                <p className="text-sm text-muted-foreground">
                  Revise la cobertura regularmente para ajustar a picos de actividad o días festivos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Ajustes Manuales</h4>
                <p className="text-sm text-muted-foreground">
                  Los turnos pueden editarse manualmente después de la planificación automática
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">¿Por qué no se asignan turnos a ningún empleado?</h4>
              <p className="text-sm text-muted-foreground">
                Puede ocurrir si no hay suficientes personas disponibles que coincidan con las reglas y roles definidos.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">¿Por qué los cambios no son visibles después de programar?</h4>
              <p className="text-sm text-muted-foreground">
                Intente actualizar la página si los nuevos turnos no aparecen inmediatamente.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium">¿Qué pasa si ningún empleado está disponible para un turno?</h4>
              <p className="text-sm text-muted-foreground">
                El sistema dejará el turno sin asignar y podrá verlo en la sección Cobertura.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">¿Puedo editar horarios después de crearlos?</h4>
              <p className="text-sm text-muted-foreground">
                Sí, los turnos se pueden ajustar manualmente una vez completada la planificación automática (antes de publicarla).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuración de Planificación Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-auto-planning">Habilitar planificación automática</Label>
                <p className="text-sm text-muted-foreground">
                  Activar la funcionalidad de generación automática de turnos
                </p>
              </div>
              <Switch id="enable-auto-planning" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Algoritmo de optimización</Label>
              <Select defaultValue="balanced">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Equilibrado (recomendado)</SelectItem>
                  <SelectItem value="efficiency">Máxima eficiencia</SelectItem>
                  <SelectItem value="fairness">Máxima equidad</SelectItem>
                  <SelectItem value="preferences">Priorizar preferencias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Algoritmo utilizado para asignar turnos automáticamente
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="respect-availability">Respetar disponibilidad de empleados</Label>
                <p className="text-sm text-muted-foreground">
                  No asignar turnos fuera de la disponibilidad declarada
                </p>
              </div>
              <Switch id="respect-availability" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforce-rest-periods">Aplicar períodos de descanso obligatorios</Label>
                <p className="text-sm text-muted-foreground">
                  Garantizar descanso mínimo entre jornadas según legislación
                </p>
              </div>
              <Switch id="enforce-rest-periods" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-publish">Publicar automáticamente tras generar</Label>
                <p className="text-sm text-muted-foreground">
                  Publicar turnos automáticamente después de la generación exitosa
                </p>
              </div>
              <Switch id="auto-publish" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Prioridad de asignación</Label>
              <Select defaultValue="seniority">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seniority">Antigüedad</SelectItem>
                  <SelectItem value="random">Aleatorio</SelectItem>
                  <SelectItem value="rotation">Rotación equitativa</SelectItem>
                  <SelectItem value="skills">Habilidades específicas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Criterio principal para priorizar empleados en la asignación
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">Guardar</Button>
            <Button variant="outline">Restablecer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};