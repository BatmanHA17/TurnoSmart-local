import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, FileText, HelpCircle, Settings } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TimezoneMismatchBanner } from "@/components/TimezoneMismatchBanner";

const DashboardManager = () => {
  const navigate = useNavigate();
  const { displayName } = useUserProfile();
  
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3">
            Hola {displayName || 'Manager'},
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Supervisa tu equipo creando <span className="font-semibold text-foreground">turnos</span> y gestionando ausencias
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-20">
          {/* Card 1 - Consulta Horarios */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate("/turnosmart")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-blue-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-12 h-12 text-notion-blue-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Consulta los horarios
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Ajusta las jornadas laborales de tu equipo
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-blue-bg hover:text-notion-blue-text transition-all duration-200"
            >
              Ver horarios
            </Button>
          </Card>

          {/* Card 2 - Actualiza Perfiles */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate('/colaboradores')}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-yellow-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-12 h-12 text-notion-yellow-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Actualiza perfiles
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Gestiona los miembros de tu equipo
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-yellow-bg hover:text-notion-yellow-text transition-all duration-200"
            >
              Ver mi equipo
            </Button>
          </Card>

          {/* Card 3 - Revisa Ausencias */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '300ms' }}
            onClick={() => navigate('/ausencias')}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-orange-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-12 h-12 text-notion-orange-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Revisa ausencias
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Aprueba las solicitudes de ausencia
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-orange-bg hover:text-notion-orange-text transition-all duration-200"
            >
              Consultar ausencias
            </Button>
          </Card>

          {/* Card 4 - Gestiona Turnos (destacada) */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '400ms' }}
            onClick={() => navigate('/turnosmart/day')}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-green-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-12 h-12 text-notion-green-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug flex items-center justify-center gap-2">
              Gestiona turnos
              <Badge variant="secondary" className="bg-notion-green-bg text-notion-green-text text-xs px-2 py-0.5">
                NUEVO
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Crea, edita y publica turnos del equipo
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-green-bg hover:text-notion-green-text transition-all duration-200"
            >
              Gestionar turnos →
            </Button>
          </Card>
        </div>

        {/* Bottom Section - Ayuda y Configuración */}
        <div className="border-t border-border/50 pt-12 sm:pt-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
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
                Nuestros artículos de ayuda te orientan y responden tus dudas sobre el 
                uso de la herramienta, para que puedas empezar fácilmente y con confianza.
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
                  Configuración del equipo
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Ajusta la configuración de tu equipo en pocos clics: gestiona 
                horarios, ausencias, y permisos de tu grupo de trabajo.
              </p>
              <Button 
                variant="link" 
                className="text-notion-blue-text p-0 h-auto hover:text-notion-blue-text/80 font-medium text-base transition-colors"
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

export default DashboardManager;