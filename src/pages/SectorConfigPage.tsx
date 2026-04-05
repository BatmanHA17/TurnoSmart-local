/**
 * SectorConfigPage — Configuración editable de turnos, roles y cobertura
 *
 * Un solo config por organización, 100% CRUD.
 * Los templates de sector solo sirven como punto de partida.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock, Users, Settings2, Plus, Pencil, Trash2, Save,
  RotateCcw, Loader2, Check,
} from "lucide-react";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import {
  loadOrgEngineConfig,
  saveOrgEngineConfig,
  configFromTemplate,
  type OrgEngineConfig,
} from "@/services/orgEngineConfigService";
import { SECTOR_ENGINE_TEMPLATES } from "@/data/sectorEngineTemplates";
import type { ShiftTimeConfig, RoleConfigOverride, RotationType } from "@/utils/engine/types";

// ---------------------------------------------------------------------------
// Helper: calculate hours from time strings
// ---------------------------------------------------------------------------
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60; // overnight
  return Math.round(mins / 60 * 10) / 10;
}

// ---------------------------------------------------------------------------
// Shift Edit Dialog
// ---------------------------------------------------------------------------
function ShiftDialog({
  open,
  onClose,
  shift,
  onSave,
  existingCodes,
}: {
  open: boolean;
  onClose: () => void;
  shift: ShiftTimeConfig | null; // null = new
  onSave: (s: ShiftTimeConfig) => void;
  existingCodes: string[];
}) {
  const [code, setCode] = useState(shift?.code ?? "");
  const [label, setLabel] = useState(shift?.label ?? "");
  const [startTime, setStartTime] = useState(shift?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(shift?.endTime ?? "16:00");
  const isEdit = !!shift;

  useEffect(() => {
    setCode(shift?.code ?? "");
    setLabel(shift?.label ?? "");
    setStartTime(shift?.startTime ?? "08:00");
    setEndTime(shift?.endTime ?? "16:00");
  }, [shift, open]);

  const hours = calcHours(startTime, endTime);
  const codeError = !isEdit && existingCodes.includes(code.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar turno" : "Nuevo turno"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Código</Label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Ej: M, T, 14x22"
              disabled={isEdit}
              className="font-mono"
            />
            {codeError && <p className="text-xs text-destructive mt-1">Ya existe</p>}
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Mañana" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Inicio</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Fin</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Duración: <strong>{hours}h</strong></p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!code.trim() || !label.trim() || codeError}
            onClick={() => {
              onSave({ code: code.trim(), label: label.trim(), startTime, endTime, hours });
              onClose();
            }}
          >
            {isEdit ? "Guardar" : "Añadir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Role Edit Dialog
// ---------------------------------------------------------------------------
const ROTATION_TYPES: { value: RotationType; label: string }[] = [
  { value: "FIJO_NO_ROTA", label: "Fijo (no rota)" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "ROTA_PARCIAL", label: "Rotación parcial" },
  { value: "ROTA_COMPLETO", label: "Rotación completa" },
];

function RoleDialog({
  open,
  onClose,
  role,
  onSave,
  availableShifts,
}: {
  open: boolean;
  onClose: () => void;
  role: RoleConfigOverride | null;
  onSave: (r: RoleConfigOverride) => void;
  availableShifts: string[];
}) {
  const [roleId, setRoleId] = useState(role?.role ?? "");
  const [label, setLabel] = useState(role?.label ?? "");
  const [rotationType, setRotationType] = useState<RotationType>(role?.rotationType ?? "ROTA_COMPLETO");
  const [seniority, setSeniority] = useState(role?.seniorityLevel ?? 1);
  const [allowed, setAllowed] = useState<string[]>(role?.allowedShifts ?? []);
  const isEdit = !!role;

  useEffect(() => {
    setRoleId(role?.role ?? "");
    setLabel(role?.label ?? "");
    setRotationType(role?.rotationType ?? "ROTA_COMPLETO");
    setSeniority(role?.seniorityLevel ?? 1);
    setAllowed(role?.allowedShifts ?? []);
  }, [role, open]);

  const absenceCodes = ["D", "V", "E", "DB", "DG"];
  const workShifts = availableShifts.filter(s => !absenceCodes.includes(s));

  const toggleShift = (code: string) => {
    setAllowed(prev => prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar rol" : "Nuevo rol"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Identificador del rol</Label>
            <Input
              value={roleId}
              onChange={e => setRoleId(e.target.value.toUpperCase().replace(/\s/g, "_"))}
              placeholder="Ej: FRONT_DESK_AGENT"
              disabled={isEdit}
              className="font-mono"
            />
          </div>
          <div>
            <Label>Nombre visible</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Recepcionista" />
          </div>
          <div>
            <Label>Tipo de rotación</Label>
            <Select value={rotationType} onValueChange={v => setRotationType(v as RotationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROTATION_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nivel de antigüedad (1-3)</Label>
            <Input type="number" min={1} max={3} value={seniority} onChange={e => setSeniority(Number(e.target.value))} />
          </div>
          <div>
            <Label>Turnos permitidos</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {workShifts.map(code => (
                <button
                  key={code}
                  onClick={() => toggleShift(code)}
                  className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                    allowed.includes(code)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!roleId.trim() || !label.trim()}
            onClick={() => {
              const allShifts = [...new Set([...allowed, ...absenceCodes])];
              onSave({ role: roleId.trim(), label: label.trim(), rotationType, seniorityLevel: seniority, allowedShifts: allShifts });
              onClose();
            }}
          >
            {isEdit ? "Guardar" : "Añadir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------

export default function SectorConfigPage() {
  const { currentOrg, loading: orgLoading } = useCurrentOrganization();
  const { toast } = useToast();

  const [config, setConfig] = useState<OrgEngineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Dialogs
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTimeConfig | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleConfigOverride | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const orgId = (currentOrg as any)?.org_id ?? (currentOrg as any)?.id;

  // Load config on mount
  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    loadOrgEngineConfig(orgId).then(cfg => {
      if (cfg) {
        setConfig(cfg);
      } else {
        // First time: initialize from hospitality template
        setConfig(configFromTemplate(orgId, "hospitality"));
        setDirty(true); // needs saving
      }
      setLoading(false);
    });
  }, [orgId]);

  // Update helper
  const update = useCallback((patch: Partial<OrgEngineConfig>) => {
    setConfig(prev => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }, []);

  // Save to DB
  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveOrgEngineConfig(config);
      setDirty(false);
      toast({ title: "Configuración guardada" });
      // Reload to get the id if it was an insert
      const fresh = await loadOrgEngineConfig(config.org_id);
      if (fresh) setConfig(fresh);
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Reset from template
  const handleReset = (sectorId: string) => {
    if (!orgId) return;
    const fresh = configFromTemplate(orgId, sectorId);
    fresh.id = config?.id; // keep DB row id
    setConfig(fresh);
    setDirty(true);
    setResetDialogOpen(false);
    toast({ title: `Restaurado desde plantilla: ${SECTOR_ENGINE_TEMPLATES[sectorId]?.name ?? sectorId}` });
  };

  // SHIFT CRUD
  const handleSaveShift = (s: ShiftTimeConfig) => {
    if (!config) return;
    const newShifts = { ...config.shifts, [s.code]: s };
    update({ shifts: newShifts });
  };

  const handleDeleteShift = (code: string) => {
    if (!config) return;
    const newShifts = { ...config.shifts };
    delete newShifts[code];
    update({ shifts: newShifts });
  };

  // ROLE CRUD
  const handleSaveRole = (r: RoleConfigOverride) => {
    if (!config) return;
    const idx = config.roles.findIndex(x => x.role === r.role);
    const newRoles = [...config.roles];
    if (idx >= 0) {
      newRoles[idx] = r;
    } else {
      newRoles.push(r);
    }
    update({ roles: newRoles });
  };

  const handleDeleteRole = (roleId: string) => {
    if (!config) return;
    update({ roles: config.roles.filter(r => r.role !== roleId) });
  };

  // Coverage update
  const handleCoverageChange = (shift: "M" | "T" | "N", value: number) => {
    if (!config) return;
    update({ coverage: { ...config.coverage, [shift]: Math.max(0, value) } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) return null;

  const absenceCodes = new Set(["D", "V", "E", "DB", "DG"]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración del Motor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turnos, roles y cobertura de tu organización. Edita lo que necesites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restaurar plantilla
          </Button>
          <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar
          </Button>
        </div>
      </div>

      {dirty && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tienes cambios sin guardar.
        </div>
      )}

      {/* TURNOS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Turnos
              </CardTitle>
              <CardDescription>Horarios de trabajo disponibles para el motor SMART.</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditingShift(null); setShiftDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1" /> Añadir turno
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.values(config.shifts).map(shift => (
              <div key={shift.code} className="flex items-center gap-2 rounded-md border px-3 py-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{shift.code}</Badge>
                    <span className="text-sm font-medium">{shift.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {shift.startTime} → {shift.endTime} · {shift.hours}h
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => { setEditingShift(shift); setShiftDialogOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteShift(shift.code)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROLES */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roles
              </CardTitle>
              <CardDescription>Tipos de empleado y su comportamiento en el motor.</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1" /> Añadir rol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.roles.map(role => (
              <div key={role.role} className="flex items-center justify-between rounded-md border px-3 py-2 group">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">{role.role}</Badge>
                  <span className="text-sm">{role.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{role.rotationType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {role.allowedShifts.filter(s => !absenceCodes.has(s)).join(", ")}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditingRole(role); setRoleDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteRole(role.role)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COBERTURA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cobertura mínima por turno
          </CardTitle>
          <CardDescription>Personas mínimas requeridas por turno en el cuadrante.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {(["M", "T", "N"] as const).map(shift => (
              <div key={shift} className="flex items-center gap-2">
                <Label className="text-sm font-mono w-6">{shift}:</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={config.coverage[shift]}
                  onChange={e => handleCoverageChange(shift, Number(e.target.value))}
                  className="h-8 w-16 text-center"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Horas semanales:</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={config.weekly_hours}
                onChange={e => update({ weekly_hours: Number(e.target.value) })}
                className="h-8 w-20 text-center"
              />
              <span className="text-xs text-muted-foreground">h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SHIFT DIALOG */}
      <ShiftDialog
        open={shiftDialogOpen}
        onClose={() => setShiftDialogOpen(false)}
        shift={editingShift}
        onSave={handleSaveShift}
        existingCodes={Object.keys(config.shifts).map(k => k.toUpperCase())}
      />

      {/* ROLE DIALOG */}
      <RoleDialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        role={editingRole}
        onSave={handleSaveRole}
        availableShifts={Object.keys(config.shifts)}
      />

      {/* RESET DIALOG */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restaurar desde plantilla</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esto reemplazará tu configuración actual con los valores predefinidos de un sector.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.values(SECTOR_ENGINE_TEMPLATES).map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleReset(tpl.id)}
                className="rounded-md border px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <span className="font-medium">{tpl.name}</span>
                <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {Object.keys(tpl.shifts).length} turnos · {tpl.roles.length} roles
                </span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
