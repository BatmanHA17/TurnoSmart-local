import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { Plus, Calendar, Clock, AlertTriangle, Edit2, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface AbsenceTypesConfigProps {
  onBack?: () => void;
}

interface AbsenceType {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  requiresApproval: boolean;
  maxDaysPerYear: number | null;
  requiresDocumentation: boolean;
  isPaid: boolean;
  autoApprove: boolean;
  notifyManager: boolean;
  minimumNotice: number; // días
  allowPartialDays: boolean;
  priority: "high" | "medium" | "low";
}

const defaultAbsenceTypes: AbsenceType[] = [
  {
    id: "vacation",
    name: "Vacaciones",
    code: "V",
    description: "Período de descanso anual del empleado",
    color: "#22c55e",
    requiresApproval: true,
    maxDaysPerYear: 48,
    requiresDocumentation: false,
    isPaid: true,
    autoApprove: false,
    notifyManager: true,
    minimumNotice: 15,
    allowPartialDays: false,
    priority: "high"
  },
  {
    id: "sick_leave",
    name: "Baja por Enfermedad",
    code: "E",
    description: "Ausencia por motivos de salud",
    color: "#ef4444",
    requiresApproval: false,
    maxDaysPerYear: null,
    requiresDocumentation: true,
    isPaid: true,
    autoApprove: true,
    notifyManager: true,
    minimumNotice: 0,
    allowPartialDays: true,
    priority: "high"
  },
  {
    id: "personal_leave",
    name: "Permiso Personal",
    code: "P",
    description: "Ausencia por asuntos personales",
    color: "#f59e0b",
    requiresApproval: true,
    maxDaysPerYear: 5,
    requiresDocumentation: false,
    isPaid: false,
    autoApprove: false,
    notifyManager: true,
    minimumNotice: 3,
    allowPartialDays: true,
    priority: "medium"
  },
  {
    id: "training",
    name: "Formación/Cursos",
    code: "C",
    description: "Formación profesional o cursos",
    color: "#3b82f6",
    requiresApproval: true,
    maxDaysPerYear: 10,
    requiresDocumentation: true,
    isPaid: true,
    autoApprove: false,
    notifyManager: true,
    minimumNotice: 7,
    allowPartialDays: true,
    priority: "medium"
  },
  {
    id: "absence_fault",
    name: "Falta",
    code: "F",
    description: "Falta injustificada",
    color: "#dc2626",
    requiresApproval: false,
    maxDaysPerYear: null,
    requiresDocumentation: false,
    isPaid: false,
    autoApprove: true,
    notifyManager: true,
    minimumNotice: 0,
    allowPartialDays: true,
    priority: "high"
  }
];

export function AbsenceTypesConfig({ onBack }: AbsenceTypesConfigProps = {}) {
  const { saveConfiguration, getConfiguration } = useConfigurationState();
  
  // Cargar configuración existente o usar valores por defecto
  const existingConfig = getConfiguration("absence-types");
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>(
    existingConfig?.absenceTypes || defaultAbsenceTypes
  );
  const [enableAbsenceTypes, setEnableAbsenceTypes] = useState(
    existingConfig?.enableAbsenceTypes ?? true
  );

  const [editingType, setEditingType] = useState<AbsenceType | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleSave = () => {
    const config = {
      enableAbsenceTypes,
      absenceTypes,
      status: 'configured'
    };
    
    saveConfiguration("absence-types", config);
    toast.success("Configuración de tipos de ausencias guardada");
    onBack?.();
  };

  const handleCreateNew = () => {
    const newType: AbsenceType = {
      id: `custom_${Date.now()}`,
      name: "",
      code: "",
      description: "",
      color: "#6b7280",
      requiresApproval: true,
      maxDaysPerYear: null,
      requiresDocumentation: false,
      isPaid: false,
      autoApprove: false,
      notifyManager: true,
      minimumNotice: 1,
      allowPartialDays: true,
      priority: "medium"
    };
    setEditingType(newType);
    setIsCreatingNew(true);
  };

  const handleSaveType = () => {
    if (!editingType) return;
    
    if (!editingType.name || !editingType.code) {
      toast.error("Nombre y código son requeridos");
      return;
    }

    // Verificar que el código no esté duplicado
    const codeExists = absenceTypes.some(type => 
      type.code === editingType.code && type.id !== editingType.id
    );
    
    if (codeExists) {
      toast.error("Ya existe un tipo de ausencia con ese código");
      return;
    }

    if (isCreatingNew) {
      setAbsenceTypes([...absenceTypes, editingType]);
      toast.success("Tipo de ausencia creado");
    } else {
      setAbsenceTypes(absenceTypes.map(type => 
        type.id === editingType.id ? editingType : type
      ));
      toast.success("Tipo de ausencia actualizado");
    }
    
    setEditingType(null);
    setIsCreatingNew(false);
  };

  const handleDeleteType = (id: string) => {
    setAbsenceTypes(absenceTypes.filter(type => type.id !== id));
    toast.success("Tipo de ausencia eliminado");
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setIsCreatingNew(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <ConfigurationHeader
        title="Configuración de Tipos de Ausencias"
        description="Configure los diferentes tipos de ausencias que pueden solicitar los empleados y sus reglas específicas"
        onBack={onBack}
      />

      {/* Configuración principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Tipos de Ausencias
          </CardTitle>
          <CardDescription>
            Configure los tipos de ausencias disponibles para los empleados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Habilitar Tipos de Ausencias Personalizados</Label>
              <p className="text-sm text-muted-foreground">
                Permite crear y gestionar tipos de ausencias específicos para su organización
              </p>
            </div>
            <Switch 
              checked={enableAbsenceTypes}
              onCheckedChange={setEnableAbsenceTypes}
            />
          </div>
        </CardContent>
      </Card>

      {enableAbsenceTypes && (
        <>
          {/* Lista de tipos de ausencias */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tipos de Ausencias Configurados
                  </CardTitle>
                  <CardDescription>
                    {absenceTypes.length} tipos de ausencias disponibles
                  </CardDescription>
                </div>
                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {absenceTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.code}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{type.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(type.priority)}
                          >
                            {type.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {type.isPaid && <span>• Remunerado</span>}
                          {type.requiresApproval && <span>• Requiere aprobación</span>}
                          {type.maxDaysPerYear && <span>• Máx. {type.maxDaysPerYear} días/año</span>}
                          {type.requiresDocumentation && <span>• Requiere documentación</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingType(type)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteType(type.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formulario de edición/creación */}
          {editingType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  {isCreatingNew ? "Crear Nuevo Tipo de Ausencia" : "Editar Tipo de Ausencia"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={editingType.name}
                      onChange={(e) => setEditingType({...editingType, name: e.target.value})}
                      placeholder="Ej: Vacaciones, Permiso médico..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      value={editingType.code}
                      onChange={(e) => setEditingType({...editingType, code: e.target.value.toUpperCase()})}
                      placeholder="Ej: V, E, P..."
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={editingType.description}
                    onChange={(e) => setEditingType({...editingType, description: e.target.value})}
                    placeholder="Descripción del tipo de ausencia"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={editingType.color}
                      onChange={(e) => setEditingType({...editingType, color: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select 
                      value={editingType.priority} 
                      onValueChange={(value) => setEditingType({...editingType, priority: value as "high" | "medium" | "low"})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDays">Máx. días por año</Label>
                    <Input
                      id="maxDays"
                      type="number"
                      value={editingType.maxDaysPerYear || ""}
                      onChange={(e) => setEditingType({...editingType, maxDaysPerYear: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="Sin límite"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumNotice">Aviso mínimo (días)</Label>
                    <Input
                      id="minimumNotice"
                      type="number"
                      value={editingType.minimumNotice}
                      onChange={(e) => setEditingType({...editingType, minimumNotice: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Configuración de Reglas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Requiere aprobación</Label>
                      <Switch
                        checked={editingType.requiresApproval}
                        onCheckedChange={(checked) => setEditingType({...editingType, requiresApproval: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Es remunerado</Label>
                      <Switch
                        checked={editingType.isPaid}
                        onCheckedChange={(checked) => setEditingType({...editingType, isPaid: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Requiere documentación</Label>
                      <Switch
                        checked={editingType.requiresDocumentation}
                        onCheckedChange={(checked) => setEditingType({...editingType, requiresDocumentation: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-aprobar</Label>
                      <Switch
                        checked={editingType.autoApprove}
                        onCheckedChange={(checked) => setEditingType({...editingType, autoApprove: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Notificar supervisor</Label>
                      <Switch
                        checked={editingType.notifyManager}
                        onCheckedChange={(checked) => setEditingType({...editingType, notifyManager: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Permitir días parciales</Label>
                      <Switch
                        checked={editingType.allowPartialDays}
                        onCheckedChange={(checked) => setEditingType({...editingType, allowPartialDays: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveType}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Tipo
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• Los tipos de ausencias configurados aparecerán disponibles en el calendario de turnos</p>
            <p>• Los códigos de ausencias deben ser únicos y se mostrarán en el cuadrante</p>
            <p>• Las reglas de aprobación se aplicarán automáticamente según la configuración</p>
            <p>• Los colores ayudan a identificar visualmente cada tipo de ausencia</p>
            <p>• Los límites anuales se controlan automáticamente por empleado</p>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          Guardar Configuración
        </Button>
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}