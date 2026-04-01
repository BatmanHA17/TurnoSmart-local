/**
 * PlantillaCalculator — Widget de cálculo de plantilla RRHH
 *
 * Fórmulas (validadas por PO):
 *   Plantilla Bruta     = total contratos
 *   Cobertura Vacaciones = Bruta × (48 / 365)
 *   Plantilla Activa     = Bruta - Vacaciones
 *   Plantilla Presencial = Activa / 1.4   (factor 7 días / 5 días trabajo)
 *
 * El techo presencial es el máximo de personas que deberían trabajar
 * simultáneamente en un día. Si se supera → alerta de riesgo.
 */

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, TrendingUp, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const VACATION_DAYS_PER_YEAR = 48; // Hostelería España (30 naturales + 18 festivos)
const DAYS_PER_YEAR = 365;
const WEEKLY_COVERAGE_FACTOR = 1.4; // 7 días / 5 días trabajo

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PlantillaData {
  bruta: number;
  coberturaVacaciones: number;
  activa: number;
  presencial: number;
  presencialRounded: number;
}

interface PlantillaCalculatorProps {
  /** Total de empleados con contrato */
  employeeCount: number;
  /** Personas programadas hoy (para comparar con techo) */
  scheduledToday?: number;
  /** Modo compacto para embeder en otros componentes */
  compact?: boolean;
  /** CSS class extra */
  className?: string;
}

// ─── Pure calculation ────────────────────────────────────────────────────────
export function calculatePlantilla(employeeCount: number): PlantillaData {
  const bruta = employeeCount;
  const coberturaVacaciones = bruta * (VACATION_DAYS_PER_YEAR / DAYS_PER_YEAR);
  const activa = bruta - coberturaVacaciones;
  const presencial = activa / WEEKLY_COVERAGE_FACTOR;
  const presencialRounded = Math.round(presencial);

  return { bruta, coberturaVacaciones, activa, presencial, presencialRounded };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function PlantillaCalculator({
  employeeCount,
  scheduledToday,
  compact = false,
  className,
}: PlantillaCalculatorProps) {
  const data = useMemo(() => calculatePlantilla(employeeCount), [employeeCount]);

  const overCeiling = scheduledToday !== undefined && scheduledToday > data.presencialRounded;
  const overBy = overCeiling ? scheduledToday! - data.presencialRounded : 0;

  if (compact) {
    return (
      <div className={cn("text-xs space-y-1", className)}>
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <Calculator className="h-3 w-3" />
          Plantilla
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">Bruta</span>
          <span className="font-medium text-right">{data.bruta}</span>
          <span className="text-muted-foreground">Activa</span>
          <span className="font-medium text-right">{data.activa.toFixed(1)}</span>
          <span className="text-muted-foreground">Presencial</span>
          <span className="font-semibold text-right">{data.presencialRounded}/día</span>
        </div>
        {overCeiling && (
          <div className="flex items-center gap-1 text-amber-600 mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>+{overBy} sobre techo ({scheduledToday} vs {data.presencialRounded})</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(overCeiling ? "border-amber-300" : "", className)}>
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Tu Plantilla
          </h4>
          {overCeiling && (
            <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px]">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Exceso
            </Badge>
          )}
        </div>

        {/* Grid de métricas */}
        <div className="space-y-2">
          <Row label="Bruta" value={`${data.bruta} contratos`} />
          <Row
            label="Vacaciones"
            value={`${data.coberturaVacaciones.toFixed(2)} U (cobertura anual)`}
            muted
          />
          <Row label="Activa" value={`${data.activa.toFixed(2)} U`} />
          <div className="h-px bg-border" />
          <Row
            label="Presencial"
            value={`${data.presencial.toFixed(2)} → ${data.presencialRounded} personas/día`}
            bold
          />
        </div>

        {/* Alerta de exceso */}
        {overCeiling && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Hoy tienes {scheduledToday} presenciales programados
            </div>
            <p className="text-amber-700">
              {overBy} persona{overBy > 1 ? "s" : ""} de más vs tu techo ({data.presencialRounded}).
              Riesgo: vacaciones no disfrutadas a final de año.
            </p>
          </div>
        )}

        {/* Info sobre factor */}
        <p className="text-[10px] text-muted-foreground">
          Factor ×1.4 (7d/5d). Vacaciones: {VACATION_DAYS_PER_YEAR}d/año (hostelería España).
        </p>
      </CardContent>
    </Card>
  );
}

// Helper para filas
function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={cn("text-muted-foreground", bold && "font-medium text-foreground")}>
        {label}
      </span>
      <span className={cn(muted && "text-muted-foreground", bold && "font-semibold")}>
        {value}
      </span>
    </div>
  );
}
