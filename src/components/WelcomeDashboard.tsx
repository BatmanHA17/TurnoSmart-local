import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, UserCheck, HelpCircle, Settings } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { TimezoneMismatchBanner } from "@/components/TimezoneMismatchBanner";
import { useAbsenceRequests } from "@/hooks/useAbsenceRequests";

export const WelcomeDashboard = () => {
  const { displayName } = useUserProfile();
  const navigate = useNavigate();
  const { absenceRequests } = useAbsenceRequests();
  const pendingAbsences = absenceRequests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Main content - Centered and responsive */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <TimezoneMismatchBanner />

        {/* Welcome header - Clean and minimal */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground mb-3 sm:mb-4">
              Hola {displayName || 'Usuario'},
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl lg:text-2xl font-light">
              Planifica, supervisa y publica Turnos
            </p>
          </div>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {/* Card 1 */}
          <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-2 text-sm sm:text-base leading-snug">
              Consulta tus Turnos, gestiona horarios y jornadas laborales
            </h3>
            <Button 
              variant="link" 
              className="text-primary text-xs sm:text-sm p-0 h-auto hover:text-primary/80 font-medium"
              onClick={() => navigate("/turnosmart")}
            >
              Ver turnos
            </Button>
          </Card>

          {/* Card 2 */}
          <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/20 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2 text-sm sm:text-base leading-snug">
              Gestiona los perfiles de tus colaboradores
            </h3>
            <Button 
              variant="link" 
              className="text-primary text-xs sm:text-sm p-0 h-auto hover:text-primary/80 font-medium"
              onClick={() => navigate("/colaboradores")}
            >
              Ver colaboradores
            </Button>
          </Card>

          {/* Card 3 */}
          <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-border bg-card/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/20 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center relative">
              <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-accent-foreground" />
              {pendingAbsences > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  {pendingAbsences}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-foreground mb-2 text-sm sm:text-base leading-snug">
              Consulta y aprueba las solicitudes de ausencia
            </h3>
            {pendingAbsences > 0 && (
              <p className="text-xs text-destructive font-medium mb-1">
                {pendingAbsences} solicitud{pendingAbsences !== 1 ? "es" : ""} pendiente{pendingAbsences !== 1 ? "s" : ""}
              </p>
            )}
            <Button
              variant="link"
              className="text-primary text-xs sm:text-sm p-0 h-auto hover:text-primary/80 font-medium"
              onClick={() => navigate("/ausencias/request/new")}
            >
              Ver ausencias
            </Button>
          </Card>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Help section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2 text-base sm:text-lg">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              ¿Necesitas ayuda?
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Nuestros artículos de ayuda te orientan y responden tus dudas sobre el 
              uso de la herramienta, para que puedas empezar fácilmente y con 
              confianza.
            </p>
            <Button 
              variant="link" 
              className="text-primary text-sm sm:text-base p-0 h-auto hover:text-primary/80 font-medium"
              onClick={() => navigate("/ayuda")}
            >
              Consultar la guía en línea
            </Button>
          </div>

          {/* Configuration section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2 text-base sm:text-lg">
              <Settings className="w-5 h-5 text-muted-foreground" />
              Configuración de la cuenta
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Ajusta la configuración de tu empresa en pocos clicks: gestiona 
              contadores de ausencias, equipos, convenios colectivos...
            </p>
            <Button 
              variant="link" 
              className="text-primary text-sm sm:text-base p-0 h-auto hover:text-primary/80 font-medium"
              onClick={() => navigate("/configuracion")}
            >
              Ir a la configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};