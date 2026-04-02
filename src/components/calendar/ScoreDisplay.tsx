/**
 * ScoreDisplay — Score desglosado del motor SMART v2.0
 *
 * Muestra:
 * - Overall score (0-100) grande + semáforo badge
 * - 6 barras de progreso por categoría
 * - Resumen de violaciones (errores/avisos)
 *
 * Componente puro, reutilizable.
 */

import { AlertTriangle, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { ScoreBreakdown, TrafficLight, AuditViolation } from "@/utils/engine";

// ---------------------------------------------------------------------------
// TRAFFIC LIGHT MAPPING
// ---------------------------------------------------------------------------

const TRAFFIC_LIGHT_CONFIG: Record<TrafficLight, {
  variant: "success" | "warning" | "destructive";
  label: string;
  icon: typeof CheckCircle2;
}> = {
  green: { variant: "success", label: "OK", icon: CheckCircle2 },
  orange: { variant: "warning", label: "Revisar", icon: AlertTriangle },
  red: { variant: "destructive", label: "Conflictos", icon: AlertCircle },
};

// ---------------------------------------------------------------------------
// CATEGORY LABELS
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  legal: { label: "Legal", emoji: "⚖️" },
  coverage: { label: "Cobertura", emoji: "👥" },
  equity: { label: "Equidad", emoji: "⚖️" },
  petitions: { label: "Peticiones", emoji: "📋" },
  ergonomics: { label: "Ergonomía", emoji: "🔄" },
  continuity: { label: "Continuidad", emoji: "🔗" },
};

/** Color de la barra según valor */
function scoreColor(value: number): string {
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

interface ScoreDisplayProps {
  score: ScoreBreakdown;
  violations?: AuditViolation[];
  /** Modo compacto (sin desglose) */
  compact?: boolean;
  /** Callback cuando se hace clic en el badge "Revisar" (naranja) */
  onReviewClick?: () => void;
}

export function ScoreDisplay({ score, violations = [], compact = false, onReviewClick }: ScoreDisplayProps) {
  const config = TRAFFIC_LIGHT_CONFIG[score.trafficLight];
  const Icon = config.icon;

  const criticalCount = violations.filter((v) => v.severity === "critical").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;
  const infoCount = violations.filter((v) => v.severity === "info").length;

  return (
    <div className="space-y-4">
      {/* Overall Score + Semáforo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold tabular-nums">{score.overall}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <Badge
          variant={config.variant}
          className={`gap-1.5 px-3 py-1${onReviewClick && score.trafficLight !== 'green' ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={onReviewClick && score.trafficLight !== 'green' ? onReviewClick : undefined}
        >
          <Icon className="h-3.5 w-3.5" />
          {config.label}
        </Badge>
      </div>

      {!compact && (
        <>
          <Separator />

          {/* Desglose por categoría */}
          <div className="space-y-3">
            {(["legal", "coverage", "equity", "petitions", "ergonomics", "continuity"] as const).map(
              (key) => {
                const cat = CATEGORY_LABELS[key];
                const value = score[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs min-w-[90px] text-muted-foreground">
                      {cat.emoji} {cat.label}
                    </span>
                    <div className="flex-1 relative">
                      <Progress value={value} className="h-2" />
                    </div>
                    <span className="text-sm font-medium tabular-nums min-w-[28px] text-right">
                      {value}
                    </span>
                  </div>
                );
              }
            )}
          </div>

          {/* Violaciones */}
          {(criticalCount > 0 || warningCount > 0 || infoCount > 0) && (
            <>
              <Separator />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {criticalCount} error{criticalCount !== 1 ? "es" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {warningCount} aviso{warningCount !== 1 ? "s" : ""}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Info className="h-3.5 w-3.5" />
                    {infoCount} info
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
