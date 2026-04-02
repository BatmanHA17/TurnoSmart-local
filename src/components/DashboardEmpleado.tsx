import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, User, Settings, HelpCircle, Send } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

/**
 * Dashboard principal para empleados.
 * Diseño moderno tipo Apple con acceso rápido a funcionalidades clave.
 */
export const DashboardEmpleado = () => {
  const { displayName } = useUserProfile();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navegar al perfil del colaborador vinculado al usuario actual
  const navigateToProfile = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile?.email) {
        toast({
          title: "Error",
          description: "No se encontró email en tu perfil",
          variant: "destructive"
        });
        navigate('/colaboradores');
        return;
      }

      const { data: colaborador, error } = await supabase
        .from('colaborador_full')
        .select('id, nombre, apellidos, email')
        .eq('email', profile.email)
        .maybeSingle();

      if (error || !colaborador) {
        toast({
          title: "Perfil no encontrado",
          description: "No se encontró tu perfil de colaborador. Contacta con el administrador.",
          variant: "destructive"
        });
        navigate('/colaboradores');
        return;
      }

      navigate(`/colaboradores/${colaborador.id}/profile`);
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al acceder a tu perfil",
        variant: "destructive"
      });
      navigate('/colaboradores');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-notion-blue-bg/40 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-notion-orange-bg/30 rounded-full blur-[140px] -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Contenido principal */}
      <div className="relative max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-12 sm:mb-16 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-3">
            Hola {displayName || 'Usuario'},
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Sigue tu <span className="font-semibold text-foreground">turnosmart®</span> y tus ausencias
          </p>
        </div>

        {/* Cards principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-20">
          {/* Card 1 - Turnosmart */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate("/turnosmart")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-blue-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-12 h-12 text-notion-blue-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Consulta tu turnosmart®
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Revisa tus horarios y planificación semanal
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-blue-bg hover:text-notion-blue-text transition-all duration-200"
            >
              Ver turnosmart
            </Button>
          </Card>

          {/* Card 2 - Ausencias */}
          <Card 
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate("/ausencias/request/new")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-orange-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-12 h-12 text-notion-orange-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Solicita y consulta tus ausencias
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Gestiona vacaciones, permisos y bajas
            </p>
            <Button 
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-orange-bg hover:text-notion-orange-text transition-all duration-200"
            >
              Solicitar ausencia
            </Button>
          </Card>

          {/* Card 3 - Peticiones */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '300ms' }}
            onClick={() => navigate("/turnosmart/peticiones")}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-purple-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Send className="w-12 h-12 text-notion-purple-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Solicita preferencias de turno
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Pide días, turnos favoritos o intercambios con compañeros
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-purple-bg hover:text-notion-purple-text transition-all duration-200"
            >
              Mis peticiones
            </Button>
          </Card>

          {/* Card 4 - Perfil */}
          <Card
            className="group p-6 sm:p-8 text-center hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer animate-fade-in"
            style={{ animationDelay: '400ms' }}
            onClick={navigateToProfile}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-notion-green-bg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <User className="w-12 h-12 text-notion-green-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3 leading-snug">
              Visualiza tu información personal
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Consulta y actualiza tu perfil
            </p>
            <Button
              variant="ghost"
              className="w-full rounded-full font-medium hover:bg-notion-green-bg hover:text-notion-green-text transition-all duration-200"
            >
              Consultar mi perfil
            </Button>
          </Card>
        </div>

        {/* Sección de ayuda y configuración */}
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
                uso de la herramienta, para que puedas empezar fácilmente y con 
                confianza.
              </p>
              <Button 
                variant="link" 
                className="text-notion-blue-text p-0 h-auto hover:text-notion-blue-text/80 font-medium text-base transition-colors"
                onClick={() => navigate("/ayuda")}
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
                  Mis preferencias
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Personaliza tu experiencia en TurnoSmart configurando tus preferencias 
                y ajustes de cuenta.
              </p>
              <Button 
                variant="link" 
                className="text-notion-blue-text p-0 h-auto hover:text-notion-blue-text/80 font-medium text-base transition-colors"
                onClick={() => navigate("/mis-preferencias")}
              >
                Ir a mis preferencias →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};