import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, Calendar, Clock, Users, Shield, AlertTriangle, 
  CheckCircle, ArrowRight, Zap, Target, RotateCcw, Moon, CalendarMinus, FileBarChart, 
  PlayCircle, ChevronRight, Star, Trophy, Sparkles
} from "lucide-react";
import { AutoRestDaysConfig } from "./AutoRestDaysConfig";
import { ShiftManagementConfig } from "./ShiftManagementConfig";
import { ShiftEditDeleteConfig } from "./ShiftEditDeleteConfig";
import { TimePlanningToolsConfig } from "./TimePlanningToolsConfig";
import { RotatingShiftsConfig } from "./RotatingShiftsConfig";
import { NightShiftConfig } from "./NightShiftConfig";
import { ShiftCoverageConfig } from "./ShiftCoverageConfig";
import { AbsenceManagementConfig } from "./AbsenceManagementConfig";
import { AbsenceTypesConfig } from "./AbsenceTypesConfig";
import { AutomaticShiftPlanningConfig } from "./AutomaticShiftPlanningConfig";
import { ShiftViewConfig } from "./ShiftViewConfig";
import { ShiftCreationAssignmentConfig } from "./ShiftCreationAssignmentConfig";
import { ShiftManagementToolConfig } from "./ShiftManagementToolConfig";
import { ScheduleExportConfig } from "./ScheduleExportConfig";
import { SavedShiftsConfig } from "./SavedShiftsConfig";
import { RestDaysConfig } from "./RestDaysConfig";
import { ShiftSwapRequestConfig } from "./ShiftSwapRequestConfig";
import { AnnualBalanceReportConfig } from "./AnnualBalanceReportConfig";
import { HoursBankConfig } from "./HoursBankConfig";
import { WorkHoursConfig } from "./WorkHoursConfig";
import { OvertimeRulesConfig } from "./OvertimeRulesConfig";
import { LaborPoliciesConfig } from "./LaborPoliciesConfig";
import { ShiftTemplatesConfig } from "./ShiftTemplatesConfig";
import { EmployeeAssignmentConfig } from "./EmployeeAssignmentConfig";
import { useConfigurationState } from "@/hooks/useConfigurationState";
import { ConfigurationHeader } from "./ConfigurationHeader";

type ConfigStatus = "configured" | "pending" | "required";

interface ConfigItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: ConfigStatus;
  priority: "high" | "medium" | "low";
  order: number;
}

const getStatusColor = (status: ConfigStatus) => {
  switch (status) {
    case "configured":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "required":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getStatusText = (status: ConfigStatus) => {
  switch (status) {
    case "configured":
      return "Completado";
    case "pending":
      return "Pendiente";
    case "required":
      return "Requerido";
    default:
      return "Sin estado";
  }
};

const getPriorityIcon = (priority: "high" | "medium" | "low") => {
  switch (priority) {
    case "high":
      return <Star className="h-3 w-3 text-red-500" />;
    case "medium":
      return <Sparkles className="h-3 w-3 text-amber-500" />;
    case "low":
      return <Target className="h-3 w-3 text-blue-500" />;
  }
};

export function ConfigurationHub() {
  const { isConfigured, configurations } = useConfigurationState();
  
  // Función para obtener el estado dinámicamente
  const getItemStatus = (id: string): ConfigStatus => {
    return isConfigured(id) ? "configured" : "pending";
  };

  // Configuraciones organizadas por prioridad y orden
  const allConfigItems: ConfigItem[] = [
    // Configuraciones esenciales (orden 1-5)
    {
      id: "work-hours",
      title: "Horas de Trabajo",
      description: "Defina límites de horas semanales y regulaciones laborales",
      icon: Target,
      status: isConfigured("work-hours") ? "configured" : "required",
      priority: "high",
      order: 1
    },
    {
      id: "overtime-rules",
      title: "Normativas de Horas Extra",
      description: "Configure reglas para gestión y cálculo de horas extraordinarias",
      icon: Zap,
      status: getItemStatus("overtime-rules"),
      priority: "high",
      order: 2
    },
    {
      id: "labor-policies",
      title: "Políticas Laborales",
      description: "Configure políticas laborales y normativas del convenio de hostelería",
      icon: Shield,
      status: getItemStatus("labor-policies"),
      priority: "high",
      order: 3
    },
    {
      id: "auto-rest-days",
      title: "Días de Descanso Automáticos",
      description: "Configure políticas automáticas para asignar días libres según normativa española",
      icon: Calendar,
      status: getItemStatus("auto-rest-days"),
      priority: "high",
      order: 4
    },
    {
      id: "night-shifts",
      title: "Turnos Nocturnos", 
      description: "Configure el registro de horas para turnos que cruzan la medianoche",
      icon: Moon,
      status: isConfigured("night-shifts") ? "configured" : "required",
      priority: "high",
      order: 5
    },
    {
      id: "shift-coverage",
      title: "Cobertura de Turnos",
      description: "Optimice horarios y asegure cobertura completa con patrones reutilizables",
      icon: Shield,
      status: isConfigured("shift-coverage") ? "configured" : "required",
      priority: "high",
      order: 6
    },
    
    // Configuraciones importantes (orden 6-10)
    {
      id: "shift-management",
      title: "Gestión de Horarios",
      description: "Configure herramientas para optimizar la programación y asignación de turnos",
      icon: Clock,
      status: getItemStatus("shift-management"),
      priority: "medium",
      order: 7
    },
    {
      id: "time-planning-tools",
      title: "Herramientas de Planificación",
      description: "Configure herramientas para gestionar métodos de control horario de empleados",
      icon: Calendar,
      status: isConfigured("time-planning-tools") ? "configured" : "required",
      priority: "medium",
      order: 7
    },
    {
      id: "absence-management",
      title: "Gestión de Ausencias",
      description: "Gestione ausencias directamente desde la aplicación de turnos",
      icon: CalendarMinus,
      status: isConfigured("absence-management") ? "configured" : "required",
      priority: "medium",
      order: 8
    },
    {
      id: "absence-types",
      title: "Configuración de Tipos de Ausencias",
      description: "Configure tipos de ausencias personalizados y sus reglas específicas",
      icon: CalendarMinus,
      status: getItemStatus("absence-types"),
      priority: "medium",
      order: 9
    },
    {
      id: "shift-templates",
      title: "Plantillas de Turnos",
      description: "Cree y gestione plantillas reutilizables para diferentes tipos de turnos",
      icon: Settings,
      status: getItemStatus("shift-templates"),
      priority: "medium",
      order: 10
    },
    {
      id: "employee-assignment",
      title: "Asignación de Empleados",
      description: "Configure reglas para asignar empleados a turnos automáticamente",
      icon: Users,
      status: getItemStatus("employee-assignment"),
      priority: "medium",
      order: 11
    },

    // Configuraciones adicionales (orden 12+)
    {
      id: "rotating-shifts",
      title: "Turnos Rotativos",
      description: "Configure patrones de turnos que se repiten en bucles continuos",
      icon: RotateCcw,
      status: getItemStatus("rotating-shifts"),
      priority: "low",
      order: 12
    },
    {
      id: "automatic-shift-planning",
      title: "Planificación Automática",
      description: "Genere horarios optimizados automáticamente con IA avanzada",
      icon: Zap,
      status: getItemStatus("automatic-shift-planning"),
      priority: "low",
      order: 13
    },
    {
      id: "shift-views",
      title: "Vistas de Gestión",
      description: "Configure diferentes formas de visualizar y organizar turnos",
      icon: Settings,
      status: getItemStatus("shift-views"),
      priority: "low",
      order: 14
    },
    {
      id: "shift-creation-assignment",
      title: "Creación y Asignación",
      description: "Optimice la creación y asignación eficiente de turnos",
      icon: Users,
      status: getItemStatus("shift-creation-assignment"),
      priority: "low",
      order: 15
    },
    {
      id: "shift-management-tool",
      title: "Herramienta de Gestión",
      description: "Configure la herramienta principal de gestión de horarios",
      icon: Calendar,
      status: getItemStatus("shift-management-tool"),
      priority: "low",
      order: 16
    },
    {
      id: "schedule-export",
      title: "Exportación de Horarios",
      description: "Configure la exportación e impresión de horarios planificados",
      icon: Settings,
      status: getItemStatus("schedule-export"),
      priority: "low",
      order: 17
    },
    {
      id: "saved-shifts",
      title: "Horarios Guardados",
      description: "Cree y gestione plantillas reutilizables de turnos frecuentes",
      icon: Calendar,
      status: getItemStatus("saved-shifts"),
      priority: "low",
      order: 18
    },
    {
      id: "rest-days",
      title: "Gestión de Días de Descanso",
      description: "Configure cómo agregar, eliminar y gestionar días de descanso",
      icon: CalendarMinus,
      status: getItemStatus("rest-days"),
      priority: "low",
      order: 19
    },
    {
      id: "shift-swap-request",
      title: "Solicitudes de Cambio de Turno",
      description: "Configure el sistema de intercambio de turnos entre empleados",
      icon: Users,
      status: getItemStatus("shift-swap-request"),
      priority: "low",
      order: 20
    },
    {
      id: "annual-balance-report",
      title: "Informes de Balance Anual",
      description: "Configure y exporte informes de balance de horas anuales",
      icon: FileBarChart,
      status: getItemStatus("annual-balance-report"),
      priority: "low",
      order: 21
    },
    {
      id: "hours-bank",
      title: "Banco de Horas",
      description: "Configure el sistema de banco de horas para optimizar la gestión de horarios",
      icon: Clock,
      status: getItemStatus("hours-bank"),
      priority: "low",
      order: 22
    },
    {
      id: "shift-edit-delete",
      title: "Edición y Eliminación de Turnos",
      description: "Configure opciones para editar y eliminar horarios de manera segura",
      icon: Settings,
      status: getItemStatus("shift-edit-delete"),
      priority: "low",
      order: 23
    }
  ];

  // Ordenar por orden de prioridad
  const sortedItems = allConfigItems.sort((a, b) => a.order - b.order);
  
  // Separar en esenciales y adicionales
  const essentialItems = sortedItems.filter(item => item.order <= 5);
  const importantItems = sortedItems.filter(item => item.order > 5 && item.order <= 12);
  const additionalItems = sortedItems.filter(item => item.order > 12);

  // Calcular progreso
  const configuredCount = sortedItems.filter(item => item.status === "configured").length;
  const totalCount = sortedItems.length;
  const progress = (configuredCount / totalCount) * 100;

  // Obtener siguiente paso recomendado
  const getNextStep = () => {
    return sortedItems.find(item => item.status !== "configured");
  };

  const nextStep = getNextStep();

  const [currentView, setCurrentView] = useState<string | null>(null);
  const nextItemRef = useRef<HTMLDivElement>(null);

  const handleBackToMain = () => {
    setCurrentView(null);
  };

  const handleConfigurationComplete = (configId: string) => {
    console.log(`Configuración completada: ${configId}`);
    setCurrentView(null);
    
    // Pequeño delay para asegurar que el DOM se actualice antes del scroll
    setTimeout(() => {
      scrollToNextItem();
    }, 100);
  };

  const scrollToNextItem = () => {
    const nextStep = getNextStep();
    if (nextStep && nextItemRef.current) {
      nextItemRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Efecto visual de highlight
      nextItemRef.current.classList.add('ring-2', 'ring-primary/50', 'ring-offset-2');
      setTimeout(() => {
        if (nextItemRef.current) {
          nextItemRef.current.classList.remove('ring-2', 'ring-primary/50', 'ring-offset-2');
        }
      }, 2000);
    }
  };

  const renderConfigView = () => {
    switch (currentView) {
      case "auto-rest-days":
        return <AutoRestDaysConfig onBack={() => handleConfigurationComplete("auto-rest-days")} />;
      case "shift-management":
        return <ShiftManagementConfig onBack={() => handleConfigurationComplete("shift-management")} />;
      case "shift-edit-delete":
        return <ShiftEditDeleteConfig onBack={() => handleConfigurationComplete("shift-edit-delete")} />;
      case "shift-templates":
        return <ShiftTemplatesConfig onBack={() => handleConfigurationComplete("shift-templates")} />;
      case "employee-assignment":
        return <EmployeeAssignmentConfig onBack={() => handleConfigurationComplete("employee-assignment")} />;
      case "time-planning-tools":
        return <TimePlanningToolsConfig onBack={() => handleConfigurationComplete("time-planning-tools")} />;
      case "rotating-shifts":
        return <RotatingShiftsConfig onBack={() => handleConfigurationComplete("rotating-shifts")} />;
      case "night-shifts":
        return <NightShiftConfig onBack={() => handleConfigurationComplete("night-shifts")} />;
      case "shift-coverage":
        return <ShiftCoverageConfig onBack={() => handleConfigurationComplete("shift-coverage")} />;
      case "absence-management":
        return <AbsenceManagementConfig onBack={() => handleConfigurationComplete("absence-management")} />;
      case "absence-types":
        return <AbsenceTypesConfig onBack={() => handleConfigurationComplete("absence-types")} />;
      case "automatic-shift-planning":
        return <AutomaticShiftPlanningConfig onBack={() => handleConfigurationComplete("automatic-shift-planning")} />;
      case "shift-views":
        return <ShiftViewConfig onBack={() => handleConfigurationComplete("shift-views")} />;
      case "shift-creation-assignment":
        return <ShiftCreationAssignmentConfig onBack={() => handleConfigurationComplete("shift-creation-assignment")} />;
      case "shift-management-tool":
        return <ShiftManagementToolConfig onBack={() => handleConfigurationComplete("shift-management-tool")} />;
      case "schedule-export":
        return <ScheduleExportConfig onBack={() => handleConfigurationComplete("schedule-export")} />;
      case "saved-shifts":
        return <SavedShiftsConfig onBack={() => handleConfigurationComplete("saved-shifts")} />;
      case "rest-days":
        return <RestDaysConfig onBack={() => handleConfigurationComplete("rest-days")} />;
      case "shift-swap-request":
        return <ShiftSwapRequestConfig onBack={() => handleConfigurationComplete("shift-swap-request")} />;
      case "annual-balance-report":
        return <AnnualBalanceReportConfig onBack={() => handleConfigurationComplete("annual-balance-report")} />;
      case "hours-bank":
        return <HoursBankConfig onBack={() => handleConfigurationComplete("hours-bank")} />;
      case "work-hours":
        return <WorkHoursConfig onBack={() => handleConfigurationComplete("work-hours")} />;
      case "overtime-rules":
        return <OvertimeRulesConfig onBack={() => handleConfigurationComplete("overtime-rules")} />;
      case "labor-policies":
        return <LaborPoliciesConfig onBack={() => handleConfigurationComplete("labor-policies")} />;
      default:
        return null;
    }
  };

  const ConfigCard = ({ item, isRecommended = false }: { item: ConfigItem; isRecommended?: boolean }) => {
    const IconComponent = item.icon;
    const ref = isRecommended ? nextItemRef : undefined;
    
    
    return (
      <Card 
        ref={ref}
        key={item.id} 
        className={`cursor-pointer transition-all duration-300 group hover:shadow-lg hover:-translate-y-1 
          ${isRecommended ? 'ring-1 ring-primary/30 bg-gradient-to-br from-primary/2 to-primary/5 border-primary/20' : 'hover:bg-muted/30'}
          ${item.status === 'configured' ? 'bg-gradient-to-br from-emerald-50/30 to-emerald-100/20 border-emerald-200/40' : ''}
          border transition-colors
        `}
        onClick={() => setCurrentView(item.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors
                ${item.status === 'configured' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-primary/10 group-hover:bg-primary/20'
                }`}>
                {item.status === 'configured' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <IconComponent className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">{item.title}</CardTitle>
                  {getPriorityIcon(item.priority)}
                </div>
                {isRecommended && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-xs text-primary font-medium">Siguiente paso</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(item.status)} text-xs font-medium px-2 py-1`}
              >
                {getStatusText(item.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary/80 group-hover:text-primary transition-colors">
              <span className="font-medium">{item.status === 'configured' ? 'Reconfigurar' : 'Configurar'}</span>
              <ChevronRight className="h-4 w-4 transition-all group-hover:translate-x-1 group-hover:scale-110" />
            </div>
            <span className="text-xs text-muted-foreground/50 font-mono">#{item.order}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (currentView) {
    return (
      <div className="min-h-screen bg-background">
        <ConfigurationHeader
          title="Configuración"
          description="Ajusta las configuraciones específicas de tu sistema"
          onBack={handleBackToMain}
          showBackButton={true}
        />
        <div className="p-6 max-w-6xl mx-auto">
          {renderConfigView()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ConfigurationHeader
        title="Centro de Configuración"
        description="Configure políticas, reglas y directrices para la gestión automatizada de turnos hoteleros"
      />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Hero Progress Card */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Tu Progreso de Configuración
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {configuredCount} de {totalCount} configuraciones completadas
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{Math.round(progress)}%</div>
                <div className="text-sm text-muted-foreground">Completado</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>{sortedItems.filter(i => i.status === "configured").length} Completado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>{sortedItems.filter(i => i.status === "pending").length} Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>{sortedItems.filter(i => i.status === "required").length} Requerido</span>
              </div>
            </div>

            {nextStep && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Siguiente paso recomendado:</p>
                    <p className="text-sm text-muted-foreground">{nextStep.title}</p>
                  </div>
                  <Button 
                    onClick={() => setCurrentView(nextStep.id)}
                    className="gap-2"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Continuar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuraciones Esenciales */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold text-foreground">Configuraciones Esenciales</h2>
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              Alta Prioridad
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {essentialItems.map((item) => (
              <ConfigCard 
                key={item.id} 
                item={item} 
                isRecommended={nextStep?.id === item.id} 
              />
            ))}
          </div>
        </div>

        {/* Configuraciones Importantes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">Configuraciones Importantes</h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              Media Prioridad
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {importantItems.map((item) => (
              <ConfigCard 
                key={item.id} 
                item={item} 
                isRecommended={nextStep?.id === item.id} 
              />
            ))}
          </div>
        </div>

        {/* Configuraciones Adicionales */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground">Configuraciones Adicionales</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              Baja Prioridad
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {additionalItems.map((item) => (
              <ConfigCard 
                key={item.id} 
                item={item} 
                isRecommended={nextStep?.id === item.id} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}