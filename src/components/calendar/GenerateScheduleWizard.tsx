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

import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
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
} from "lucide-react";
import { ScoreDisplay } from "./ScoreDisplay";
import type { GenerationResult, ExistingShiftsPolicy } from "@/utils/engine";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

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
  weeks: 1 | 2 | 3 | 4;
  existingShiftsPolicy: ExistingShiftsPolicy;
}

// ---------------------------------------------------------------------------
// STEP DEFINITIONS
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Posicionar", icon: Calendar },
  { id: 2, label: "Semanas", icon: Calendar },
  { id: 3, label: "Conflictos", icon: FileWarning },
  { id: 4, label: "Resumen", icon: CheckCircle2 },
  { id: 5, label: "Generar", icon: Sparkles },
  { id: 6, label: "Elegir", icon: Wand2 },
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
  onGenerate,
  generation,
  isGenerating,
  onApplyAlternative,
}: WizardProps) {
  const [step, setStep] = useState(1);
  const [weeks, setWeeks] = useState<1 | 2 | 3 | 4>(4);
  const [existingPolicy, setExistingPolicy] = useState<ExistingShiftsPolicy>("overwrite");

  const monthLabel = format(startOfMonth(currentWeek), "MMMM yyyy", { locale: es });

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return true; // posicionar siempre OK
      case 2: return true; // semanas siempre tiene valor
      case 3: return true; // conflictos siempre tiene valor
      case 4: return true; // resumen siempre OK
      case 5: return !isGenerating && generation !== null; // esperando generación
      case 6: return false; // último paso
      default: return false;
    }
  }, [step, isGenerating, generation]);

  const handleNext = () => {
    if (step === 4) {
      // Paso 4 → 5: lanzar generación
      onGenerate({ weeks, existingShiftsPolicy: existingPolicy });
      setStep(5);
    } else if (step === 5 && generation) {
      setStep(6);
    } else if (step < 6) {
      // Skip step 3 si no hay turnos existentes
      if (step === 2 && !hasExistingShifts) {
        setStep(4);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      if (step === 4 && !hasExistingShifts) {
        setStep(2);
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
          {step === 2 && <Step2Weeks weeks={weeks} onWeeksChange={setWeeks} />}
          {step === 3 && <Step3Conflicts policy={existingPolicy} onPolicyChange={setExistingPolicy} />}
          {step === 4 && (
            <Step4Summary
              weeks={weeks}
              policy={existingPolicy}
              pendingPetitions={pendingPetitionsCount}
              hasOccupancy={hasOccupancyData}
            />
          )}
          {step === 5 && <Step5Generate isGenerating={isGenerating} generation={generation} />}
          {step === 6 && generation && (
            <Step6Choose generation={generation} onApply={handleApply} />
          )}
        </div>

        {/* Navigation */}
        <Separator className="my-4" />
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 1 || step === 5}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Atrás
          </Button>
          {step < 6 && (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!canNext}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
            >
              {step === 4 ? (
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
  weeks,
  onWeeksChange,
}: {
  weeks: 1 | 2 | 3 | 4;
  onWeeksChange: (w: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">¿Cuántas semanas generar?</Label>
      <RadioGroup
        value={String(weeks)}
        onValueChange={(v) => onWeeksChange(parseInt(v) as 1 | 2 | 3 | 4)}
        className="space-y-2"
      >
        {([1, 2, 3, 4] as const).map((w) => (
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
            {w === 4 && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                Mes completo
              </Badge>
            )}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 3 — Conflictos (turnos existentes)
// ---------------------------------------------------------------------------

function Step3Conflicts({
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
// STEP 4 — Resumen pre-generación
// ---------------------------------------------------------------------------

function Step4Summary({
  weeks,
  policy,
  pendingPetitions,
  hasOccupancy,
}: {
  weeks: number;
  policy: ExistingShiftsPolicy;
  pendingPetitions: number;
  hasOccupancy: boolean;
}) {
  const policyLabels: Record<ExistingShiftsPolicy, string> = {
    overwrite: "Sobreescribir todo",
    keep_locked: "Respetar bloqueados",
    fill_gaps: "Solo huecos",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Resumen antes de generar</h3>

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
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Se generarán 3 alternativas (Equilibrio, Peticiones, Cobertura)
        para que elijas la mejor.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STEP 5 — Generando
// ---------------------------------------------------------------------------

function Step5Generate({
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
// STEP 6 — Elegir alternativa
// ---------------------------------------------------------------------------

function Step6Choose({
  generation,
  onApply,
}: {
  generation: GenerationResult;
  onApply: (index: number) => void;
}) {
  const { alternatives, recommendedIndex } = generation;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Elige la versión a aplicar</Label>

      {alternatives.map((alt, idx) => {
        const isRecommended = idx === recommendedIndex;
        return (
          <Card
            key={alt.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
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
              </div>

              <ScoreDisplay score={alt.output.score} violations={alt.output.violations} compact />

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

export type { WizardConfig };
