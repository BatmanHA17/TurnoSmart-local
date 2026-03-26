import { Badge } from "@/components/ui/badge";
import { Info, PiggyBank } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmployeeLeftColumnProps {
  employee: {
    id: string;
    nombre: string;
    apellidos: string;
    avatar_url?: string;
    tiempo_trabajo_semanal?: number;
  };
  weeklyStats: {
    contractHours: number;
    realHours: number;
    absenceHours: number;
    difference: number;
  };
  compensatoryHours?: number;
  hasCompliance?: boolean;
  onClick?: () => void;
  onCompensatoryClick?: () => void;
  canEdit?: boolean;
}

export function EmployeeLeftColumn({
  employee,
  weeklyStats,
  compensatoryHours = 0,
  hasCompliance = false,
  onClick,
  onCompensatoryClick,
  canEdit = false
}: EmployeeLeftColumnProps) {
  const fullName = `${employee.nombre} ${employee.apellidos}`;
  
  return (
    <div className="space-y-0.5 flex-1">
      {/* Nombre del empleado */}
      <div className="flex items-center gap-1">
        <div 
          className={`text-[9px] sm:text-[10px] md:text-[11px] font-medium text-gray-900 truncate transition-colors ${
            canEdit ? 'cursor-pointer hover:text-blue-600' : ''
          }`}
          onClick={onClick}
          title={canEdit ? "Ver perfil del colaborador" : ""}
        >
          {fullName}
        </div>
        
        {/* Icono de cumplimiento si hay exceso de horas */}
        {hasCompliance && (
          <div 
            className="h-3 w-3 text-red-500 cursor-help flex-shrink-0 relative group"
            title={`Se han detectado posibles irregularidades en el cumplimiento de la normativa laboral. Revisa las horas planificadas de este colaborador (${weeklyStats.realHours}h/${weeklyStats.contractHours}h)`}
          >
            <Info className="h-3 w-3" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-red-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              ⚠️ Exceso de horas: {weeklyStats.realHours}h/{weeklyStats.contractHours}h
            </div>
          </div>
        )}
      </div>
      
      {/* Línea de horas: planificadas | reales | ausencias | diferencia */}
      <div className="text-[8px] sm:text-[9px] text-gray-600 whitespace-nowrap flex gap-1">
        <span 
          className="cursor-help"
          title="Horas contrato"
        >
          {weeklyStats.contractHours}h
        </span>
        <span>|</span>
        <span 
          className="cursor-help"
          title="Horas reales esta semana"
        >
          {weeklyStats.realHours}h 0'
        </span>
        <span>|</span>
        <span 
          className="cursor-help"
          title="Ausencias realizadas"
        >
          {weeklyStats.absenceHours}h
        </span>
        <span>|</span>
        <span 
          className="cursor-help"
          title="Diferencia"
        >
          <span className={weeklyStats.difference > 0 ? "text-red-500" : ""}>
            {weeklyStats.difference >= 0 ? '+' : ''}{weeklyStats.difference}h
          </span>
        </span>
      </div>
      
      {/* Compensar Xh */}
      <div 
        className={`text-[8px] text-blue-600 transition-colors mt-1 ${
          canEdit ? 'cursor-pointer hover:text-blue-800' : 'cursor-not-allowed opacity-50'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (!canEdit) {
            toast({
              title: "Acceso restringido",
              description: "No tienes permisos para modificar el banco de horas",
              variant: "destructive"
            });
            return;
          }
          onCompensatoryClick?.();
        }}
      >
        Compensar {compensatoryHours}h
      </div>
    </div>
  );
}
