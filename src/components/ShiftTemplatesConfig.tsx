import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Layout, 
  Plus, 
  Clock, 
  CheckCircle, 
  Target,
  Settings,
  Copy,
  Users,
  Zap,
  Palette
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ShiftTemplatesConfigProps {
  onBack?: () => void;
}

export const ShiftTemplatesConfig = ({ onBack }: ShiftTemplatesConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableShiftTemplates, setEnableShiftTemplates] = useState(true);
  const [defaultTemplateType, setDefaultTemplateType] = useState("standard");
  const [allowCustomization, setAllowCustomization] = useState(true);
  const [autoSaveTemplates, setAutoSaveTemplates] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [templateCategories, setTemplateCategories] = useState("department");

  const handleSave = async () => {
    const config = {
      enableShiftTemplates,
      defaultTemplateType,
      allowCustomization,
      autoSaveTemplates,
      requireApproval,
      templateCategories
    };
    
    const success = await saveConfiguration("shift-templates", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" />
          Plantillas de Turnos
        </h2>
        <p className="text-muted-foreground">
          Cree y gestione plantillas reutilizables para diferentes tipos de turnos, facilitando la programación rápida y consistente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ¿Qué son las Plantillas de Turnos?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las plantillas de turnos son patrones predefinidos que puede usar para crear rápidamente 
            horarios consistentes. Son especialmente útiles para organizaciones con horarios de trabajo estándar.
          </p>
          
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Creación Rápida</h4>
                <p className="text-sm text-blue-800">
                  Acelere la programación usando plantillas predefinidas para turnos comunes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <Copy className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Reutilización</h4>
                <p className="text-sm text-green-800">
                  Use las mismas plantillas en múltiples semanas o períodos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-purple-200 bg-purple-50/50">
              <Palette className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Personalización</h4>
                <p className="text-sm text-purple-800">
                  Modifique plantillas para adaptarse a necesidades específicas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Cómo Crear Plantillas de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Proceso de Creación
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                  <span>Ir a Turnos → Configuración → Plantillas</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                  <span>Hacer clic en "Nueva plantilla"</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                  <span>Definir nombre y descripción</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                  <span>Configurar horarios y días</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
                  <span>Guardar como plantilla</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Plantillas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-templates">Habilitar plantillas de turnos</Label>
                <p className="text-sm text-muted-foreground">
                  Activar el sistema de plantillas reutilizables
                </p>
              </div>
              <Switch 
                id="enable-templates" 
                checked={enableShiftTemplates}
                onCheckedChange={setEnableShiftTemplates}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Tipo de plantilla predeterminada</Label>
              <Select value={defaultTemplateType} onValueChange={setDefaultTemplateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="rotating">Rotativa</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-customization">Permitir personalización</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir modificar plantillas al aplicarlas
                </p>
              </div>
              <Switch 
                id="allow-customization" 
                checked={allowCustomization}
                onCheckedChange={setAllowCustomization}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">Autoguardar plantillas</Label>
                <p className="text-sm text-muted-foreground">
                  Guardar automáticamente cambios en plantillas
                </p>
              </div>
              <Switch 
                id="auto-save" 
                checked={autoSaveTemplates}
                onCheckedChange={setAutoSaveTemplates}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-approval">Requerir aprobación</Label>
                <p className="text-sm text-muted-foreground">
                  Requerir aprobación para nuevas plantillas
                </p>
              </div>
              <Switch 
                id="require-approval" 
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Categorías de plantillas</Label>
              <Select value={templateCategories} onValueChange={setTemplateCategories}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Por departamento</SelectItem>
                  <SelectItem value="role">Por rol/cargo</SelectItem>
                  <SelectItem value="shift-type">Por tipo de turno</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
              Guardar
            </Button>
            <Button variant="outline">Restablecer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};