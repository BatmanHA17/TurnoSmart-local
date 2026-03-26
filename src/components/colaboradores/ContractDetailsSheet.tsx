import React, { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField } from "@/components/ui/form-field";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContractDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: any;
}

export const ContractDetailsSheet = ({ 
  open, 
  onOpenChange, 
  colaborador 
}: ContractDetailsSheetProps) => {
  const { organizations } = useOrganizations();
  const { assignments, getJobStatus, refetch: refetchAssignments } = useTeamAssignments(colaborador?.id);
  const { departments } = useJobDepartments();
  const { currentOrg } = useCurrentOrganization();
  
  // Estado local para manejar equipos seleccionados
  const [selectedDepartments, setSelectedDepartments] = useState<{id: string, name: string}[]>([]);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  
  const getContractTypeDisplay = (tipo: string) => {
    if (!tipo) return "Sin especificar";
    switch (tipo) {
      case "Práctica profesional": return "Contrato de prácticas";
      case "Contrato temporal": return "Contrato temporal";
      case "Contrato indefinido": return "Contrato indefinido";
      case "Extra (colaborador externo)": return "Colaborador externo";
      case "Empleado trabajo temporal (ETT)": return "ETT";
      case "Contrato de formación": return "Contrato de formación";
      case "Contrato fijo discontinuo": return "Contrato fijo discontinuo";
      default: return tipo;
    }
  };

  // Estados locales para refrescar cuando cambien los datos
  const [localColaborador, setLocalColaborador] = useState(colaborador);
  
  // Sincronizar cuando cambien las props del colaborador
  useEffect(() => {
    if (colaborador) {
      setLocalColaborador(colaborador);
    }
  }, [colaborador]);

  // Sincronizar equipos seleccionados con assignments
  useEffect(() => {
    if (assignments.length > 0) {
      const depts = assignments.map(a => ({
        id: a.department_id,
        name: a.department_name
      }));
      setSelectedDepartments(depts);
    }
  }, [assignments]);

  // Función para agregar equipo
  const handleAddDepartment = async (departmentId: string) => {
    if (!colaborador?.id || !currentOrg?.org_id) return;
    
    setIsAddingDepartment(true);
    try {
      // Insertar o actualizar en colaborador_departments
      const { error } = await supabase
        .from('colaborador_departments')
        .upsert({
          colaborador_id: colaborador.id,
          department_id: departmentId,
          org_id: currentOrg.org_id,
          is_active: true,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'colaborador_id,department_id'
        });

      if (error) throw error;

      // Actualizar estado local
      const department = departments.find(d => d.id === departmentId);
      if (department) {
        setSelectedDepartments(prev => [...prev, { id: department.id, name: department.value }]);
      }

      // Refrescar assignments
      refetchAssignments();

      toast({
        title: "Equipo añadido",
        description: "El equipo ha sido asignado correctamente.",
      });
    } catch (error) {
      console.error('Error añadiendo equipo:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir el equipo.",
        variant: "destructive"
      });
    } finally {
      setIsAddingDepartment(false);
    }
  };

  // Función para remover equipo
  const handleRemoveDepartment = async (departmentId: string) => {
    if (!colaborador?.id) return;

    try {
      // Desactivar en colaborador_departments
      const { error } = await supabase
        .from('colaborador_departments')
        .update({ is_active: false })
        .eq('colaborador_id', colaborador.id)
        .eq('department_id', departmentId);

      if (error) throw error;

      // Actualizar estado local
      setSelectedDepartments(prev => prev.filter(d => d.id !== departmentId));

      // Refrescar assignments
      refetchAssignments();

      toast({
        title: "Equipo removido",
        description: "El equipo ha sido desasignado correctamente.",
      });
    } catch (error) {
      console.error('Error removiendo equipo:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el equipo.",
        variant: "destructive"
      });
    }
  };

  const isDiurno = true; // Por defecto, se puede ajustar según datos reales
  const diasTrabajados = localColaborador?.tiempo_trabajo_semanal ? Math.ceil(localColaborador.tiempo_trabajo_semanal / 8) : 5;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-lg font-medium">
            Contrato de {localColaborador?.nombre || 'Colaborador'}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="contrato" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="nominas">Nóminas</TabsTrigger>
          </TabsList>

          <TabsContent value="contrato" className="space-y-6">
            {/* Sección CONTRATO */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                CONTRATO
              </h3>
              
              <FormField label="Tipo de contrato">
                <Select disabled value={localColaborador?.tipo_contrato || ""}>
                  <SelectTrigger className="bg-muted text-muted-foreground">
                    <SelectValue placeholder={localColaborador?.tipo_contrato ? getContractTypeDisplay(localColaborador.tipo_contrato) : "Sin especificar"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contrato indefinido">Contrato indefinido</SelectItem>
                    <SelectItem value="Contrato temporal">Contrato temporal</SelectItem>
                    <SelectItem value="Práctica profesional">Contrato de prácticas</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="contrato-diurno" 
                  checked={isDiurno} 
                  disabled 
                  className="data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground"
                />
                <Label 
                  htmlFor="contrato-diurno" 
                  className="text-sm text-muted-foreground"
                >
                  Este contrato es un contrato de trabajo diurno
                </Label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    El tiempo de trabajo semanal es de <strong>{localColaborador?.tiempo_trabajo_semanal || 40} horas</strong>. 
                    Puedes modificarlo desde la sección "Contratos" en el perfil del empleado.
                  </p>
                </div>
              </div>

              <FormField label="Fecha de inicio del contrato">
                <Input
                  type="text"
                  value={localColaborador?.fecha_inicio_contrato ? 
                    new Date(localColaborador.fecha_inicio_contrato).toLocaleDateString('es-ES') : 
                    '14/02/2025'
                  }
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </FormField>

              <FormField label="Hora de inicio del contrato">
                <Input
                  type="time"
                  value={localColaborador?.hora_inicio_contrato || "08:00"}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </FormField>

              <FormField label="Fecha de fin de período de prueba">
                <Input
                  type="text"
                  value="dd/mm/aaaa"
                  disabled
                  className="bg-muted text-muted-foreground"
                  placeholder="dd/mm/aaaa"
                />
              </FormField>

              <FormField label="Días trabajados por semana">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={diasTrabajados}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <span className="text-sm text-muted-foreground">d</span>
                </div>
              </FormField>

              <FormField label="Disponibilidad">
                <Input
                  type="text"
                  value={(() => {
                    if (!localColaborador?.disponibilidad_semanal) return "No especificado";
                    try {
                      const disponibilidad = typeof localColaborador.disponibilidad_semanal === 'string' 
                        ? JSON.parse(localColaborador.disponibilidad_semanal)
                        : localColaborador.disponibilidad_semanal;
                      
                      if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
                        return "No especificado";
                      }
                      
                      // Ordenar los días de lunes a domingo
                      const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      const diasOrdenados = disponibilidad
                        .filter(dia => ordenDias.includes(dia))
                        .sort((a, b) => ordenDias.indexOf(a) - ordenDias.indexOf(b));
                      
                      return diasOrdenados.join(', ');
                    } catch {
                      return "No especificado";
                    }
                  })()}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </FormField>
            </div>

            {/* Sección EMPLEO Y CUALIFICACIÓN */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                EMPLEO Y CUALIFICACIÓN
              </h3>
              
              <FormField label="Puesto de trabajo">
                <Input
                  type="text"
                  value={(() => {
                    const jobStatus = getJobStatus();
                    if (jobStatus.type === 'none') {
                      return 'Sin equipos asignados';
                    }
                    if (jobStatus.type === 'incomplete' || jobStatus.type === 'partial') {
                      return jobStatus.message;
                    }
                    // Si todos los equipos tienen trabajos, mostrar el primer trabajo encontrado
                    const firstJobAssignment = assignments.find(a => a.has_job);
                    return firstJobAssignment?.job_title || 'Sin puesto asignado';
                  })()}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </FormField>

            </div>

            {/* Sección ASIGNACIÓN DE EQUIPOS */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                ASIGNACIÓN DE EQUIPOS
              </h3>
              
              <FormField label="Equipo" required>
                <div className="space-y-3">
                  <Select 
                    value="" 
                    disabled={true}
                  >
                    <SelectTrigger className="bg-muted text-muted-foreground">
                      <SelectValue placeholder="Seleccionar equipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                      {departments
                        .filter(dept => !selectedDepartments.find(sd => sd.id === dept.id))
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                            {dept.value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedDepartments.map((dept) => (
                        <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
                          {dept.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {departments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay equipos creados. Crea equipos en Configuración → Puestos → Equipos
                    </p>
                  )}
                </div>
              </FormField>
            </div>

            {/* Sección AFILIACIÓN */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                AFILIACIÓN
              </h3>

              <FormField label="Establecimiento por defecto">
                <Input
                  type="text"
                  value={organizations.find(org => org.id === localColaborador?.org_id)?.name || 'No especificado'}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </FormField>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Responsable directo: <strong>{localColaborador?.responsable_directo || 'No asignado'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="no-publicar-registro" 
                  disabled 
                  className="data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground"
                />
                <Label 
                  htmlFor="no-publicar-registro" 
                  className="text-sm text-muted-foreground"
                >
                  No se publicará en el registro del personal
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nominas" className="space-y-6">
            {/* Sección SALARIO */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                SALARIO
              </h3>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Empleado con SMI
                </Label>
                <Switch 
                  disabled 
                  checked={localColaborador?.empleado_smi || false}
                  className="data-[state=checked]:bg-muted data-[state=unchecked]:bg-muted"
                />
              </div>

              <FormField label="Salario bruto mensual">
                <div className="relative">
                  <Input
                    type="text"
                    value={localColaborador?.salario_bruto_mensual || ""}
                    disabled
                    className="bg-muted text-muted-foreground pr-8"
                    placeholder=""
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </FormField>

              <FormField label="Tasa horaria bruta">
                <div className="relative">
                  <Input
                    type="text"
                    value={localColaborador?.tasa_horaria_bruta || ""}
                    disabled
                    className="bg-muted text-muted-foreground pr-8"
                    placeholder=""
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </FormField>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};