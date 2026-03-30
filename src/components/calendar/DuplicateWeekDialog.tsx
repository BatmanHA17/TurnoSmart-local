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
import { AlertTriangle, Copy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DuplicateWeekDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (source: "week1" | "week2", target: "week1" | "week2") => void;
  week1Label: string;
  week2Label: string;
}

type WeekOption = "week1" | "week2";

export function DuplicateWeekDialog({
  open,
  onClose,
  onConfirm,
  week1Label,
  week2Label,
}: DuplicateWeekDialogProps) {
  const [source, setSource] = useState<WeekOption | null>(null);

  const target: WeekOption | null =
    source === "week1" ? "week2" : source === "week2" ? "week1" : null;

  const handleConfirm = () => {
    if (!source || !target) return;
    onConfirm(source, target);
    setSource(null);
  };

  const handleClose = () => {
    setSource(null);
    onClose();
  };

  const weekLabels: Record<WeekOption, string> = {
    week1: week1Label,
    week2: week2Label,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            <DialogTitle>Duplicar semana</DialogTitle>
          </div>
          <DialogDescription>
            Selecciona la semana origen. Sus turnos se copiarán día a día a la semana destino.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm font-medium text-muted-foreground">Copiar desde:</p>

          {(["week1", "week2"] as WeekOption[]).map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => setSource(week)}
              className={cn(
                "w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                source === week
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <span className="font-medium text-sm">{weekLabels[week]}</span>
              {source === week && (
                <span className="text-xs text-primary font-semibold uppercase tracking-wide">
                  Origen
                </span>
              )}
            </button>
          ))}

          {source && target && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
              <span className="text-sm text-muted-foreground truncate flex-1">
                {weekLabels[source]}
              </span>
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1 text-right">
                {weekLabels[target]}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Los turnos existentes en la semana destino serán reemplazados.
              Esta acción se puede deshacer con Ctrl+Z.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!source}>
            <Copy className="h-4 w-4 mr-1.5" />
            Duplicar semana
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
