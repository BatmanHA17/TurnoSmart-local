import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, EyeOff, Users } from "lucide-react";

interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string;
  role: "admin" | "super_admin" | "user";
}

type Role = "admin" | "super_admin" | "user";

interface UserSystemRolesProps {
  rows: UserRow[];
  updateRole: (userId: string, role: Role) => Promise<void>;
  updateActive: (userId: string, isActive: boolean) => Promise<void>;
  deleteUser: (userId: string, hardDelete?: boolean) => Promise<void>;
}

export const UserSystemRoles = ({ rows, updateRole, updateActive, deleteUser }: UserSystemRolesProps) => {
  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-pink-100 text-pink-800 border-pink-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
      default:
        return <Badge variant="outline">Usuario</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestión de Usuarios del Sistema
        </CardTitle>
        <CardDescription>
          Control completo sobre todos los usuarios y sus roles de acceso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.display_name || user.email}</p>
                    {getRoleBadge(user.role)}
                  </div>
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
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={user.is_active || false}
                    onCheckedChange={(checked) => updateActive(user.id, checked)}
                  />
                  {user.is_active ? (
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
                        Esta acción eliminará permanentemente el usuario "{user.display_name || user.email}" del sistema. 
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(user.id)}
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
          
          {rows.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">No hay usuarios en el sistema</p>
              <p className="text-sm text-muted-foreground">Los usuarios aparecerán aquí cuando se registren</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};