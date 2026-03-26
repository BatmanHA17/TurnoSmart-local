import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Save, 
  Plus, 
  Palette, 
  Clock, 
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  Calendar,
  Zap,
  MessageSquare,
  MoreHorizontal,
  Coffee
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { getSavedShifts, getSavedShiftsSync, removeSavedShift } from "@/store/savedShiftsStore";
import { AdvancedShiftDialog } from "./AdvancedShiftDialog";
import { formatBreakTime } from "@/utils/breakCalculations";
import { useJobDepartments } from "@/hooks/useJobDepartments";

interface SavedShiftsConfigProps {
  onBack?: () => void;
}

export const SavedShiftsConfig = ({ onBack }: SavedShiftsConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const { departments } = useJobDepartments();
  const [enableSavedShifts, setEnableSavedShifts] = useState(true);
  const [autoColorAssignment, setAutoColorAssignment] = useState(true);
  const [colorPalette, setColorPalette] = useState("standard");
  const [showColorLegend, setShowColorLegend] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);
  const [overtimeDefault, setOvertimeDefault] = useState(false);
  const [defaultAction, setDefaultAction] = useState("keep-original");
  
  // Estados para gestión de horarios guardados - tomando de "Opciones avanzadas" como matriz
  const [savedShifts, setSavedShifts] = useState<any[]>([]);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Helper functions for team selection - same as AdvancedShiftDialog
  const parseTeamsFromString = (teamsString: string): string[] => {
    if (!teamsString || teamsString.trim() === "") return [];
    return teamsString.split(',').map(t => t.trim()).filter(t => t !== "");
  };

  const getTeamNameById = (teamId: string): string => {
    const team = departments.find(dept => dept.id === teamId);
    return team ? team.value : teamId;
  };

  const formatTeamNames = (selectedTeam: string): string => {
    console.log('🔍 formatTeamNames DEBUG:', { 
      selectedTeam, 
      departments: departments.length,
      departmentsList: departments.map(d => ({ id: d.id, value: d.value }))
    });
    
    if (!selectedTeam || selectedTeam.trim() === '') return '-';
    if (departments.length === 0) return 'Cargando...'; // Wait for departments to load
    const teamIds = parseTeamsFromString(selectedTeam);
    
    console.log('🔍 teamIds parsed:', teamIds);
    
    if (teamIds.length === 0) return '-';
    if (teamIds.length === 1) {
      const result = getTeamNameById(teamIds[0]);
      console.log('🔍 Single team result:', result);
      return result;
    }
    const result = `${teamIds.length} equipos`;
    console.log('🔍 Multiple teams result:', result);
    return result;
  };

  // Cargar horarios guardados desde la matriz de "Opciones avanzadas"
  useEffect(() => {
    const loadSavedShifts = async () => {
      // Forzar recarga desde base de datos para obtener datos actualizados
      const shifts = await getSavedShifts(true);
      console.log('SavedShiftsConfig - departments loaded:', departments.length);
      console.log('SavedShiftsConfig - shifts loaded:', shifts.map(s => ({ name: s.name, selectedTeam: s.selectedTeam })));
      setSavedShifts(shifts);
    };
    loadSavedShifts();
  }, [refreshKey, departments]); // Add departments as dependency

  const handleSave = async () => {
    const config = {
      enableSavedShifts,
      autoColorAssignment,
      colorPalette,
      showColorLegend,
      requireLocation,
      overtimeDefault,
      defaultAction
    };
    
    const success = await saveConfiguration("saved-shifts", config);
    if (success && onBack) {
      onBack();
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    removeSavedShift(shiftId);
    setRefreshKey(prev => prev + 1);
  };

  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setShowAdvancedDialog(true);
  };

  const handleNewShift = () => {
    setEditingShift(null);
    setShowAdvancedDialog(true);
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Save className="h-6 w-6 text-primary" />
          Horarios Guardados
        </h2>
        <p className="text-muted-foreground">
          Cree y reutilice diferentes tipos de turnos con franjas horarias designadas, eliminando la entrada manual repetitiva.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Ventajas de los Horarios Guardados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Ahorro de Tiempo</h4>
                <p className="text-sm text-blue-800">
                  Elimina la necesidad de ingresar manualmente las horas de turnos repetitivos
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Plantillas reutilizables de turnos frecuentes</li>
                  <li>• Configuración única para uso múltiple</li>
                  <li>• Reducción significativa del tiempo de programación</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <Palette className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Reconocimiento Visual</h4>
                <p className="text-sm text-green-800">
                  Etiquetas de color para identificación inmediata de franjas horarias
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Código de colores personalizable</li>
                  <li>• Reconocimiento inmediato de turnos</li>
                  <li>• Mejora claridad del cronograma</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Información de Ubicación</h4>
                <p className="text-sm text-purple-800">
                  Incluye lugares de trabajo, áreas específicas y comentarios
                </p>
                <ul className="text-sm text-purple-700 space-y-1 mt-2">
                  <li>• Asignación automática de ubicaciones</li>
                  <li>• Comentarios predefinidos por turno</li>
                  <li>• Gestión eficiente de múltiples ubicaciones</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Proceso de Creación de Horarios Guardados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span>Barra lateral → Turnos → Ícono tres puntos (esquina superior derecha)</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span>Seleccionar "Configuración de Horarios"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <span>Asegurarse de estar en pestaña "Horarios guardados"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
              <span>Clic en "+ Guardar un nuevo turno"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
              <span>Completar información: nombre, horarios, color, ubicación</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">6</div>
              <span>Clic en "Guardar" para finalizar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignación de Horarios Guardados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span>Barra lateral → Turnos → Botón "+"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span>Elegir "Agregar turnos"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <span>Seleccionar empleados y definir período</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
              <span>Seleccionar horario guardado de la lista</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
              <span>Configurar opciones adicionales y añadir</span>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 mt-4">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Opciones Especiales de Asignación
            </h4>
            <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
              <li>• <strong>Turno de horas extras:</strong> Marcar si el turno cuenta como horas extraordinarias</li>
              <li>• <strong>Editar ubicación:</strong> Modificar lugar y área de trabajo específicos</li>
              <li>• <strong>Comentarios:</strong> Agregar notas adicionales al turno asignado</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Sistema de Códigos de Color
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Función del Código de Colores
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Las etiquetas de color asignadas corresponden al color de visualización en el cronograma
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Reconocimiento inmediato de franjas horarias</li>
                <li>• Mejora la claridad visual del cronograma</li>
                <li>• Facilita comprensión rápida de la programación</li>
                <li>• Leyenda accesible mediante "Ver código de color"</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-2 rounded border">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Mañana</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded border">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Tarde</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded border">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm">Noche</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded border">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">Urgencia</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Gestión de Horarios Guardados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MoreHorizontal className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Menú de Opciones</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Clic en ícono de tres puntos junto al horario guardado para acceder a opciones
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Editar horario guardado:</strong> Modificar horarios, nombre, color y ubicación</li>
                  <li>• <strong>Eliminar horario guardado:</strong> Remover permanentemente del sistema</li>
                  <li>• <strong>Duplicar turno:</strong> Crear copia para modificaciones rápidas</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Consideraciones Importantes
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Eliminar un horario guardado no afecta horarios ya asignados</li>
                <li>• Cambios en horarios guardados no se aplican retroactivamente</li>
                <li>• Recordar publicar calendario después de asignar turnos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nueva sección: Tus horarios guardados - idéntica a Opciones avanzadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Tus horarios guardados
          </CardTitle>
          <div className="flex justify-end">
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-50 rounded-full"
              onClick={handleNewShift}
            >
              <Plus className="h-3 w-3 mr-1" />
              Nuevo Horario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabla de horarios guardados - misma estructura que en Opciones avanzadas */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-muted/20 border-b px-4 py-2">
              <div className="grid grid-cols-7 gap-4 text-xs font-medium text-muted-foreground">
                <div>Nombre del horario</div>
                <div>Rango horario</div>
                <div>Descanso</div>
                <div>Lugar de trabajo</div>
                <div>Área de trabajo</div>
                <div>Acceso</div>
                <div></div>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {savedShifts.length > 0 ? (
                <div className="divide-y">
                  {savedShifts.map((shift) => (
                    <div key={shift.id} className="px-4 py-2 hover:bg-muted/10">
                      <div className="grid grid-cols-7 gap-4 text-sm items-center">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: shift.color }}
                          ></div>
                          <span className="font-medium">{shift.name}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="text-muted-foreground">
                          {shift.hasBreak && (shift.totalBreakTime || shift.breakDuration)
                            ? shift.totalBreakTime 
                              ? `${Math.round(shift.totalBreakTime)} min`
                              : `${shift.breakDuration} min`
                            : '-'
                          }
                        </div>
                        <div className="text-muted-foreground">
                          {shift.selectedWorkplace || shift.organization || '-'}
                        </div>
                        <div className="text-muted-foreground">
                          {(() => {
                            const result = formatTeamNames(shift.selectedTeam);
                            console.log(`Shift: ${shift.name}, selectedTeam: "${shift.selectedTeam}", formatted: "${result}"`);
                            return result;
                          })()}
                        </div>
                        <div>
                          <Badge 
                            variant={shift.accessType === 'company' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {shift.accessType === 'company' ? 'Todo' : 'Equipo'}
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 rounded-full hover:bg-muted/20"
                              >
                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditShift(shift)}>
                                Editar horario guardado
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteShift(shift.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Eliminar horario guardado
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Aún no hay horarios guardados.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-50 rounded-full"
                    onClick={handleNewShift}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo Horario
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Horarios Guardados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-saved-shifts">Habilitar horarios guardados</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar la funcionalidad de plantillas de turnos reutilizables
                  </p>
                </div>
                <Switch 
                  id="enable-saved-shifts" 
                  checked={enableSavedShifts}
                  onCheckedChange={setEnableSavedShifts}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-color-assignment">Asignación automática de colores</Label>
                  <p className="text-sm text-muted-foreground">
                    Asignar colores automáticamente al crear nuevos horarios guardados
                  </p>
                </div>
                <Switch 
                  id="auto-color-assignment" 
                  checked={autoColorAssignment}
                  onCheckedChange={setAutoColorAssignment}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Paleta de colores predeterminada</Label>
                <Select value={colorPalette} onValueChange={setColorPalette}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="vibrant">Vibrante</SelectItem>
                    <SelectItem value="pastel">Pastel</SelectItem>
                    <SelectItem value="professional">Profesional</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Conjunto de colores disponibles para horarios guardados
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-color-legend">Mostrar leyenda de colores automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Visualizar código de colores sin necesidad de hacer clic
                  </p>
                </div>
                <Switch 
                  id="show-color-legend" 
                  checked={showColorLegend}
                  onCheckedChange={setShowColorLegend}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-location">Requerir información de ubicación</Label>
                  <p className="text-sm text-muted-foreground">
                    Hacer obligatorio especificar lugar y área de trabajo
                  </p>
                </div>
                <Switch 
                  id="require-location" 
                  checked={requireLocation}
                  onCheckedChange={setRequireLocation}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overtime-default">Marcar como horas extras por defecto</Label>
                  <p className="text-sm text-muted-foreground">
                    Configuración predeterminada para turnos de horas extraordinarias
                  </p>
                </div>
                <Switch 
                  id="overtime-default" 
                  checked={overtimeDefault}
                  onCheckedChange={setOvertimeDefault}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Acción por defecto al asignar</Label>
                <Select value={defaultAction} onValueChange={setDefaultAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep-original">Mantener configuración original</SelectItem>
                    <SelectItem value="allow-edit">Permitir edición en asignación</SelectItem>
                    <SelectItem value="force-edit">Requerir revisión en asignación</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Comportamiento al asignar horarios guardados a empleados
                </p>
              </div>
            </div>

             <div className="flex gap-2 pt-4">
               <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">Guardar</Button>
               <Button variant="outline">Restablecer</Button>
             </div>
        </CardContent>
      </Card>

      {/* Dialog de Opciones avanzadas - la matriz de datos */}
      <AdvancedShiftDialog
        isOpen={showAdvancedDialog}
        onClose={() => {
          setShowAdvancedDialog(false);
          setEditingShift(null);
          setRefreshKey(prev => prev + 1); // Refrescar la lista cuando se cierre
        }}
        employee={undefined} // No hay empleado específico en configuración
        date={new Date()} // Fecha actual por defecto
        editingShift={editingShift} // Pasar el horario que se está editando
        onShiftAssigned={(shiftData) => {
          console.log("Horario guardado:", shiftData);
          setRefreshKey(prev => prev + 1); // Refrescar la lista después de guardar
        }}
      />
    </div>
  );
};