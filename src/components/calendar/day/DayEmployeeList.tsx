import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeCompensatoryBalance } from "@/components/EmployeeCompensatoryBalance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { X, Info } from "lucide-react";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  avatar_url?: string;
  email?: string;
  tiempo_trabajo_semanal?: number;
}

interface DayEmployeeListProps {
  employees: Employee[];
  searchTerm: string;
  shifts?: any[];
  canEdit?: boolean;
  isEmployee?: boolean;
  onRemoveEmployee?: (employeeId: string, employeeName: string) => void;
}

export function DayEmployeeList({ 
  employees, 
  searchTerm, 
  shifts = [],
  canEdit = true,
  isEmployee = false,
  onRemoveEmployee
}: DayEmployeeListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.nombre.toLowerCase().includes(term) ||
      emp.apellidos.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  const getInitials = (nombre: string, apellidos: string) => {
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  // Calcular horas reales del empleado en el día seleccionado
  const getDailyRealHours = (employeeId: string) => {
    const employeeShifts = shifts.filter(s => s.employee_id === employeeId);
    let totalMinutes = 0;
    
    employeeShifts.forEach(shift => {
      if (shift.start_time && shift.end_time && shift.shift_name !== "Descanso Semanal") {
        const [startH, startM] = shift.start_time.split(':').map(Number);
        const [endH, endM] = shift.end_time.split(':').map(Number);
        
        let minutes = (endH * 60 + endM) - (startH * 60 + startM);
        if (minutes < 0) minutes += 24 * 60; // Overnight shift
        
        // Restar descanso si existe
        if (shift.break_duration) {
          const [breakH, breakM] = shift.break_duration.split(':').map(Number);
          minutes -= (breakH * 60 + breakM);
        }
        
        totalMinutes += minutes;
      }
    });
    
    return Math.floor(totalMinutes / 60);
  };

  // Calcular horas de ausencias
  const getDailyAbsenceHours = (employeeId: string) => {
    const employeeShifts = shifts.filter(s => 
      s.employee_id === employeeId && 
      s.shift_name === "Descanso Semanal"
    );
    return employeeShifts.length > 0 ? 8 : 0;
  };

  return (
    <div className="divide-y divide-border">
      {filteredEmployees.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No se encontraron empleados
        </div>
      ) : (
        filteredEmployees.map((employee) => {
          // Obtener horas de contrato semanales del empleado y calcular horas diarias
          const weeklyHours = employee.tiempo_trabajo_semanal || 40;
          const contractHours = Math.round(weeklyHours / 5); // Horas diarias (asumiendo 5 días)
          const realHours = getDailyRealHours(employee.id);
          const absenceHours = getDailyAbsenceHours(employee.id);
          const difference = realHours - contractHours;
          const isPositive = difference > 0;
          const isExceeded = isPositive;
          
          return (
            <div
              key={employee.id}
              className={`py-0.5 px-1 border-r relative group h-[68px] flex items-center ${isExceeded ? "bg-red-50" : ""}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="space-y-0 flex-1">
                  {/* Nombre del empleado */}
                  <div className="flex items-center gap-1">
                    <div 
                      className={`text-[9px] sm:text-[10px] md:text-[11px] font-medium text-gray-900 truncate transition-colors ${
                        canEdit ? 'cursor-pointer hover:text-blue-600' : ''
                      }`}
                      onClick={() => {
                        if (canEdit || (employee.email === user?.email)) {
                          navigate(`/equipo/${employee.id}`);
                        }
                      }}
                      title={canEdit ? "Ver perfil del colaborador" : ""}
                    >
                      {employee.nombre} {employee.apellidos}
                    </div>
                    {isExceeded && (
                      <div 
                        className="h-3 w-3 text-red-500 cursor-help flex-shrink-0 relative group"
                        title={`Se han detectado posibles irregularidades en el cumplimiento de la normativa laboral. Revisa las horas planificadas de este colaborador (${realHours}h/${contractHours}h)`}
                      >
                        <Info className="h-3 w-3" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-red-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                          ⚠️ Exceso de horas: {realHours}h/{contractHours}h
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Línea de horas: planificadas | reales | ausencias | diferencia */}
                  <div className="text-[8px] sm:text-[9px] text-gray-600 whitespace-nowrap flex gap-1">
                    <span 
                      className="cursor-help"
                      title="Horas contratos"
                    >
                      {weeklyHours}h
                    </span>
                    <span>|</span>
                    <span 
                      className="cursor-help"
                      title="Horas reales este día"
                    >
                      {realHours}h 0'
                    </span>
                    <span>|</span>
                    <span 
                      className="cursor-help"
                      title="Ausencias realizadas"
                    >
                      {absenceHours}h
                    </span>
                    <span>|</span>
                    <span 
                      className="cursor-help"
                      title="Diferencia"
                    >
                      <span className={isPositive ? "text-red-500" : ""}>
                        {difference >= 0 ? '+' : ''}{difference}h
                      </span>
                    </span>
                  </div>
                  
                  {/* Compensar Xh - clickable */}
                  <div 
                    className={`text-[8px] text-blue-600 transition-colors ${
                      canEdit || employee.email === user?.email
                        ? 'cursor-pointer hover:text-blue-800'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      if (isEmployee && employee.email !== user?.email) {
                        toast({
                          title: "Acceso restringido",
                          description: "Solo puedes acceder a tu propia información",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      navigate(`/equipo/${employee.id}/absences`);
                    }}
                    title={canEdit || employee.email === user?.email 
                      ? "Ver compensación de horas extras" 
                      : "Solo puedes ver tu propia información"}
                  >
                    <EmployeeCompensatoryBalance 
                      colaboradorId={employee.id}
                      className="cursor-pointer text-[8px]"
                    />
                  </div>
                </div>
                
                {/* Controles del empleado - checkbox y botón eliminar */}
                {canEdit && onRemoveEmployee && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveEmployee(employee.id, `${employee.nombre} ${employee.apellidos}`);
                      }}
                      className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 hover:text-red-700 transition-colors"
                      title={`Eliminar ${employee.nombre} ${employee.apellidos} del calendario`}
                    >
                      <X className="w-full h-full" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
