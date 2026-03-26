import { Info, X } from "lucide-react";
import { EmployeeCompensatoryBalance } from "@/components/EmployeeCompensatoryBalance";
import { toast } from "@/hooks/use-toast";

interface EmployeeCalendarColumnProps {
  employee: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  weeklyStats: {
    contractHours: number;
    realHours: number;
    absenceHours: number;
    difference: number;
  };
  hasCompliance: boolean;
  hasAbsence?: boolean;
  absenceDays?: number;
  canEdit: boolean;
  isCurrentUser: boolean;
  onNavigateToProfile: () => void;
  onNavigateToAbsences: () => void;
  onRemove?: () => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function EmployeeCalendarColumn({
  employee,
  weeklyStats,
  hasCompliance,
  hasAbsence = false,
  absenceDays = 0,
  canEdit,
  isCurrentUser,
  onNavigateToProfile,
  onNavigateToAbsences,
  onRemove,
  selected = false,
  onSelect,
}: EmployeeCalendarColumnProps) {
  return (
    <div className="flex items-center justify-between h-full group">
      <div className="space-y-0 flex-1">
        {/* Nombre y badges */}
        <div className="flex items-center gap-1">
          <div 
            className={`text-[10px] font-medium text-gray-900 truncate transition-colors ${
              canEdit || isCurrentUser ? 'cursor-pointer hover:text-blue-600' : ''
            }`}
            onClick={() => {
              if (canEdit || isCurrentUser) {
                onNavigateToProfile();
              }
            }}
            title={canEdit || isCurrentUser ? "Ver perfil del colaborador" : ""}
          >
            {employee.name}
          </div>
          
          {/* Badge de vacaciones */}
          {hasAbsence && (
            <div className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
              Vacaciones ({absenceDays} días)
            </div>
          )}
          
          {/* Icono de compliance */}
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
        <div className="text-[8px] text-gray-600 whitespace-nowrap flex gap-1">
          <span className="cursor-help" title="Horas contrato">
            {weeklyStats.contractHours}h
          </span>
          <span>|</span>
          <span className="cursor-help" title="Horas reales">
            {weeklyStats.realHours}h 0'
          </span>
          <span>|</span>
          <span className="cursor-help" title="Ausencias realizadas">
            {weeklyStats.absenceHours}h
          </span>
          <span>|</span>
          <span className="cursor-help" title="Diferencia">
            <span className={weeklyStats.difference > 0 ? "text-red-500" : ""}>
              {weeklyStats.difference >= 0 ? '+' : ''}{weeklyStats.difference}h
            </span>
          </span>
        </div>
        
        {/* Compensar Xh */}
        <div 
          className={`text-[8px] text-blue-600 transition-colors ${
            canEdit || isCurrentUser
              ? 'cursor-pointer hover:text-blue-800'
              : 'cursor-not-allowed opacity-50'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            
            if (!canEdit && !isCurrentUser) {
              toast({
                title: "Acceso restringido",
                description: "Solo puedes acceder a tu propia información",
                variant: "destructive"
              });
              return;
            }
            
            onNavigateToAbsences();
          }}
          title={canEdit || isCurrentUser 
            ? "Ver compensación de horas extras" 
            : "Solo puedes ver tu propia información"}
        >
          <EmployeeCompensatoryBalance 
            colaboradorId={employee.id}
            className="cursor-pointer text-[8px]"
          />
        </div>
      </div>
      
      {/* Controles del empleado - checkbox y botón eliminar (solo para admins/managers) */}
      {canEdit && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          {onSelect && (
            <input
              type="checkbox"
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer accent-black"
              checked={selected}
              onChange={() => onSelect(employee.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 hover:text-red-700 transition-colors"
              title={`Eliminar ${employee.name} del calendario`}
            >
              <X className="w-full h-full" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
