import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

 type Role = "user" | "admin" | "super_admin";

 interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface RoleRow { user_id: string; role: Role }

export default function UserManagement() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useUserRole();

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name,is_active,created_at"),
      supabase.from("user_roles").select("user_id,role"),
    ]);

    if (!profilesRes.error && profilesRes.data) setProfiles(profilesRes.data as ProfileRow[]);
    if (!rolesRes.error && rolesRes.data) setRoles(rolesRes.data as RoleRow[]);

    if (profilesRes.error) console.error("Error loading profiles:", profilesRes.error);
    if (rolesRes.error) console.error("Error loading roles:", rolesRes.error);

    setLoading(false);
  };

  useEffect(() => {
    document.title = "Administración de usuarios | TurnoSmart";
    loadData();
  }, []);

  const rows = useMemo(() => {
    const roleMap = new Map<string, Role>(roles.map(r => [r.user_id, r.role]));
    return profiles
      .slice()
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""))
      .map(p => ({
        ...p,
        role: roleMap.get(p.id) || ("user" as Role),
      }));
  }, [profiles, roles]);

  const updateRole = async (userId: string, role: Role) => {
    // Remove existing roles and insert the selected one
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      console.error("Error clearing roles:", delErr);
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (insErr) {
      console.error("Error setting role:", insErr);
      return;
    }
    loadData();
  };

  const updateActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
    if (error) {
      console.error("Error updating active:", error);
      return;
    }
    setProfiles(prev => prev.map(p => (p.id === userId ? { ...p, is_active: isActive } : p)));
  };

  const deleteUser = async (userId: string, hardDelete: boolean = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId, hardDelete }
      });

      if (error) throw error;

      toast({
        title: hardDelete ? "Usuario eliminado permanentemente" : "Usuario eliminado",
        description: hardDelete 
          ? "El usuario ha sido eliminado permanentemente del sistema."
          : "El usuario ha sido marcado para eliminación. Tiene 30 días para reactivar su cuenta.",
      });
      
      loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Administración de usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.email}</TableCell>
                    <TableCell>{row.display_name}</TableCell>
                    <TableCell>
                      <Select value={row.role} onValueChange={(val) => updateRole(row.id, val as Role)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="super_admin">Súper administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {row.is_active ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-sm text-muted-foreground">Activo</span>
                        <Switch
                          checked={!!row.is_active}
                          onCheckedChange={(checked) => updateActive(row.id, checked)}
                        />
                        
                        {/* Soft Delete para todos los admins */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
                              <AlertDialogDescription>
                                El usuario será marcado para eliminación y tendrá 30 días para reactivar su cuenta.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(row.id, false)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Hard Delete solo para super admins */}
                        {isSuperAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">⚠️ Eliminación Permanente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>ADVERTENCIA:</strong> Esta acción eliminará permanentemente al usuario y todos sus datos del sistema. 
                                  Esta acción NO se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUser(row.id, true)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
