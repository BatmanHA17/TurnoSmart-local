import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserStatsCards } from "./UserStatsCards";
import { UserSystemRoles } from "./UserSystemRoles";
import { 
  Users, 
  Shield, 
  Database,
  Lock,
  Crown,
  Trash2,
  Eye,
  EyeOff,
  Settings
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

interface UserSystemManagementProps {
  colaboradorId: string;
  colaboradorEmail: string;
}

export const UserSystemManagement = ({ colaboradorId, colaboradorEmail }: UserSystemManagementProps) => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

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

    loadData();
  }, []);

  // Encontrar el perfil de usuario asociado a este colaborador
  const associatedProfile = profiles.find(p => p.email === colaboradorEmail);
  const associatedRole = roles.find(r => r.user_id === associatedProfile?.id)?.role || 'user';

  const updateRole = async (userId: string, role: Role) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating role:", error);
        toast.error("Error al actualizar el rol");
        return;
      }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando información del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Sistema & Usuarios</h2>
          <p className="text-sm text-muted-foreground">Gestión de usuarios del sistema y acceso avanzado</p>
        </div>
      </div>

      {/* Información del usuario asociado */}
      {associatedProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Usuario del Sistema Asociado
            </CardTitle>
            <CardDescription>
              Gestión del acceso al sistema para este colaborador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {associatedProfile.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{associatedProfile.display_name || associatedProfile.email}</p>
                  <p className="text-sm text-muted-foreground">{associatedProfile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Registrado: {new Date(associatedProfile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={associatedRole}
                  onValueChange={(value: Role) => updateRole(associatedProfile.id, value)}
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
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={associatedProfile.is_active || false}
                    onCheckedChange={(checked) => updateActive(associatedProfile.id, checked)}
                  />
                  {associatedProfile.is_active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente el acceso al sistema de este usuario. ¿Estás seguro?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(associatedProfile.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Todos los Usuarios
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <UserStatsCards stats={stats} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserSystemRoles 
            rows={rows} 
            updateRole={updateRole} 
            updateActive={updateActive} 
            deleteUser={deleteUser} 
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Configuración avanzada de seguridad del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Información del Sistema</p>
                    <p className="text-sm text-muted-foreground">Ver detalles técnicos del sistema</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSystemInfo(!showSystemInfo)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {showSystemInfo ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
                
                {showSystemInfo && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Estado:</span>
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                          ✓ Operativo
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Versión:</span>
                        <span className="ml-2 text-muted-foreground">v2.1.0</span>
                      </div>
                      <div>
                        <span className="font-medium">Base de datos:</span>
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                          ✓ Conectada
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Última actualización:</span>
                        <span className="ml-2 text-muted-foreground">Hace 2 días</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};