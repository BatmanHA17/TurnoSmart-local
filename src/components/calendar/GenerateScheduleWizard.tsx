/**
 * GenerateScheduleWizard — Wizard 9 pasos para generación SMART v2.0
 *
 * Flujo confirmado (H1):
 * 1. Posicionar — mes/semana a generar
 * 2. Semanas — ¿cuántas semanas? 1/2/3/4
 * 3. Conflictos — si hay turnos existentes: sobreescribir/respetar/huecos
 * 4. Resumen — historial anterior, peticiones pendientes, ocupación
 * 5. Generar — ejecutar motor (loading)
 * 6. Elegir — 3 alternativas con score (AlternativesResultSheet inline)
 * 7. Ajustar — FOM revisa borrador (cierra wizard, edita en calendario)
 * 8. Publicar — semáforo + score final + botón publicar
 * 9. Notificar — confirma envío notificaciones a empleados
 *
 * Para Fase 5 MVP: pasos 1-6 funcionales en el wizard.
 * Pasos 7-9 se gestionan fuera del wizard (en el calendario).
 */

import { useState, useMemo, Fragment } from "react";
import { format, startOfMonth, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { buildGenerationPeriod } from "@/utils/engine/helpers";
import { PlantillaCalculator } from "./PlantillaCalculator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Sparkles,
  Shield,
  CircleCheck,
  CircleAlert,
  Info,
} from "lucide-react";
import { ScoreDisplay } from "./ScoreDisplay";
import { ViolationIcon } from "@/components/audit/AuditViolationBadge";
import { VIOLATION_TYPE_LABELS } from "@/types/audit";
import type { AuditViolation, SuggestedFix } from "@/types/audit";
import type { GenerationResult, ExistingShiftsPolicy, DailyOccupancy } from "@/utils/engine";
import type { PetitionRecord } from "@/hooks/usePetitions";
import { useCriteria, type CriteriaRecord } from "@/hooks/useCriteria";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";
import { Wrench, Sliders, ShieldCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface WizardEmployee {
  id: string;
  name: string;
  role?: string;
  workingHours?: string;
}

/** Resumen del período anterior por empleado */
export interface PreviousPeriodSummary {
  employeeId: string;
  employeeName: string;
  lastShift: string;        // Último turno trabajado (M, T, N, etc.)
  morningCount: number;     // Mañanas acumuladas
  afternoonCount: number;   // Tardes acumuladas
  nightCount: number;       // Noches acumuladas
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeek: Date;
  /** true si hay turnos existentes en el período */
  hasExistingShifts: boolean;
  /** Número de peticiones pendientes */
  pendingPetitionsCount: number;
  /** true si hay datos de ocupación cargados */
  hasOccupancyData: boolean;
  /** Peticiones reales para detalle en resumen */
  petitions?: PetitionRecord[];
  /** Datos de ocupación procesados */
  occupancyData?: DailyOccupancy[];
  /** Empleados del calendario para checklist pre-generación */
  employees?: WizardEmployee[];
  /** Resumen del período anterior para continuidad */
  previousPeriod?: PreviousPeriodSummary[];
  /** Abrir panel de peticiones */
  onOpenPetitions?: () => void;
  /** Abrir diálogo de ocupación */
  onOpenOccupancy?: () => void;
  /** Abrir configuración de criterios */
  onOpenCriteria?: () => void;
  /** Llamado al generar */
  onGenerate: (config: WizardConfig) => void;
  /** Resultado de la generación (llega async) */
  generation: GenerationResult | null;
  /** Estado de generación */
  isGenerating: boolean;
  /** Llamado al elegir alternativa */
  onApplyAlternative: (index: number) => void;
}

export interface WizardConfig {
  weeks: number;
  existingShiftsPolicy: ExistingShiftsPolicy;
  /** Días del período (1-based) donde FOM tiene Guardia (G/GT) */
  fomGuardiaDays: number[];
}

// ---------------------------------------------------------------------------
// STEP DEFINITIONS
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Posicionar", icon: Calendar },
  { id: 2, label: "Semanas", icon: Calendar },
  { id: 3, label: "Guardias FOM", icon: Shield },
  { id: 4, label: "Conflictos", icon: FileWarning },
  { id: 5, label: "Resumen", icon: CheckCircle2 },
  { id: 6, label: "Generar", icon: Sparkles },
  { id: 7, label: "Elegir", icon: Wand2 },
] as const;

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function GenerateScheduleWizard({
  open,
  onOpenChange,
  currentWeek,
  hasExistingShifts,
  pendingPetitionsCount,
  hasOccupancyData,
  petitions,
  occupancyData,
  employees: wizardEmployees,
  previousPeriod,
  onOpenPetitions,
  onOpenOccupancy,
  onOpenCriteria,
  onGenerate,
  generation,
  isGenerating,
  onApplyAlternative,
}: WizardProps) {
  const [step, setStep] = useState(1);
  const [weeks, setWeeks] = useState<number>(4);
  const [existingPolicy, setExistingPolicy] = useState<ExistingShiftsPolicy>("overwrite");
  const [fomGuardiaDays, setFomGuardiaDays] = useState<number[]>([]);

  const monthLabel = format(startOfMonth(currentWeek), "MMMM yyyy", { locale: es });

  const employeeCount = wizardEmployees?.length ?? 0;

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return true;
      case 2: return true;
      case 3: return true; // guardias (puede ser vacío = sin guardias)
      case 4: return true; // conflictos
      case 5: return employeeCount > 0; // bloquear generación sin empleados
      case 6: return !isGenerating && generation !== null;
      case 7: return false; // último paso
      default: return false;
    }
  }, [step, isGenerating, generation, employeeCount]);

  const handleNext = () => {
    if (step === 5) {
      // Paso 5 → 6: lanzar generación
      onGenerate({ weeks, existingShiftsPolicy: existingPolicy, fomGuardiaDays });
      setStep(6);
    } else if (step === 6 && generation) {
      setStep(7);
    } else if (step < 7) {
      // Skip step 4 (conflictos) si no hay turnos existentes
      if (step === 3 && !hasExistingShifts) {
        setStep(5);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      if (step === 5 && !hasExistingShifts) {
        setStep(3);
      } else {
        setStep(step - 1);
      }
    }
  };

  const handleApply = (index: number) => {
    onApplyAlternative(index);
    onOpenChange(false);
    setStep(1); // reset para próxima vez
  };

  const progressPercent = (step / STEPS.length) * 100;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setStep(1); }}>
      <SheetContent side="right" className="w-[440px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Generar SMART — Paso {step} de {STEPS.length}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {STEPS[step - 1]?.label} · {monthLabel}
          </SheetDescription>
        </SheetHeader>

        {/* Progress bar */}
        <Progress value={progressPercent} className="h-1.5 mb-4" />

        {/* Step content */}
        <div className="min-h-[300px]">
          {step === 1 && <Step1Position monthLabel={monthLabel} />}
          {step === 2 && <Step2Weeks currentWeek={currentWeek} weeks={weeks} onWeeksChange={setWeeks} />}
          {step === 3 && (
            <Step3Guardias
              currentWeek={currentWeek}
              weeks={weeks}
              guardiaDays={fomGuardiaDays}
              onGuardiaDaysChange={setFomGuardiaDays}
            />
          )}
          {step === 4 && <Step4Conflicts policy={existingPolicy} onPolicyChange={setExistingPolicy} />}
          {step === 5 && (
            <Step5Summary
              weeks={weeks}
              policy={existingPolicy}
              pendingPetitions={pendingPetitionsCount}
              hasOccupancy={hasOccupancyData}
              guardiaDays={fomGuardiaDays}
              petitions={petitions}
              occupancyData={occupancyData}
              employees={wizardEmployees}
              previousPeriod={previousPeriod}
              onOpenPetitions={onOpenPetitions}
              onOpenOccupancy={onOpenOccupancy}
              onOpenCriteria={onOpenCriteria}
            />
          )}
          {step === 6 && <Step6Generate isGenerating={isGenerating} generation={generation} />}
          {step === 7 && generation && (
            <Step7Choose generation={generation} onApply={handleApply} />
          )}
        </div>

        {/* Navigation */}
        <Separator className="my-4" />
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 1 || step === 6}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Atrás
          </Button>
          {step < 7 && (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canNext}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
            >
              {step === 5 ? (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Generar
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// STEP 1 — Posicionar
// ---------------------------------------------------------------------------

function Step1Position({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <Calendar className="h-12 w-12 mx-auto text-violet-600 mb-3" />
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Se generará el cuadrante para este período.
          <br />
          Navega en el calendario si necesitas cambiar de mes.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 2 — Semanas
// ---------------------------------------------------------------------------

function Step2Weeks({
  currentWeek,
  weeks,
  onWeeksChange,
}: {
  currentWeek: Date;
  weeks: number;
  onWeeksChange: (w: number) => void;
}) {
  const monthStart = startOfMonth(currentWeek);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth() + 1;
  const period = buildGenerationPeriod(year, month);
  const fullMonthWeeks = period.totalWeeks;

  // "mes" = valor especial que indica auto-cálculo completo
  const isMes = weeks >= 4;
  const effectiveWeeks = isMes ? fullMonthWeeks : weeks;
  const effectivePeriod = buildGenerationPeriod(year, month, effectiveWeeks);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">¿Cuántas semanas generar?</Label>
      <RadioGroup
        value={isMes ? "mes" : String(weeks)}
        onValueChange={(v) => {
          if (v === "mes") {
            onWeeksChange(fullMonthWeeks);
          } else {
            onWeeksChange(parseInt(v));
          }
        }}
        className="space-y-2"
      >
        {([1, 2, 3] as const).map((w) => (
          <label
            key={w}
            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <RadioGroupItem value={String(w)} />
            <div>
              <span className="font-medium">{w} semana{w > 1 ? "s" : ""}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({w * 7} días)
              </span>
            </div>
          </label>
        ))}
        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="mes" />
          <div className="flex-1">
            <span className="font-medium">Mes completo</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({fullMonthWeeks} semanas · {fullMonthWeeks * 7} días)
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            Recomendado
          </Badge>
        </label>
      </RadioGroup>

      <p className="text-xs text-muted-foreground">
        Período: <strong>{format(new Date(effectivePeriod.startDate + "T00:00:00"), "EEE d MMM", { locale: es })}</strong>
        {" → "}
        <strong>{format(new Date(effectivePeriod.endDate + "T00:00:00"), "EEE d MMM yyyy", { locale: es })}</strong>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 3 — Guardias FOM (¿Qué fines de semana tiene guardia?)
// ---------------------------------------------------------------------------

function Step3Guardias({
  currentWeek,
  weeks,
  guardiaDays,
  onGuardiaDaysChange,
}: {
  currentWeek: Date;
  weeks: number;
  guardiaDays: number[];
  onGuardiaDaysChange: (days: number[]) => void;
}) {
  // Calcular el período real usando la misma lógica que el engine
  const monthStart = startOfMonth(currentWeek);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth() + 1;
  const period = buildGenerationPeriod(year, month, weeks || undefined);
  const periodStart = new Date(period.startDate + "T00:00:00");
  const totalWeeks = period.totalWeeks;

  // Encontrar S+D agrupados por fin de semana, usando fechas reales del período
  const weekends: Array<{
    weekNum: number;
    satDay: number | null;
    sunDay: number | null;
    satDate: string;
    sunDate: string;
  }> = [];

  for (let wi = 0; wi < totalWeeks; wi++) {
    let satDay: number | null = null;
    let sunDay: number | null = null;

    for (let di = 0; di < 7; di++) {
      const dayIndex = wi * 7 + di + 1; // 1-based dentro del período
      const realDate = addDays(periodStart, dayIndex - 1);
      const dow = realDate.getDay(); // 0=dom, 6=sáb
      if (dow === 6) satDay = dayIndex;
      if (dow === 0) sunDay = dayIndex;
    }

    if (satDay || sunDay) {
      weekends.push({
        weekNum: wi + 1,
        satDay,
        sunDay,
        satDate: satDay
          ? format(addDays(periodStart, satDay - 1), "d MMM", { locale: es })
          : "",
        sunDate: sunDay
          ? format(addDays(periodStart, sunDay - 1), "d MMM", { locale: es })
          : "",
      });
    }
  }

  const toggleDay = (day: number) => {
    if (guardiaDays.includes(day)) {
      onGuardiaDaysChange(guardiaDays.filter(d => d !== day));
    } else {
      onGuardiaDaysChange([...guardiaDays, day]);
    }
  };

  // Contar fines de semana con guardia (al menos 1 día del fds seleccionado)
  const weekendsWithGuardia = weekends.filter(w =>
    (w.satDay && guardiaDays.includes(w.satDay)) ||
    (w.sunDay && guardiaDays.includes(w.sunDay))
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-violet-600" />
        <Label className="text-sm font-medium">Guardias del FOM</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        ¿En qué fines de semana tiene Guardia (G/GT) el FOM este período?
        <br />
        <span className="text-[10px]">
          Las semanas con guardia, el FOM librará 2 días entre semana. Máximo 2 fines de semana con guardia.
        </span>
      </p>

      <div className="space-y-2">
        {weekends.map((w) => (
          <Card key={w.weekNum} className="overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Semana {w.weekNum}</span>
              <div className="flex gap-3">
                {w.satDay && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={guardiaDays.includes(w.satDay)}
                      onCheckedChange={() => toggleDay(w.satDay!)}
                      disabled={weekendsWithGuardia >= 2 && !guardiaDays.includes(w.satDay)}
                    />
                    <span className="text-sm">Sáb {w.satDate}</span>
                    <Badge variant="outline" className="text-[9px]">G</Badge>
                  </label>
                )}
                {w.sunDay && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={guardiaDays.includes(w.sunDay)}
                      onCheckedChange={() => toggleDay(w.sunDay!)}
                      disabled={weekendsWithGuardia >= 2 && !guardiaDays.includes(w.sunDay)}
                    />
                    <span className="text-sm">Dom {w.sunDate}</span>
                    <Badge variant="outline" className="text-[9px]">G</Badge>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {guardiaDays.length === 0 && (
        <p className="text-xs text-center text-muted-foreground italic">
          Sin guardias — el FOM librará todos los fines de semana.
        </p>
      )}
      {guardiaDays.length > 0 && (
        <p className="text-xs text-center text-violet-600 font-medium">
          {guardiaDays.length} día{guardiaDays.length > 1 ? "s" : ""} de guardia seleccionado{guardiaDays.length > 1 ? "s" : ""}.
          El FOM librará entre semana en esas semanas.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 4 — Conflictos (turnos existentes)
// ---------------------------------------------------------------------------

function Step4Conflicts({
  policy,
  onPolicyChange,
}: {
  policy: ExistingShiftsPolicy;
  onPolicyChange: (p: ExistingShiftsPolicy) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-yellow-600 mb-2">
        <AlertTriangle className="h-4 w-4" />
        <Label className="text-sm font-medium">Hay turnos ya asignados</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        ¿Qué hacer con los turnos existentes en este período?
      </p>
      <RadioGroup
        value={policy}
        onValueChange={(v) => onPolicyChange(v as ExistingShiftsPolicy)}
        className="space-y-2"
      >
        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
          <RadioGroupItem value="overwrite" className="mt-0.5" />
          <div>
            <span className="font-medium text-sm">Sobreescribir todo</span>
            <p className="text-xs text-muted-foreground">
              Genera desde cero. Todos los turnos actuales se reemplazan.
            </p>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
          <RadioGroupItem value="keep_locked" className="mt-0.5" />
          <div>
            <span className="font-medium text-sm">Respetar bloqueados</span>
            <p className="text-xs text-muted-foreground">
              Los turnos marcados como bloqueados se mantienen. El resto se regenera.
            </p>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
          <RadioGroupItem value="fill_gaps" className="mt-0.5" />
          <div>
            <span className="font-medium text-sm">Solo rellenar huecos</span>
            <p className="text-xs text-muted-foreground">
              Solo asigna turnos en los días que no tienen nada asignado.
            </p>
          </div>
        </label>
      </RadioGroup>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 5 — Resumen pre-generación
// ---------------------------------------------------------------------------

function Step5Summary({
  weeks,
  policy,
  pendingPetitions,
  hasOccupancy,
  guardiaDays,
  petitions,
  occupancyData,
  employees,
  previousPeriod,
  onOpenPetitions,
  onOpenOccupancy,
  onOpenCriteria,
}: {
  weeks: number;
  policy: ExistingShiftsPolicy;
  pendingPetitions: number;
  hasOccupancy: boolean;
  guardiaDays: number[];
  petitions?: PetitionRecord[];
  occupancyData?: DailyOccupancy[];
  employees?: WizardEmployee[];
  previousPeriod?: PreviousPeriodSummary[];
  onOpenPetitions?: () => void;
  onOpenOccupancy?: () => void;
  onOpenCriteria?: () => void;
}) {
  const policyLabels: Record<ExistingShiftsPolicy, string> = {
    overwrite: "Sobreescribir todo",
    keep_locked: "Respetar bloqueados",
    fill_gaps: "Solo huecos",
  };

  // ────────────────────────────────────────────────────────────
  // Checklist Copilot Pre-Generación
  // ────────────────────────────────────────────────────────────
  const checks = useMemo(() => {
    const items: { ok: boolean; label: string; detail: string; action?: () => void }[] = [];

    // 1. Empleados con horas configuradas
    const empCount = employees?.length ?? 0;
    const missingHours = employees?.filter(e => !e.workingHours || e.workingHours === '0h/40h' && !e.workingHours.includes('/')) ?? [];
    const missingHoursNames = missingHours.slice(0, 3).map(e => e.name).join(', ');
    items.push({
      ok: empCount > 0 && missingHours.length === 0,
      label: empCount === 0
        ? 'Sin empleados en el calendario'
        : missingHours.length > 0
          ? `${missingHours.length} empleado(s) sin horas: ${missingHoursNames}${missingHours.length > 3 ? '...' : ''}`
          : `${empCount} empleados configurados correctamente`,
      detail: empCount === 0
        ? 'Añade empleados al calendario antes de generar.'
        : missingHours.length > 0
          ? 'Corrige las horas semanales en la ficha del empleado.'
          : '',
    });

    // 2. Peticiones
    items.push({
      ok: pendingPetitions > 0 || (petitions?.length ?? 0) > 0,
      label: pendingPetitions > 0
        ? `${pendingPetitions} petición(es) pendiente(s) — serán consideradas`
        : (petitions?.length ?? 0) > 0
          ? `${petitions!.length} petición(es) procesada(s)`
          : 'Sin peticiones registradas',
      detail: pendingPetitions === 0 && (petitions?.length ?? 0) === 0
        ? '¿Quieres añadir peticiones de vacaciones o preferencias antes de generar?'
        : '',
      action: onOpenPetitions,
    });

    // 3. Ocupación
    items.push({
      ok: hasOccupancy,
      label: hasOccupancy
        ? 'Datos de ocupación cargados'
        : 'Sin datos de ocupación',
      detail: !hasOccupancy
        ? 'La alternativa Cobertura no podrá optimizar picos sin datos de check-in/check-out.'
        : '',
      action: onOpenOccupancy,
    });

    // 4. Criterios
    items.push({
      ok: true, // Siempre ok — criterios tienen defaults
      label: 'Criterios SMART configurados',
      detail: 'Puedes ajustar cobertura mínima y otros criterios antes de generar.',
      action: onOpenCriteria,
    });

    // 5. Conflictos de peticiones duras (Tipo A) — mismos días para distintos empleados
    if (petitions && petitions.length > 0) {
      const hardPetitions = petitions.filter(p => p.type === 'A' && (p.status === 'approved' || p.status === 'pending'));
      const dayEmployees: Record<number, string[]> = {};
      for (const p of hardPetitions) {
        for (const d of p.days) {
          if (!dayEmployees[d]) dayEmployees[d] = [];
          dayEmployees[d].push(p.employee_name || p.employee_id);
        }
      }
      const conflictDays = Object.entries(dayEmployees).filter(([, emps]) => emps.length >= 2);
      if (conflictDays.length > 0) {
        const sample = conflictDays.slice(0, 2).map(([d, emps]) => `día ${d} (${emps.join(', ')})`).join('; ');
        items.push({
          ok: false,
          label: `${conflictDays.length} día(s) con múltiples ausencias duras: ${sample}`,
          detail: 'Verifica que la cobertura no se resienta. Revisa peticiones o ajusta manualmente.',
          action: onOpenPetitions,
        });
      }
    }

    // 6. Staffing recommendation — ¿hay suficientes FDAs para 100% cobertura?
    if (employees && employees.length > 0) {
      const fdas = employees.filter(e => e.role === 'FRONT_DESK_AGENT');
      // Simplified staffing calc (mirrors solver's calculateStaffingRecommendation)
      // Coverage defaults M:2, T:2, N:1 — same as engine defaults
      const mN = 2, tN = 2, nN = 1;
      const fdaMNeeded = Math.max(0, mN * 7 - 5 - 1 - 5); // total - FOM(5) - AFOM(1 Sun M) - GEX(5)
      const fdaTNeeded = Math.max(0, tN * 7 - 3); // total - AFOM(3 T/week)
      const fdaNNeeded = Math.max(0, nN * 7 - 5); // total - Night Agent(5)
      const minFDAs = Math.ceil((fdaMNeeded + fdaTNeeded + fdaNNeeded) / 5);
      const isSufficient = fdas.length >= minFDAs;
      items.push({
        ok: isSufficient,
        label: isSufficient
          ? `${fdas.length} Front Desk Agents — plantilla suficiente para 100% cobertura`
          : `${fdas.length} Front Desk Agents — necesitas mínimo ${minFDAs} para 100% cobertura (faltan ${minFDAs - fdas.length})`,
        detail: !isSufficient
          ? `Con M:${mN}, T:${tN}, N:${nN} se requieren ${minFDAs} FDAs. Añade personal o reduce cobertura mínima.`
          : '',
      });
    }

    // 7. Equidad — desequilibrio previo grande
    if (previousPeriod && previousPeriod.length > 0) {
      const rotating = previousPeriod.filter(p => p.nightCount !== undefined);
      if (rotating.length >= 2) {
        const nightCounts = rotating.map(p => p.nightCount);
        const maxN = Math.max(...nightCounts);
        const minN = Math.min(...nightCounts);
        if (maxN - minN > 5) {
          const over = rotating.find(p => p.nightCount === maxN);
          items.push({
            ok: false,
            label: `Desequilibrio de noches: diferencia de ${maxN - minN} entre empleados`,
            detail: over ? `${over.employeeName} lleva ${maxN} noches. El motor intentará compensar.` : '',
          });
        }
      }
    }

    // 8. Guardias FOM — máximo 2 por período
    if (guardiaDays.length > 2) {
      items.push({
        ok: false,
        label: `${guardiaDays.length} guardias FOM seleccionadas (máximo recomendado: 2)`,
        detail: 'El convenio permite máximo 2 fines de semana con guardia por período.',
      });
    }

    return items;
  }, [employees, pendingPetitions, petitions, hasOccupancy, guardiaDays, previousPeriod, onOpenPetitions, onOpenOccupancy, onOpenCriteria]);

  const allOk = checks.every(c => c.ok);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Resumen antes de generar</h3>

      {/* Checklist Copilot */}
      <Card className={allOk ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
        <CardContent className="pt-3 pb-2 space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            {allOk ? <CircleCheck className="h-3.5 w-3.5 text-green-600" /> : <CircleAlert className="h-3.5 w-3.5 text-amber-600" />}
            {allOk ? 'Listo para generar' : 'Revisa antes de generar'}
          </h4>
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {c.ok
                ? <CircleCheck className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                : <CircleAlert className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <span className={c.ok ? 'text-green-800' : 'text-amber-800'}>{c.label}</span>
                {!c.ok && c.detail && (
                  <p className="text-muted-foreground text-[10px] mt-0.5">{c.detail}</p>
                )}
              </div>
              {c.action && !c.ok && (
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={c.action}>
                  Corregir
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Criterios SMART — resumen rápido (T2-2 Copilot Pre-Generación) */}
      <CriteriaSummaryCard onOpenCriteria={onOpenCriteria} />

      {/* Plantilla RRHH compacta */}
      {(employees?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="pt-3 pb-2">
            <PlantillaCalculator employeeCount={employees!.length} compact />
          </CardContent>
        </Card>
      )}

      {/* Período anterior */}
      {previousPeriod && previousPeriod.length > 0 && (
        <Card>
          <CardContent className="pt-3 pb-2 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Período anterior
            </h4>
            <div className="text-[10px] grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 gap-y-0.5">
              <span className="font-medium text-muted-foreground">Empleado</span>
              <span className="font-medium text-muted-foreground text-center">Último</span>
              <span className="font-medium text-muted-foreground text-center">M</span>
              <span className="font-medium text-muted-foreground text-center">T</span>
              <span className="font-medium text-muted-foreground text-center">N</span>
              {previousPeriod.map((p) => (
                <Fragment key={p.employeeId}>
                  <span className="truncate">{p.employeeName}</span>
                  <span className="text-center font-mono font-medium">{p.lastShift}</span>
                  <span className="text-center">{p.morningCount}</span>
                  <span className="text-center">{p.afternoonCount}</span>
                  <span className="text-center">{p.nightCount}</span>
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Período</span>
            <span className="font-medium">{weeks} semana{weeks > 1 ? "s" : ""} ({weeks * 7} días)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Turnos existentes</span>
            <span className="font-medium">{policyLabels[policy]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Peticiones pendientes</span>
            <span className="font-medium">
              {pendingPetitions > 0 ? (
                <Badge variant="info" className="text-[10px]">{pendingPetitions}</Badge>
              ) : (
                "Ninguna"
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Datos de ocupación</span>
            <span className="font-medium">
              {hasOccupancy ? (
                <Badge variant="success" className="text-[10px]">Cargados</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">No disponibles</Badge>
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Guardias FOM</span>
            <span className="font-medium">
              {guardiaDays.length > 0 ? (
                <Badge variant="info" className="text-[10px]">{guardiaDays.length} día{guardiaDays.length > 1 ? "s" : ""}</Badge>
              ) : (
                "Sin guardias"
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de peticiones */}
      {petitions && petitions.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Peticiones</h4>
              {onOpenPetitions && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenPetitions}>
                  Gestionar
                </Button>
              )}
            </div>
            {(["A", "B", "C", "D"] as const).map(type => {
              const ofType = petitions.filter(p => p.type === type);
              if (ofType.length === 0) return null;
              const pending = ofType.filter(p => p.status === "pending").length;
              const approved = ofType.filter(p => p.status === "approved").length;
              const typeLabels = { A: "Dura", B: "Blanda", C: "Intercambio", D: "Recurrente" };
              return (
                <div key={type} className="text-xs">
                  <span className="font-medium">Tipo {type} ({typeLabels[type]}):</span>{" "}
                  {ofType.map(p => p.employee_name || "?").join(", ")}
                  <span className="text-muted-foreground ml-1">
                    ({approved} aprobada{approved !== 1 ? "s" : ""}, {pending} pendiente{pending !== 1 ? "s" : ""})
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Detalle de ocupación */}
      {occupancyData && occupancyData.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Ocupación</h4>
              {onOpenOccupancy && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onOpenOccupancy}>
                  Gestionar
                </Button>
              )}
            </div>
            {(() => {
              const avg = Math.round(occupancyData.reduce((s, d) => s + d.totalMovements, 0) / occupancyData.length);
              const peak = Math.max(...occupancyData.map(d => d.totalMovements));
              const peakDays = occupancyData.filter(d => d.totalMovements === peak).map(d => d.day);
              const reinforceDays = occupancyData.filter(d => d.needsReinforcement).length;
              return (
                <div className="text-xs space-y-1">
                  <div>{occupancyData.length} días con datos</div>
                  <div>Media: {avg} movimientos/día</div>
                  <div>Pico: {peak} mov. (día{peakDays.length > 1 ? "s" : ""} {peakDays.join(", ")})</div>
                  {reinforceDays > 0 && (
                    <div className="text-orange-600">{reinforceDays} día{reinforceDays !== 1 ? "s" : ""} requieren refuerzo</div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Se generarán 3 alternativas (Equilibrio, Peticiones, Cobertura)
        para que elijas la mejor.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 6 — Generando
// ---------------------------------------------------------------------------

function Step6Generate({
  isGenerating,
  generation,
}: {
  isGenerating: boolean;
  generation: GenerationResult | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {isGenerating ? (
        <>
          <Loader2 className="h-12 w-12 text-violet-600 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Generando 3 alternativas...
          </p>
          <p className="text-xs text-muted-foreground">
            Analizando roles, equidad, cobertura, peticiones
          </p>
        </>
      ) : generation ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-sm font-medium">
            3 alternativas generadas
          </p>
          <p className="text-xs text-muted-foreground">
            {generation.alternatives[0]?.output.meta.durationMs}ms ·{" "}
            {generation.alternatives[0]?.output.meta.totalEmployees} empleados ·{" "}
            {generation.alternatives[0]?.output.meta.totalDays} días
          </p>
        </>
      ) : (
        <>
          <Sparkles className="h-12 w-12 text-violet-300" />
          <p className="text-sm text-muted-foreground">
            Preparando generación...
          </p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 7 — Elegir alternativa
// ---------------------------------------------------------------------------

/** T2-2: Copilot Pre-Generación — Resumen de criterios activos */
function CriteriaSummaryCard({ onOpenCriteria }: { onOpenCriteria?: () => void }) {
  const { org } = useCurrentOrganization();
  const { criteria, isLoading } = useCriteria({ organizationId: org?.id });

  if (isLoading || criteria.length === 0) return null;

  const mandatory = criteria.filter(c => c.category === 'mandatory' && c.enabled);
  const optional = criteria.filter(c => c.category === 'optional' && c.enabled);
  const disabled = criteria.filter(c => c.category === 'optional' && !c.enabled);
  const boosted = optional.filter(c => c.boost >= 3);

  // Coverage minimums from mandatory criteria
  const coverageM = criteria.find(c => c.criteria_key === 'MIN_COVERAGE_M');
  const coverageT = criteria.find(c => c.criteria_key === 'MIN_COVERAGE_T');
  const coverageN = criteria.find(c => c.criteria_key === 'MIN_COVERAGE_N');

  return (
    <Card>
      <CardContent className="pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            Criterios SMART activos
          </h4>
          {onOpenCriteria && (
            <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={onOpenCriteria}>
              Ajustar
            </Button>
          )}
        </div>

        {/* Coverage minimums */}
        {(coverageM || coverageT || coverageN) && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Cobertura mín:</span>
            <div className="flex gap-2">
              {coverageM && <Badge variant="outline" className="text-[10px] py-0">M:{coverageM.boost}</Badge>}
              {coverageT && <Badge variant="outline" className="text-[10px] py-0">T:{coverageT.boost}</Badge>}
              {coverageN && <Badge variant="outline" className="text-[10px] py-0">N:{coverageN.boost}</Badge>}
            </div>
          </div>
        )}

        {/* Mandatory count */}
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="h-3 w-3 text-green-600" />
          <span className="text-green-800">{mandatory.length} criterios legales activos</span>
        </div>

        {/* Optional enabled */}
        {optional.length > 0 && (
          <div className="text-xs space-y-0.5">
            <span className="text-muted-foreground">{optional.length} opcionales activados:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {optional.map(c => (
                <Badge key={c.id} variant={c.boost >= 3 ? "default" : "secondary"} className="text-[9px] py-0">
                  {c.criteria_name}{c.boost >= 3 ? ` ×${c.boost}` : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Boosted criteria highlight */}
        {boosted.length > 0 && (
          <div className="text-[10px] text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {boosted.length} criterio{boosted.length > 1 ? 's' : ''} con boost alto — el motor los priorizará
          </div>
        )}

        {/* Disabled warnings */}
        {disabled.length > 0 && (
          <div className="text-[10px] text-amber-700 flex items-center gap-1">
            <CircleAlert className="h-3 w-3" />
            {disabled.length} opcional{disabled.length > 1 ? 'es' : ''} desactivado{disabled.length > 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Step7Choose({
  generation,
  onApply,
}: {
  generation: GenerationResult;
  onApply: (index: number) => void;
}) {
  const { alternatives, recommendedIndex } = generation;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  // Show staffing recommendation from first alternative (same for all 3)
  const staffingRec = alternatives[0]?.output?.staffingRecommendation;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Elige la versión a aplicar</Label>

      {/* Staffing recommendation banner */}
      {staffingRec && !staffingRec.isSufficient && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Plantilla insuficiente</p>
            <p className="mt-0.5 text-amber-700">
              Necesitas mínimo {staffingRec.minRotaCompleto} Front Desk Agents para 100% cobertura.
              Actualmente tienes {staffingRec.currentRotaCompleto} — faltan {staffingRec.minRotaCompleto - staffingRec.currentRotaCompleto}.
            </p>
          </div>
        </div>
      )}

      {staffingRec && staffingRec.isSufficient && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700">
          <CircleCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Plantilla suficiente: {staffingRec.currentRotaCompleto} FDAs cubren 100% cobertura (mín. {staffingRec.minRotaCompleto})</span>
        </div>
      )}

      {alternatives.map((alt, idx) => {
        const isRecommended = idx === recommendedIndex;
        const violations = alt.output.violations || [];
        const isExpanded = expandedIdx === idx;

        return (
          <Card
            key={alt.id}
            className={`transition-all hover:shadow-md ${
              isRecommended ? "ring-2 ring-violet-400" : ""
            }`}
          >
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{alt.label}</span>
                  {isRecommended && (
                    <Badge variant="info" className="text-[10px]">Recomendada</Badge>
                  )}
                </div>
                {violations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => toggleExpand(idx)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {violations.length} alerta{violations.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>

              <ScoreDisplay
                score={alt.output.score}
                violations={violations}
                compact
                onReviewClick={violations.length > 0 ? () => toggleExpand(idx) : undefined}
              />

              {/* Expandable violations list */}
              {isExpanded && violations.length > 0 && (
                <WizardViolationList violations={violations} />
              )}

              <Button
                size="sm"
                onClick={() => onApply(idx)}
                className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Aplicar {alt.label}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** Lista compacta de violaciones para Wizard Step 7 — Copilot Auditoría */
function WizardViolationList({ violations }: { violations: AuditViolation[] }) {
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 5;

  // Sort: errors first, then warnings, then info
  const sorted = useMemo(() => {
    const order: Record<string, number> = { error: 0, critical: 0, warning: 1, info: 2 };
    return [...violations].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  }, [violations]);

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);

  const handleResolve = (fix: SuggestedFix) => {
    toast({
      title: "Sugerencia del Copilot",
      description: fix.label,
      duration: 5000,
    });
  };

  return (
    <div className="border rounded-lg bg-muted/30 p-2 space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1">
        Violaciones detectadas
      </p>
      {visible.map((v) => (
        <div
          key={v.id}
          className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
            v.severity === 'error' ? 'bg-destructive/5' : v.severity === 'warning' ? 'bg-amber-500/5' : ''
          }`}
        >
          <ViolationIcon type={v.type} severity={v.severity} size={12} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{v.message}</p>
            {v.suggestedFix && (
              <button
                onClick={() => handleResolve(v.suggestedFix!)}
                className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded px-1.5 py-0.5"
              >
                <Wrench className="h-2.5 w-2.5" />
                <span className="truncate">{v.suggestedFix.label}</span>
              </button>
            )}
          </div>
        </div>
      ))}
      {sorted.length > MAX_VISIBLE && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[10px] text-primary hover:underline px-2 py-1"
        >
          Ver {sorted.length - MAX_VISIBLE} más...
        </button>
      )}
    </div>
  );
}

export type { WizardConfig };
