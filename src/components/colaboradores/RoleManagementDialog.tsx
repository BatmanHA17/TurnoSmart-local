import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { UserCog, Shield, Crown, User, Loader2 } from "lucide-react";

interface RoleManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  colaborador: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  currentRole?: string;
  onRoleUpdated: () => void;
}

const HOTEL_ROLES = [
  { value: "propietario", label: "Propietario", icon: Crown, color: "bg-purple-500" },
  { value: "administrador", label: "Administrador", icon: Shield, color: "bg-red-500" },
  { value: "director", label: "Director", icon: UserCog, color: "bg-blue-500" },
  { value: "manager", label: "Manager", icon: UserCog, color: "bg-green-500" },
  // REMOVIDO: jefe_departamento - Ahora unificado con Manager
  { value: "empleado", label: "Empleado", icon: User, color: "bg-gray-500" },
];

const DEPARTAMENTOS = [
  "Bares",
  "Recepción", 
  "Housekeeping",
  "Cocina",
  "Mantenimiento",
  "Animación",
  "Administración"
];

export function RoleManagementDialog({ 
  isOpen, 
  onClose, 
  colaborador, 
  currentRole,
  onRoleUpdated 
}: RoleManagementDialogProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole || "empleado");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { currentOrganization } = useOrganizationsUnified();

  const getCurrentRoleInfo = () => {
    return HOTEL_ROLES.find(role => role.value === currentRole) || HOTEL_ROLES[5];
  };

  const getSelectedRoleInfo = () => {
    return HOTEL_ROLES.find(role => role.value === selectedRole) || HOTEL_ROLES[5];
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while saving
    onClose();
  };

  const handleSaveRole = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Debe seleccionar un rol",
        variant: "destructive"
      });
      return;
    }

    // REMOVIDO: Validación de departamento ya no necesaria (jefe_departamento unificado con manager)

    setLoading(true);

    try {
      // Get current role for logging
      const { data: currentRoleData } = await supabase
        .from('colaborador_roles')
        .select('role')
        .eq('colaborador_id', colaborador.id)
        .eq('activo', true)
        .maybeSingle();

      const previousRole = currentRoleData?.role || 'sin rol';

      // PASO 1: Desactivar todos los roles existentes del colaborador
      const { error: deactivateError } = await supabase
        .from('colaborador_roles')
        .update({ activo: false })
        .eq('colaborador_id', colaborador.id)
        .eq('org_id', currentOrganization?.id || null);

      if (deactivateError) {
        console.error('Error deactivating roles:', deactivateError);
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol",
          variant: "destructive"
        });
        return;
      }

      // PASO 2: Insertar el nuevo rol activo
      const { error: insertError } = await supabase
        .from('colaborador_roles')
        .insert({
          colaborador_id: colaborador.id,
          role: selectedRole as any,
          departamento: selectedDepartment || null,
          asignado_por: (await supabase.auth.getUser()).data.user?.id,
          org_id: currentOrganization?.id || null,
          activo: true
        });

      if (insertError) {
        console.error('Error inserting role:', insertError);
        toast({
          title: "Error",
          description: "No se pudo asignar el rol",
          variant: "destructive"
        });
        return;
      }

      // Log detailed role change activity
      const roleLabels: Record<string, string> = {
        'propietario': 'Propietario',
        'administrador': 'Administrador',
        'director': 'Director',
        'manager': 'Manager',
        'jefe_departamento': 'Manager', // UNIFICADO: mostrar como Manager
        'empleado': 'Empleado',
        'sin rol': 'Sin rol'
      };

      const previousRoleLabel = roleLabels[previousRole] || previousRole;
      const newRoleLabel = roleLabels[selectedRole] || selectedRole;

      await logActivity({
        action: `ha asignado el rol de "${newRoleLabel}"${selectedDepartment ? ` en el departamento "${selectedDepartment}"` : ''} a ${colaborador.nombre} ${colaborador.apellidos}${previousRole !== 'sin rol' ? ` (anteriormente: "${previousRoleLabel}")` : ''}`,
        entityType: 'colaborador_role',
        entityId: colaborador.id,
        entityName: `${colaborador.nombre} ${colaborador.apellidos}`,
        details: {
          previous_role: previousRole,
          new_role: selectedRole,
          department: selectedDepartment,
          action_type: 'role_assignment',
          colaborador_id: colaborador.id,
          role_change_summary: `${previousRoleLabel} → ${newRoleLabel}`,
          department_assigned: selectedDepartment || 'Sin departamento específico'
        }
      });

      toast({
        title: "Rol asignado",
        description: `Se ha asignado el rol de ${getSelectedRoleInfo().label} a ${colaborador.nombre} ${colaborador.apellidos}`,
      });

      onRoleUpdated();
      onClose();
    } catch (err) {
      console.error('Error in handleSaveRole:', err);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentRoleInfo = getCurrentRoleInfo();
  const selectedRoleInfo = getSelectedRoleInfo();
  const CurrentIcon = currentRoleInfo.icon;
  const SelectedIcon = selectedRoleInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gestionar Rol - {colaborador.nombre} {colaborador.apellidos}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rol Actual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rol Actual</Label>
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              <Badge className={`${currentRoleInfo.color} text-white`}>
                {currentRoleInfo.label}
              </Badge>
            </div>
          </div>

          {/* Seleccionar Nuevo Rol */}
          <div className="space-y-2">
            <Label htmlFor="role-select" className="text-sm font-medium">
              Nuevo Rol
            </Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Seleccionar rol..." />
              </SelectTrigger>
              <SelectContent>
                {HOTEL_ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* REMOVIDO: Selector de departamento - Ya no es necesario */}

          {/* Vista Previa */}
          {selectedRole !== currentRole && (
            <div className="bg-muted/20 p-4 rounded-lg border-l-4 border-primary">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Cambio:</span>
                <div className="flex items-center gap-1">
                  <CurrentIcon className="h-3 w-3" />
                  <span className="line-through text-muted-foreground">{currentRoleInfo.label}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex items-center gap-1">
                  <SelectedIcon className="h-3 w-3" />
                  <span className="font-medium">{selectedRoleInfo.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Información sobre el Rol */}
          <div className="bg-background border rounded-lg p-4">
            <h4 className="font-medium mb-2">Información del Rol</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {selectedRole === "propietario" && (
                <p>• Acceso completo a todas las funciones del sistema</p>
              )}
              {selectedRole === "administrador" && (
                <p>• Gestión de personal, roles y configuración general</p>
              )}
              {selectedRole === "director" && (
                <p>• Supervisión de operaciones y gestión de managers</p>
              )}
              {selectedRole === "manager" && (
                <>
                  <p>• Gestión de equipos y planificación operativa</p>
                  <p>• Puede gestionar uno o más departamentos (opcional)</p>
                </>
              )}
              {selectedRole === "empleado" && (
                <p>• Acceso básico a funciones operativas</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveRole} 
            disabled={loading || selectedRole === currentRole}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </div>
            ) : "Asignar Rol"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}