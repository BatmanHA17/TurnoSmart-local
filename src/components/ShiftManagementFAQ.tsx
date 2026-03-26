import { useState } from "react";
import { ArrowLeft, HelpCircle, Download, Save, Clock, Users, Smartphone, Eye, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ShiftManagementFAQProps {
  onBack?: () => void;
}

export const ShiftManagementFAQ = ({ onBack }: ShiftManagementFAQProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const faqs = [
    {
      id: "export-shifts",
      question: "¿Cómo exportar los turnos en formato imprimible?",
      icon: Download,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para exportar los turnos en un formato imprimible, sigue estos pasos:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <p className="text-sm">Navega a la pestaña <strong>Turnos</strong> en tu barra lateral</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <p className="text-sm">Elige la vista que deseas exportar (semanal, mensual o 4 semanas)</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <p className="text-sm">Haz clic en el ícono de tres puntos ubicado en la esquina superior derecha</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <p className="text-sm">Selecciona <strong>Exportar calendario</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">5</Badge>
              <p className="text-sm">Decide el filtro que quieres aplicar para exportar</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">6</Badge>
              <p className="text-sm">Si deseas excluir turnos de borrador, marca la opción relacionada</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">7</Badge>
              <p className="text-sm">Haz clic en <strong>Enviar</strong></p>
            </div>
          </div>
          
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Después de estos pasos, recibirás un correo electrónico con el archivo. 
              Una vez generado, podrás encontrarlo en la sección <strong>Mis documentos</strong> de tu cuenta.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: "saved-vs-custom",
      question: "¿Cuáles son las diferencias entre horarios guardados y turnos personalizados?",
      icon: Save,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los horarios guardados y los turnos personalizados son dos métodos proporcionados 
            por TurnoSmart.app para crear nuevos turnos.
          </p>
          
          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Save className="h-4 w-4 text-green-600" />
                Horarios Guardados
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Permiten guardar horarios utilizados con frecuencia con franjas horarias designadas</li>
                <li>• Eliminan la necesidad de ingresar manualmente las horas cada vez</li>
                <li>• La etiqueta de color asignada corresponde al color de visualización</li>
                <li>• Brindan reconocimiento inmediato de las franjas horarias asignadas</li>
                <li>• Se pueden seleccionar fácilmente al crear nuevos turnos</li>
                <li>• Ahorran tiempo y esfuerzo en el proceso de programación</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                Turnos Personalizados
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Brindan flexibilidad para crear turnos únicos</li>
                <li>• Particularmente útiles para turnos que no tienen el mismo patrón cada vez</li>
                <li>• Ideales para administrar horas extras</li>
                <li>• Permiten configuraciones específicas para situaciones especiales</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "shifts-breaks",
      question: "¿Cómo gestionar turnos y descansos?",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A la hora de gestionar turnos y descansos, es importante considerar la programación 
            y duración correcta de los descansos.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-red-600">Descanso No Remunerado</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Ejemplo:</strong> Turno de 8 horas con descanso no remunerado de 30 minutos
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Deberás crear <strong>dos turnos</strong> para reflejar el descanso y ajustar las horas estimadas:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Primer turno:</strong> 10:00 a.m. a 2:00 p.m.</li>
                <li>• <strong>Segundo turno:</strong> 2:30 p.m. a 8:30 p.m.</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-green-600">Descanso Remunerado</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Ejemplo:</strong> Turno de 8 horas con descanso pagado de 30 minutos
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Actualmente no hay forma de reflejar directamente el descanso. En este caso:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Configura el turno para las <strong>8 horas completas</strong> (ej: 10:00 a.m. a 8:00 p.m.)</li>
                <li>• Indica el descanso de 30 minutos al empleado en los <strong>comentarios</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "team-workplace-shifts",
      question: "¿Es posible ver los turnos de mi equipo o lugar de trabajo?",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sí, es posible ver los turnos de tu equipo o lugar de trabajo. En la sección 
            <strong> Permisos</strong>, tienes la flexibilidad de personalizar los permisos 
            de gestión de turnos según tus preferencias.
          </p>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Configuración de Permisos</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Puedes hacer esto posible usando un grupo de permisos con:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span>Permisos <strong>"Ver turnos publicados"</strong> configurados para <strong>"Toda la empresa"</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span>Visibilidad configurada en <strong>"Su propio equipo"</strong> o <strong>"Su propio lugar de trabajo"</strong></span>
              </li>
            </ul>
          </div>
          
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Esta configuración permite que los managers y supervisores puedan visualizar 
              y gestionar los turnos de sus equipos mientras mantienen la privacidad de otros departamentos.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: "mobile-app-shifts",
      question: "¿Es posible que un empleado vea vistas de turnos en la aplicación móvil?",
      icon: Smartphone,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Los empleados que tengan turnos como herramienta de planificación o permisos 
            para agregar turnos podrán ver sus horarios de turnos dentro de la aplicación móvil.
          </p>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Requisitos para la Vista Móvil</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Tener <strong>turnos como herramienta de planificación</strong> asignada</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span>Contar con <strong>permisos para agregar turnos</strong></span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Funcionalidades Disponibles en Móvil</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ver horarios de turnos personales</li>
              <li>• Consultar turnos asignados por fecha</li>
              <li>• Acceder a detalles de turnos (ubicación, horarios, comentarios)</li>
              <li>• Solicitar cambios de turno (si está habilitado)</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Preguntas Frecuentes sobre Gestión de Turnos</h2>
          <p className="text-muted-foreground">
            Consulta las preguntas más comunes y sus respuestas sobre la gestión de turnos
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Centro de Ayuda
            </CardTitle>
            <CardDescription>
              Encuentra respuestas rápidas a las preguntas más frecuentes sobre la gestión de turnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta sección contiene las preguntas más comunes que recibimos sobre la gestión de turnos. 
              Si no encuentras la respuesta que buscas, puedes contactar con nuestro equipo de soporte.
            </p>
          </CardContent>
        </Card>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const IconComponent = faq.icon;
            const isOpen = openSections[faq.id];
            
            return (
              <Card key={faq.id}>
                <Collapsible 
                  open={isOpen} 
                  onOpenChange={() => toggleSection(faq.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-left text-base">
                            {faq.question}
                          </CardTitle>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      {faq.content}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>

        {/* Contacto adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-600" />
              ¿Necesitas más ayuda?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si no has encontrado la respuesta que buscabas en estas preguntas frecuentes, 
              tenemos otros recursos disponibles para ayudarte.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Centro de Ayuda</h4>
                <p className="text-xs text-muted-foreground">Accede a guías detalladas y tutoriales</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Soporte Técnico</h4>
                <p className="text-xs text-muted-foreground">Contacta directamente con nuestro equipo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};