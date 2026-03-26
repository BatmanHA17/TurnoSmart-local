import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Eye, 
  Users, 
  Building2, 
  Calendar, 
  Clock,
  Grid3X3,
  CalendarDays,
  CalendarRange,
  MapPin,
  AlertCircle,
  Plus,
  Settings
} from "lucide-react";

interface ShiftViewConfigProps {
  onBack?: () => void;
}

export const ShiftViewConfig = ({ onBack }: ShiftViewConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const navigate = useNavigate();
  const [enableEmployeeView, setEnableEmployeeView] = useState(true);
  const [enableWorkareaView, setEnableWorkareaView] = useState(true);
  const [showHourlyCounter, setShowHourlyCounter] = useState(true);
  const [defaultView, setDefaultView] = useState("weekly");
  const [showPendingAbsences, setShowPendingAbsences] = useState(true);
  const [autoAddWorkareaButton, setAutoAddWorkareaButton] = useState(true);
  const [workareaSort, setWorkareaSort] = useState("start-time");

  const handleSave = async () => {
    const success = await saveConfiguration("shift-views", {
      enableEmployeeView,
      enableWorkareaView,
      showHourlyCounter,
      defaultView,
      showPendingAbsences,
      autoAddWorkareaButton,
      workareaSort
    });
    
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary" />
          Vistas en la Gestión de Turnos
        </h2>
        <p className="text-muted-foreground">
          Configure las diferentes formas de visualizar y gestionar los turnos según las necesidades de su organización.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Tipos de Vistas Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Vista Semanal</h4>
                <p className="text-sm text-blue-800">
                  Visualiza turnos organizados por empleado individual
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Acceso desde encabezado de tabla → "Empleado/a"</li>
                  <li>• Vista centrada en cada persona</li>
                  <li>• Ideal para gestión personalizada</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Vista por Área de Trabajo</h4>
                <p className="text-sm text-green-800">
                  Turnos agrupados por área de trabajo y organizados por empleado
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Acceso desde encabezado de tabla → "Área de trabajo"</li>
                  <li>• Ordenados por hora de inicio dentro de cada área</li>
                  <li>• Empleados sin área se agrupan como "Sin área de trabajo"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Vistas Temporales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Vista Diaria</h4>
                <p className="text-sm text-muted-foreground">
                  Descripción completa de todos los turnos programados durante el día
                </p>
                <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Contador por Hora</span>
                  </div>
                  <p className="text-xs text-orange-800 mt-1">
                    Muestra cantidad de empleados por hora, incluyendo fracciones precisas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CalendarDays className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Vista Semanal</h4>
                <p className="text-sm text-muted-foreground">
                  Horario de trabajo semanal completo de cada persona con turnos asignados detallados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CalendarRange className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Vista de 4 Semanas</h4>
                <p className="text-sm text-muted-foreground">
                  Muestra las cuatro semanas completas del mes para planificación a largo plazo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Vista Mensual</h4>
                <p className="text-sm text-muted-foreground">
                  Período completo desde el primer día hasta el último día del mes
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nota: Detalles como lugares y áreas de trabajo no se muestran en vistas largas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Gestión de Ausencias en Vistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Ausencias Pendientes
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Las ausencias pendientes aparecen como casillas a rayas etiquetadas como "Ausencia pendiente" o "AP"
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• No crean conflictos hasta ser aprobadas</li>
              <li>• Botón contextual de suma al pasar cursor</li>
              <li>• Permite agregar turnos en la misma celda</li>
              <li>• Visibles en todas las vistas de tiempo</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
                Pendiente
              </Badge>
              <span className="text-sm">Ausencia no aprobada, no genera conflictos</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                Aprobada
              </Badge>
              <span className="text-sm">Ausencia confirmada, bloquea asignación de turnos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Asignación de Áreas de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-2">Turnos con Área Asignada</h4>
              <p className="text-sm text-blue-800">
                Se agrupan correctamente bajo su área de trabajo correspondiente y se ordenan por hora de inicio
              </p>
            </div>

            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50">
              <h4 className="font-medium text-orange-900 mb-2">Turnos "Sin Área de Trabajo"</h4>
              <p className="text-sm text-orange-800 mb-2">
                Turnos creados pero no asignados a un área específica se agrupan en el lugar de trabajo predeterminado
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Plus className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700">
                  Botón "Agregar área de trabajo" disponible con permisos adecuados
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Vistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-employee-view">Vista semanal</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar visualización organizada por empleado individual
                </p>
              </div>
              <Switch 
                id="enable-employee-view" 
                checked={enableEmployeeView}
                onCheckedChange={setEnableEmployeeView}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-workarea-view">Vista por área de trabajo</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar agrupación por áreas de trabajo
                </p>
              </div>
              <Switch 
                id="enable-workarea-view" 
                checked={enableWorkareaView}
                onCheckedChange={setEnableWorkareaView}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-hourly-counter">Contador por hora en vista diaria</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar cantidad de empleados por hora incluyendo fracciones
                </p>
              </div>
              <Switch 
                id="show-hourly-counter" 
                checked={showHourlyCounter}
                onCheckedChange={setShowHourlyCounter}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Vista predeterminada</Label>
              <Select value={defaultView} onValueChange={setDefaultView}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="4weeks">4 Semanas</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Vista que se carga por defecto al acceder a turnos
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-pending-absences">Mostrar ausencias pendientes</Label>
                <p className="text-sm text-muted-foreground">
                  Visualizar ausencias no aprobadas con estilo diferenciado
                </p>
              </div>
              <Switch 
                id="show-pending-absences" 
                checked={showPendingAbsences}
                onCheckedChange={setShowPendingAbsences}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-add-workarea-button">Botón automático "Agregar área"</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar botón para agregar área cuando hay turnos sin asignar
                </p>
              </div>
              <Switch 
                id="auto-add-workarea-button" 
                checked={autoAddWorkareaButton}
                onCheckedChange={setAutoAddWorkareaButton}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Ordenación en área de trabajo</Label>
              <Select value={workareaSort} onValueChange={setWorkareaSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start-time">Por hora de inicio</SelectItem>
                  <SelectItem value="employee-name">Por nombre de empleado</SelectItem>
                  <SelectItem value="duration">Por duración del turno</SelectItem>
                  <SelectItem value="priority">Por prioridad</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Criterio de ordenación dentro de cada área de trabajo
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