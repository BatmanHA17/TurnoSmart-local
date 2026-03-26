import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Colaborador {
  id: string;
  nombre: string;
  apellidos: string;
  status: string;
}

export interface ApprovedRequest {
  employee: string;
  startDate: Date;
  endDate: Date;
  startPeriod: "mañana" | "tarde";
  endPeriod: "mañana" | "tarde";
}

interface TeamCalendarProps {
  className?: string;
  approvedRequests?: ApprovedRequest[];
}

export const TeamCalendar = ({ className = "", approvedRequests = [] }: TeamCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 1)); // September 2025
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('TeamCalendar received approvedRequests:', approvedRequests);
  
  // Load active colaboradores from database
  useEffect(() => {
    const loadColaboradores = async () => {
      try {
        const { data, error } = await supabase
          .from('colaborador_full')
          .select('id, nombre, apellidos, status')
          .eq('status', 'activo')
          .order('apellidos', { ascending: true })
          .order('nombre', { ascending: true });

        if (error) {
          console.error('Error loading colaboradores:', error);
          setLoading(false);
          return;
        }

        console.log('Loaded colaboradores:', data);
        setColaboradores(data || []);
      } catch (error) {
        console.error('Error loading colaboradores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadColaboradores();
  }, []);

  // Get month and year for display
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate days dynamically based on currentDate
  const getDaysForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and how many days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Day letters in Spanish (S=Sábado, D=Domingo, L=Lunes, M=Martes, MI=Miércoles, J=Jueves, V=Viernes)
    const dayLetters = ['D', 'L', 'M', 'MI', 'J', 'V', 'S']; // Sunday=0, Monday=1, etc.
    
    const days = [];
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dayOfWeek = (firstDayOfWeek - 1 - i + 7) % 7;
      days.push({
        dayLetter: dayLetters[dayOfWeek],
        dayNumber: dayNum,
        isCurrentMonth: false
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      days.push({
        dayLetter: dayLetters[dayOfWeek],
        dayNumber: day,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to complete the grid (up to 35 days total)
    const nextMonthDays = 35 - days.length;
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      const dayOfWeek = date.getDay();
      days.push({
        dayLetter: dayLetters[dayOfWeek],
        dayNumber: day,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = getDaysForMonth();

  // Generate absence data based on approved requests
  const getAbsenceData = (colaboradorName: string, dayIndex: number) => {
    const currentMonthDays = getDaysForMonth();
    const currentDay = currentMonthDays[dayIndex];
    
    if (!currentDay?.isCurrentMonth) return "";
    
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay.dayNumber);
    
    // Debug logging
    console.log(`Checking absence for ${colaboradorName} on day ${currentDay.dayNumber}`, {
      dateToCheck,
      approvedRequestsCount: approvedRequests.length,
      approvedRequests: approvedRequests.map(req => ({
        employee: req.employee,
        startDate: req.startDate,
        endDate: req.endDate
      }))
    });
    
    // Check if this colaborador has an approved absence on this date
    const hasAbsence = approvedRequests.some(request => {
      // More flexible name matching
      const colaboradorNameLower = colaboradorName.toLowerCase();
      const employeeNameLower = request.employee.toLowerCase();
      
      // Check if names contain each other (Spider Man vs Spider SPIDERMAN)
      const matchesEmployee = colaboradorNameLower.includes(employeeNameLower.split(' ')[0]) || 
                             employeeNameLower.includes(colaboradorNameLower.split(' ')[0]) ||
                             colaboradorNameLower.includes('spider') && employeeNameLower.includes('spider') ||
                             colaboradorNameLower.includes('batman') && employeeNameLower.includes('batman') ||
                             colaboradorNameLower.includes('super') && employeeNameLower.includes('super');
      
      console.log(`Name matching for ${colaboradorName} vs ${request.employee}:`, { matchesEmployee });
      
      if (!matchesEmployee) return false;
      
      // Check if current date falls within the absence period
      const isInRange = dateToCheck >= request.startDate && dateToCheck <= request.endDate;
      console.log(`Date range check for ${colaboradorName}:`, { 
        dateToCheck, 
        startDate: request.startDate, 
        endDate: request.endDate, 
        isInRange 
      });
      
      return isInRange;
    });
    
    console.log(`Final absence result for ${colaboradorName} on day ${currentDay.dayNumber}:`, hasAbsence);
    
    return hasAbsence ? "bg-green-100" : ""; // Verde pastel muy sutil para ausencias
  };

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal text-gray-900">CALENDARIO DEL EQUIPO</h2>
        <Select defaultValue="mostrar-calendario">
          <SelectTrigger className="w-[280px] bg-white border border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="mostrar-calendario">Mostrar el calendario del equipo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Month Navigation - Exactly like in the reference image */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 px-3">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
              {currentMonth} de {currentYear}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="text-sm text-gray-700 space-y-1 mb-6">
        <div><span className="font-semibold">0</span> solicitudes de ausencia del equipo pendientes para el periodo</div>
        <div><span className="font-semibold">{
          approvedRequests.length > 0 
            ? new Set(approvedRequests.map(req => req.employee)).size 
            : 0
        }</span> los miembros del equipo tienen al menos una ausencia durante el periodo</div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded-sm"></div>
          <span>Ausencias aprobadas</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando colaboradores...</div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border-r border-gray-200 font-medium text-sm w-32">Empleado</th>
                  {days.map((day, index) => (
                    <th key={index} className="text-center p-1 border-r border-gray-200 last:border-r-0 font-normal text-xs min-w-[24px]">
                      <div className="space-y-0.5">
                        <div>{day.dayLetter}</div>
                        <div className="text-xs text-gray-600">{day.dayNumber}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((colaborador, colaboradorIndex) => {
                  const displayName = `${colaborador.nombre} ${colaborador.apellidos}`;
                  return (
                    <tr key={colaboradorIndex} className="border-b border-gray-100 last:border-b-0">
                      <td className="p-2 border-r border-gray-200 text-sm">
                        <button className="text-blue-600 hover:text-blue-800 underline text-left">
                          {displayName}
                        </button>
                      </td>
                      {days.map((day, dayIndex) => (
                        <td key={dayIndex} className="p-0 border-r border-gray-200 last:border-r-0 h-8 min-w-[24px]">
                          <div className={`h-full w-full ${getAbsenceData(displayName, dayIndex)}`}></div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};