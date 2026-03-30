/**
 * EquityBadge — Mini-badge de equidad por empleado
 *
 * Muestra el balance M/T/N acumulado del empleado como indicador visual.
 * Toggleable desde la toolbar del calendario (capa "equidad").
 *
 * Estados:
 * - balanced (±3): sin badge o verde
 * - warning (>3): naranja
 * - critical (>5): rojo
 */

import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EquityDeviation } from "@/utils/engine";

interface EquityBadgeProps {
  deviation: EquityDeviation;
  /** Modo compacto: solo icono con color */
  compact?: boolean;
}

const STATUS_CONFIG = {
  balanced: {
    variant: "secondary" as const,
    className: "text-green-700 bg-green-50 border-green-200",
    label: "Equilibrado",
  },
  warning: {
    variant: "warning" as const,
    className: "",
    label: "Desviación moderada",
  },
  critical: {
    variant: "destructive" as const,
    className: "",
    label: "Desviación alta",
  },
};

export function EquityBadge({ deviation, compact = false }: EquityBadgeProps) {
  const config = STATUS_CONFIG[deviation.status];

  // Si está equilibrado y es compacto, no mostrar nada
  if (deviation.status === "balanced" && compact) return null;

  const content = (
    <Badge
      variant={config.variant}
      className={`text-[10px] px-1 py-0 gap-0.5 cursor-default ${config.className}`}
    >
      <Scale className="h-2.5 w-2.5" />
      {!compact && `±${deviation.maxDeviation}`}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs max-w-[200px]">
        <p className="font-medium mb-1">{config.label}</p>
        <div className="space-y-0.5 text-muted-foreground">
          <p>M: {deviation.morningDev > 0 ? "+" : ""}{deviation.morningDev}</p>
          <p>T: {deviation.afternoonDev > 0 ? "+" : ""}{deviation.afternoonDev}</p>
          <p>N: {deviation.nightDev > 0 ? "+" : ""}{deviation.nightDev}</p>
          <p>FDS: {deviation.weekendDev > 0 ? "+" : ""}{deviation.weekendDev}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
