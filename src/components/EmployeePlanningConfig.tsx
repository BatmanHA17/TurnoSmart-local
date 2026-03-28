import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { supabase } from "@/integrations/supabase/client";

interface EmployeePlanningConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  employeeName?: string;
  colaboradorId?: string;
  onOpenAccessManagement?: () => void;
  onOpenEditContract?: () => void;
}

export function EmployeePlanningConfig({
  isOpen,
  onClose,
  onSave,
  employeeName = "Leo",
  colaboradorId,
  onOpenAccessManagement,
  onOpenEditContract
}: EmployeePlanningConfigProps) {
  const { org: currentOrg } = useCurrentOrganization();
  const { departments, loading: loadingDepartments } = useJobDepartments();
  const { assignments, loading: loadingAssignments } = useTeamAssignments(colaboradorId);
  const [departmentPlanning, setDepartmentPlanning] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Inicializar estados basándose en los equipos asignados al colaborador
  useEffect(() => {
    if (isOpen && departments.length > 0 && !loadingAssignments) {
      const initialState: Record<string, boolean> = {};
      
      // Crear un Set con los IDs de departamentos asignados
      const assignedDepartmentIds = new Set(
        assignments.map(a => a.department_id)
      );
      
      // Marcar como activos solo los departamentos asignados
      departments.forEach(dept => {
        initialState[dept.id] = assignedDepartmentIds.has(dept.id);
      });
      
      setDepartmentPlanning(initialState);
    }
  }, [isOpen, departments, assignments, loadingAssignments]);

  const handleDepartmentToggle = (deptId: string) => {
    setDepartmentPlanning(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const handleSave = async () => {
    if (!colaboradorId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el colaborador",
        variant: "destructive",
      });
      return;
    }

    // Validar que al menos un departamento esté activo
    const hasAtLeastOneActive = Object.values(departmentPlanning).some(active => active);
    if (!hasAtLeastOneActive) {
      toast({
        title: "Error",
        description: "El empleado debe estar planificable en al menos un equipo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const user = await supabase.auth.getUser();
      
      // Procesar cambios para todos los departamentos usando upsert
      for (const dept of departments) {
        const isActive = departmentPlanning[dept.id];

        // Usar upsert para crear o actualizar asignaciones
        const { error } = await supabase
          .from('colaborador_departments')
          .upsert({
            colaborador_id: colaboradorId,
            department_id: dept.id,
            org_id: currentOrg?.org_id,
            is_active: isActive,
            assigned_by: user.data.user?.id
          }, {
            onConflict: 'colaborador_id,department_id',
            ignoreDuplicates: false
          });

        if (error) throw error;
      }

      toast({
        title: "Configuración actualizada",
        description: "Se ha actualizado tu planificación correctamente.",
      });
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving planning configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de planificación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        {/* Header */}
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-semibold text-foreground">
            Planificación
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* First info box */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">
                La modificación de los accesos del empleado permite que sea planificable en varios equipos
              </p>
              <p className="text-xs text-blue-600">
                Para que un empleado aparezca en el horario de un equipo, primero debe tener acceso al equipo o al establecimiento. Puede conceder este acceso en la sección{" "}
                <button 
                  className="font-medium underline hover:text-blue-700 cursor-pointer"
                  onClick={() => {
                    onClose();
                    onOpenAccessManagement?.();
                  }}
                >
                  gestión de accesos
                </button>.
              </p>
            </div>
          </div>

          {/* Second info box */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">
                El empleado sigue siendo planificable en este equipo por defecto indicado en el contrato
              </p>
               <p className="text-xs text-blue-600">
                 El establecimiento y el equipo predeterminados indicados en el contrato de trabajo están bloqueados. Solo puede modificarlos acudiendo al{" "}
                 <button 
                   className="font-medium underline hover:text-blue-700 cursor-pointer"
                   onClick={() => {
                     onClose();
                     onOpenEditContract?.();
                   }}
                 >
                   contrato de trabajo
                 </button>.
               </p>
            </div>
          </div>

          {/* Planning selection */}
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Seleccione las Rotas en las que debe aparecer {employeeName}:
            </p>
            
            {currentOrg && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{currentOrg.org_name}</h4>
                
                {loadingDepartments || loadingAssignments ? (
                  <div className="border border-border/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Cargando Rotas...</p>
                  </div>
                ) : departments.length > 0 ? (
                  departments.map((dept) => (
                    <div key={dept.id} className="border border-border/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {dept.value}
                        </span>
                        <Switch
                          checked={departmentPlanning[dept.id] || false}
                          onCheckedChange={() => handleDepartmentToggle(dept.id)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-border/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">No hay Rotas disponibles</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving || loadingDepartments || loadingAssignments}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}