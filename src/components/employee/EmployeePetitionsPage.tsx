/**
 * EmployeePetitionsPage — Autoservicio de peticiones para empleados
 *
 * Muestra "Mis Peticiones" con estados + botón "Nueva petición"
 * El empleado solo ve/crea sus propias peticiones (RLS endurecido)
 */

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useTurnoSmartRole } from "@/hooks/useTurnoSmartRole";
import { usePetitions, type PetitionRecord } from "@/hooks/usePetitions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import type { PetitionType, PetitionStatus } from "@/utils/engine";

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  A: { label: "Vacaciones / Ausencia", description: "Obligatoria (aprobada por RRHH)", color: "bg-red-100 text-red-800" },
  B: { label: "Preferencia", description: "El motor intentará respetarla", color: "bg-blue-100 text-blue-800" },
  C: { label: "Intercambio", description: "Acuerdo con otro compañero", color: "bg-purple-100 text-purple-800" },
  D: { label: "Recurrente", description: "Petición que se repite cada período (SMART detecta patrones)", color: "bg-emerald-100 text-emerald-800" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprobada", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  rejected: { label: "Rechazada", icon: XCircle, color: "bg-red-100 text-red-800" },
  auto_detected: { label: "Auto-detectada", icon: FileText, color: "bg-gray-100 text-gray-800" },
};

const SHIFT_OPTIONS = [
  { value: "M", label: "Mañana (M)" },
  { value: "T", label: "Tarde (T)" },
  { value: "N", label: "Noche (N)" },
  { value: "D", label: "Descanso (D)" },
  { value: "11x19", label: "Transición (11×19)" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function EmployeePetitionsPage() {
  const { org } = useCurrentOrganization();
  const { colaboradorId, loading: roleLoading } = useTurnoSmartRole();
  const { displayName } = useUserProfile();

  // Period: current month + next month
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const periodStart = format(selectedMonth, "yyyy-MM-dd");
  const periodEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { petitions, isLoading, createPetition, deletePetition, refresh } = usePetitions({
    organizationId: org?.id,
    periodStart,
    periodEnd,
  });

  // Filter to only this employee's petitions
  const myPetitions = useMemo(
    () => petitions.filter((p) => p.employee_id === colaboradorId),
    [petitions, colaboradorId]
  );

  const [showNewForm, setShowNewForm] = useState(false);

  // Navigation
  const goToPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
  const goToNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Mis Peticiones</h1>
        <p className="text-muted-foreground text-sm">
          Solicita vacaciones, preferencias de turno o intercambios con compañeros.
        </p>
      </div>

      {/* Month selector + New button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center capitalize">
            {format(selectedMonth, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva petición
        </Button>
      </div>

      {/* Petition list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : myPetitions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No tienes peticiones para {format(selectedMonth, "MMMM yyyy", { locale: es })}.
            </p>
            <Button variant="link" className="mt-2" onClick={() => setShowNewForm(true)}>
              Crear tu primera petición
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myPetitions.map((petition) => (
            <PetitionCard
              key={petition.id}
              petition={petition}
              onCancel={async () => {
                if (petition.status !== "pending") return;
                await deletePetition(petition.id);
                refresh();
              }}
            />
          ))}
        </div>
      )}

      {/* New petition dialog */}
      <NewPetitionDialog
        open={showNewForm}
        onOpenChange={setShowNewForm}
        colaboradorId={colaboradorId}
        organizationId={org?.id}
        periodStart={periodStart}
        periodEnd={periodEnd}
        totalDays={endOfMonth(selectedMonth).getDate()}
        onCreate={async (data) => {
          await createPetition(data);
          refresh();
          setShowNewForm(false);
        }}
      />
    </div>
  );
}

// ─── PetitionCard ────────────────────────────────────────────────────────────
function PetitionCard({
  petition,
  onCancel,
}: {
  petition: PetitionRecord;
  onCancel: () => Promise<void>;
}) {
  const [cancelling, setCancelling] = useState(false);
  const status = STATUS_CONFIG[petition.status] || STATUS_CONFIG.pending;
  const type = TYPE_LABELS[petition.type] || TYPE_LABELS.B;
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Type + Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px]", type.color)}>
                Tipo {petition.type} — {type.label}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] gap-1", status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>

            {/* Days */}
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                Día{petition.days.length > 1 ? "s" : ""}: {petition.days.sort((a, b) => a - b).join(", ")}
              </span>
            </div>

            {/* Shift preference */}
            {petition.requested_shift && (
              <div className="text-xs text-muted-foreground">
                Turno solicitado: <span className="font-medium text-foreground">{petition.requested_shift}</span>
              </div>
            )}
            {petition.avoid_shift && (
              <div className="text-xs text-muted-foreground">
                Evitar: <span className="font-medium text-foreground">{petition.avoid_shift}</span>
              </div>
            )}

            {/* Reason */}
            {petition.reason && (
              <p className="text-xs text-muted-foreground italic">"{petition.reason}"</p>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground">
              Creada: {format(new Date(petition.created_at), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>

          {/* Cancel button (only for pending) */}
          {petition.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive text-xs"
              disabled={cancelling}
              onClick={async () => {
                setCancelling(true);
                try {
                  await onCancel();
                } finally {
                  setCancelling(false);
                }
              }}
            >
              {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancelar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── NewPetitionDialog ───────────────────────────────────────────────────────
function NewPetitionDialog({
  open,
  onOpenChange,
  colaboradorId,
  organizationId,
  periodStart,
  periodEnd,
  totalDays,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId: string | null;
  organizationId: string | undefined;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  onCreate: (data: Omit<PetitionRecord, "id" | "created_at" | "updated_at" | "employee_name">) => Promise<void>;
}) {
  const [type, setType] = useState<PetitionType>("B");
  const [daysInput, setDaysInput] = useState("");
  const [requestedShift, setRequestedShift] = useState<string>("");
  const [avoidShift, setAvoidShift] = useState<string>("");
  const [priority, setPriority] = useState(3);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedDays = useMemo(() => {
    return daysInput
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= totalDays);
  }, [daysInput, totalDays]);

  const canSubmit = parsedDays.length > 0 && colaboradorId && organizationId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({
        employee_id: colaboradorId!,
        organization_id: organizationId!,
        type,
        status: "pending" as PetitionStatus,
        days: parsedDays,
        requested_shift: requestedShift || null,
        avoid_shift: avoidShift || null,
        exchange_with_employee_id: null,
        exchange_day: null,
        priority,
        reason: reason.trim() || null,
        period_start: periodStart,
        period_end: periodEnd,
      });
      // Reset form
      setType("B");
      setDaysInput("");
      setRequestedShift("");
      setAvoidShift("");
      setPriority(3);
      setReason("");
      toast({ title: "Petición enviada", description: "Tu responsable la revisará pronto." });
    } catch (err) {
      toast({ title: "Error", description: "No se pudo crear la petición.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva petición</DialogTitle>
          <DialogDescription>
            Crea una solicitud de vacaciones, preferencia de turno o intercambio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de petición</Label>
            <Select value={type} onValueChange={(v) => setType(v as PetitionType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    <span className="font-medium">Tipo {key}</span> — {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {TYPE_LABELS[type]?.description}
            </p>
          </div>

          {/* Days */}
          <div className="space-y-1.5">
            <Label className="text-xs">Días del mes (1-{totalDays})</Label>
            <Input
              placeholder="Ej: 5, 6, 7, 12"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              className="h-9"
            />
            {parsedDays.length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {parsedDays.length} día{parsedDays.length > 1 ? "s" : ""} seleccionado{parsedDays.length > 1 ? "s" : ""}:{" "}
                {parsedDays.sort((a, b) => a - b).join(", ")}
              </p>
            )}
          </div>

          {/* Shift preference (only for type B) */}
          {type === "B" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Turno preferido</Label>
                <Select value={requestedShift} onValueChange={setRequestedShift}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Ninguno</SelectItem>
                    {SHIFT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Evitar turno</Label>
                <Select value={avoidShift} onValueChange={setAvoidShift}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Ninguno</SelectItem>
                    {SHIFT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs">Prioridad</Label>
            <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 — Urgente</SelectItem>
                <SelectItem value="2">2 — Alta</SelectItem>
                <SelectItem value="3">3 — Normal</SelectItem>
                <SelectItem value="4">4 — Baja</SelectItem>
                <SelectItem value="5">5 — Si es posible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea
              placeholder="Explica brevemente el motivo de tu petición..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={2}
              className="resize-none text-sm"
            />
            <p className="text-[10px] text-muted-foreground text-right">
              {reason.length}/200
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar petición
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
