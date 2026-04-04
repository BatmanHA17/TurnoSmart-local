/**
 * EmployeeInfoCell — Extracted from GoogleCalendarStyle.tsx (Phase 3 split)
 * Renders the left-side employee info column in the calendar grid.
 */
import React from "react";
import { X, Info } from "lucide-react";
import { EmployeeViolationBadge } from "@/components/audit";
import { EmployeeCompensatoryBalance } from "../EmployeeCompensatoryBalance";
import type { CalendarEmployee } from "./calendarTypes";
import type { AuditViolation } from "@/types/audit";

export interface HoursCompliance {
  plannedHours: number;
  contractHours: number;
  isExceeded: boolean;
}

export interface EmployeeInfoCellProps {
  employee: CalendarEmployee;
  compliance: HoursCompliance;
  hasAbsenceThisWeek: boolean;
  absenceDays: number;
  selectedEmployees: Set<string>;
  colaboradores: any[];
  canEdit: boolean;
  isManager: boolean;
  isEmployee: boolean;
  userId?: string;
  // Violations
  employeeViolations: AuditViolation[];
  // Hours display
  weeklyContractHours: number;
  weeklyRealHours: number;
  weeklyAbsenceHours: number;
  // Handlers
  onNavigateToProfile: (employeeName: string) => void;
  onEmployeeSelect: (employeeId: string) => void;
  onRemoveEmployee: (employeeId: string, employeeName: string) => void;
  onNavigateToAbsences: (employeeId: string) => void;
}

export const EmployeeInfoCell: React.FC<EmployeeInfoCellProps> = React.memo(({
  employee,
  compliance,
  hasAbsenceThisWeek,
  absenceDays,
  selectedEmployees,
  colaboradores,
  canEdit,
  isManager,
  isEmployee,
  userId,
  employeeViolations,
  weeklyContractHours,
  weeklyRealHours,
  weeklyAbsenceHours,
  onNavigateToProfile,
  onEmployeeSelect,
  onRemoveEmployee,
  onNavigateToAbsences,
}) => {
  const maxSeverity = employeeViolations.length > 0
    ? employeeViolations.reduce((max, v) => {
        const order = { error: 3, warning: 2, info: 1 };
        return order[v.severity] > order[max] ? v.severity : max;
      }, 'info' as 'error' | 'warning' | 'info')
    : null;

  const colaborador = colaboradores.find(c => c.id === employee.id);
  const canNavigateProfile = canEdit || colaborador?.user_id === userId;
  const canViewCompensation = canEdit || colaborador?.email === (userId ? undefined : ''); // handled by parent

  const hoursDifference = weeklyRealHours - weeklyContractHours;
  const wholeHours = Math.floor(weeklyRealHours);
  const minutes = Math.round((weeklyRealHours - wholeHours) * 60);

  return (
    <td className="py-0.5 px-1 border-r relative group">
      <div className="flex items-center justify-between">
        <div className="space-y-0 flex-1">
          {/* Employee name */}
          <div className="flex items-center gap-1">
            <div
              className={`text-[9px] sm:text-[10px] md:text-[11px] font-medium text-gray-900 truncate transition-colors ${
                canNavigateProfile ? 'cursor-pointer hover:text-blue-600' : ''
              }`}
              onClick={() => {
                if (canNavigateProfile) onNavigateToProfile(employee.name);
              }}
              title={canNavigateProfile ? "Ver perfil del colaborador" : ""}
            >
              {employee.name}
            </div>

            {/* Audit violation badge */}
            {maxSeverity && (
              <EmployeeViolationBadge
                count={employeeViolations.length}
                maxSeverity={maxSeverity}
              />
            )}

            {/* Absence badge */}
            {hasAbsenceThisWeek && (
              <div className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                Vacaciones ({absenceDays} días)
              </div>
            )}

            {/* Hours exceeded warning */}
            {compliance.isExceeded && (
              <div
                className="h-3 w-3 text-red-500 cursor-help flex-shrink-0 relative group"
                title={`Se han detectado posibles irregularidades en el cumplimiento de la normativa laboral. Revisa las horas planificadas de este colaborador (${compliance.plannedHours}h/${compliance.contractHours}h)`}
              >
                <Info className="h-3 w-3" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-red-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  ⚠️ Exceso de horas: {compliance.plannedHours}h/{compliance.contractHours}h
                </div>
              </div>
            )}
          </div>

          {/* Hours line: contract | real | absence | difference */}
          <div className="text-[8px] sm:text-[9px] text-gray-600 whitespace-nowrap flex gap-1">
            <span className="cursor-help" title="Horas contratos">
              {weeklyContractHours || compliance.plannedHours}h
            </span>
            <span>|</span>
            <span className="cursor-help" title="Horas reales esta semana">
              {wholeHours}h {minutes}'
            </span>
            <span>|</span>
            <span className="cursor-help" title="Ausencias realizadas">
              {weeklyAbsenceHours}h
            </span>
            <span>|</span>
            <span className="cursor-help" title="Diferencia">
              <span className={hoursDifference > 0 ? "text-red-500" : ""}>
                {hoursDifference >= 0 ? '+' : ''}{hoursDifference}h
              </span>
            </span>
          </div>

          {/* Compensatory balance link */}
          <div
            className={`text-[8px] text-blue-600 transition-colors ${
              canEdit || colaborador?.email === userId
                ? 'cursor-pointer hover:text-blue-800'
                : 'cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (isEmployee) {
                const currentUserColaborador = colaboradores.find(c => c.email === userId);
                if (!currentUserColaborador || currentUserColaborador.id !== employee.id) {
                  return;
                }
              }
              onNavigateToAbsences(employee.id);
            }}
            title={canEdit || colaborador?.email === userId
              ? "Ver compensación de horas extras"
              : "Solo puedes ver tu propia información"}
          >
            <EmployeeCompensatoryBalance
              colaboradorId={employee.id}
              className="cursor-pointer text-[8px]"
            />
          </div>
        </div>

        {/* Controls: checkbox + remove button */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <input
            type="checkbox"
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer accent-black"
            checked={selectedEmployees.has(employee.id)}
            onChange={() => onEmployeeSelect(employee.id)}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveEmployee(employee.id, employee.name);
            }}
            className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 hover:text-red-700 transition-colors"
            title={`Eliminar ${employee.name} del calendario`}
          >
            <X className="w-full h-full" />
          </button>
        </div>
      </div>
    </td>
  );
});

EmployeeInfoCell.displayName = 'EmployeeInfoCell';
