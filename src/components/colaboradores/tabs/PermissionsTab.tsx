import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useParams, useNavigate } from "react-router-dom";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PermissionsTab() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colaborador } = useColaboradorById(id);
  const { permissions, updatePermission, assignRole } = useUserPermissions(id);
  const { role } = useUserRole();
  const { isAdmin } = useAdminPermissions();
  
  const [selectedRole, setSelectedRole] = useState<string>("empleado");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isInactive = colaborador?.status === 'inactivo';

  const handleRoleChange = async (newRole: string) => {
    if (!colaborador) return;
    
    try {
      await assignRole(colaborador.id, newRole);
      toast.success("Rol actualizado correctamente");
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Error al actualizar el rol");
    }
  };

  const getCheckmarkComponent = (permissionName: string) => {
    const permission = permissions?.find(p => p.permission_name === permissionName);
    const isEnabled = permission?.is_enabled || false;
    const isConfigurable = permission?.is_configurable !== false;

    if (!isConfigurable) {
      return (
        <span className={isEnabled ? "text-green-600 text-lg" : "text-gray-400 text-lg"}>
          {isEnabled ? "✓" : "✗"}
        </span>
      );
    }

    return (
      <Switch
        checked={isEnabled}
        disabled={!isAdmin}
        onCheckedChange={(checked) => {
          if (colaborador) {
            updatePermission(colaborador.id, permissionName, checked);
          }
        }}
      />
    );
  };

  const handleDeleteColaborador = async () => {
    if (!colaborador) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', colaborador.id);

      if (error) throw error;

      toast.success("Colaborador eliminado correctamente");
      navigate('/colaboradores');
    } catch (error) {
      console.error('Error deleting colaborador:', error);
      toast.error("Error al eliminar el colaborador");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className={`${isInactive || role === 'user' ? 'opacity-50 pointer-events-none' : ''}`}>
        <Card>
          <CardContent className="p-6 space-y-8">
            {/* Sección Cuenta */}
            <div className="bg-muted/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Cuenta</h3>
              
              <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-background">
                <div>
                  <h4 className="font-medium text-foreground">Acceso a la cuenta</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    La desactivación del empleado le impide conectarse a su cuenta. Si su contrato sigue activo, seguirá recibiendo sus horarios por correo electrónico.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-6">Rol y permisos</h3>
              
            </div>

            {/* Roles y permisos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">🔒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Rol y Permisos</h3>
                </div>
                {!isAdmin && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-amber-600 text-sm">🔒</span>
                    <span className="text-sm text-amber-800">Solo administradores pueden modificar permisos</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Empleado */}
                <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                  selectedRole === "empleado" 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="rol" 
                      id="empleado" 
                      className="mt-1" 
                       checked={selectedRole === "empleado"}
                      onChange={async () => {
                        setSelectedRole("empleado");
                        await handleRoleChange("empleado");
                      }}
                    />
                    <div>
                      <label htmlFor="empleado" className="font-medium text-foreground cursor-pointer">Empleado</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rol predeterminado que permite acceder a la plataforma como empleado.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manager */}
                <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                  selectedRole === "manager" 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="rol" 
                      id="manager" 
                      className="mt-1" 
                      checked={selectedRole === "manager"}
                      onChange={async () => {
                        setSelectedRole("manager");
                        await handleRoleChange("manager");
                      }}
                    />
                    <div>
                      <label htmlFor="manager" className="font-medium text-foreground cursor-pointer">Manager</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supervisa un equipo creando horarios o gestionando ausencias.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Director */}
                <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                  selectedRole === "director" 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="rol" 
                      id="director" 
                      className="mt-1" 
                      checked={selectedRole === "director"}
                      onChange={async () => {
                        setSelectedRole("director");
                        await handleRoleChange("director");
                      }}
                    />
                    <div>
                      <label htmlFor="director" className="font-medium text-foreground cursor-pointer">Director</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Administra un establecimiento desde la configuración hasta la pre-nómina.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Administrador */}
                <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                  selectedRole === "administrador" 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="rol" 
                      id="administrador" 
                      className="mt-1" 
                      checked={selectedRole === "administrador"}
                      onChange={async () => {
                        setSelectedRole("administrador");
                        await handleRoleChange("administrador");
                      }}
                    />
                    <div>
                      <label htmlFor="administrador" className="font-medium text-foreground cursor-pointer">Administrador</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Puede acceder a toda la aplicación.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Propietario */}
                <div className={`rounded-lg p-4 ${
                  selectedRole === "propietario" 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-border/20"
                }`}>
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="rol" 
                      id="propietario" 
                      className="mt-1" 
                      checked={selectedRole === "propietario"}
                      onChange={async () => {
                        setSelectedRole("propietario");
                        await handleRoleChange("propietario");
                      }}
                    />
                    <div>
                      <label htmlFor="propietario" className="font-medium text-foreground cursor-pointer">Propietario</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        El titular de la cuenta puede modificar los derechos de un admin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Planificación */}
            <div className="bg-muted/20 rounded-lg p-6">
              <h4 className="font-medium mb-6 text-foreground">Planificación</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Acceso a la planificación publicada de sus equipos/ubicaciones</span>
                  {getCheckmarkComponent("acceso_planificacion_publicada_equipos")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Acceso a la planificación no publicada (borrador)</span>
                  {getCheckmarkComponent("acceso_planificacion_no_publicada")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Acceso a la planificación publicada de otros equipos/ubicaciones</span>
                  {getCheckmarkComponent("acceso_planificacion_otros_equipos")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Visualización de alertas y contadores</span>
                  {getCheckmarkComponent("visualizacion_alertas")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Creación, modificación y publicación de planificación</span>
                  {getCheckmarkComponent("creacion_modificacion_planificacion")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Puede editar las planificaciones publicadas y validar los turnos de su ubicación</span>
                  {getCheckmarkComponent("editar_planificaciones_publicadas")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Visualización de ratios de análisis</span>
                  {getCheckmarkComponent("visualizacion_ratios")}
                </div>
              </div>
            </div>

            {/* Gestión de Horas */}
            <div className="bg-muted/20 rounded-lg p-6">
              <h4 className="font-medium mb-6 text-foreground">Gestión de Horas</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Guardar sus propias horas de trabajo</span>
                  {getCheckmarkComponent("guardar_propias_horas")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Ingresar las horas reales de su equipo/ubicación</span>
                  {getCheckmarkComponent("ingresar_horas_equipo")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Puede validar sus propias horas reales</span>
                  {getCheckmarkComponent("validar_propias_horas")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Ingresar las horas reales de todos los equipos/ubicaciones</span>
                  {getCheckmarkComponent("ingresar_horas_todos_equipos")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Puede anular la validación de horas reales</span>
                  {getCheckmarkComponent("anular_validacion_horas")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Puede revalorizar ausencias</span>
                  {getCheckmarkComponent("revalorizar_ausencias")}
                </div>
              </div>
            </div>

            {/* Perfil de Usuario */}
            <div className="bg-muted/20 rounded-lg p-6">
              <h4 className="font-medium mb-6 text-foreground">Perfil de Usuario</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Puede acceder a su propio perfil de usuario</span>
                  {getCheckmarkComponent("acceso_propio_perfil")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Puede modificar su información personal y detalles de contacto</span>
                  {getCheckmarkComponent("modificar_informacion_personal")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Puede consultar sus propias hojas de asistencia</span>
                  {getCheckmarkComponent("consultar_propias_hojas")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Acceso al perfil de empleados de mi equipo o ubicación</span>
                  {getCheckmarkComponent("acceso_perfil_empleados_equipo")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Acceso a los perfiles de los managers de mi equipo o establecimiento</span>
                  {getCheckmarkComponent("acceso_perfiles_managers")}
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <span className="text-sm text-foreground">Acceso al perfil de todos los empleados de todas las ubicaciones</span>
                  {getCheckmarkComponent("acceso_perfil_todos_empleados")}
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Puede eliminar el perfil de un empleado o manager</span>
                  {getCheckmarkComponent("eliminar_perfil_empleado")}
                </div>
              </div>
            </div>

            {/* Gestión de Ausencias */}
            <div className="bg-muted/20 rounded-lg p-6">
              <h4 className="font-medium mb-6 text-foreground">Gestión de Ausencias</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">Puede modificar manualmente los contadores de días de vacaciones pagados</span>
                  {getCheckmarkComponent("modificar_contadores_vacaciones")}
                </div>
              </div>
            </div>

            {/* Eliminar cuenta del empleado */}
            <div className="border border-border/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Eliminar cuenta del empleado</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    Borrar permanentemente al empleado de su establecimiento.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Advertencia, esta operación eliminará permanentemente los datos del empleado.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-muted hover:bg-muted/80 text-muted-foreground"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Eliminar Cuenta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a <strong>{colaborador?.nombre} {colaborador?.apellidos}</strong> de su establecimiento.
              <br /><br />
              <strong>Advertencia:</strong> Esta operación eliminará permanentemente todos los datos del empleado y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No eliminar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteColaborador}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
