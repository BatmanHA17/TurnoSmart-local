/**
 * useSmartGenerateV2 — integra el SMART Engine v2.0 con el calendario.
 *
 * Mapea empleados del calendario → EngineEmployee[],
 * ejecuta generateAlternatives(), y devuelve ShiftBlock[] + score.
 *
 * Fase 2: Genera 3 alternativas, el FOM elige cuál aplicar.
 */
import { useState, useCallback } from "react";
import { startOfMonth, setDate, addDays } from "date-fns";
import type { ShiftBlock } from "@/utils/calendarShiftUtils";
import {
  generateAlternatives,
  buildGenerationPeriod,
  SPAIN_LABOR_LAW,
  ROLE_CONFIGS,
  DEFAULT_MIN_COVERAGE,
  DEFAULT_REINFORCEMENT_THRESHOLD,
} from "@/utils/engine";
import type {
  EngineEmployee,
  EngineConstraints,
  GenerationResult,
  DayAssignmentV2,
  EmployeeRoleV2,
  ScoreBreakdown,
} from "@/utils/engine";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CalendarEmployee {
  id: string;
  name: string;
  role: string;       // "employee" | "manager" | "gex" — del v1
  workingHours: string;
  seniority_level?: number;
  job_title?: string;
}

interface UseSmartGenerateV2Props {
  employees: CalendarEmployee[];
  currentWeek: Date;
  orgId: string | undefined;
  onResult: (newBlocks: ShiftBlock[]) => void;
}

interface GenerateV2Result {
  /** Resultado completo con 3 alternativas */
  generation: GenerationResult | null;
  /** Score de la alternativa aplicada (o recomendada si no se ha elegido) */
  score: ScoreBreakdown | null;
  isGenerating: boolean;
  error: string | null;
  /** Genera 3 alternativas (no aplica ninguna automáticamente) */
  generate: (weeks?: 1 | 2 | 3 | 4) => void;
  /** Aplica una alternativa al calendario por índice */
  applyAlternative: (index: number) => void;
}

// ---------------------------------------------------------------------------
// SHIFT COLORS (for ShiftBlock mapping)
// ---------------------------------------------------------------------------

const SHIFT_COLORS: Record<string, string> = {
  M:      "#3b82f6",
  T:      "#f59e0b",
  N:      "#8b5cf6",
  D:      "#6b7280",
  V:      "#10b981",
  G:      "#ef4444",
  GT:     "#f97316",
  E:      "#94a3b8",
  F:      "#ec4899",
  DB:     "#14b8a6",
  DG:     "#14b8a6",
  PM:     "#a78bfa",
  PC:     "#a78bfa",
  "11x19": "#06b6d4",
  "9x17":  "#0ea5e9",
  "12x20": "#0ea5e9",
};

const SHIFT_TYPE_MAP: Record<string, ShiftBlock["type"]> = {
  M:  "morning",
  T:  "afternoon",
  N:  "night",
  D:  "absence",
  V:  "absence",
  E:  "absence",
  F:  "absence",
  DB: "absence",
  DG: "absence",
  PM: "absence",
  PC: "absence",
  G:  "morning",
  GT: "afternoon",
  "11x19": "morning",
  "9x17":  "morning",
  "12x20": "afternoon",
};

// ---------------------------------------------------------------------------
// ROLE MAPPING (v1 role → v2 EmployeeRoleV2)
// ---------------------------------------------------------------------------

function mapRole(calEmp: CalendarEmployee): EmployeeRoleV2 {
  // Buscar en job_title Y en nombre del empleado (permite seed con nombres de rol)
  const jt = calEmp.job_title?.toUpperCase() ?? "";
  const nm = calEmp.name?.toUpperCase() ?? "";
  const combined = `${jt} ${nm}`;

  if (combined.includes("AFOM") || combined.includes("ASSISTANT FOM")) return "AFOM";
  if (combined.includes("FOM") || combined.includes("FRONT OFFICE MANAGER")) return "FOM";
  if (combined.includes("NIGHT") || combined.includes("NOCTURNO")) return "NIGHT_SHIFT_AGENT";
  if (combined.includes("GEX") || combined.includes("GUEST EXPERIENCE")) return "GEX";
  if (combined.includes("FRONT DESK") || combined.includes("FDA")) return "FRONT_DESK_AGENT";

  // Fallback por role del v1
  if (calEmp.role === "manager") return "FOM";
  if (calEmp.role === "gex") return "GEX";
  return "FRONT_DESK_AGENT";
}

function parseWeeklyHours(workingHours: string): number {
  const match = workingHours.match(/(\d+)h?\s*\/\s*(\d+)/);
  if (match) return parseInt(match[2], 10);
  const simple = workingHours.match(/(\d+)/);
  if (simple) return parseInt(simple[1], 10);
  return 40;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useSmartGenerateV2({
  employees: calEmployees,
  currentWeek,
  orgId,
  onResult,
}: UseSmartGenerateV2Props): GenerateV2Result {
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreBreakdown | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Genera 3 alternativas sin aplicar ninguna automáticamente
  const generate = useCallback(
    (weeks: 1 | 2 | 3 | 4 = 4, fomGuardiaDays: number[] = []) => {
      setIsGenerating(true);
      setError(null);

      try {
        const refDate = startOfMonth(currentWeek);
        const year = refDate.getFullYear();
        const month = refDate.getMonth() + 1;

        const period = buildGenerationPeriod(year, month, weeks);

        const engineEmployees: EngineEmployee[] = calEmployees.map((ce) => {
          const role = mapRole(ce);
          const config = ROLE_CONFIGS[role];
          const wh = parseWeeklyHours(ce.workingHours);
          return {
            id: ce.id,
            name: ce.name,
            role,
            rotationType: config.rotationType,
            seniorityLevel: config.seniorityLevel,
            weeklyHours: wh,
            contractUnits: wh / 8,
            absences: [],
            petitions: [],
            equityBalance: {
              morningCount: 0,
              afternoonCount: 0,
              nightCount: 0,
              weekendWorkedCount: 0,
              longWeekendCount: 0,
              holidayWorkedCount: 0,
              petitionSatisfactionRatio: 0,
              nightCoverageCount: 0,
            },
          };
        });

        const constraints: EngineConstraints = {
          law: { ...SPAIN_LABOR_LAW },
          ergonomicRotation: true,
          fairWeekendDistribution: true,
          occupancyBasedStaffing: false,
          minCoveragePerShift: DEFAULT_MIN_COVERAGE,
          reinforcementThreshold: DEFAULT_REINFORCEMENT_THRESHOLD,
          fomAfomMirror: true,
          optionalCriteria: [],
          allowForceMajeureOverride: false,
          existingShiftsPolicy: "overwrite",
        };

        const result = generateAlternatives({
          period,
          employees: engineEmployees,
          constraints,
          occupancy: [],
          fomGuardiaDays,
        });

        setGeneration(result);

        // Mostrar score de la alternativa recomendada (sin aplicar)
        const best = result.alternatives[result.recommendedIndex];
        setScoreResult(best.output.score);

        toast({
          title: "3 alternativas SMART generadas",
          description: `Mejor score: ${best.output.score.overall}/100 — elige cuál aplicar`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        toast({ title: "Error al generar", description: msg, variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    },
    [calEmployees, currentWeek, toast]
  );

  // Aplica una alternativa elegida al calendario
  const applyAlternative = useCallback(
    (index: number) => {
      if (!generation) return;
      const alt = generation.alternatives[index];
      if (!alt) return;

      const refDate = startOfMonth(currentWeek);
      const totalDays = alt.output.meta.totalDays;

      const blocks = engineOutputToBlocks(
        alt.output.schedules,
        calEmployees,
        refDate,
        totalDays,
        orgId
      );

      setScoreResult(alt.output.score);
      onResult(blocks);

      const light = alt.output.score.trafficLight;
      toast({
        title: `Versión "${alt.label}" aplicada`,
        description: `Score: ${alt.output.score.overall}/100 (${light === "green" ? "OK" : light === "orange" ? "Revisar" : "Conflictos"})`,
      });
    },
    [generation, calEmployees, currentWeek, orgId, onResult, toast]
  );

  return {
    generation,
    score: scoreResult,
    isGenerating,
    error,
    generate,
    applyAlternative,
  };
}

// ---------------------------------------------------------------------------
// ENGINE OUTPUT → SHIFT BLOCKS
// ---------------------------------------------------------------------------

function engineOutputToBlocks(
  schedules: Record<string, Record<number, DayAssignmentV2>>,
  calEmployees: CalendarEmployee[],
  monthStart: Date,
  totalDays: number,
  orgId: string | undefined
): ShiftBlock[] {
  const blocks: ShiftBlock[] = [];

  for (const emp of calEmployees) {
    const empSchedule = schedules[emp.id];
    if (!empSchedule) continue;

    for (let day = 1; day <= totalDays; day++) {
      const assignment = empSchedule[day];
      if (!assignment) continue;

      const code = assignment.code;

      // Skip rest/absence days — solo generar bloques para turnos de trabajo
      if (code === "D" || assignment.hours === 0) continue;

      const date = setDate(monthStart, day);
      const type = SHIFT_TYPE_MAP[code] ?? (code.match(/^\d/) ? "morning" : "absence");
      const color = SHIFT_COLORS[code] ?? "#6b7280";

      blocks.push({
        id: `smart-v2-${emp.id}-${day}`,
        employeeId: emp.id,
        date,
        startTime: assignment.startTime !== "00:00" ? assignment.startTime : undefined,
        endTime: assignment.endTime !== "00:00" ? assignment.endTime : undefined,
        type,
        color,
        name: code,
        organization_id: orgId,
        absenceCode: type === "absence" ? code : undefined,
      });
    }
  }

  return blocks;
}
