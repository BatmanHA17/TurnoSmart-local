import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoTurnoStep1DateSelection } from "./GoTurnoStep1DateSelection";
import { GoTurnoStep2EmployeeSelection } from "./GoTurnoStep2EmployeeSelection";
import { GoTurnoStep3ShiftAssignment } from "./GoTurnoStep3ShiftAssignment";
import { GoTurnoStep3Mobile } from "./GoTurnoStep3Mobile";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Employee } from "@/types/database";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const GoTurnoSmartManual = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [isStep3Valid, setIsStep3Valid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const step3Ref = useRef<any>(null);
  const isMobile = useIsMobile();

  const steps = [
    {
      number: 1,
      title: "Selección de Fechas",
      description: "Definir el período del turno público",
      icon: Calendar,
      completed: dateRange !== null
    },
    {
      number: 2,
      title: "Selección de Personal",
      description: "Elegir empleados para el turno",
      icon: Users,
      completed: selectedEmployees.length > 0
    },
    {
      number: 3,
      title: "Asignación de Turnos",
      description: "Configurar horarios específicos",
      icon: Clock,
      completed: false
    }
  ];

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return dateRange !== null;
      case 2:
        return selectedEmployees.length > 0;
      case 3:
        return isStep3Valid;
      default:
        return false;
    }
  };

  const handleFinalizeTurno = async () => {
    if (!isStep3Valid || !dateRange) return;
    
    setIsProcessing(true);
    try {
      // Obtener las asignaciones del Step 3
      const assignments = step3Ref.current?.getAssignments() || [];
      
      // Preparar los datos en el formato correcto para la visualización
      const shiftData = {
        employees: selectedEmployees.map(employee => {
          const employeeAssignments = assignments.filter((a: any) => a.employeeId === employee.id);
          const schedule: any = {};
          
          employeeAssignments.forEach((assignment: any, index: number) => {
            // Usar el índice directo para el día en lugar de getDay()
            schedule[index] = {
              statusCode: assignment.statusCode,
              startTime: assignment.startTime,
              date: assignment.date,
              dayOfWeek: new Date(assignment.date).getDay()
            };
          });
          
          return {
            id: employee.id,
            name: employee.name,
            category: employee.category,
            schedule: schedule
          };
        }),
        dateRange: dateRange,
        assignments: assignments
      };
      
      // Guardar horario público como draft en la base de datos
      const { data, error } = await supabase
        .from('turnos_publicos')
        .insert({
          date_range_start: dateRange.startDate.toISOString().split('T')[0],
          date_range_end: dateRange.endDate.toISOString().split('T')[0],
          employee_count: selectedEmployees.length,
          shift_data: shiftData,
          status: 'draft'
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✓ Horario Guardado",
        description: `Draft guardado con ${selectedEmployees.length} empleados`,
        duration: 2000,
      });
      
      // Navegar automáticamente a la sección Turno Público - múltiples métodos para asegurar navegación
      const navigateToTurnoPublico = () => {
        // Método 1: Hash navigation
        window.location.hash = '#turno-publico';
        
        // Método 2: Scroll to element if exists
        const turnoPublicoElement = document.getElementById('turno-publico') || 
                                   document.querySelector('[data-section="turno-publico"]');
        if (turnoPublicoElement) {
          turnoPublicoElement.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Método 3: Trigger hash change event manually
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        
        // Método 4: Update URL without hash and then with hash to force trigger
        const currentPath = window.location.pathname + window.location.search;
        window.history.pushState(null, '', currentPath);
        setTimeout(() => {
          window.location.hash = '#turno-publico';
        }, 100);
      };
      
      // Ejecutar navegación inmediatamente y también con delay
      navigateToTurnoPublico();
      setTimeout(navigateToTurnoPublico, 300);
      
      // Resetear el formulario después de navegar
      setTimeout(() => {
        setCurrentStep(1);
        setDateRange(null);
        setSelectedEmployees([]);
        setIsStep3Valid(false);
        setIsProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error al guardar horario:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al guardar el turno público. Inténtalo de nuevo.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            Creación Manual de Turno Público
          </CardTitle>
          <CardDescription className="text-sm">
            Sigue estos 3 pasos para crear un nuevo turno público desde cero
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps - Mobile optimized */}
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between mb-6 md:mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center md:flex-col md:items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-colors flex-shrink-0
                    ${currentStep === step.number 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : step.completed 
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-background border-muted-foreground text-muted-foreground'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <step.icon className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </div>
                  <div className="ml-3 md:ml-0 md:text-center md:mt-2">
                    <p className={`text-sm font-medium ${
                      currentStep === step.number ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block">
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="space-y-4 md:space-y-6">
            {currentStep === 1 && (
              <GoTurnoStep1DateSelection 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            )}

            {currentStep === 2 && (
              <GoTurnoStep2EmployeeSelection 
                selectedEmployees={selectedEmployees}
                onSelectedEmployeesChange={setSelectedEmployees}
              />
            )}

            {currentStep === 3 && dateRange && (
              isMobile ? (
                <GoTurnoStep3Mobile 
                  ref={step3Ref}
                  dateRange={dateRange}
                  selectedEmployees={selectedEmployees}
                  onValidationChange={setIsStep3Valid}
                />
              ) : (
                <GoTurnoStep3ShiftAssignment 
                  ref={step3Ref}
                  dateRange={dateRange}
                  selectedEmployees={selectedEmployees}
                  onValidationChange={setIsStep3Valid}
                />
              )
            )}
          </div>

          {/* Navigation Buttons - Circular Notion Style */}
          <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 border-t border-border/60">
            {/* Previous Button - Circular */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className={cn(
                "h-8 w-8 rounded-full border border-border bg-background hover:bg-muted",
                "transition-all duration-200 shadow-sm hover:shadow-md",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                currentStep === 1 && "invisible"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Progress Indicator - Compact */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all duration-300",
                    step === currentStep 
                      ? "bg-primary w-4" 
                      : step < currentStep 
                        ? "bg-primary/60" 
                        : "bg-border"
                  )}
                />
              ))}
            </div>

            {/* Next/Finish Button - Circular */}
            {currentStep < 3 ? (
              <Button
                size="icon"
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
                className={cn(
                  "h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground",
                  "transition-all duration-200 shadow-sm hover:shadow-md",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                size="icon"
                disabled={!isStep3Valid || isProcessing}
                onClick={handleFinalizeTurno}
                className={cn(
                  "h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white",
                  "transition-all duration-200 shadow-sm hover:shadow-md",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};