/**
 * PetitionsListPanel — Lista de peticiones con filtrado y aprobación/rechazo
 *
 * Vista FOM: ver todas las peticiones, aprobar/rechazar, filtrar por tipo/status.
 * Usa usePetitions() hook.
 */

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, Trash2, Plus } from "lucide-react";
import type { PetitionRecord } from "@/hooks/usePetitions";
import type { PetitionType, PetitionStatus } from "@/utils/engine";

interface PetitionsListPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petitions: PetitionRecord[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateNew: () => void;
}

const TYPE_LABELS: Record<PetitionType, string> = {
  A: "Dura",
  B: "Blanda",
  C: "Intercambio",
  D: "Recurrente",
};

const TYPE_COLORS: Record<PetitionType, "destructive" | "default" | "secondary" | "outline"> = {
  A: "destructive",
  B: "default",
  C: "secondary",
  D: "outline",
};

const STATUS_CONFIG: Record<PetitionStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Pendiente", icon: Clock, color: "text-yellow-600" },
  approved: { label: "Aprobada", icon: CheckCircle, color: "text-green-600" },
  rejected: { label: "Rechazada", icon: XCircle, color: "text-red-600" },
  auto_detected: { label: "Auto-detectada", icon: Clock, color: "text-blue-600" },
};

export function PetitionsListPanel({
  open,
  onOpenChange,
  petitions,
  isLoading,
  onApprove,
  onReject,
  onDelete,
  onCreateNew,
}: PetitionsListPanelProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = petitions.filter((p) => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = petitions.filter((p) => p.status === "pending").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Peticiones
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pendientes</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Filtros + Crear */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="A">Tipo A</SelectItem>
              <SelectItem value="B">Tipo B</SelectItem>
              <SelectItem value="C">Tipo C</SelectItem>
              <SelectItem value="D">Tipo D</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="rejected">Rechazada</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={onCreateNew}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nueva
          </Button>
        </div>

        <Separator />

        {/* Lista */}
        <ScrollArea className="h-[calc(100vh-180px)] mt-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando peticiones...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {petitions.length === 0 ? "No hay peticiones para este período" : "Ninguna petición coincide con los filtros"}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((pet) => {
                const statusConf = STATUS_CONFIG[pet.status];
                const StatusIcon = statusConf.icon;

                return (
                  <div key={pet.id} className="border rounded-lg p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={TYPE_COLORS[pet.type]} className="text-xs">
                          {TYPE_LABELS[pet.type]}
                        </Badge>
                        <span className="text-sm font-medium">{pet.employee_name || pet.employee_id.slice(0, 8)}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${statusConf.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConf.label}
                      </div>
                    </div>

                    {/* Detalles */}
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        Días: {pet.days.join(", ")}
                        {pet.requested_shift && ` — Solicita: ${pet.requested_shift}`}
                        {pet.avoid_shift && ` — Evita: ${pet.avoid_shift}`}
                      </p>
                      {pet.type === "C" && pet.exchange_with_employee_id && (
                        <p>Intercambio con empleado, día {pet.exchange_day}</p>
                      )}
                      {pet.reason && <p className="italic">"{pet.reason}"</p>}
                      <p>Prioridad: {pet.priority} / 5</p>
                    </div>

                    {/* Acciones (solo para pending) */}
                    {pet.status === "pending" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => onApprove(pet.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => onReject(pet.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rechazar
                        </Button>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => onDelete(pet.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
