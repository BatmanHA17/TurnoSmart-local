/**
 * CriteriaConfigDialog — Configuración de criterios del motor SMART
 *
 * Secciones: Obligatorios (siempre ON), Opcionales (toggle + boost 1-5 + nota)
 * Lee/escribe schedule_criteria via useCriteria hook.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Sliders, RotateCcw, Users } from "lucide-react";
import type { CriteriaRecord } from "@/hooks/useCriteria";

interface CriteriaConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criteria: CriteriaRecord[];
  isLoading: boolean;
  onToggle: (key: string, enabled: boolean, boost: number, boostNote?: string) => Promise<void>;
  onSeedDefaults: () => Promise<void>;
}

const BOOST_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Moderado",
  3: "Enfatizado",
  4: "Alto",
  5: "Máximo",
};

export function CriteriaConfigDialog({
  open,
  onOpenChange,
  criteria,
  isLoading,
  onToggle,
  onSeedDefaults,
}: CriteriaConfigDialogProps) {
  const COVERAGE_KEYS = ["MIN_COVERAGE_M", "MIN_COVERAGE_T", "MIN_COVERAGE_N"];
  const coverageCriteria = criteria.filter((c) => COVERAGE_KEYS.includes(c.criteria_key));
  const HIDDEN_KEYS = [...COVERAGE_KEYS, "CROSS_PERIOD_12H"]; // CROSS_PERIOD_12H merged into 12H_REST
  const mandatory = criteria.filter((c) => c.category === "mandatory" && !HIDDEN_KEYS.includes(c.criteria_key));
  const optional = criteria.filter((c) => c.category === "optional");
  const custom = criteria.filter((c) => c.category === "custom");

  const COVERAGE_LABELS: Record<string, { label: string; short: string }> = {
    MIN_COVERAGE_M: { label: "Mañana (M)", short: "M" },
    MIN_COVERAGE_T: { label: "Tarde (T)", short: "T" },
    MIN_COVERAGE_N: { label: "Noche (N)", short: "N" },
  };

  // Local state for boost edits
  const [localBoosts, setLocalBoosts] = useState<Record<string, { boost: number; note: string }>>({});

  useEffect(() => {
    const boosts: Record<string, { boost: number; note: string }> = {};
    for (const c of criteria) {
      boosts[c.criteria_key] = { boost: c.boost, note: c.boost_note || "" };
    }
    setLocalBoosts(boosts);
  }, [criteria]);

  const handleToggle = async (c: CriteriaRecord, enabled: boolean) => {
    const local = localBoosts[c.criteria_key];
    await onToggle(c.criteria_key, enabled, local?.boost ?? c.boost, local?.note ?? c.boost_note ?? "");
  };

  const handleBoostChange = (key: string, boost: number) => {
    setLocalBoosts((prev) => ({
      ...prev,
      [key]: { ...prev[key], boost },
    }));
  };

  const handleBoostCommit = async (c: CriteriaRecord) => {
    const local = localBoosts[c.criteria_key];
    if (local) {
      await onToggle(c.criteria_key, c.enabled, local.boost, local.note);
    }
  };

  const handleNoteChange = (key: string, note: string) => {
    setLocalBoosts((prev) => ({
      ...prev,
      [key]: { ...prev[key], note },
    }));
  };

  const handleCoverageChange = async (key: string, delta: number) => {
    const c = coverageCriteria.find((cr) => cr.criteria_key === key);
    if (!c) return;
    const current = localBoosts[key]?.boost ?? c.boost;
    const next = Math.max(1, Math.min(5, current + delta));
    setLocalBoosts((prev) => ({ ...prev, [key]: { ...prev[key], boost: next } }));
    await onToggle(key, true, next, "");
  };

  const renderCoverageSection = () => {
    if (coverageCriteria.length === 0) return null;
    return (
      <div className="mb-3 rounded-md border border-border bg-muted/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold">Cobertura mínima por turno</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {COVERAGE_KEYS.map((key) => {
            const c = coverageCriteria.find((cr) => cr.criteria_key === key);
            if (!c) return null;
            const value = localBoosts[key]?.boost ?? c.boost;
            const meta = COVERAGE_LABELS[key];
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{meta?.label}</span>
                <div className="flex items-center gap-1">
                  <button
                    className="h-6 w-6 rounded border text-sm font-bold hover:bg-accent"
                    onClick={() => handleCoverageChange(key, -1)}
                    disabled={value <= 1}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{value}</span>
                  <button
                    className="h-6 w-6 rounded border text-sm font-bold hover:bg-accent"
                    onClick={() => handleCoverageChange(key, 1)}
                    disabled={value >= 5}
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {value === 1 ? "persona" : "personas"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          💡 El motor alertará si no puede cubrir estos mínimos con el equipo disponible.
        </p>
      </div>
    );
  };

  const renderCriterion = (c: CriteriaRecord, isMandatory: boolean) => {
    const local = localBoosts[c.criteria_key] ?? { boost: c.boost, note: "" };

    return (
      <div key={c.criteria_key} className="py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{c.criteria_name}</span>
              {isMandatory && <Badge variant="outline" className="text-[9px]">Ley</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
          </div>
          <Switch
            checked={c.enabled}
            onCheckedChange={(checked) => handleToggle(c, checked)}
            disabled={isMandatory}
          />
        </div>

        {/* Boost slider (solo opcionales habilitados) */}
        {!isMandatory && c.enabled && (
          <div className="pl-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-12">Boost</Label>
              <Slider
                value={[local.boost]}
                min={1}
                max={5}
                step={1}
                className="flex-1"
                onValueChange={([v]) => handleBoostChange(c.criteria_key, v)}
                onValueCommit={() => handleBoostCommit(c)}
              />
              <Badge
                variant={local.boost >= 4 ? "destructive" : local.boost >= 3 ? "default" : "secondary"}
                className="text-[9px] w-16 justify-center"
              >
                {BOOST_LABELS[local.boost]}
              </Badge>
            </div>
            {local.boost >= 3 && (
              <Input
                className="h-7 text-xs"
                placeholder="Nota del boost (opcional): ej. Reforzar M los días 3, 6, 8"
                value={local.note}
                onChange={(e) => handleNoteChange(c.criteria_key, e.target.value)}
                onBlur={() => handleBoostCommit(c)}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Criterios del Motor SMART
          </DialogTitle>
        </DialogHeader>

        {criteria.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">No hay criterios configurados para esta organización.</p>
            <Button onClick={onSeedDefaults} variant="outline" size="sm">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Inicializar criterios por defecto
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-3">
            {/* Cobertura mínima por turno */}
            {renderCoverageSection()}

            {/* Obligatorios */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold">Obligatorios (Ley)</h3>
                <Badge variant="destructive" className="text-[9px]">Siempre ON</Badge>
              </div>
              {mandatory.map((c) => renderCriterion(c, true))}
            </div>

            <Separator className="my-3" />

            {/* Opcionales */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold">Opcionales</h3>
                <Badge variant="secondary" className="text-[9px]">Toggle + Boost</Badge>
              </div>
              {optional.map((c) => renderCriterion(c, false))}
            </div>

            {/* Custom */}
            {custom.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold mb-2">Personalizados</h3>
                  {custom.map((c) => renderCriterion(c, false))}
                </div>
              </>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          {criteria.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onSeedDefaults} className="mr-auto text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar defaults
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
