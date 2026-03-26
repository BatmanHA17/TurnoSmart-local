import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Mail, 
  Users, 
  Calendar,
  Filter,
  CheckSquare,
  Settings,
  Printer,
  Eye,
  Layout,
  FolderOpen
} from "lucide-react";
import { useConfigurationState } from "@/hooks/useConfigurationState";

interface ScheduleExportConfigProps {
  onBack?: () => void;
}

export const ScheduleExportConfig = ({ onBack }: ScheduleExportConfigProps) => {
  const { saveConfiguration } = useConfigurationState();
  const [enableAutoExport, setEnableAutoExport] = useState(false);
  const [fileFormat, setFileFormat] = useState("pdf");
  const [excludeDraftsDefault, setExcludeDraftsDefault] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [designStyle, setDesignStyle] = useState("professional");
  const [includeEmployeePhotos, setIncludeEmployeePhotos] = useState(false);
  const [autoSaveDocuments, setAutoSaveDocuments] = useState(true);
  const [defaultFilter, setDefaultFilter] = useState("all");

  const handleSave = async () => {
    const config = {
      enableAutoExport,
      fileFormat,
      excludeDraftsDefault,
      emailNotifications,
      designStyle,
      includeEmployeePhotos,
      autoSaveDocuments,
      defaultFilter
    };
    
    const success = await saveConfiguration("schedule-export", config);
    if (success && onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          Exportación de Horarios Planificados
        </h2>
        <p className="text-muted-foreground">
          Exporte e imprima turnos de empleados en archivos con formato horizontal y diseño visualmente atractivo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Beneficios de la Exportación de Horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Planificación de Personal</h4>
                <p className="text-sm text-blue-800">
                  Facilita la organización y gestión del personal con horarios exportados
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Archivos listos para compartir y revisar</li>
                  <li>• Formato horizontal optimizado para lectura</li>
                  <li>• Diseño visualmente atractivo y profesional</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Mayor Visibilidad para Empleados</h4>
                <p className="text-sm text-green-800">
                  Entregue horarios directamente a empleados de forma física o digital
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Distribución directa de horarios personalizados</li>
                  <li>• Transparencia en programación de turnos</li>
                  <li>• Mejora comunicación interna</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Proceso de Exportación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
              <span>Barra lateral → Turnos</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
              <span>Clic en ícono de configuración (esquina superior derecha)</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
              <span>Seleccionar "Exportar horarios"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
              <span>Decidir filtros a aplicar en "Exportar por"</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">5</div>
              <span>Marcar casilla para excluir turnos en borrador (opcional)</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold">6</div>
              <span>Clic en "Guardar" para generar exportación</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Entrega y Acceso a Archivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Notificación por Email</h4>
                <p className="text-sm text-muted-foreground">
                  Recibirá un correo electrónico con el archivo exportado una vez generado
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FolderOpen className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Acceso en "Mis Documentos"</h4>
                <p className="text-sm text-muted-foreground">
                  El archivo estará disponible en la sección "Mis documentos" para descarga posterior
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Layout className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Formato Horizontal</h4>
                <p className="text-sm text-muted-foreground">
                  Diseño optimizado para lectura e impresión con layout horizontal profesional
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Opciones de Filtrado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Exportar Por
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Configure qué información incluir en la exportación
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Por departamento o área de trabajo</li>
                <li>• Por empleado específico</li>
                <li>• Por rango de fechas personalizado</li>
                <li>• Por tipo de turno o categoría</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-orange-200 bg-orange-50/50">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Exclusión de Borradores
              </h4>
              <p className="text-sm text-orange-800">
                Opción para excluir turnos en estado borrador del archivo exportado, 
                mostrando solo turnos finalizados y publicados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Exportación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-auto-export">Habilitar exportación automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Generar automáticamente exportaciones al publicar horarios
                  </p>
                </div>
                <Switch 
                  id="enable-auto-export" 
                  checked={enableAutoExport}
                  onCheckedChange={setEnableAutoExport}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Formato de archivo predeterminado</Label>
                <Select value={fileFormat} onValueChange={setFileFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Formato de archivo que se generará por defecto
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exclude-drafts-default">Excluir borradores por defecto</Label>
                  <p className="text-sm text-muted-foreground">
                    Marcar automáticamente la opción de excluir turnos en borrador
                  </p>
                </div>
                <Switch 
                  id="exclude-drafts-default" 
                  checked={excludeDraftsDefault}
                  onCheckedChange={setExcludeDraftsDefault}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar email cuando la exportación esté lista para descarga
                  </p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Estilo de diseño</Label>
                <Select value={designStyle} onValueChange={setDesignStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profesional</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                    <SelectItem value="colorful">Colorido</SelectItem>
                    <SelectItem value="compact">Compacto</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Estilo visual del archivo exportado
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-employee-photos">Incluir fotos de empleados</Label>
                  <p className="text-sm text-muted-foreground">
                    Agregar fotografías de empleados en el horario exportado
                  </p>
                </div>
                <Switch 
                  id="include-employee-photos" 
                  checked={includeEmployeePhotos}
                  onCheckedChange={setIncludeEmployeePhotos}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save-documents">Guardar automáticamente en "Mis documentos"</Label>
                  <p className="text-sm text-muted-foreground">
                    Almacenar automáticamente todas las exportaciones generadas
                  </p>
                </div>
                <Switch 
                  id="auto-save-documents" 
                  checked={autoSaveDocuments}
                  onCheckedChange={setAutoSaveDocuments}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Filtro predeterminado para exportación</Label>
                <Select value={defaultFilter} onValueChange={setDefaultFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los empleados</SelectItem>
                    <SelectItem value="department">Por departamento</SelectItem>
                    <SelectItem value="area">Por área de trabajo</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Filtro que aparece seleccionado por defecto al exportar
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