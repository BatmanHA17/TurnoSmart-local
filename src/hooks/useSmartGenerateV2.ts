/**
 * useSmartGenerateV2 — integra el SMART Engine v2.0 con el calendario.
 *
 * Mapea empleados del calendario → EngineEmployee[],
 * ejecuta generateAlternatives(), y devuelve ShiftBlock[] + score.
 *
 * Fase 2: Genera 3 alternativas, el FOM elige cuál aplicar.
 */
import { useState, useCallback } from "react";
import { startOfMonth, addDays, endOfMonth, format } from "date-fns";
import type { ShiftBlock } from "@/utils/calendarShiftUtils";
import { supabase } from "@/integrations/supabase/client";
import {
  generateAlternatives,
  buildGenerationPeriod,
  SPAIN_LABOR_LAW,
  ROLE_CONFIGS,
  DEFAULT_REINFORCEMENT_THRESHOLD,
  SHIFT_TIMES,
} from "@/utils/engine";
import type {
  EngineEmployee,
  EngineConstraints,
  GenerationResult,
  DayAssignmentV2,
  EmployeeRoleV2,
  ScoreBreakdown,
  Petition,
  DailyOccupancy,
  ContinuityHistory,
  EquityBalance,
  OptionalCriteria,
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
  generate: (weeks?: number, fomGuardiaDays?: number[]) => Promise<void>;
  /** Aplica una alternativa al calendario por índice */
  applyAlternative: (index: number) => void;
}

// ---------------------------------------------------------------------------
// SHIFT COLORS (for ShiftBlock mapping)
// ---------------------------------------------------------------------------

// C10: Paleta progresiva CLARO→OSCURO (amanecer → atardecer → noche)
const SHIFT_COLORS: Record<string, string> = {
  M:      "#fbbf24",  // amber-400 (sunrise)
  T:      "#f97316",  // orange-500 (sunset)
  N:      "#6366f1",  // indigo-500 (night)
  D:      "#6b7280",  // gray-500
  V:      "#10b981",  // green-500
  G:      "#f87171",  // red-400 (alert)
  GT:     "#f87171",  // red-400
  E:      "#94a3b8",  // slate-400
  F:      "#ec4899",  // pink-500
  DB:     "#14b8a6",  // teal-500
  DG:     "#14b8a6",  // teal-500
  PM:     "#a78bfa",  // violet-400
  PC:     "#a78bfa",  // violet-400
  "11x19": "#fb923c", // orange-400 (transition)
  "9x17":  "#fcd34d", // amber-300 (GEX morning)
  "12x20": "#fdba74", // orange-300 (GEX afternoon)
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

  // AFOM must be checked BEFORE FOM (because "AFOM" contains "FOM")
  if (combined.includes("AFOM") || combined.includes("ASSISTANT FRONT OFFICE")) return "AFOM";
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
    async (weeks?: number, fomGuardiaDays: number[] = []) => {
      setIsGenerating(true);
      setError(null);

      try {
        // Guard: no generar sin empleados
        if (!calEmployees || calEmployees.length === 0) {
          setError("No hay empleados configurados. Añade empleados al calendario antes de generar.");
          setIsGenerating(false);
          return;
        }

        const refDate = startOfMonth(currentWeek);
        const year = refDate.getFullYear();
        const month = refDate.getMonth() + 1;

        // Auto-calcula semanas completas L-D para cubrir todo el mes
        const period = weeks
          ? buildGenerationPeriod(year, month, weeks)
          : buildGenerationPeriod(year, month);
        const periodStart = period.startDate;
        const periodEnd = period.endDate;

        // --- Cargar peticiones desde DB ---
        const petitionsByEmployee = new Map<string, Petition[]>();
        if (orgId) {
          const { data: dbPetitions } = await supabase
            .from("schedule_petitions")
            .select("*")
            .eq("organization_id", orgId)
            .lte("period_start", periodEnd)
            .gte("period_end", periodStart);

          for (const row of dbPetitions ?? []) {
            const p: Petition = {
              id: row.id,
              employeeId: row.employee_id,
              type: row.type as Petition["type"],
              days: row.days ?? [],
              requestedShift: row.requested_shift ?? undefined,
              avoidShift: (row.avoid_shift as Petition["avoidShift"]) ?? undefined,
              exchangeWithEmployeeId: row.exchange_with_employee_id ?? undefined,
              exchangeDay: row.exchange_day ?? undefined,
              status: row.status as Petition["status"],
              priority: row.priority ?? 3,
              reason: row.reason ?? undefined,
            };
            const list = petitionsByEmployee.get(row.employee_id) ?? [];
            list.push(p);
            petitionsByEmployee.set(row.employee_id, list);
          }
        }

        // --- Cargar ocupación desde DB ---
        let occupancy: DailyOccupancy[] = [];
        if (orgId) {
          const { data: dbOccupancy } = await supabase
            .from("daily_occupancy")
            .select("date, check_ins, check_outs")
            .eq("organization_id", orgId)
            .gte("date", periodStart)
            .lte("date", periodEnd)
            .order("date");

          occupancy = (dbOccupancy ?? []).map((row) => {
            const dayNum = parseInt(row.date.split("-")[2], 10);
            const total = (row.check_ins ?? 0) + (row.check_outs ?? 0);
            return {
              day: dayNum,
              checkIns: row.check_ins ?? 0,
              checkOuts: row.check_outs ?? 0,
              totalMovements: total,
              needsReinforcement: total >= DEFAULT_REINFORCEMENT_THRESHOLD,
            };
          });
        }

        // --- Cargar equity del período anterior desde DB ---
        const equityByEmployee = new Map<string, EquityBalance>();
        if (orgId) {
          const { data: dbEquity } = await supabase
            .from("employee_equity")
            .select("*")
            .eq("organization_id", orgId)
            .lt("period_end", periodStart)
            .order("period_end", { ascending: false });

          // Tomar solo la más reciente por empleado
          for (const row of dbEquity ?? []) {
            if (!equityByEmployee.has(row.employee_id)) {
              equityByEmployee.set(row.employee_id, {
                morningCount: row.morning_count ?? 0,
                afternoonCount: row.afternoon_count ?? 0,
                nightCount: row.night_count ?? 0,
                weekendWorkedCount: row.weekend_worked_count ?? 0,
                longWeekendCount: row.long_weekend_count ?? 0,
                holidayWorkedCount: 0,
                petitionSatisfactionRatio: 0,
                nightCoverageCount: 0,
              });
            }
          }
        }

        // --- Cargar criterios BOOST desde DB ---
        let optionalCriteria: OptionalCriteria[] = [];
        let minCoverageM = 2;
        let minCoverageT = 2;
        let minCoverageN = 1;
        if (orgId) {
          const { data: dbCriteria } = await supabase
            .from("schedule_criteria")
            .select("*")
            .eq("organization_id", orgId);

          // Extraer cobertura mínima por turno de los criterios (boost = nº personas)
          const criteriaByKey = new Map((dbCriteria ?? []).map((c: any) => [c.criteria_key, c]));
          minCoverageM = criteriaByKey.get("MIN_COVERAGE_M")?.boost ?? 2;
          minCoverageT = criteriaByKey.get("MIN_COVERAGE_T")?.boost ?? 2;
          minCoverageN = criteriaByKey.get("MIN_COVERAGE_N")?.boost ?? 1;

          optionalCriteria = (dbCriteria ?? [])
            .filter((c: any) => c.category === "optional" && c.enabled)
            .map((c: any) => ({
              id: c.criteria_key,
              name: c.criteria_name ?? c.criteria_key,
              description: c.description ?? "",
              enabled: c.enabled,
              boost: c.boost ?? 1,
              boostNote: c.boost_note ?? undefined,
            }));
        }

        // --- Construir continuity desde equity + últimos días del período anterior ---
        let continuity: ContinuityHistory | undefined;
        const equitySnapshot: Record<string, EquityBalance> = {};
        equityByEmployee.forEach((eq, empId) => {
          equitySnapshot[empId] = eq;
        });

        // Cargar últimos 3 días del período anterior para cross-period 12h rest
        const lastWeek: Record<string, import("@/utils/engine/types").DayAssignmentV2[]> = {};
        if (orgId) {
          const prevEnd = addDays(new Date(periodStart + "T00:00:00"), -1);
          const prevStart = addDays(prevEnd, -2); // 3 días antes
          const empIds = calEmployees.map((e) => e.id);
          const { data: prevShifts } = await supabase
            .from("calendar_shifts")
            .select("employee_id, date, shift_name, start_time, end_time")
            .eq("org_id", orgId)
            .in("employee_id", empIds)
            .gte("date", format(prevStart, "yyyy-MM-dd"))
            .lte("date", format(prevEnd, "yyyy-MM-dd"))
            .order("date", { ascending: true });

          if (prevShifts && prevShifts.length > 0) {
            for (const row of prevShifts as any[]) {
              const empId = row.employee_id;
              if (!lastWeek[empId]) lastWeek[empId] = [];
              const shiftInfo = SHIFT_TIMES[row.shift_name];
              lastWeek[empId].push({
                code: row.shift_name || "D",
                hours: shiftInfo?.hours ?? 0,
                locked: false,
                startTime: row.start_time || shiftInfo?.startTime,
                endTime: row.end_time || shiftInfo?.endTime,
              });
            }
          }
        }

        if (equityByEmployee.size > 0 || Object.keys(lastWeek).length > 0) {
          continuity = { lastWeek, equitySnapshot };
        }

        const engineEmployees: EngineEmployee[] = calEmployees.map((ce) => {
          const role = mapRole(ce);
          const config = ROLE_CONFIGS[role];
          const wh = parseWeeklyHours(ce.workingHours);
          const prevEquity = equityByEmployee.get(ce.id);
          return {
            id: ce.id,
            name: ce.name,
            role,
            rotationType: config.rotationType,
            seniorityLevel: config.seniorityLevel,
            weeklyHours: wh,
            contractUnits: wh / 8,
            absences: [],
            petitions: petitionsByEmployee.get(ce.id) ?? [],
            equityBalance: prevEquity ?? {
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
          occupancyBasedStaffing: occupancy.length > 0,
          minCoveragePerShift: { M: minCoverageM, T: minCoverageT, N: minCoverageN },
          reinforcementThreshold: DEFAULT_REINFORCEMENT_THRESHOLD,
          fomAfomMirror: true,
          optionalCriteria,
          allowForceMajeureOverride: false,
          existingShiftsPolicy: "overwrite",
        };

        const result = generateAlternatives({
          period,
          employees: engineEmployees,
          constraints,
          occupancy,
          continuity,
          fomGuardiaDays,
        });

        setGeneration(result);

        // Mostrar score de la alternativa recomendada (sin aplicar)
        const best = result.alternatives[result.recommendedIndex];
        setScoreResult(best.output.score);

        const petitionCount = [...petitionsByEmployee.values()].flat().length;
        toast({
          title: "3 alternativas SMART generadas",
          description: `Score: ${best.output.score.overall}/100 · ${petitionCount} petición(es) · ${occupancy.length} días ocupación`,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        toast({ title: "Error al generar", description: msg, variant: "destructive" });
      } finally {
        setIsGenerating(false);
      }
    },
    [calEmployees, currentWeek, orgId, toast]
  );

  // Aplica una alternativa elegida al calendario
  const applyAlternative = useCallback(
    (index: number) => {
      if (!generation) return;
      const alt = generation.alternatives[index];
      if (!alt) return;

      // Usar el startDate real del período (primer lunes >= día 1 del mes)
      const periodStartDate = new Date(alt.output.meta.period.startDate + "T00:00:00");
      const totalDays = alt.output.meta.totalDays;

      const blocks = engineOutputToBlocks(
        alt.output.schedules,
        calEmployees,
        periodStartDate,
        totalDays,
        orgId
      );

      // ---------------------------------------------------------------
      // Limpiar turnos viejos del período en DB que no tendrán reemplazo.
      // El engine no genera bloques para días de descanso (D), así que
      // los shifts viejos de esos días quedarían en DB como fantasmas.
      // Hacemos fire-and-forget ANTES de setear state + persist.
      // ---------------------------------------------------------------
      if (orgId) {
        const periodEndDate = addDays(periodStartDate, totalDays - 1);
        const startStr = format(periodStartDate, "yyyy-MM-dd");
        const endStr = format(periodEndDate, "yyyy-MM-dd");
        const empIds = calEmployees.map((e) => e.id);

        // Calcular qué (employee_id, date) tienen bloque nuevo
        const coveredKeys = new Set(
          blocks.map((b) => `${b.employeeId}|${format(b.date, "yyyy-MM-dd")}`)
        );

        // Solo borrar los que NO tendrán reemplazo (días de descanso)
        // Los que SÍ tienen bloque se actualizarán via upsert
        supabase
          .from("calendar_shifts")
          .select("id, employee_id, date")
          .eq("org_id", orgId)
          .gte("date", startStr)
          .lte("date", endStr)
          .in("employee_id", empIds)
          .then(({ data: existing }) => {
            if (!existing) return;
            const idsToDelete = existing
              .filter((row) => !coveredKeys.has(`${row.employee_id}|${row.date}`))
              .map((row) => row.id);
            if (idsToDelete.length > 0) {
              supabase
                .from("calendar_shifts")
                .delete()
                .in("id", idsToDelete)
                .then(({ error }) => {
                  if (error) console.error("Error borrando turnos fantasma:", error);
                });
            }
          });
      }

      // ── Persist DG accumulated (T2-6) ──────────────────────────
      if (orgId && alt.output.dgAccumulated) {
        const periodEnd = format(
          addDays(periodStartDate, totalDays - 1),
          "yyyy-MM-dd"
        );
        for (const [empId, dgCount] of Object.entries(alt.output.dgAccumulated)) {
          if (dgCount > 0) {
            supabase.rpc("increment_dg_balance", {
              _employee_id: empId,
              _org_id: orgId,
              _period_end: periodEnd,
              _dg_delta: dgCount,
            }).then(({ error }) => {
              if (error) {
                // Fallback: upsert directly
                supabase
                  .from("employee_equity")
                  .upsert({
                    employee_id: empId,
                    organization_id: orgId,
                    period_start: format(periodStartDate, "yyyy-MM-dd"),
                    period_end: periodEnd,
                    dg_balance: dgCount,
                  }, { onConflict: "employee_id,organization_id,period_start" })
                  .then(() => {});
              }
            });
          }
        }
      }

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
  periodStartDate: Date,
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

      // day es 1-based dentro del período → fecha real = periodStart + (day - 1)
      const date = addDays(periodStartDate, day - 1);
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
