import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, Play } from "lucide-react";

interface UserGuidanceCardProps {
  onNavigate: (section: string) => void;
}

export const UserGuidanceCard = ({ onNavigate }: UserGuidanceCardProps) => {
  const quickSteps = [
    {
      step: "1",
      title: "Configura tu equipo",
      description: "Añade los empleados de tu departamento",
      action: () => onNavigate("configuration"),
      icon: "👥"
    },
    {
      step: "2", 
      title: "Crea tu primer horario",
      description: "Usa el asistente automático",
      action: () => onNavigate("go-turno-smart"),
      icon: "📅"
    },
    {
      step: "3",
      title: "Revisa y publica",
      description: "Comprueba que todo es correcto",
      action: () => onNavigate("repo"),
      icon: "✅"
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Guía de inicio rápido</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ¿Primera vez usando TurnoSmart? Te guiamos paso a paso:
        </p>
        
        <div className="space-y-3">
          {quickSteps.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors cursor-pointer"
              onClick={item.action}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Paso {item.step}
                    </span>
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={() => onNavigate("go-turno-smart")}
          >
            <Play className="h-4 w-4 mr-2" />
            Empezar ahora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};