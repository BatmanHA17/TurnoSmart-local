import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Loader2, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Mail, 
  Key,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Clock
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { CleanupUsersButton } from "@/components/CleanupUsersButton";

type Role = "user" | "admin" | "super_admin";

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
}

interface RoleRow { 
  user_id: string; 
  role: Role 
}

interface UserWithRole extends ProfileRow {
  role: Role;
}

export default function AdminUserManagement() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof UserWithRole>("email");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    display_name: "",
    first_name: "",
    last_name: "",
    role: "user" as Role
  });
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isSuperAdmin } = useUserRole();

  useEffect(() => {
    document.title = "Gestión de Usuarios | TurnoSmart Admin";
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id,email,display_name,first_name,last_name,is_active,created_at,deleted_at,deleted_by,deletion_reason"),
        supabase.from("user_roles").select("user_id,role"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);
      setRoles((rolesRes.data || []) as any);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    const roleMap = new Map<string, Role>(roles.map(r => [r.user_id, r.role]));
    
    let users: UserWithRole[] = profiles.map(p => ({
      ...p,
      role: roleMap.get(p.id) || "user"
    }));

    // Filtrar por búsqueda
    if (searchTerm) {
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar: usuarios en grace period primero, luego activos, luego inactivos
    users.sort((a, b) => {
      // Primero por estado de eliminación
      const aIsDeleted = !!a.deleted_at;
      const bIsDeleted = !!b.deleted_at;
      
      if (aIsDeleted !== bIsDeleted) {
        return aIsDeleted ? -1 : 1; // Deleted users first
      }
      
      // Luego por el campo de ordenación seleccionado
      const aValue = a[sortBy] || "";
      const bValue = b[sortBy] || "";
      
      if (sortDirection === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return users;
  }, [profiles, roles, searchTerm, sortBy, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: keyof UserWithRole) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const updateRole = async (userId: string, newRole: Role) => {
    try {
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      
      if (insErr) throw insErr;

      await loadData();
      toast({
        title: "Éxito",
        description: "Rol de usuario actualizado correctamente"
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive"
      });
    }
  };

  const updateActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);
      
      if (error) throw error;

      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, is_active: isActive } : p
      ));
      
      toast({
        title: "Éxito",
        description: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`
      });
    } catch (error: any) {
      console.error("Error updating active status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive"
      });
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Email y contraseña son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Usar el client con privilegios de admin para crear usuario
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email.trim().toLowerCase(),
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          display_name: newUser.display_name || newUser.first_name || newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error(authError.message);
      }

      // Esperar un momento para que el trigger se ejecute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Actualizar el rol si no es 'user'
      if (newUser.role !== 'user' && authData.user) {
        await updateRole(authData.user.id, newUser.role);
      }

      await loadData();
      setIsCreateDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        display_name: "",
        first_name: "",
        last_name: "",
        role: "user"
      });
      
      toast({
        title: "Éxito",
        description: "Usuario creado correctamente"
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive"
      });
    }
  };

  const canDeleteUser = (userId: string): { canDelete: boolean; reason?: string } => {
    // Verificar si es auto-eliminación
    const isSelfDeletion = currentUser?.id === userId;
    const userToDelete = filteredAndSortedUsers.find(u => u.id === userId);
    
    if (isSelfDeletion && userToDelete?.role === 'super_admin') {
      // Contar cuántos super administradores hay
      const superAdminCount = filteredAndSortedUsers.filter(u => u.role === 'super_admin').length;
      
      if (superAdminCount <= 1) {
        return {
          canDelete: false,
          reason: "No puedes eliminar tu cuenta ya que eres el único Súper Administrador del sistema. Debe haber al menos un Súper Administrador en todo momento."
        };
      }
    }
    
    return { canDelete: true };
  };

  const deleteUser = async (userId: string, hardDelete: boolean = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId, hardDelete }
      });

      if (error) {
        console.error('Error from delete-user function:', error);
        throw new Error(error.message || 'Edge Function error');
      }

      if (data?.error) {
        console.error('Error response from delete-user function:', data);
        throw new Error(data.details || data.error || 'Operation failed');
      }

      await loadData();
      toast({
        title: 'Éxito',
        description: hardDelete
          ? 'Usuario eliminado permanentemente'
          : 'Usuario marcado para eliminación (30 días de gracia)'
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el usuario',
        variant: 'destructive'
      });
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-account', {
        body: { userId }
      });

      if (error) {
        console.error('Error from reactivate-account function:', error);
        throw new Error(error.message || 'Edge Function error');
      }

      if (data?.error) {
        console.error('Error response from reactivate-account function:', data);
        throw new Error(data.details || data.error || 'Operation failed');
      }

      await loadData();
      toast({
        title: 'Éxito',
        description: 'Usuario reactivado correctamente'
      });
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reactivar el usuario',
        variant: 'destructive'
      });
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Correo de restablecimiento de contraseña enviado"
      });
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de restablecimiento",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Usuarios del Sistema</CardTitle>
              <div className="flex gap-2">
                <CleanupUsersButton />
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Crear Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background border border-border shadow-lg">
                  <DialogHeader className="pb-4 border-b border-border">
                    <DialogTitle className="text-lg font-semibold text-foreground">Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription className="sr-only">Formulario para crear un nuevo usuario del sistema</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="usuario@ejemplo.com"
                        className="w-full bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Contraseña *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Contraseña segura"
                        className="w-full bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="text-sm font-medium text-foreground">
                        Nombre para mostrar
                      </Label>
                      <Input
                        id="display_name"
                        value={newUser.display_name}
                        onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
                        placeholder="Nombre para mostrar"
                        className="w-full bg-background border-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium text-foreground">
                          Nombre
                        </Label>
                        <Input
                          id="first_name"
                          value={newUser.first_name}
                          onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                          placeholder="Nombre"
                          className="w-full bg-background border-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium text-foreground">
                          Apellidos
                        </Label>
                        <Input
                          id="last_name"
                          value={newUser.last_name}
                          onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                          placeholder="Apellidos"
                          className="w-full bg-background border-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-foreground">
                        Rol
                      </Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value: Role) => setNewUser({...newUser, role: value})}
                      >
                        <SelectTrigger className="w-full bg-background border-input">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="user" className="hover:bg-accent hover:text-accent-foreground">Usuario</SelectItem>
                          <SelectItem value="admin" className="hover:bg-accent hover:text-accent-foreground">Administrador</SelectItem>
                          <SelectItem value="super_admin" className="hover:bg-accent hover:text-accent-foreground">Súper Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="px-4 py-2"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={createUser}
                      disabled={!newUser.email || !newUser.password}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Crear Usuario
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Barra de búsqueda y filtros */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email, nombre..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("email")}
                    >
                      Email {sortBy === "email" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("display_name")}
                    >
                      Nombre {sortBy === "display_name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("created_at")}
                    >
                      Fecha de registro {sortBy === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(val) => updateRole(user.id, val as Role)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="super_admin">Súper Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.deleted_at ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Grace Period
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.max(0, 30 - Math.floor((Date.now() - new Date(user.deleted_at).getTime()) / (1000 * 60 * 60 * 24)))} días restantes
                              </span>
                            </div>
                          ) : (
                            <>
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                              <Switch
                                checked={!!user.is_active}
                                onCheckedChange={(checked) => updateActive(user.id, checked)}
                                disabled={!!user.deleted_at}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reactivar usuario en grace period */}
                          {user.deleted_at && isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reactivateUser(user.id)}
                              title="Reactivar usuario"
                              className="text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Resetear contraseña solo para usuarios activos */}
                          {!user.deleted_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPasswordReset(user.email!)}
                              title="Enviar correo de restablecimiento"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Eliminar usuario solo para usuarios activos */}
                          {!user.deleted_at && (() => {
                            const { canDelete, reason } = canDeleteUser(user.id);
                            const isSelfDeletion = currentUser?.id === user.id;
                            
                            if (!canDelete) {
                              return (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive hover:text-destructive"
                                      title="Eliminar usuario"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-background border border-border shadow-lg">
                                    <AlertDialogHeader>
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        <AlertDialogTitle>Eliminación no permitida</AlertDialogTitle>
                                      </div>
                                      <AlertDialogDescription className="text-left space-y-2">
                                        <p>{reason}</p>
                                        <p className="text-sm text-muted-foreground">
                                          Para poder eliminar tu cuenta, primero debes asignar el rol de Súper Administrador a otro usuario.
                                        </p>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Entendido</AlertDialogCancel>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              );
                            }
                            
                            return (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-background border border-border shadow-lg">
                                  <AlertDialogHeader>
                                    <div className="flex items-center gap-2">
                                      {isSelfDeletion && user.role === 'super_admin' ? (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                      ) : (
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                      )}
                                      <AlertDialogTitle>
                                        {isSelfDeletion ? '¿Eliminar tu cuenta?' : '¿Eliminar usuario?'}
                                      </AlertDialogTitle>
                                    </div>
                                    <AlertDialogDescription className="text-left space-y-2">
                                      {isSelfDeletion && user.role === 'super_admin' ? (
                                        <>
                                          <p className="font-medium text-amber-600">
                                            ⚠️ Estás a punto de eliminar tu propia cuenta de Súper Administrador
                                          </p>
                                          <p>
                                            Esta acción eliminará permanentemente tu cuenta <strong>{user.email}</strong> y 
                                            perderás el acceso completo al sistema. Solo podrás recuperar el acceso si otro 
                                            Súper Administrador te crea una nueva cuenta.
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Asegúrate de que realmente deseas proceder con esta acción irreversible.
                                          </p>
                                        </>
                                      ) : (
                                        <p>
                                          Esta acción aplicará un borrado suave. El usuario <strong>{user.email}</strong> será marcado para eliminación y tendrá 30 días para reactivar su cuenta.
                                        </p>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isSelfDeletion ? 'Sí, eliminar mi cuenta' : 'Eliminar'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                                           );
                                         })()}
                                       </div>
                                     </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} de{" "}
                  {filteredAndSortedUsers.length} usuarios
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}