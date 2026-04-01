/**
 * DelegationToggle — Toggle de delegación FOM→AFOM (T2-10)
 *
 * Permite al FOM activar/desactivar la delegación de edición para un empleado AFOM.
 * Opcionalmente con fechas de inicio y fin.
 * Se integra en la ficha del empleado o en el header del calendario.
 */

import { useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DelegationToggleProps {
  /** ID del empleado AFOM en tabla colaboradores */
  colaboradorId: string;
  /** Nombre del empleado para display */
  employeeName: string;
  /** Estado actual */
  isActive: boolean;
  /** Fechas actuales (ISO strings) */
  startDate?: string | null;
  endDate?: string | null;
  /** ID del FOM que otorga (auth.uid) */
  grantedByUserId: string;
  /** Callback al cambiar estado */
  onToggle?: (active: boolean) => void;
  /** Modo compacto (inline) */
  compact?: boolean;
}

export function DelegationToggle({
  colaboradorId,
  employeeName,
  isActive,
  startDate,
  endDate,
  grantedByUserId,
  onToggle,
  compact = false,
}: DelegationToggleProps) {
  const [active, setActive] = useState(isActive);
  const [start, setStart] = useState(startDate || "");
  const [end, setEnd] = useState(endDate || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleToggle = useCallback(async (checked: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("colaboradores" as any)
        .update({
          delegation_active: checked,
          delegation_start: checked && start ? start : null,
          delegation_end: checked && end ? end : null,
          delegation_granted_by: checked ? grantedByUserId : null,
          delegation_granted_at: checked ? new Date().toISOString() : null,
        } as any)
        .eq("id", colaboradorId);

      if (error) throw error;

      setActive(checked);
      onToggle?.(checked);
      toast({
        title: checked ? "Delegación activada" : "Delegación desactivada",
        description: checked
          ? `${employeeName} puede editar turnos${start ? ` desde ${start}` : ""}${end ? ` hasta ${end}` : ""}`
          : `${employeeName} ya no tiene permisos de edición delegados`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la delegación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [colaboradorId, employeeName, grantedByUserId, start, end, onToggle, toast]);

  const handleSaveDates = useCallback(async () => {
    if (!active) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("colaboradores" as any)
        .update({
          delegation_start: start || null,
          delegation_end: end || null,
        } as any)
        .eq("id", colaboradorId);

      if (error) throw error;
      toast({ title: "Fechas actualizadas" });
    } catch {
      toast({ title: "Error al guardar fechas", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [active, start, end, colaboradorId, toast]);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor={`delegation-${colaboradorId}`} className="text-sm cursor-pointer">
          Delegar edición a {employeeName}
        </Label>
        <Switch
          id={`delegation-${colaboradorId}`}
          checked={active}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Delegación de edición</h4>
          </div>
          <Switch
            id={`delegation-${colaboradorId}`}
            checked={active}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Permite a {employeeName} editar turnos del calendario durante el período especificado.
        </p>

        {active && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDates}
              disabled={saving}
              className="w-full h-7 text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Guardar fechas
            </Button>
            {!start && !end && (
              <p className="text-[10px] text-amber-600">
                Sin fechas = delegación permanente hasta desactivar
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
