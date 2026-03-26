import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useColaboradorOrganizations } from "@/hooks/useColaboradorOrganizations";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";

interface AccessManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  colaboradorId?: string;
  employeeName?: string;
  onOpenEditContract?: () => void;
}

export function AccessManagementDialog({
  isOpen,
  onClose,
  onSave,
  colaboradorId,
  employeeName = "Leo",
  onOpenEditContract
}: AccessManagementDialogProps) {
  const { accesses } = useColaboradorOrganizations(colaboradorId || null);
  const { organizations: allOrganizations } = useOrganizationsUnified();
  const [departmentAccess, setDepartmentAccess] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orgDepartments, setOrgDepartments] = useState<Record<string, any[]>>({});
  const [orgAssignments, setOrgAssignments] = useState<Record<string, any[]>>({});

  // Cargar departamentos y asignaciones para todas las organizaciones
  useEffect(() => {
    const fetchAllData = async () => {
      if (!isOpen || !colaboradorId || allOrganizations.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orgIds = allOrganizations.map(org => org.id);

        // Cargar departamentos de TODAS las organizaciones disponibles
        const { data: allDepartments, error: deptError } = await supabase
          .from('job_departments')
          .select('*')
          .in('org_id', orgIds)
          .order('value');

        if (deptError) throw deptError;

        // Agrupar por org_id
        const deptsByOrg: Record<string, any[]> = {};
        (allDepartments || []).forEach(dept => {
          if (!deptsByOrg[dept.org_id]) {
            deptsByOrg[dept.org_id] = [];
          }
          deptsByOrg[dept.org_id].push(dept);
        });
        setOrgDepartments(deptsByOrg);

        // Cargar asignaciones actuales del colaborador
        const { data: allAssignments, error: assignError } = await supabase
          .from('colaborador_departments')
          .select('*')
          .eq('colaborador_id', colaboradorId)
          .eq('is_active', true)
          .in('org_id', orgIds);

        if (assignError) throw assignError;

        // Agrupar asignaciones por org_id
        const assignByOrg: Record<string, any[]> = {};
        (allAssignments || []).forEach(assign => {
          if (!assignByOrg[assign.org_id]) {
            assignByOrg[assign.org_id] = [];
          }
          assignByOrg[assign.org_id].push(assign);
        });
        setOrgAssignments(assignByOrg);

        // Inicializar estados de switches
        const initialState: Record<string, boolean> = {};
        const assignedDeptIds = new Set((allAssignments || []).map(a => a.department_id));
        
        (allDepartments || []).forEach(dept => {
          initialState[dept.id] = assignedDeptIds.has(dept.id);
        });
        
        setDepartmentAccess(initialState);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isOpen, colaboradorId, allOrganizations]);

  const handleDepartmentToggle = (deptId: string) => {
    setDepartmentAccess(prev => ({
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
    const hasAtLeastOneActive = Object.values(departmentAccess).some(active => active);
    if (!hasAtLeastOneActive) {
      toast({
        title: "Error",
        description: "El empleado debe tener acceso a al menos un equipo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const user = await supabase.auth.getUser();
      
      // Procesar cambios para TODAS las organizaciones
      for (const org of allOrganizations) {
        const orgId = org.id;
        const depts = orgDepartments[orgId] || [];
        const assignments = orgAssignments[orgId] || [];

        for (const dept of depts) {
          const isActive = departmentAccess[dept.id];
          const existingAssignment = assignments.find(a => a.department_id === dept.id);

          if (isActive && !existingAssignment) {
            // Crear nueva asignación
            const { error: insertError } = await supabase
              .from('colaborador_departments')
              .insert({
                colaborador_id: colaboradorId,
                department_id: dept.id,
                org_id: orgId,
                is_active: true,
                assigned_by: user.data.user?.id
              });

            if (insertError) throw insertError;
          } else if (!isActive && existingAssignment) {
            // Desactivar asignación existente
            const { error: updateError } = await supabase
              .from('colaborador_departments')
              .update({ is_active: false })
              .eq('id', existingAssignment.id);

            if (updateError) throw updateError;
          } else if (isActive && existingAssignment) {
            // Reactivar si estaba desactivada
            const { error: updateError } = await supabase
              .from('colaborador_departments')
              .update({ is_active: true })
              .eq('id', existingAssignment.id);

            if (updateError) throw updateError;
          }
        }
      }

      toast({
        title: "Accesos actualizados",
        description: "Los cambios de acceso han sido guardados correctamente.",
      });
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving access changes:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios de acceso",
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
            Gestión de accesos
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="space-y-6">
          {/* Info box */}
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-700">
                El empleado sigue siendo planificable en este equipo por defecto indicado en su contrato
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

          {/* Selection text */}
          <p className="text-sm text-foreground">
            Seleccione los establecimientos a los que {employeeName} tiene acceso:
          </p>

          {/* Organizations sections */}
          {loading ? (
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Cargando equipos...</p>
            </div>
          ) : allOrganizations.length > 0 ? (
            <div className="space-y-3">
              {allOrganizations.map((org) => {
                const depts = orgDepartments[org.id] || [];
                
                return (
                  <div key={org.id} className="border border-border/30 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-3">{org.name}</h4>
                    
                    <div className="space-y-2">
                      {depts.length > 0 ? (
                        depts.map((dept) => (
                          <div key={dept.id} className="flex items-center justify-between py-2">
                            <span className="text-sm text-foreground">
                              {dept.value}
                            </span>
                            <Switch
                              checked={departmentAccess[dept.id] || false}
                              onCheckedChange={() => handleDepartmentToggle(dept.id)}
                              disabled={saving}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">Equipo por defecto</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">No hay organizaciones disponibles</p>
            </div>
          )}

          {/* Save button */}
          <div className="pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving || loading}
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