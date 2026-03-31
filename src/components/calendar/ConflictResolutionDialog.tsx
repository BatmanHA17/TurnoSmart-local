/**
 * ConflictResolutionDialog — Resolución de conflictos post-edición
 *
 * Se abre cuando el FOM edita un turno y la edición viola una regla del audit.
 * 3 opciones: Swap, Force Majeure (doble confirmación), Dismiss.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowLeftRight, ShieldAlert, XCircle } from "lucide-react";
import { SHIFT_TIMES } from "@/utils/engine/constants";

interface ConflictInfo {
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
  employeeId: string;
  employeeName: string;
  day: number;
  currentCode: string;
  newCode: string;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictInfo | null;
  employees: Array<{ id: string; name: string; currentShift?: string }>;
  onSwap: (partnerId: string) => Promise<void>;
  onForceMajeure: (reason: string) => Promise<void>;
  onDismiss: () => void;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflict,
  employees,
  onSwap,
  onForceMajeure,
  onDismiss,
}: ConflictResolutionDialogProps) {
  const [resolution, setResolution] = useState<"swap" | "force" | null>(null);
  const [swapPartnerId, setSwapPartnerId] = useState("");
  const [forceReason, setForceReason] = useState("");
  const [forceConfirmed, setForceConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!conflict) return null;

  const isCritical = conflict.severity === "critical";

  const handleSwap = async () => {
    if (!swapPartnerId) return;
    setIsSubmitting(true);
    try {
      await onSwap(swapPartnerId);
      onOpenChange(false);
      resetState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForce = async () => {
    if (!forceReason.trim() || !forceConfirmed) return;
    setIsSubmitting(true);
    try {
      await onForceMajeure(forceReason);
      onOpenChange(false);
      resetState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setResolution(null);
    setSwapPartnerId("");
    setForceReason("");
    setForceConfirmed(false);
  };

  // Filter employees eligible for swap (different from conflicted employee)
  const swapCandidates = employees.filter((e) => e.id !== conflict.employeeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${isCritical ? "text-red-500" : "text-yellow-500"}`} />
            Conflicto Detectado
          </DialogTitle>
          <DialogDescription>
            El cambio de {conflict.currentCode} a {conflict.newCode} para {conflict.employeeName} el día {conflict.day} viola una regla.
          </DialogDescription>
        </DialogHeader>

        {/* Conflict detail */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={isCritical ? "destructive" : "default"} className="text-[10px]">
              {conflict.rule}
            </Badge>
            <Badge variant={isCritical ? "destructive" : "secondary"} className="text-[10px]">
              {conflict.severity}
            </Badge>
          </div>
          <p className="text-sm">{conflict.description}</p>
        </div>

        <Separator />

        {/* Resolution options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Elige cómo resolver:</p>

          {/* Option 1: Swap */}
          <button
            type="button"
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              resolution === "swap" ? "border-blue-500 bg-blue-50" : "hover:bg-muted/50"
            }`}
            onClick={() => setResolution("swap")}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Intercambiar con otro empleado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selecciona un compañero y se valida 12h en ambos lados
            </p>
          </button>

          {resolution === "swap" && (
            <div className="pl-4 space-y-2">
              <Label className="text-xs">Intercambiar con:</Label>
              <Select value={swapPartnerId} onValueChange={setSwapPartnerId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {swapCandidates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} {e.currentShift ? `(${e.currentShift})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleSwap}
                disabled={!swapPartnerId || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Validando..." : "Realizar intercambio"}
              </Button>
            </div>
          )}

          {/* Option 2: Force Majeure */}
          <button
            type="button"
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              resolution === "force" ? "border-orange-500 bg-orange-50" : "hover:bg-muted/50"
            }`}
            onClick={() => setResolution("force")}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Fuerza mayor (override)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Forzar el cambio con doble confirmación + motivo registrado
            </p>
          </button>

          {resolution === "force" && (
            <div className="pl-4 space-y-2">
              <Label className="text-xs">Motivo de fuerza mayor (obligatorio):</Label>
              <Textarea
                className="text-xs"
                rows={2}
                placeholder="Explicar la razón del override..."
                value={forceReason}
                onChange={(e) => setForceReason(e.target.value)}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceConfirmed}
                  onChange={(e) => setForceConfirmed(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs">
                  Confirmo que este override es necesario y asumo la responsabilidad
                </span>
              </label>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleForce}
                disabled={!forceReason.trim() || !forceConfirmed || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Aplicando..." : "Forzar cambio"}
              </Button>
            </div>
          )}

          {/* Option 3: Dismiss */}
          <button
            type="button"
            className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            onClick={handleDismiss}
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cancelar cambio</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deshacer la edición y mantener el turno original
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
