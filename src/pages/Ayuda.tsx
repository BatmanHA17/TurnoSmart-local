import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShiftManagementFAQ } from "@/components/ShiftManagementFAQ";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { 
  HelpCircle, 
  FileText, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock,
  Users,
  Calendar,
  Settings
} from "lucide-react";

export default function Ayuda() {
  useEffect(() => {
    document.title = "Centro de Ayuda – TurnoSmart";
  }, []);

  const helpCategories = [
    {
      title: "Primeros Pasos",
      description: "Aprende lo básico para comenzar con TurnoSmart",
      icon: Users,
      topics: [
        "Configuración inicial del sistema",
        "Creación de empleados y departamentos",
        "Configuración de tipos de contrato",
        "Importación de datos existentes"
      ]
    },
    {
      title: "Gestión de Turnos",
      description: "Todo sobre la planificación y asignación de turnos",
      icon: Calendar,
      topics: [
        "Crear y asignar turnos manuales",
        "Planificación automática",
        "Turnos rotativos y nocturnos",
        "Gestión de cambios y solicitudes"
      ]
    },
    {
      title: "Control Horario",
      description: "Registro de jornada y seguimiento de horas",
      icon: Clock,
      topics: [
        "Fichaje de entrada y salida",
        "Banco de horas",
        "Horas extraordinarias",
        "Reportes de asistencia"
      ]
    },
    {
      title: "Configuración Avanzada",
      description: "Personaliza el sistema según tus necesidades",
      icon: Settings,
      topics: [
        "Políticas laborales",
        "Normativas de descanso",
        "Alertas de cumplimiento",
        "Integraciones y exportación"
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Centro de Ayuda</h1>
              <p className="text-muted-foreground">
                Encuentra respuestas, guías y soporte para aprovechar al máximo TurnoSmart
              </p>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Chat en Vivo</h3>
                  <p className="text-sm text-blue-700">Habla con nuestro equipo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Email</h3>
                  <p className="text-sm text-green-700">soporte@turnosmart.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-medium text-purple-900">Teléfono</h3>
                  <p className="text-sm text-purple-700">+34 900 123 456</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Categories */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Categorías de Ayuda</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {helpCategories.map((category) => (
              <Card key={category.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <category.icon className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.topics.map((topic) => (
                      <div key={topic} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Ver Guías
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              Preguntas Frecuentes
              <Badge variant="secondary" className="ml-auto">Actualizado</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Respuestas a las consultas más comunes sobre gestión de turnos
            </p>
          </CardHeader>
          <CardContent>
            <ShiftManagementFAQ />
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Manual de Usuario</h4>
                  <p className="text-sm text-muted-foreground">Guía completa paso a paso</p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                    Descargar PDF
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Videos Tutorial</h4>
                  <p className="text-sm text-muted-foreground">Aprende viendo ejemplos prácticos</p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                    Ver Playlist
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
