/**
 * AlternativesResultSheet — Panel de resultados SMART v2.0
 *
 * Muestra las 3 alternativas generadas en Tabs.
 * El FOM compara scores y elige cuál aplicar al calendario.
 */

import { Clock, Sparkles, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreDisplay } from "./ScoreDisplay";
import type { GenerationResult, ScheduleAlternative } from "@/utils/engine";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface AlternativesResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generation: GenerationResult | null;
  onApplyAlternative: (index: number) => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function AlternativesResultSheet({
  open,
  onOpenChange,
  generation,
  onApplyAlternative,
}: AlternativesResultSheetProps) {
  if (!generation) return null;

  const { alternatives, recommendedIndex, generatedAt } = generation;
  const generatedTime = new Date(generatedAt);
  const durationMs = alternatives[0]?.output.meta.durationMs ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[460px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Cuadrantes SMART Generados
          </SheetTitle>
          <SheetDescription className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationMs}ms
            </span>
            <span>
              {generatedTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>
              {alternatives[0]?.output.meta.totalEmployees} empleados
              {" · "}
              {alternatives[0]?.output.meta.totalDays} días
            </span>
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={alternatives[recommendedIndex]?.id ?? alternatives[0]?.id}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {alternatives.map((alt, idx) => (
              <TabsTrigger
                key={alt.id}
                value={alt.id}
                className="text-xs gap-1 relative"
              >
                {idx === recommendedIndex && (
                  <Star className="h-3 w-3 text-violet-600 fill-violet-600" />
                )}
                {alt.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {alternatives.map((alt, idx) => (
            <TabsContent key={alt.id} value={alt.id}>
              <AlternativeCard
                alternative={alt}
                isRecommended={idx === recommendedIndex}
                onApply={() => onApplyAlternative(idx)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// ALTERNATIVE CARD
// ---------------------------------------------------------------------------

interface AlternativeCardProps {
  alternative: ScheduleAlternative;
  isRecommended: boolean;
  onApply: () => void;
}

function AlternativeCard({ alternative, isRecommended, onApply }: AlternativeCardProps) {
  const { output, label, weights } = alternative;
  const { score, violations } = output;

  return (
    <div className="space-y-4">
      {/* Recommended badge */}
      {isRecommended && (
        <Badge variant="info" className="gap-1">
          <Star className="h-3 w-3" />
          Recomendada
        </Badge>
      )}

      {/* Score */}
      <Card>
        <CardContent className="pt-4">
          <ScoreDisplay score={score} violations={violations} />
        </CardContent>
      </Card>

      {/* Weight profile info */}
      <div className="px-1">
        <p className="text-xs text-muted-foreground mb-2">Prioridad de pesos:</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries({
            Equidad: weights.equity,
            Cobertura: weights.coverage,
            Peticiones: weights.petitions,
            Ergonomía: weights.ergonomics,
            Continuidad: weights.continuity,
          })
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => (
              <Badge
                key={name}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {name} {Math.round(value * 100)}%
              </Badge>
            ))}
        </div>
      </div>

      <Separator />

      {/* Apply button */}
      <Button
        onClick={onApply}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
      >
        <Sparkles className="h-4 w-4" />
        Aplicar versión {label}
      </Button>
    </div>
  );
}
