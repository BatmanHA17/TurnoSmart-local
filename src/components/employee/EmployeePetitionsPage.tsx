/**
 * EmployeePetitionsPage — Autoservicio de peticiones para empleados
 *
 * Muestra "Mis Peticiones" con estados + botón "Nueva petición"
 * El empleado solo ve/crea sus propias peticiones (RLS endurecido)
 */

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Trash2,
  Pencil,
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
  A: { label: "Vacaciones / Ausencia", description: "Petición dura — se respeta al 100%", color: "bg-red-100 text-red-800" },
  B: { label: "Preferencia", description: "Petición blanda — el motor intentará respetarla", color: "bg-blue-100 text-blue-800" },
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

// ─── Request type options for the new "¿Qué solicitas?" dropdown ────────────
type RequestOption = {
  value: string;
  label: string;
  autoType: "A" | "B";
  autoPriority: number;
  /** For Tipo B, this is the requested_shift value */
  shiftCode?: string;
};

const REQUEST_OPTIONS: RequestOption[] = [
  // Tipo A (Dura) — priority 1
  { value: "V",  label: "Vacaciones (V)",        autoType: "A", autoPriority: 1 },
  { value: "D",  label: "Descanso (D)",          autoType: "A", autoPriority: 1 },
  { value: "F",  label: "Festivo (F)",           autoType: "A", autoPriority: 1 },
  { value: "DB", label: "Día Debido (DB)",       autoType: "A", autoPriority: 1 },
  { value: "DG", label: "Debido Guardia (DG)",   autoType: "A", autoPriority: 1 },
  { value: "PM", label: "Permiso Mudanza (PM)",  autoType: "A", autoPriority: 1 },
  { value: "PC", label: "Permiso Curso (PC)",    autoType: "A", autoPriority: 1 },
  { value: "E",  label: "Enfermedad (E)",        autoType: "A", autoPriority: 1 },
  { value: "L",  label: "Licencia (L)",          autoType: "A", autoPriority: 1 },
  // Tipo B (Blanda) — priority 3
  { value: "pref_M",     label: "Preferir Mañana (M)",       autoType: "B", autoPriority: 3, shiftCode: "M" },
  { value: "pref_T",     label: "Preferir Tarde (T)",        autoType: "B", autoPriority: 3, shiftCode: "T" },
  { value: "pref_N",     label: "Preferir Noche (N)",        autoType: "B", autoPriority: 3, shiftCode: "N" },
  { value: "pref_9x17",  label: "Preferir 9×17",            autoType: "B", autoPriority: 3, shiftCode: "9x17" },
  { value: "pref_12x20", label: "Preferir 12×20",           autoType: "B", autoPriority: 3, shiftCode: "12x20" },
  { value: "pref_11x19", label: "Preferir 11×19",           autoType: "B", autoPriority: 3, shiftCode: "11x19" },
];

// ─── Mini-calendar helper ───────────────────────────────────────────────────
function MiniCalendarPicker({
  totalDays,
  selectedDays,
  onToggleDay,
  periodStart,
}: {
  totalDays: number;
  selectedDays: number[];
  onToggleDay: (day: number, shiftHeld: boolean) => void;
  periodStart: string;
}) {
  const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Calculate which weekday the 1st falls on (0=Mon ... 6=Sun)
  const firstDate = new Date(periodStart + "T00:00:00");
  // JS getDay: 0=Sun, 1=Mon... convert to 0=Mon format
  const jsDay = firstDate.getDay();
  const startOffset = jsDay === 0 ? 6 : jsDay - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-1.5">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0.5">
        {weekDayLabels.map((wd) => (
          <div key={wd} className="text-[10px] text-muted-foreground text-center font-medium py-0.5">
            {wd}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }
          const isSelected = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={cn(
                "h-8 w-full rounded text-xs font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/40 text-foreground"
              )}
              onClick={(e) => onToggleDay(day, e.shiftKey)}
            >
              {day}
            </button>
          );
        })}
      </div>
      {/* Count */}
      {selectedDays.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {selectedDays.length} día{selectedDays.length > 1 ? "s" : ""} seleccionado{selectedDays.length > 1 ? "s" : ""}:{" "}
          {[...selectedDays].sort((a, b) => a - b).join(", ")}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground/60">
        Clic = seleccionar/deseleccionar. Shift+clic = seleccionar rango.
      </p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function EmployeePetitionsPage() {
  const { org } = useCurrentOrganization();
  const { colaboradorId, loading: roleLoading } = useTurnoSmartRole();
  const { displayName } = useUserProfile();

  // Period: current month + next month
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const periodStart = format(selectedMonth, "yyyy-MM-dd");
  const periodEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { petitions, isLoading, createPetition, updatePetition, deletePetition, refresh } = usePetitions({
    organizationId: org?.id,
    periodStart,
    periodEnd,
  });

  // Load employees for Manager view (when colaboradorId is null)
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    if (!org?.id || colaboradorId) return; // Only load for manager (no colaboradorId)
    supabase
      .from('colaboradores')
      .select('id, nombre, apellidos')
      .eq('org_id', org.id)
      .eq('status', 'activo')
      .order('nombre')
      .then(({ data }) => {
        if (data) setEmployeesList(data.map(c => ({ id: c.id, name: `${c.nombre} ${c.apellidos || ''}`.trim() })));
      });
  }, [org?.id, colaboradorId]);

  // Filter to only this employee's petitions (or all for manager)
  const myPetitions = useMemo(
    () => colaboradorId ? petitions.filter((p) => p.employee_id === colaboradorId) : petitions,
    [petitions, colaboradorId]
  );

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingPetition, setEditingPetition] = useState<PetitionRecord | null>(null);

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
              onEdit={(p) => {
                setEditingPetition(p);
                setShowNewForm(true);
              }}
              onCancel={async () => {
                await deletePetition(petition.id);
                refresh();
              }}
            />
          ))}
        </div>
      )}

      {/* New / Edit petition dialog */}
      <NewPetitionDialog
        open={showNewForm}
        onOpenChange={(open) => {
          setShowNewForm(open);
          if (!open) setEditingPetition(null);
        }}
        colaboradorId={colaboradorId}
        organizationId={org?.id}
        periodStart={periodStart}
        periodEnd={periodEnd}
        totalDays={endOfMonth(selectedMonth).getDate()}
        employees={employeesList}
        editingPetition={editingPetition}
        onCreate={async (data) => {
          await createPetition(data);
          refresh();
          setShowNewForm(false);
        }}
        onUpdate={async (id, data) => {
          await updatePetition(id, data);
          refresh();
          setShowNewForm(false);
          setEditingPetition(null);
        }}
      />
    </div>
  );
}

// ─── PetitionCard ────────────────────────────────────────────────────────────
function PetitionCard({
  petition,
  onEdit,
  onCancel,
}: {
  petition: PetitionRecord;
  onEdit: (petition: PetitionRecord) => void;
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

          {/* Edit + Delete buttons (always visible) */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={() => onEdit(petition)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
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
              {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
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
  onUpdate,
  employees,
  editingPetition,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorId: string | null;
  organizationId: string | undefined;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  onCreate: (data: Omit<PetitionRecord, "id" | "created_at" | "updated_at" | "employee_name">) => Promise<void>;
  onUpdate?: (id: string, data: Partial<PetitionRecord>) => Promise<void>;
  employees?: Array<{ id: string; name: string }>;
  editingPetition?: PetitionRecord | null;
}) {
  const isEditing = !!editingPetition;

  // The main "what are you requesting?" selector value
  const [requestOption, setRequestOption] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [lastClickedDay, setLastClickedDay] = useState<number | null>(null);
  const [avoidShift, setAvoidShift] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(colaboradorId || "");

  // Derived values from the selected request option
  const currentOption = REQUEST_OPTIONS.find((o) => o.value === requestOption);
  const autoType: PetitionType = currentOption?.autoType ?? "B";
  const autoPriority = currentOption?.autoPriority ?? 3;
  const autoRequestedShift = currentOption?.shiftCode ?? null;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingPetition && open) {
      // Try to match to a request option
      const matchedOpt = REQUEST_OPTIONS.find((o) => {
        if (editingPetition.type === "A") {
          return o.autoType === "A" && o.value === editingPetition.requested_shift;
        }
        // For Tipo B, match by shiftCode
        return o.autoType === "B" && o.shiftCode === editingPetition.requested_shift;
      });
      setRequestOption(matchedOpt?.value ?? "");
      setSelectedDays([...editingPetition.days].sort((a, b) => a - b));
      setAvoidShift(editingPetition.avoid_shift || "");
      setReason(editingPetition.reason || "");
      setSelectedEmployeeId(editingPetition.employee_id || colaboradorId || "");
      setLastClickedDay(null);
    }
  }, [editingPetition, open, colaboradorId]);

  // Use colaboradorId if available (employee view), otherwise use selected (manager view)
  const effectiveEmployeeId = colaboradorId || selectedEmployeeId;

  const canSubmit = selectedDays.length > 0 && effectiveEmployeeId && organizationId && requestOption;

  const resetForm = () => {
    setRequestOption("");
    setSelectedDays([]);
    setLastClickedDay(null);
    setAvoidShift("");
    setReason("");
  };

  // Mini-calendar toggle handler with shift+click range support
  const handleToggleDay = (day: number, shiftHeld: boolean) => {
    setSelectedDays((prev) => {
      if (shiftHeld && lastClickedDay !== null) {
        // Range selection: select all days between lastClickedDay and day
        const lo = Math.min(lastClickedDay, day);
        const hi = Math.max(lastClickedDay, day);
        const range: number[] = [];
        for (let d = lo; d <= hi; d++) range.push(d);
        // Merge with existing, dedupe
        const merged = new Set([...prev, ...range]);
        return [...merged].sort((a, b) => a - b);
      }
      // Simple toggle
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
    setLastClickedDay(day);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // For Tipo A, the requested_shift is the absence/leave code (V, D, F, etc.)
      // For Tipo B, the requested_shift is the preferred shift code (M, T, N, etc.)
      const resolvedRequestedShift = autoType === "A"
        ? requestOption  // The absence code itself (V, D, F, DB, etc.)
        : (autoRequestedShift || null);

      if (isEditing && onUpdate) {
        await onUpdate(editingPetition!.id, {
          type: autoType,
          days: selectedDays,
          requested_shift: resolvedRequestedShift,
          avoid_shift: (autoType === "B" && avoidShift && avoidShift !== "_none") ? avoidShift : null,
          priority: autoPriority,
          reason: reason.trim() || null,
          employee_id: effectiveEmployeeId!,
        });
        resetForm();
        toast({ title: "Petición actualizada", description: "Los cambios se han guardado." });
      } else {
        await onCreate({
          employee_id: effectiveEmployeeId!,
          organization_id: organizationId!,
          type: autoType,
          status: "pending" as PetitionStatus,
          days: selectedDays,
          requested_shift: resolvedRequestedShift,
          avoid_shift: (autoType === "B" && avoidShift && avoidShift !== "_none") ? avoidShift : null,
          exchange_with_employee_id: null,
          exchange_day: null,
          priority: autoPriority,
          reason: reason.trim() || null,
          period_start: periodStart,
          period_end: periodEnd,
        });
        resetForm();
        toast({ title: "Petición enviada", description: "Tu responsable la revisará pronto." });
      }
    } catch (err) {
      toast({ title: "Error", description: isEditing ? "No se pudo actualizar la petición." : "No se pudo crear la petición.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar petición" : "Nueva petición"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de tu petición."
              : "Selecciona lo que necesitas y los días del mes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Employee selector (Manager view when colaboradorId is null) */}
          {!colaboradorId && employees && employees.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Empleado</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* What are you requesting? (replaces old Type + Shift preference) */}
          <div className="space-y-1.5">
            <Label className="text-xs">¿Qué solicitas?</Label>
            <Select value={requestOption} onValueChange={setRequestOption}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar tipo de solicitud" />
              </SelectTrigger>
              <SelectContent>
                {/* Group A: Absences */}
                <SelectItem value="__separator_a" disabled>
                  ── Ausencias / Permisos ──
                </SelectItem>
                {REQUEST_OPTIONS.filter((o) => o.autoType === "A").map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
                {/* Group B: Preferences */}
                <SelectItem value="__separator_b" disabled>
                  ── Preferencias de turno ──
                </SelectItem>
                {REQUEST_OPTIONS.filter((o) => o.autoType === "B").map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Auto-detected type badge */}
            {requestOption && currentOption && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    currentOption.autoType === "A"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  Tipo {currentOption.autoType} — {currentOption.autoType === "A" ? "Dura" : "Blanda"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {currentOption.autoType === "A"
                    ? "Se respeta al 100%"
                    : "El motor intentará respetarla"}
                </span>
              </div>
            )}
          </div>

          {/* Mini-calendar day picker */}
          <div className="space-y-1.5">
            <Label className="text-xs">Días del mes</Label>
            <MiniCalendarPicker
              totalDays={totalDays}
              selectedDays={selectedDays}
              onToggleDay={handleToggleDay}
              periodStart={periodStart}
            />
          </div>

          {/* Avoid shift (only for Tipo B) */}
          {autoType === "B" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Evitar turno (opcional)</Label>
              <Select value={avoidShift} onValueChange={setAvoidShift}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Ninguno" />
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
          )}

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
            {isEditing ? "Guardar cambios" : "Enviar petición"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
