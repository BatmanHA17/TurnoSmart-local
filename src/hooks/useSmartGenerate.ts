/**
 * useSmartGenerate — integra el SMART Schedule Engine con el calendario.
 *
 * Recibe la configuración del GenerateScheduleSheet (criterios del jefe),
 * llama a generateSchedule(), y devuelve ShiftBlock[] para el calendario.
 */
import { useState, useCallback } from "react";
import { startOfMonth, setDate } from "date-fns";
import {
  generateSchedule,
  ScheduleEmployee,
  ScheduleOutput,
  ShiftCode,
} from "@/utils/smartScheduleEngine";
import { ShiftBlock } from "@/utils/calendarShiftUtils";
import { useToast } from "@/hooks/use-toast";
import type { GenerateConfig, EmployeeConfig } from "@/components/calendar/GenerateScheduleSheet";

// ---------------------------------------------------------------------------
// Tipos internos del calendario
// ---------------------------------------------------------------------------

interface CalendarEmployee {
  id: string;
  name: string;
  role: string;
  workingHours: string; // "0h/40h"
}

interface UseSmartGenerateProps {
  employees: CalendarEmployee[];
  currentWeek: Date;
  orgId: string | undefined;
  onResult: (newBlocks: ShiftBlock[]) => void;
}

// ---------------------------------------------------------------------------
// Mapeadores
// ---------------------------------------------------------------------------

const SHIFT_COLORS: Record<ShiftCode, string> = {
  M:  "#3b82f6", // blue-500
  T:  "#f59e0b", // amber-500
  N:  "#8b5cf6", // violet-500
  D:  "#6b7280", // gray-500
  V:  "#10b981", // emerald-500
  G:  "#ef4444", // red-500
  GT: "#f97316", // orange-500
  E:  "#94a3b8", // slate-400
  F:  "#ec4899", // pink-500
  DB: "#14b8a6", // teal-500
  DG: "#84cc16", // lime-500
};

const SHIFT_NAMES: Partial<Record<ShiftCode, string>> = {
  M:  "Mañana",
  T:  "Tarde",
  N:  "Noche",
  D:  "Descanso",
  V:  "Vacaciones",
  G:  "Guardia",
  GT: "Guardia Tarde",
  E:  "Baja por enfermedad",
  F:  "Festivo",
  DB: "Día Debido",
  DG: "Día Debido Guardia",
};

const WORK_SHIFTS = new Set<ShiftCode>(["M", "T", "N", "G", "GT"]);

/**
 * Mapea la config del dialog → ScheduleEmployee[] para el motor.
 * Usa las preferencias y horas que el jefe configuró en el panel.
 */
function mapConfigToScheduleEmployees(
  configs: EmployeeConfig[],
  calendarEmployees: CalendarEmployee[]
): ScheduleEmployee[] {
  return configs
    .filter((c) => c.included)
    .map((c) => {
      const calEmp = calendarEmployees.find((e) => e.id === c.id);
      return {
        id: c.id,
        name: c.name,
        weeklyHours: c.weeklyHours,
        role: calEmp?.role?.toLowerCase().includes("jefe") ||
              calEmp?.role?.toLowerCase().includes("manager") ||
              calEmp?.role?.toLowerCase().includes("director") ||
              calEmp?.role?.toLowerCase().includes("gerente")
          ? ("manager" as const)
          : ("employee" as const),
        preference: c.preference,
      };
    });
}

function mapOutputToShiftBlocks(
  output: ScheduleOutput,
  includedEmployees: EmployeeConfig[],
  year: number,
  month: number,
  orgId: string | undefined
): ShiftBlock[] {
  const blocks: ShiftBlock[] = [];

  for (const emp of includedEmployees) {
    if (!emp.included) continue;
    const empSchedule = output.schedules[emp.id];
    if (!empSchedule) continue;

    for (const [dayStr, assignment] of Object.entries(empSchedule)) {
      const day = Number(dayStr);
      const code = assignment.code as ShiftCode;

      // Solo generar bloques para turnos de trabajo (no descansos/ausencias)
      if (!WORK_SHIFTS.has(code)) continue;

      const shiftDate = setDate(new Date(year, month - 1, 1), day);

      const block: ShiftBlock = {
        id: `smart-${emp.id}-${year}-${month}-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employeeId: emp.id,
        date: shiftDate,
        type: code === "M" ? "morning"
            : code === "T" ? "afternoon"
            : code === "N" ? "night"
            : "morning",
        color: SHIFT_COLORS[code] ?? "#6b7280",
        name: SHIFT_NAMES[code] ?? code,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        organization_id: orgId,
        notes: assignment.forced ? "⚠️ Forzado por cobertura mínima" : undefined,
      };

      blocks.push(block);
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSmartGenerate({
  employees,
  currentWeek,
  orgId,
  onResult,
}: UseSmartGenerateProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastOutput, setLastOutput] = useState<ScheduleOutput | null>(null);

  /**
   * generate() ahora recibe la config del GenerateScheduleSheet.
   * El jefe ya configuró empleados, preferencias, cobertura y criterios.
   */
  const generate = useCallback(
    async (config: GenerateConfig) => {
      const includedEmployees = config.employees.filter((e) => e.included);

      if (includedEmployees.length === 0) {
        toast({
          title: "Sin empleados",
          description: "Selecciona al menos un empleado en el panel.",
          variant: "destructive",
        });
        return;
      }

      setIsGenerating(true);

      try {
        const monthStart = startOfMonth(currentWeek);
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth() + 1;

        const scheduleEmployees = mapConfigToScheduleEmployees(config.employees, employees);

        // Calcular cobertura mínima como el máximo de los 3 turnos
        const minCoverage = Math.max(
          config.coveragePerShift.morning,
          config.coveragePerShift.afternoon,
          config.coveragePerShift.night
        );

        const output = generateSchedule({
          employees: scheduleEmployees,
          year,
          month,
          constraints: {
            ergonomicRotation: config.optionalCriteria.ergonomicRotation,
            fairWeekendDistribution: config.optionalCriteria.fairWeekendDistribution,
            minCoveragePerShift: minCoverage,
          },
          occupancyForecast: config.weeklyOccupancy,
        });

        setLastOutput(output);

        const newBlocks = mapOutputToShiftBlocks(
          output,
          config.employees,
          year,
          month,
          orgId
        );

        onResult(newBlocks);

        // Toast con resultado
        const hasViolations = output.violations.length > 0;
        const hasWarnings = output.warnings.length > 0;

        if (hasViolations) {
          toast({
            title: `Cuadrante generado — Score ${output.score}/100`,
            description: `⚠️ ${output.violations.length} problema(s) legal(es). Revisa el panel de auditoría.`,
            variant: "destructive",
          });
        } else if (hasWarnings) {
          toast({
            title: `Cuadrante generado — Score ${output.score}/100 ✓`,
            description: `${newBlocks.length} turnos para ${includedEmployees.length} empleados. ${output.warnings.length} aviso(s).`,
          });
        } else {
          toast({
            title: `Cuadrante generado — Score ${output.score}/100 ✓`,
            description: `${newBlocks.length} turnos para ${includedEmployees.length} empleados. Sin problemas legales.`,
          });
        }
      } catch (err) {
        toast({
          title: "Error al generar",
          description: String(err),
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [employees, currentWeek, orgId, onResult, toast]
  );

  return { generate, isGenerating, lastOutput };
}
