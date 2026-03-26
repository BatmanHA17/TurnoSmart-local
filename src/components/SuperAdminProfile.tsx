import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useActivityLog } from "@/hooks/useActivityLog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Save, 
  Crown, 
  Users, 
  Shield, 
  Settings, 
  Trash2, 
  UserPlus,
  Activity,
  Database,
  Eye,
  EyeOff,
  Bell,
  Lock
} from "lucide-react";

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface RoleRow {
  user_id: string;
  role: "admin" | "super_admin" | "user";
}

type Role = "admin" | "super_admin" | "user";

export const SuperAdminProfile = () => {
  const { profile, loading: profileLoading, refresh } = useUserProfile();
  const { isSuperAdmin } = useUserRole();
  const { logActivity } = useActivityLog();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || ""
  });

  // Cargar datos de usuarios
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profilesRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("id, email, display_name, is_active, created_at").order('created_at', { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
        ]);

        if (profilesRes.error) {
          console.error("Error loading profiles:", profilesRes.error);
          toast.error("Error al cargar usuarios");
          return;
        }

        if (rolesRes.error) {
          console.error("Error loading roles:", rolesRes.error);
          toast.error("Error al cargar roles");
          return;
        }

        setProfiles(profilesRes.data || []);
        setRoles((rolesRes.data || []).filter((r: any) => ['admin', 'super_admin', 'user'].includes(r.role)) as RoleRow[]);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    if (isSuperAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  // Sincronizar formData cuando el perfil se actualiza
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || ""
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
        return;
      }

      toast.success('Perfil actualizado correctamente');
      refresh();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al actualizar el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasChanges() && !isUpdating) {
      handleSave();
    }
  };

  const updateRole = async (userId: string, role: Role) => {
    try {
      // Get current role and user details for logging
      const { data: currentUserRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (roleError) console.error('[SuperAdminProfile] Error fetching current role:', roleError);

      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .single();
      if (profileError) console.error('[SuperAdminProfile] Error fetching profile:', profileError);

      const previousRole = currentUserRole?.role || 'sin rol';

      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating role:", error);
        toast.error("Error al actualizar el rol");
        return;
      }

      // Log detailed role change activity
      const roleLabels: Record<string, string> = {
        'super_admin': 'Super Administrador',
        'admin': 'Administrador', 
        'user': 'Usuario',
        'sin rol': 'Sin rol'
      };

      const previousRoleLabel = roleLabels[previousRole] || previousRole;
      const newRoleLabel = roleLabels[role] || role;

      await logActivity({
        action: `ha actualizado el rol del usuario ${targetProfile?.display_name || targetProfile?.email || 'usuario'} de "${previousRoleLabel}" a "${newRoleLabel}"`,
        entityType: 'user_role',
        entityId: userId,
        entityName: targetProfile?.display_name || targetProfile?.email || 'Unknown User',
        details: {
          previous_role: previousRole,
          new_role: role,
          action_type: 'role_update_admin_panel',
          target_user_email: targetProfile?.email,
          role_change_summary: `${previousRoleLabel} → ${newRoleLabel}`,
          updated_from: 'admin_panel'
        }
      });

      setRoles(prev => prev.map(r => r.user_id === userId ? { ...r, role } : r));
      toast.success("Rol actualizado correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el rol");
    }
  };

  const updateActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("Error al actualizar el estado");
        return;
      }

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: isActive } : p));
      toast.success(`Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const deleteUser = async (userId: string, hardDelete: boolean = false) => {
    try {
      const response = await fetch('/api/v1/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId, hardDelete })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar usuario');
      }

      if (hardDelete) {
        setProfiles(prev => prev.filter(p => p.id !== userId));
        setRoles(prev => prev.filter(r => r.user_id !== userId));
      } else {
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: false } : p));
      }

      toast.success(`Usuario ${hardDelete ? 'eliminado permanentemente' : 'desactivado'} correctamente`);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Error al eliminar usuario");
    }
  };

  const hasChanges = () => {
    return (
      formData.display_name !== (profile?.display_name || "") ||
      formData.first_name !== (profile?.first_name || "") ||
      formData.last_name !== (profile?.last_name || "")
    );
  };

  // Crear tabla combinada de usuarios
  const rows = profiles.map(profile => {
    const role = roles.find(r => r.user_id === profile.id)?.role || 'user';
    return { ...profile, role };
  });

  const stats = {
    totalUsers: profiles.length,
    activeUsers: profiles.filter(p => p.is_active).length,
    superAdmins: roles.filter(r => r.role === 'super_admin').length,
    admins: roles.filter(r => r.role === 'admin').length,
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold">Acceso Denegado</p>
          <p className="text-sm text-muted-foreground">Solo los super administradores pueden acceder a esta sección</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Panel de Super Administrador</h1>
          <p className="text-sm text-muted-foreground">Control total del sistema y gestión avanzada</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Configuración de tu perfil de super administrador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Email" className="opacity-75">
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El email no puede modificarse ya que se usa para el acceso a la aplicación
                </p>
              </FormField>

              <FormField label="Nombre de Usuario">
                <Input
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingresa tu nombre de usuario"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nombre">
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tu nombre"
                  />
                </FormField>

                <FormField label="Apellidos">
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tus apellidos"
                  />
                </FormField>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges() || isUpdating}
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isUpdating ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Estadísticas de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Usuarios</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Administradores</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Super Admins</p>
                    <p className="text-2xl font-bold text-pink-600">{stats.superAdmins}</p>
                  </div>
                  <Crown className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de usuarios */}
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Control completo sobre todos los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rows.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {user.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Registrado: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={user.role}
                        onValueChange={(value: Role) => updateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      
                      <Switch
                        checked={user.is_active || false}
                        onCheckedChange={(checked) => updateActive(user.id, checked)}
                      />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.id, true)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Información del Sistema
              </CardTitle>
              <CardDescription>
                Detalles técnicos y configuración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mostrar información sensible</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSystemInfo(!showSystemInfo)}
                  className="flex items-center gap-2"
                >
                  {showSystemInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSystemInfo ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              
              {showSystemInfo && (
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de Usuario</label>
                    <p className="text-sm font-mono bg-background p-2 rounded border mt-1 break-all">
                      {profile?.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Base de Datos</label>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Conectado - Supabase
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Versión API</label>
                    <p className="text-sm font-medium mt-1">
                      v1.0.0
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Gestión de políticas de seguridad y acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Autenticación Multifactor</p>
                    <p className="text-sm text-muted-foreground">Seguridad adicional para tu cuenta</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Notificaciones de Seguridad</p>
                    <p className="text-sm text-muted-foreground">Alertas sobre actividad sospechosa</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Logs de Auditoría</p>
                    <p className="text-sm text-muted-foreground">Registro de todas las acciones administrativas</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  <Bell className="h-4 w-4 mr-2" />
                  Configurar Alertas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};