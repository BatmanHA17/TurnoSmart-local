import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Umbrella, User, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaveRequestData {
  type: "sick" | "vacation" | "personal";
  startDate: string;
  endDate: string;
  notes: string;
}

interface MobileLeaveRequestSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeaveRequestData) => Promise<void>;
}

type LeaveType = "sick" | "vacation" | "personal";

interface TypeOption {
  id: LeaveType;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    id: "sick",
    label: "Baja médica",
    description: "Enfermedad o accidente",
    icon: Stethoscope,
    colorClass: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    id: "vacation",
    label: "Vacaciones",
    description: "Días de descanso anuales",
    icon: Umbrella,
    colorClass: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    id: "personal",
    label: "Personal",
    description: "Asunto personal o familiar",
    icon: User,
    colorClass: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
];

const TOTAL_STEPS = 3;

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current
              ? "w-6 h-2 bg-primary"
              : i === current
              ? "w-4 h-2 bg-primary"
              : "w-2 h-2 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function MobileLeaveRequestSheet({
  open,
  onClose,
  onSubmit,
}: MobileLeaveRequestSheetProps) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetState = () => {
    setStep(0);
    setSelectedType(null);
    setStartDate("");
    setEndDate("");
    setNotes("");
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!selectedType || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      await onSubmit({ type: selectedType, startDate, endDate, notes });
      setSubmitted(true);
    } catch {
      // error handling left to parent
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeOption = TYPE_OPTIONS.find((t) => t.id === selectedType);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] flex flex-col p-0 rounded-t-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step > 0 && !submitted && (
              <button
                onClick={handleBack}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Volver"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <SheetTitle className="text-lg">
              {submitted ? "Solicitud enviada" : "Nueva solicitud"}
            </SheetTitle>
          </div>
          {!submitted && (
            <div className="pt-1">
              <ProgressDots current={step} />
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* Submitted confirmation */}
          {submitted && (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div>
                <p className="text-lg font-semibold">Solicitud enviada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu solicitud ha sido registrada y está pendiente de aprobación.
                </p>
              </div>
              <Button className="w-full h-14 mt-4" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          )}

          {/* Step 1: Select type */}
          {!submitted && step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                ¿Qué tipo de ausencia necesitas solicitar?
              </p>
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id)}
                    className={cn(
                      "w-full h-14 min-h-[56px] flex items-center gap-4 px-4 rounded-xl border-2 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", opt.colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                    {active && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Select dates */}
          {!submitted && step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                ¿Cuándo necesitas la ausencia?
              </p>
              <div className="space-y-2">
                <Label htmlFor="start-date">Fecha de inicio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="h-14 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Fecha de fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-14 text-base"
                />
              </div>
            </div>
          )}

          {/* Step 3: Notes + confirm */}
          {!submitted && step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">Añade notas opcionales y confirma.</p>

              {/* Summary */}
              {selectedTypeOption && (
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Resumen</p>
                  <p className="font-semibold">{selectedTypeOption.label}</p>
                  {startDate && endDate && (
                    <p className="text-sm text-muted-foreground">
                      {startDate === endDate
                        ? startDate
                        : `${startDate} → ${endDate}`}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Añade cualquier información relevante..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none text-base"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer action */}
        {!submitted && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-border">
            {step < TOTAL_STEPS - 1 ? (
              <Button
                className="w-full h-14 text-base"
                disabled={
                  (step === 0 && !selectedType) ||
                  (step === 1 && (!startDate || !endDate))
                }
                onClick={handleNext}
              >
                Continuar
              </Button>
            ) : (
              <Button
                className="w-full h-14 text-base"
                disabled={submitting || !selectedType || !startDate || !endDate}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
