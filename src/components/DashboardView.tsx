import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  ArrowRight,
  BarChart3,
  Zap,
  FileText,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const quickStats = [
  {
    title: "Empleados Activos",
    value: "174",
    description: "Personal + ETT",
    icon: Users,
    trend: "+12",
    color: "text-blue-600"
  },
  {
    title: "Turnos Hoy",
    value: "142",
    description: "Presenciales trabajando",
    icon: Calendar,
    trend: "-8",
    color: "text-green-600"
  },
  {
    title: "Banco de Horas",
    value: "1,247h",
    description: "Acumuladas este mes",
    icon: Clock,
    trend: "+156h",
    color: "text-orange-600"
  },
  {
    title: "Ocupación Hotel",
    value: "87%",
    description: "581 habitaciones",
    icon: TrendingUp,
    trend: "+5%",
    color: "text-purple-600"
  },
];

const quickActions = [
  {
    title: "Crear Horario",
    description: "Asignar nuevo horario a empleados",
    icon: Plus,
    action: "/turnos/crear",
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    title: "Configuración de Horarios",
    description: "Gestionar turnos y horarios",
    icon: Clock,
    action: "/planificacion-automatica",
    color: "bg-purple-50 text-purple-600 border-purple-200"
  },
  {
    title: "Gestionar Ausencias",
    description: "Procesar solicitudes pendientes",
    icon: AlertTriangle,
    action: "/solicitudes-ausencia",
    color: "bg-orange-50 text-orange-600 border-orange-200"
  },
  {
    title: "Ver Reportes",
    description: "Analizar estadísticas de turnos",
    icon: BarChart3,
    action: "/reportes",
    color: "bg-green-50 text-green-600 border-green-200"
  },
];

const recentActivities = [
  {
    type: "shift_created",
    message: "María González creó turnos para la semana del 13-19 Enero",
    time: "Hace 2 horas",
    status: "success"
  },
  {
    type: "swap_request",
    message: "Solicitud de cambio de turno entre Marcos Toledo y Geiler Cruz",
    time: "Hace 3 horas",
    status: "pending"
  },
  {
    type: "absence_approved",
    message: "Aprobada ausencia de Minerva Arías del 15-17 Enero",
    time: "Hace 5 horas",
    status: "success"
  },
  {
    type: "compliance_alert",
    message: "Alerta: Días libres no consecutivos detectados",
    time: "Hace 1 día",
    status: "warning"
  },
];

const upcomingTasks = [
  {
    title: "Publicar turnos Febrero",
    description: "Revisar y publicar planificación del próximo mes",
    dueDate: "En 3 días",
    priority: "high"
  },
  {
    title: "Revisar banco de horas",
    description: "Procesar compensaciones pendientes",
    dueDate: "En 5 días",
    priority: "medium"
  },
  {
    title: "Informe mensual",
    description: "Generar reporte de balance anual",
    dueDate: "En 1 semana",
    priority: "low"
  },
];

export function DashboardView() {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "pending":
        return "text-orange-600";
      case "warning":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestión integral de turnos hoteleros - Hotel Cantaclaro
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/configuracion")}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
          <Button onClick={() => navigate("/turnos/crear")}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Horario
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className={`${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-muted-foreground ml-1">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={action.title}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${action.color}`}
                  onClick={() => navigate(action.action)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs opacity-75">{action.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimos eventos en el sistema de gestión de horarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full" onClick={() => navigate("/actividades")}>
              Ver todas las actividades
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas Pendientes</CardTitle>
            <CardDescription>
              Acciones que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{task.dueDate}</p>
                </div>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </Badge>
              </div>
            ))}
            <Button variant="ghost" className="w-full" onClick={() => navigate("/tareas")}>
              Ver todas las tareas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}