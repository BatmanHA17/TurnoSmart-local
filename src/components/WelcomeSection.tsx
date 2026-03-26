import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserGuidanceCard } from "@/components/UserGuidanceCard";

interface WelcomeSectionProps {
  userName?: string | null;
  onNavigate: (section: string) => void;
}

export const WelcomeSection = ({ userName, onNavigate }: WelcomeSectionProps) => {
  const features = [
    {
      icon: Calendar,
      title: "🚀 Crear Horarios",
      description: "Diseña horarios de trabajo automáticamente respetando días libres y vacaciones",
      action: "go-turno-smart",
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "📋 Gestionar Empleados",
      description: "Organiza tu equipo, contratos de trabajo y asigna turnos fácilmente",
      action: "repo", 
      color: "text-emerald-600"
    },
    {
      icon: TrendingUp,
      title: "📊 Calcular Presupuestos",
      description: "Calcula cuántos empleados necesitas según la ocupación de tu hotel",
      action: "planning",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "⚖️ Evitar Problemas Legales",
      description: "Recibe avisos cuando un horario no cumple con la ley laboral española",
      action: "compliance",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Hola {userName ? userName.split(' ')[0] : 'Usuario'} 👋
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Bienvenido a <span className="font-semibold text-primary">TurnoSmart</span>, 
          el programa que hace los horarios de trabajo de tu hotel automáticamente y sin errores legales
        </p>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20"
              onClick={() => onNavigate(feature.action)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-background border border-border/50 group-hover:border-primary/20 transition-colors ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-foreground mb-1">
                  ¿Listo para crear tu primer horario?
                </h3>
                <p className="text-sm text-muted-foreground">
                  En solo 3 pasos tendrás el horario de trabajo de tu departamento listo para imprimir
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="default" 
                  onClick={() => onNavigate("go-turno-smart")}
                  className="whitespace-nowrap"
                >
                  🚀 Crear mi Primer Horario
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate("planning")}
                  className="whitespace-nowrap"
                >
                  📊 Ver Calculadora
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <UserGuidanceCard onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};