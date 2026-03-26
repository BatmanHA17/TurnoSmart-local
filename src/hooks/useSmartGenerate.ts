/**
 * useSmartGenerate — integra el SMART Schedule Engine con el calendario.
 *
 * Lee employees y shiftBlocks del componente, llama a generateSchedule(),
 * y devuelve los nuevos ShiftBlock[] listos para setShiftBlocksWithHistory.
 */
import { useState, useCallback } from "react";
import { startOfMonth, getDaysInMonth, setDate } from "date-fns";
import {
  generateSchedule,
  ScheduleEmployee,
  ScheduleOutput,
  ShiftCode,
} from "@/utils/smartScheduleEngine";
import { ShiftBlock } from "@/utils/calendarShiftUtils";
import { useToast } from "@/hooks/use-toast";

// Tipos internos del calendario
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

function parseWeeklyHours(workingHours: string): number {
  // Formato: "0h/40h" → 40
  const parts = workingHours.split("/");
  if (parts.length >= 2) {
    const raw = parts[1].replace("h", "");
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 40;
}

function mapCalendarEmployeesToSchedule(
  employees: CalendarEmployee[]
): ScheduleEmployee[] {
  return employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    weeklyHours: parseWeeklyHours(emp.workingHours),
    role: emp.role?.toLowerCase().includes("manager") ||
          emp.role?.toLowerCase().includes("jefe") ||
          emp.role?.toLowerCase().includes("director") ||
          emp.role?.toLowerCase().includes("gerente")
      ? "manager"
      : "employee",
    preference: "rotating",
  }));
}

function mapOutputToShiftBlocks(
  output: ScheduleOutput,
  employees: CalendarEmployee[],
  year: number,
  month: number,
  orgId: string | undefined
): ShiftBlock[] {
  const blocks: ShiftBlock[] = [];

  for (const emp of employees) {
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

  const generate = useCallback(async () => {
    if (employees.length === 0) {
      toast({
        title: "Sin empleados",
        description: "Añade colaboradores antes de generar el cuadrante.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Determinar mes a generar (mes de la semana actual en pantalla)
      const monthStart = startOfMonth(currentWeek);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth() + 1;

      const scheduleEmployees = mapCalendarEmployeesToSchedule(employees);

      const output = generateSchedule({
        employees: scheduleEmployees,
        year,
        month,
        constraints: {
          ergonomicRotation: true,
          fairWeekendDistribution: true,
          minCoveragePerShift: 1,
        },
      });

      setLastOutput(output);

      const newBlocks = mapOutputToShiftBlocks(output, employees, year, month, orgId);

      onResult(newBlocks);

      // Toast con resultado
      const hasViolations = output.violations.length > 0;
      const hasWarnings = output.warnings.length > 0;

      if (hasViolations) {
        toast({
          title: `Cuadrante generado — Score ${output.score}/100`,
          description: `⚠️ ${output.violations.length} problema(s) legal(es) detectado(s). Revisa el panel de auditoría.`,
          variant: "destructive",
        });
      } else if (hasWarnings) {
        toast({
          title: `Cuadrante generado — Score ${output.score}/100 ✓`,
          description: `${newBlocks.length} turnos asignados. ${output.warnings.length} aviso(s) de revisión.`,
        });
      } else {
        toast({
          title: `Cuadrante generado — Score ${output.score}/100 ✓`,
          description: `${newBlocks.length} turnos asignados para ${employees.length} empleados. Sin problemas legales.`,
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
  }, [employees, currentWeek, orgId, onResult, toast]);

  return { generate, isGenerating, lastOutput };
}
