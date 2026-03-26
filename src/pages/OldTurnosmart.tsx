import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  ArrowRight,
  Zap
} from "lucide-react";
import { employees } from "@/data/employees";
import { calculateMonthlyStats, calculateStaffing } from "@/utils/calculations";

const OldTurnosmart = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  
  // Datos del dashboard original
  const stats = calculateMonthlyStats(employees);
  const staffing = calculateStaffing(85, 0.1); // 85% occupancy, 10% absenteeism

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
      title: "Crear Turno",
      description: "Asignar nuevo turno a empleados",
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
      action: "/ausencias",
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

  const features = [
    {
      title: "Dashboard",
      description: "Panel principal con resumen de actividades y estadísticas en tiempo real",
      icon: BarChart3,
      status: "Funcionalidad completa disponible",
    },
    {
      title: "GoTurnoSmart",
      description: "Planificación inteligente automatizada basada en ocupación hotelera",
      icon: Zap,
      status: "Sistema de IA para asignación automática",
    },
    {
      title: "Cuadrantes",
      description: "Gestión de cuadrantes mensuales con sistema Excel integrado",
      icon: Calendar,
      status: "Basado en plantillas Cantaclaro",
    },
    {
      title: "Editor",
      description: "Editor de turnos avanzado con validación de cumplimiento",
      icon: Settings,
      status: "Editor visual con alertas laborales",
    },
    {
      title: "Horario Público",
      description: "Vista pública de turnos para empleados con acceso móvil",
      icon: Users,
      status: "Acceso público optimizado",
    },
    {
      title: "Planificación",
      description: "Herramientas de planificación basadas en presupuestos y ocupación",
      icon: FileText,
      status: "Cálculos automáticos de plantilla",
    },
  ];

  const dashboardCards = [
    {
      title: "Personal Presencial Promedio",
      value: stats.averagePresent.toFixed(1),
      description: "Empleados trabajando por día",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Total Días Libres",
      value: stats.totalFree.toString(),
      description: "Suma de todos los días libres",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Total Días Vacaciones",
      value: stats.totalVacation.toString(),
      description: "Suma de días de vacaciones",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Alertas de Cumplimiento",
      value: stats.complianceIssues.toString(),
      description: "Posibles irregularidades detectadas",
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard TurnoSmart.app</h2>
          <p className="text-muted-foreground">
            Gestión integral de turnos hoteleros - Sistema Original
          </p>
        </div>
        <Badge variant="secondary">Modo Legacy</Badge>
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
          <CardTitle>Acciones Rápidas - TurnoSmart.app</CardTitle>
          <CardDescription>
            Funcionalidades principales de la aplicación original
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
              Últimos eventos en el sistema original
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
          </CardContent>
        </Card>

        {/* Presupuesto de Plantilla */}
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto de Plantilla</CardTitle>
            <CardDescription>
              Cálculo automático según ocupación actual (85%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Plantilla Presencial:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {staffing.presentialStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Plantilla Activa:</span>
                <span className="font-bold text-green-600 text-sm">
                  {staffing.activeStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Para Vacaciones:</span>
                <span className="font-bold text-orange-600 text-sm">
                  {staffing.vacationStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Para Absentismo:</span>
                <span className="font-bold text-red-600 text-sm">
                  {staffing.absenteeismStaff.toFixed(1)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between h-8">
                  <span className="font-semibold text-sm">Total Bruto:</span>
                  <span className="font-bold text-lg text-foreground">
                    {staffing.grossStaff.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.complianceIssues > 0 && (
        <Alert className="p-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Se han detectado <strong>{stats.complianceIssues}</strong> posibles irregularidades 
            en el cumplimiento de la normativa laboral. Revisa la pestaña de "Alertas de Cumplimiento" 
            para más detalles.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Funcionalidades TurnoSmart.app
        </h2>
        <p className="text-muted-foreground">
          Características y herramientas de la aplicación original que podemos aprovechar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <feature.icon className="h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{feature.status}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    if (feature.title === "Dashboard") {
                      navigate("/reportes");
                    }
                  }}
                >
                  Ver detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Sistema Excel Cantaclaro</CardTitle>
          <CardDescription>
            Integración con el sistema de planillas Excel para gestión hotelera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El sistema anterior estaba basado en las plantillas Excel de Cantaclaro,
              incluyendo cálculos automáticos de plantilla, presupuestos por ocupación,
              y gestión de personal por departamentos.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-lg">581</p>
                <p className="text-sm text-muted-foreground">Habitaciones</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-lg">48</p>
                <p className="text-sm text-muted-foreground">Días vacaciones</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-lg">1.4</p>
                <p className="text-sm text-muted-foreground">Ratio libranza</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold text-lg">2-15%</p>
                <p className="text-sm text-muted-foreground">Absentismo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Old-Turnosmart.app
        </h1>
        <p className="text-muted-foreground">
          Funcionalidades y dashboard de la aplicación anterior TurnoSmart.app 
          con todas sus características originales restauradas.
        </p>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard Funcional</TabsTrigger>
          <TabsTrigger value="features">Características</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>
        
        <TabsContent value="features" className="mt-6">
          {renderFeatures()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OldTurnosmart;