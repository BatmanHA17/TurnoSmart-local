/**
 * SmartSuggestionsPanel — Panel SMART+IA
 *
 * Muestra las sugerencias proactivas detectadas por el motor SMART+IA.
 * El FOM puede aceptar, postponer o descartar cada sugerencia.
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Star,
  RefreshCw,
  Settings2,
  Zap,
  Eye,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  Check,
  X,
  Clock,
} from "lucide-react";
import type { SmartSuggestion, SuggestionType } from "@/utils/engine/smartIA";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUGGESTION_META: Record<
  SuggestionType,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  auto_favorite: {
    icon: <Star className="h-4 w-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  recurrent_petition: {
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  config_suggestion: {
    icon: <Settings2 className="h-4 w-4" />,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950",
  },
  smart_conflict: {
    icon: <Zap className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  reinforcement: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
  accountability: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
  },
  viz_preference: {
    icon: <Eye className="h-4 w-4" />,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950",
  },
  absence_save: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950",
  },
  vacation_alert: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
  transition_proposal: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SmartSuggestionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: SmartSuggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SmartSuggestionsPanel({
  open,
  onOpenChange,
  suggestions,
  onAccept,
  onDismiss,
  onClearAll,
}: SmartSuggestionsPanelProps) {
  const pending = suggestions.filter((s) => !s.dismissed);
  const dismissed = suggestions.filter((s) => s.dismissed);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <SheetTitle>Sugerencias SMART+IA</SheetTitle>
            {pending.length > 0 && (
              <Badge className="ml-auto bg-violet-600 text-white text-xs">
                {pending.length}
              </Badge>
            )}
          </div>
          <SheetDescription>
            El sistema detecta patrones y te propone mejoras proactivas.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {pending.length === 0 && dismissed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Sparkles className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin sugerencias por ahora</p>
              <p className="text-xs mt-1 opacity-70">
                Genera un cuadrante para que SMART+IA analice los patrones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pendientes */}
              {pending.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Pendientes ({pending.length})
                    </p>
                    {pending.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground"
                        onClick={onClearAll}
                      >
                        Descartar todas
                      </Button>
                    )}
                  </div>

                  {pending.map((s) => {
                    const meta = SUGGESTION_META[s.type];
                    return (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        meta={meta}
                        onAccept={() => onAccept(s.id)}
                        onDismiss={() => onDismiss(s.id)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Separador */}
              {pending.length > 0 && dismissed.length > 0 && (
                <Separator />
              )}

              {/* Descartadas */}
              {dismissed.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Respondidas ({dismissed.length})
                  </p>
                  {dismissed.map((s) => {
                    const meta = SUGGESTION_META[s.type];
                    return (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        meta={meta}
                        onAccept={() => onAccept(s.id)}
                        onDismiss={() => onDismiss(s.id)}
                        isDismissed
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// SuggestionCard
// ---------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: SmartSuggestion;
  meta: { icon: React.ReactNode; color: string; bgColor: string };
  onAccept: () => void;
  onDismiss: () => void;
  isDismissed?: boolean;
}

function SuggestionCard({
  suggestion,
  meta,
  onAccept,
  onDismiss,
  isDismissed,
}: SuggestionCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-opacity ${
        isDismissed ? "opacity-50" : ""
      } ${meta.bgColor}`}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${meta.color}`}>
            {suggestion.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {suggestion.description}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5" />
        <span>
          {new Date(suggestion.createdAt).toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Actions */}
      {!isDismissed && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={onAccept}
          >
            <Check className="h-3 w-3" />
            {suggestion.actionLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
            Ignorar
          </Button>
        </div>
      )}
    </div>
  );
}
