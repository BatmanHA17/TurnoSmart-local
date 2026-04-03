import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Shield,
  BarChart3,
  Settings,
  HelpCircle,
  Building,
  UserPlus,
  Crown,
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TimezoneMismatchBanner } from "@/components/TimezoneMismatchBanner";

/**
 * Dashboard OWNER / Super Admin — panel de control completo.
 * Muestra resumen de la organización + accesos rápidos a todas las áreas.
 */
const DashboardOwner = () => {
  const navigate = useNavigate();
  const { displayName } = useUserProfile();
  const [stats, setStats] = useState({
    colaboradores: 0,
    departamentos: 0,
    orgName: "—",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Org info
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .limit(1)
          .single();

        // Colaboradores count
        const { count: colabCount } = await supabase
          .from("colaboradores")
          .select("*", { count: "exact", head: true });

        // Departamentos count
        const { count: deptCount } = await supabase
          .from("job_departments")
          .select("*", { count: "exact", head: true });

        setStats({
          colaboradores: colabCount || 0,
          departamentos: deptCount || 0,
          orgName: org?.name || "—",
        });
      } catch (err) {
        console.error("[DashboardOwner] Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-notion-blue-bg/40 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-notion-orange-bg/30 rounded-full blur-[140px] -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
        <TimezoneMismatchBanner />

        {/* Header Section */}
        <div className="mb-12 sm:mb-16 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2.5 py-0.5"
            >
              Super Admin
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3">
            Hola {displayName || "Admin"},
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Panel de control de{" "}
            <span className="font-semibold text-foreground">
              {stats.orgName}
            </span>
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <Card className="p-4 sm:p-5 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-notion-blue-bg flex items-center justify-center">
                <Users className="w-5 h-5 text-notion-blue-text" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.colaboradores}</p>
                <p className="text-xs text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-notion-yellow-bg flex items-center justify-center">
                <Building className="w-5 h-5 text-notion-yellow-text" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.departamentos}</p>
                <p className="text-xs text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 bg-card/80 backdrop-blur-sm border-border/50 col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-notion-green-bg flex items-center justify-center">
                <Shield className="w-5 h-5 text-notion-green-text" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.orgName}</p>
                <p className="text-xs text-muted-foreground">Organización</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-20">
          {/* Card 1 - Calendario / Turnos */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: "100ms" }}
            onClick={() => navigate("/turnosmart")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-blue-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-12 h-12 text-notion-blue-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Calendario de turnos
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Genera, edita y publica cuadrantes con el motor SMART
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-blue-bg hover:text-notion-blue-text transition-all duration-200"
            >
              Ir al calendario
            </Button>
          </Card>

          {/* Card 2 - Equipo */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: "200ms" }}
            onClick={() => navigate("/turnosmart/collaborators")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-yellow-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-12 h-12 text-notion-yellow-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Gestiona tu equipo
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Añade colaboradores, asigna roles y departamentos
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-yellow-bg hover:text-notion-yellow-text transition-all duration-200"
            >
              Ver equipo
            </Button>
          </Card>

          {/* Card 3 - Creador rápido */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: "300ms" }}
            onClick={() => navigate("/turnosmart/collaborators/quick-create")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-green-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="w-12 h-12 text-notion-green-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug flex items-center justify-center gap-2">
              Creador rápido
              <Badge
                variant="secondary"
                className="bg-notion-green-bg text-notion-green-text text-xs px-2 py-0.5"
              >
                NUEVO
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Añade varios colaboradores a la vez o importa desde Excel
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-green-bg hover:text-notion-green-text transition-all duration-200"
            >
              Crear equipo
            </Button>
          </Card>

          {/* Card 4 - Analítica */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: "400ms" }}
            onClick={() => navigate("/turnosmart/hr")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-orange-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-12 h-12 text-notion-orange-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              RRHH y analítica
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Plantilla, ausencias, equidad y estadísticas del equipo
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-orange-bg hover:text-notion-orange-text transition-all duration-200"
            >
              Ver analítica
            </Button>
          </Card>
        </div>

        {/* Bottom Section - Configuración y Ayuda */}
        <div
          className="border-t border-border/50 pt-12 sm:pt-16 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-10 flex items-center gap-3">
            <Settings className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
            Configuración y ayuda
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Ayuda */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-notion-purple-bg flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-notion-purple-text" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  ¿Necesitas ayuda?
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Nuestros artículos de ayuda te orientan y responden tus dudas
                sobre el uso de la herramienta, para que puedas empezar
                fácilmente y con confianza.
              </p>
              <Button
                variant="link"
                className="text-notion-blue-text p-0 h-auto hover:text-notion-blue-text/80 font-medium text-base transition-colors"
              >
                Consultar la guía en línea →
              </Button>
            </div>

            {/* Configuración */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-notion-yellow-bg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-notion-yellow-text" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Configuración general
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Gestiona la organización, permisos, criterios SMART y
                preferencias de la herramienta.
              </p>
              <Button
                variant="link"
                className="text-notion-blue-text p-0 h-auto hover:text-notion-blue-text/80 font-medium text-base transition-colors"
                onClick={() => navigate("/configuracion-legacy")}
              >
                Ir a la configuración →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOwner;
