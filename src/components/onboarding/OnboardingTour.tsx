/**
 * OnboardingTour — Tour guiado de 5 pasos para nuevos usuarios
 *
 * Se activa solo la primera vez que el FOM accede al calendario.
 * Usa localStorage key `turnosmart_tour_completed_${orgId}` para no repetirse.
 * Renderiza un overlay + tooltip posicionado sobre el elemento target.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tour Steps ──────────────────────────────────────────────────────────────
interface TourStep {
  /** CSS selector del elemento a señalar */
  target: string;
  /** Título del tooltip */
  title: string;
  /** Descripción del tooltip */
  description: string;
  /** Posición del tooltip relativa al target */
  placement: "top" | "bottom" | "left" | "right";
  /** Action to run before showing this step (e.g., open a panel) */
  onBeforeStep?: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="calendar-table"]',
    title: "Tu calendario de turnos",
    description: "Aquí verás los turnos de todo tu equipo. Cada fila es un empleado y cada columna un día de la semana.",
    placement: "bottom",
  },
  {
    target: '[data-tour="favorites-area"]',
    title: "⭐ Zona de favoritos",
    description: "Pulsa la estrella ⭐ en la cabecera para abrir este panel. Arrastra horarios y ausencias directamente al calendario. Puedes crear los tuyos o restaurar el kit base.",
    placement: "right",
    onBeforeStep: () => {
      // Open favorites panel if closed
      const btn = document.querySelector('[data-tour="favorites-area"]');
      if (btn && btn.clientHeight < 50) {
        // Panel is collapsed — try clicking the star toggle
        const starBtn = document.querySelector('button[title*="Favoritos"], button[aria-label*="Favoritos"]');
        if (starBtn) (starBtn as HTMLElement).click();
      }
      // Fallback: set localStorage to ensure it opens
      try { localStorage.setItem('turnosmart-show-favorites', 'true'); } catch {}
    },
  },
  {
    target: '[data-tour="generate-button"]',
    title: "Genera turnos con IA",
    description: "Un clic para generar 3 alternativas optimizadas. El motor SMART respeta la ley, peticiones y equidad.",
    placement: "bottom",
  },
  {
    target: '[data-tour="audit-button"]',
    title: "Auditoría inteligente",
    description: "Revisa problemas antes de publicar. Descanso insuficiente, cobertura, equidad... con botón para resolver.",
    placement: "bottom",
  },
  {
    target: '[data-tour="petitions-button"]',
    title: "Gestiona peticiones",
    description: "Tu equipo envía vacaciones y preferencias. Las verás aquí y el motor las respetará al generar.",
    placement: "bottom",
  },
];

// ─── Hook ────────────────────────────────────────────────────────────────────
function getTourKey(orgId?: string) {
  return `turnosmart_tour_completed_${orgId || "default"}`;
}

export function useOnboardingTour(orgId?: string) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    const completed = localStorage.getItem(getTourKey(orgId));
    if (!completed) {
      // Delay para que el calendario se renderice antes de posicionar tooltips
      const timer = setTimeout(() => setShouldShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [orgId]);

  const completeTour = useCallback(() => {
    if (orgId) {
      localStorage.setItem(getTourKey(orgId), "true");
    }
    setShouldShow(false);
  }, [orgId]);

  return { shouldShow, completeTour };
}

// ─── Component ───────────────────────────────────────────────────────────────
interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ isActive, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  // Position tooltip relative to target element
  const positionTooltip = useCallback(() => {
    if (!currentStep) return;
    // Run pre-step action (e.g., open favorites panel)
    currentStep.onBeforeStep?.();
    const el = document.querySelector(currentStep.target);
    if (!el) {
      // Target not found — skip to next or end
      if (!isLast) setStep((s) => s + 1);
      else onComplete();
      return;
    }

    const rect = el.getBoundingClientRect();
    const tooltipW = 320;
    const tooltipH = 180;
    const gap = 12;

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "top":
        top = rect.top - tooltipH - gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - gap;
        break;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

    setTooltipStyle({ top, left, width: tooltipW });

    // Scroll target into view & highlight
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "z-[9999]", "relative");

    return () => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "z-[9999]", "relative");
    };
  }, [currentStep, isLast, onComplete]);

  useEffect(() => {
    if (!isActive) return;
    const cleanup = positionTooltip();
    const handleResize = () => positionTooltip();
    window.addEventListener("resize", handleResize);
    return () => {
      cleanup?.();
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive, step, positionTooltip]);

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300"
        onClick={onComplete}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="fixed z-[10000] bg-card border border-border rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step counter */}
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground">
            Paso {step + 1} de {TOUR_STEPS.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold mb-1">{currentStep.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={onComplete}
          >
            Saltar tour
          </Button>
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => setStep((s) => s - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
                Anterior
              </Button>
            )}
            <Button
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => {
                if (isLast) {
                  onComplete();
                } else {
                  setStep((s) => s + 1);
                }
              }}
            >
              {isLast ? "Entendido" : "Siguiente"}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
