import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { employees } from "@/data/employees";
import { calculateMonthlyStats, calculateStaffing } from "@/utils/calculations";
import { Users, Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function Dashboard() {
  const navigate = useNavigate();
  const { organizations, loading: orgLoading } = useCurrentOrganization();
  const stats = calculateMonthlyStats(employees);
  
  // Redirect to onboarding if user has no organizations
  useEffect(() => {
    if (!orgLoading && organizations && organizations.length === 0) {
      console.log('Dashboard: User has no organizations, redirecting to onboarding wizard');
      navigate('/onboarding/wizard', { replace: true });
    }
  }, [organizations, orgLoading, navigate]);
  const staffing = calculateStaffing(85, 0.1); // 85% occupancy, 10% absenteeism

  const cards = [
    {
      title: "Personal Presencial Promedio",
      value: stats.averagePresent.toFixed(1),
      description: "Empleados trabajando por día",
      icon: Users,
      color: "text-notion-blue-text"
    },
    {
      title: "Total Días Libres",
      value: stats.totalFree.toString(),
      description: "Suma de todos los días libres",
      icon: Calendar,
      color: "text-notion-green-text"
    },
    {
      title: "Total Días Vacaciones",
      value: stats.totalVacation.toString(),
      description: "Suma de días de vacaciones",
      icon: TrendingUp,
      color: "text-notion-orange-text"
    },
    {
      title: "Alertas de Cumplimiento",
      value: stats.complianceIssues.toString(),
      description: "Posibles irregularidades detectadas",
      icon: AlertTriangle,
      color: "text-notion-red-text"
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Control</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Resumen ejecutivo del departamento de bares - Enero 2011
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium leading-tight">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 md:h-6 md:w-6 ${card.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className="pt-2">
                <div className={`text-xl md:text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Distribución de Personal</CardTitle>
            <CardDescription className="text-sm">
              Clasificación por tipo de contrato y departamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between h-8">
                <span className="text-sm font-medium">Personal Propio</span>
                <Badge variant="secondary">
                  {employees.filter(e => e.department === 'PROPIO').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm font-medium">Personal ETT</span>
                <Badge variant="outline">
                  {employees.filter(e => e.department === 'ETT').length}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <h4 className="text-sm font-medium">Por tipo de contrato:</h4>
              <div className="space-y-2">
                {[8, 6, 5, 4].map(hours => {
                  const count = employees.filter(e => e.contract === hours).length;
                  return (
                    <div key={hours} className="flex items-center justify-between h-8">
                      <span className="text-sm">{hours} horas</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Presupuesto de Plantilla</CardTitle>
            <CardDescription className="text-sm">
              Cálculo automático según ocupación actual (85%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Plantilla Presencial:</span>
                <span className="font-bold text-notion-blue-text text-sm md:text-base">
                  {staffing.presentialStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Plantilla Activa:</span>
                <span className="font-bold text-notion-green-text text-sm md:text-base">
                  {staffing.activeStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Para Vacaciones:</span>
                <span className="font-bold text-notion-yellow-text text-sm md:text-base">
                  {staffing.vacationStaff.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between h-8">
                <span className="text-sm">Para Absentismo:</span>
                <span className="font-bold text-notion-orange-text text-sm md:text-base">
                  {staffing.absenteeismStaff.toFixed(1)}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between h-8">
                  <span className="font-semibold text-sm md:text-base">Total Bruto:</span>
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

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona solicitudes y revisa información</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate('/solicitudes-ausencia')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Ver Solicitudes
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}