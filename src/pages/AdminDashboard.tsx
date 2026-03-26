import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, UserPlus, Activity, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";

interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  activeUsers: number;
  inactiveUsers: number;
  superAdmins: number;
  admins: number;
  regularUsers: number;
  recentActivity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard de Administración | TurnoSmart";
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Obtener datos de perfiles y roles
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id,email,is_active,created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);

      if (profilesRes.error || rolesRes.error) {
        console.error("Error loading data:", profilesRes.error || rolesRes.error);
        return;
      }

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      
      // Crear mapa de roles
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
      
      // Calcular estadísticas
      const totalUsers = profiles.length;
      const activeUsers = profiles.filter(p => p.is_active).length;
      const inactiveUsers = totalUsers - activeUsers;
      
      // Usuarios nuevos esta semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = profiles.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).length;
      
      // Contar por roles
      const superAdmins = roles.filter(r => r.role === 'super_admin').length;
      const admins = roles.filter(r => r.role === 'admin').length;
      const regularUsers = roles.filter(r => r.role === 'user').length;
      
      // Actividad reciente (últimos usuarios registrados)
      const recentActivity = profiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(p => ({
          ...p,
          role: roleMap.get(p.id) || 'user'
        }));

      setStats({
        totalUsers,
        newUsersThisWeek,
        activeUsers,
        inactiveUsers,
        superAdmins,
        admins,
        regularUsers,
        recentActivity
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
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

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold">Error al cargar estadísticas</p>
            <Button onClick={loadDashboardStats} className="mt-4">
              Reintentar
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Administración</h1>
          <p className="text-muted-foreground mt-2">
            Vista general del sistema y estadísticas de usuarios
          </p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos esta semana</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.newUsersThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inactiveUsers} inactivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.superAdmins + stats.admins}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.superAdmins} súper admins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución por roles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Súper Administradores</Badge>
                  </div>
                  <span className="font-semibold">{stats.superAdmins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Administradores</Badge>
                  </div>
                  <span className="font-semibold">{stats.admins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Usuarios</Badge>
                  </div>
                  <span className="font-semibold">{stats.regularUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-muted-foreground text-xs">
                        Registrado {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        user.role === 'super_admin' ? 'destructive' : 
                        user.role === 'admin' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {user.role === 'super_admin' ? 'Súper Admin' : 
                       user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </div>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-muted-foreground text-sm">No hay actividad reciente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/admin/users")}>
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/users?action=create")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Nuevo Usuario
              </Button>
              <Button variant="outline" onClick={loadDashboardStats}>
                <Activity className="h-4 w-4 mr-2" />
                Actualizar Estadísticas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}