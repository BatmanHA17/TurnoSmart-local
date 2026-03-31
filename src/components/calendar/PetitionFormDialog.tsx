/**
 * PetitionFormDialog — Modal para crear/editar peticiones de empleados
 *
 * Tipos: A (dura), B (blanda), C (intercambio), D (recurrente SMART)
 * Usa usePetitions().createPetition()
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { PetitionType, PetitionStatus, ShiftCode } from "@/utils/engine";
import type { PetitionRecord } from "@/hooks/usePetitions";

interface PetitionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (petition: Omit<PetitionRecord, "id" | "created_at" | "updated_at" | "employee_name">) => Promise<void>;
  employees: Array<{ id: string; name: string }>;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
}

const SHIFT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "M", label: "Mañana (M)" },
  { value: "T", label: "Tarde (T)" },
  { value: "N", label: "Noche (N)" },
  { value: "D", label: "Descanso (D)" },
  { value: "9x17", label: "GEX 9-17" },
  { value: "12x20", label: "GEX 12-20" },
  { value: "11x19", label: "Transición 11-19" },
];

const TYPE_INFO: Record<PetitionType, { label: string; description: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  A: { label: "Tipo A — Dura", description: "Obligatoria (vacaciones, baja). Se respeta al 100%.", variant: "destructive" },
  B: { label: "Tipo B — Blanda", description: "Preferencia. Se intenta respetar, puede saltar por cobertura.", variant: "default" },
  C: { label: "Tipo C — Intercambio", description: "Dos empleados acuerdan cambio. FOM valida.", variant: "secondary" },
  D: { label: "Tipo D — Recurrente", description: "Detectada por patrón 3+ meses (SMART+IA).", variant: "outline" },
};

export function PetitionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  employees,
  organizationId,
  periodStart,
  periodEnd,
  totalDays,
}: PetitionFormDialogProps) {
  const [type, setType] = useState<PetitionType>("B");
  const [employeeId, setEmployeeId] = useState("");
  const [daysInput, setDaysInput] = useState("");
  const [requestedShift, setRequestedShift] = useState<string | null>(null);
  const [avoidShift, setAvoidShift] = useState<string | null>(null);
  const [exchangeEmployeeId, setExchangeEmployeeId] = useState<string | null>(null);
  const [exchangeDay, setExchangeDay] = useState<string>("");
  const [priority, setPriority] = useState("3");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseDays = (input: string): number[] => {
    return input
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= totalDays);
  };

  const handleSubmit = async () => {
    const days = parseDays(daysInput);
    if (!employeeId || days.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        employee_id: employeeId,
        organization_id: organizationId,
        type,
        status: type === "D" ? "auto_detected" : "pending",
        days,
        requested_shift: requestedShift,
        avoid_shift: avoidShift,
        exchange_with_employee_id: type === "C" ? exchangeEmployeeId : null,
        exchange_day: type === "C" && exchangeDay ? parseInt(exchangeDay, 10) : null,
        priority: parseInt(priority, 10),
        reason: reason || null,
        period_start: periodStart,
        period_end: periodEnd,
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setType("B");
    setEmployeeId("");
    setDaysInput("");
    setRequestedShift(null);
    setAvoidShift(null);
    setExchangeEmployeeId(null);
    setExchangeDay("");
    setPriority("3");
    setReason("");
  };

  const days = parseDays(daysInput);
  const canSubmit = employeeId && days.length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Petición</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de petición</Label>
            <Select value={type} onValueChange={(v) => setType(v as PetitionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(TYPE_INFO) as [PetitionType, typeof TYPE_INFO.A][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{TYPE_INFO[type].description}</p>
          </div>

          {/* Empleado */}
          <div className="space-y-1.5">
            <Label>Empleado</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Días */}
          <div className="space-y-1.5">
            <Label>Días del mes (separados por coma)</Label>
            <Input
              placeholder="ej: 5, 12, 18"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
            />
            {days.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {days.map((d) => (
                  <Badge key={d} variant="outline" className="text-xs">Día {d}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Turno solicitado / evitar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Turno solicitado</Label>
              <Select value={requestedShift ?? "_none"} onValueChange={(v) => setRequestedShift(v === "_none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ninguno</SelectItem>
                  {SHIFT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Turno a evitar</Label>
              <Select value={avoidShift ?? "_none"} onValueChange={(v) => setAvoidShift(v === "_none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ninguno</SelectItem>
                  {SHIFT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intercambio (solo tipo C) */}
          {type === "C" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Intercambio con</Label>
                <Select value={exchangeEmployeeId ?? ""} onValueChange={setExchangeEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.filter((e) => e.id !== employeeId).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Día del intercambio</Label>
                <Input
                  type="number"
                  min={1}
                  max={totalDays}
                  placeholder="Día"
                  value={exchangeDay}
                  onChange={(e) => setExchangeDay(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Prioridad + razón */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridad (1=alta, 5=baja)</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={String(p)}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Razón (opcional)</Label>
            <Textarea
              placeholder="Motivo de la petición..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Creando..." : "Crear petición"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
