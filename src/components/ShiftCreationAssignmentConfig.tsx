import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Users, 
  RotateCcw, 
  Save, 
  Copy,
  Clock,
  Calendar,
  Filter,
  AlertTriangle,
  CheckCircle,
  Mail,
  Bell,
  Settings
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ShiftCreationAssignmentConfigProps {
  onBack?: () => void;
}

export const ShiftCreationAssignmentConfig = ({ onBack }: ShiftCreationAssignmentConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableQuickCopy, setEnableQuickCopy] = useState(true);
  const [autoConflictDetection, setAutoConflictDetection] = useState(true);
  const [defaultCreationMethod, setDefaultCreationMethod] = useState("saved-shifts");
  const [showAddButton, setShowAddButton] = useState(true);
  const [autoSaveTemplates, setAutoSaveTemplates] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleSave = async () => {
    const config = {
      enableQuickCopy,
      autoConflictDetection,
      defaultCreationMethod,
      showAddButton,
      autoSaveTemplates,
      emailNotifications,
      pushNotifications
    };
    
    const success = await saveConfiguration("shift-creation-assignment", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Plus className="h-6 w-6 text-primary" />
          Creación y Asignación de Turnos
        </h2>
        <p className="text-muted-foreground">
          Optimice su proceso de gestión de turnos con métodos eficientes de creación y asignación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Métodos de Creación de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Turnos Rotativos</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Ideal para turnos tradicionales que siguen patrones específicos semanales o quincenales
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Patrones que se repiten en bucle continuo</li>
                  <li>• Útil para planificación y programación</li>
                  <li>• Automatiza la asignación recurrente</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <Save className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Horarios Guardados</h4>
                <p className="text-sm text-green-800 mb-2">
                  Guarde turnos frecuentes con franjas horarias designadas
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Elimina entrada manual repetitiva de horas</li>
                  <li>• Flexibilidad para turnos sin patrón fijo</li>
                  <li>• Útil para gestión de horas extraordinarias</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <Plus className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Turno Desde Cero</h4>
                <p className="text-sm text-purple-800 mb-2">
                  Cree turnos completamente personalizados para necesidades específicas
                </p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Máxima flexibilidad de configuración</li>
                  <li>• Definición completa de horarios y ubicaciones</li>
                  <li>• Opción de guardar para uso futuro</li>
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
            Proceso de Creación de Turno Desde Cero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span>Turnos → Botón "+" → Añadir turnos → Nuevo horario desde cero</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span>Seleccionar personas y definir nombre del horario</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <span>Definir duración y período (No se repite, Diario, Período personalizado)</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
              <span>Configurar pausas, lugar y área de trabajo</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
              <span>Definir hora de inicio/fin, agregar comentarios y guardar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Funcionalidades de Productividad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Copy className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Copiar Semana Anterior</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Copie todos los turnos publicados de la semana anterior
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ahorra tiempo significativo en programación</li>
                  <li>• Página principal → "Copiar la semana anterior" → Confirmar</li>
                  <li>• Solo copia turnos ya publicados</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Plus className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Agregar Turnos Adicionales</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Añada más turnos en días ya programados
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Hover sobre turno existente → Aparece ícono "+"</li>
                  <li>• Seleccione horario guardado o cree desde cero</li>
                  <li>• Flexibilidad para cambios de última hora</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Save className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Asignar Horario Guardado</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use turnos previamente guardados para asignación rápida
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Turnos → "+" → Añadir horarios</li>
                  <li>• Seleccionar personas y duración</li>
                  <li>• Elegir de horarios guardados → Añadir</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Publicación y Gestión de Conflictos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Resolución de Conflictos
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              Antes de publicar, resuelva todos los conflictos resaltados en rojo
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900 dark:text-red-100">
                  Encontrar conflictos: Filtro → Estado del turno = Conflictos de turnos
                </span>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-6">
                <li>• Identificar turnos conflictivos automáticamente</li>
                <li>• Resolver eliminando turnos incorrectos</li>
                <li>• Verificar resolución antes de publicar</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Proceso de Publicación</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Verificar y resolver todos los conflictos</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Hacer clic en "Publicar el calendario" (esquina superior derecha)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>Comunicar turnos por email/notificación push</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-purple-600" />
                <span>Turnos se vuelven horas estimadas para control horario</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Creación y Asignación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-quick-copy">Habilitar copia rápida de semana</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir copiar turnos de la semana anterior con un clic
                  </p>
                </div>
                <Switch 
                  id="enable-quick-copy" 
                  checked={enableQuickCopy}
                  onCheckedChange={setEnableQuickCopy}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-conflict-detection">Detección automática de conflictos</Label>
                  <p className="text-sm text-muted-foreground">
                    Resaltar automáticamente turnos con conflictos en rojo
                  </p>
                </div>
                <Switch 
                  id="auto-conflict-detection" 
                  checked={autoConflictDetection}
                  onCheckedChange={setAutoConflictDetection}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Método predeterminado de creación</Label>
                <Select value={defaultCreationMethod} onValueChange={setDefaultCreationMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from-scratch">Desde cero</SelectItem>
                    <SelectItem value="saved-shifts">Horarios guardados</SelectItem>
                    <SelectItem value="rotating">Turnos rotativos</SelectItem>
                    <SelectItem value="copy-previous">Copiar anterior</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Método que aparece por defecto al crear nuevos turnos
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-add-button">Mostrar botón "+" en hover</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar botón para agregar turnos al pasar cursor sobre días
                  </p>
                </div>
                <Switch 
                  id="show-add-button" 
                  checked={showAddButton}
                  onCheckedChange={setShowAddButton}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save-templates">Guardar automáticamente como plantilla</Label>
                  <p className="text-sm text-muted-foreground">
                    Preguntar si guardar horarios personalizados como plantilla
                  </p>
                </div>
                <Switch 
                  id="auto-save-templates" 
                  checked={autoSaveTemplates}
                  onCheckedChange={setAutoSaveTemplates}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por email al publicar</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar automáticamente emails cuando se publiquen turnos
                  </p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Notificaciones push al publicar</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificaciones push a la app móvil al publicar
                  </p>
                </div>
                <Switch 
                  id="push-notifications" 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
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