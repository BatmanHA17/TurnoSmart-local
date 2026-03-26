/**
 * GenerateScheduleSheet — Panel de configuración que se abre ANTES de generar.
 *
 * El jefe de departamento configura:
 * 1. Mes a generar
 * 2. Empleados a incluir (checkbox)
 * 3. Personas por turno M/T/N (numérico)
 * 4. Preferencia de turno por empleado
 * 5. Criterios obligatorios (ley — no se pueden desactivar)
 * 6. Criterios opcionales (convenio/organización — toggle)
 * 7. Semanas de alta/baja ocupación
 *
 * Solo al pulsar "Generar cuadrante" dentro del panel se ejecuta el motor.
 */
import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  Wand2,
  Users,
  Shield,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

interface CalendarEmployee {
  id: string;
  name: string;
  role: string;
  workingHours: string;
}

type ShiftPreference = "rotating" | "morning" | "afternoon" | "night_fixed";

interface EmployeeConfig {
  id: string;
  name: string;
  included: boolean;
  preference: ShiftPreference;
  weeklyHours: number;
}

interface GenerateConfig {
  /** Empleados con sus configuraciones individuales */
  employees: EmployeeConfig[];
  /** Personas mínimas por turno */
  coveragePerShift: {
    morning: number;
    afternoon: number;
    night: number;
  };
  /** Criterios opcionales (los obligatorios son ley y siempre activos) */
  optionalCriteria: {
    ergonomicRotation: boolean;
    fairWeekendDistribution: boolean;
  };
  /** Nivel de ocupación por semana del mes (1=baja, 2=normal, 3=alta) */
  weeklyOccupancy: number[];
}

export interface GenerateScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: CalendarEmployee[];
  currentWeek: Date;
  isGenerating: boolean;
  onGenerate: (config: GenerateConfig) => void;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function parseWeeklyHours(workingHours: string): number {
  const parts = workingHours.split("/");
  if (parts.length >= 2) {
    const raw = parts[1].replace("h", "");
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 40;
}

const PREFERENCE_LABELS: Record<ShiftPreference, string> = {
  rotating: "Rotativo",
  morning: "Solo mañanas",
  afternoon: "Solo tardes",
  night_fixed: "Solo noches",
};

// ---------------------------------------------------------------------------
// COMPONENTE
// ---------------------------------------------------------------------------

export function GenerateScheduleSheet({
  open,
  onOpenChange,
  employees,
  currentWeek,
  isGenerating,
  onGenerate,
}: GenerateScheduleSheetProps) {
  const monthStart = startOfMonth(currentWeek);
  const monthLabel = format(monthStart, "MMMM yyyy", { locale: es });

  // --- Estado del formulario ---
  const [employeeConfigs, setEmployeeConfigs] = useState<EmployeeConfig[]>(() =>
    employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      included: true,
      preference: "rotating" as ShiftPreference,
      weeklyHours: parseWeeklyHours(emp.workingHours),
    }))
  );

  const [coverage, setCoverage] = useState({
    morning: 1,
    afternoon: 1,
    night: 1,
  });

  const [optionalCriteria, setOptionalCriteria] = useState({
    ergonomicRotation: true,
    fairWeekendDistribution: true,
  });

  const [weeklyOccupancy, setWeeklyOccupancy] = useState<number[]>([2, 2, 2, 2, 2]);

  // Sync employees when they change
  useMemo(() => {
    if (employees.length > 0 && employeeConfigs.length !== employees.length) {
      setEmployeeConfigs(
        employees.map((emp) => {
          const existing = employeeConfigs.find((c) => c.id === emp.id);
          return existing ?? {
            id: emp.id,
            name: emp.name,
            included: true,
            preference: "rotating" as ShiftPreference,
            weeklyHours: parseWeeklyHours(emp.workingHours),
          };
        })
      );
    }
  }, [employees]);

  const includedCount = employeeConfigs.filter((e) => e.included).length;

  // --- Handlers ---
  const toggleEmployee = (id: string) => {
    setEmployeeConfigs((prev) =>
      prev.map((e) => (e.id === id ? { ...e, included: !e.included } : e))
    );
  };

  const setPreference = (id: string, pref: ShiftPreference) => {
    setEmployeeConfigs((prev) =>
      prev.map((e) => (e.id === id ? { ...e, preference: pref } : e))
    );
  };

  const handleGenerate = () => {
    onGenerate({
      employees: employeeConfigs,
      coveragePerShift: coverage,
      optionalCriteria,
      weeklyOccupancy,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-600" />
            Generar cuadrante
          </SheetTitle>
          <SheetDescription>
            Configura los criterios antes de generar el cuadrante de{" "}
            <span className="font-semibold capitalize">{monthLabel}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* ─── SECCIÓN 1: EMPLEADOS ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                Empleados ({includedCount}/{employeeConfigs.length})
              </h3>
            </div>

            {employeeConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay empleados visibles en el calendario esta semana.
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {employeeConfigs.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        checked={emp.included}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.weeklyHours}h/sem</p>
                      </div>
                    </div>
                    {emp.included && (
                      <Select
                        value={emp.preference}
                        onValueChange={(val) => setPreference(emp.id, val as ShiftPreference)}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PREFERENCE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* ─── SECCIÓN 2: COBERTURA POR TURNO ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Personas por turno (mínimo)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["morning", "afternoon", "night"] as const).map((shift) => (
                <div key={shift}>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {shift === "morning" ? "☀️ Mañana" : shift === "afternoon" ? "🌅 Tarde" : "🌙 Noche"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={coverage[shift]}
                    onChange={(e) =>
                      setCoverage((prev) => ({
                        ...prev,
                        [shift]: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    className="h-8 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ─── SECCIÓN 3: OCUPACIÓN SEMANAL ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Nivel de ocupación por semana</h3>
            </div>
            <div className="space-y-2">
              {weeklyOccupancy.map((level, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Semana {i + 1}</span>
                  <Select
                    value={String(level)}
                    onValueChange={(val) => {
                      const copy = [...weeklyOccupancy];
                      copy[i] = parseInt(val);
                      setWeeklyOccupancy(copy);
                    }}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-xs">🟢 Baja</SelectItem>
                      <SelectItem value="2" className="text-xs">🟡 Normal</SelectItem>
                      <SelectItem value="3" className="text-xs">🔴 Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ─── SECCIÓN 4: CRITERIOS ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Criterios</h3>
            </div>

            {/* Obligatorios (ley) — no se pueden desactivar */}
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Obligatorios (ley española)
              </p>
              {[
                "Mínimo 12h entre jornadas",
                "2 días libres consecutivos por semana",
                "Prohibido Tarde→Mañana (descanso insuficiente)",
                "Día libre tras turno de noche",
              ].map((rule) => (
                <div key={rule} className="flex items-center gap-2 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs">{rule}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                    Siempre activo
                  </Badge>
                </div>
              ))}
            </div>

            {/* Opcionales — toggle */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Opcionales (organización)
              </p>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs">Rotación ergonómica (M→T→N→M)</span>
                <Switch
                  checked={optionalCriteria.ergonomicRotation}
                  onCheckedChange={(v) =>
                    setOptionalCriteria((prev) => ({ ...prev, ergonomicRotation: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs">Distribución equitativa de fines de semana</span>
                <Switch
                  checked={optionalCriteria.fairWeekendDistribution}
                  onCheckedChange={(v) =>
                    setOptionalCriteria((prev) => ({ ...prev, fairWeekendDistribution: v }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ─── AVISOS ─── */}
          {includedCount === 0 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">
                Selecciona al menos un empleado para generar el cuadrante.
              </p>
            </div>
          )}

          {/* ─── BOTÓN GENERAR ─── */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || includedCount === 0}
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generar cuadrante ({includedCount} empleados)
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            El cuadrante generado reemplaza el mes actual. Puedes deshacerlo con Ctrl+Z.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type { GenerateConfig, EmployeeConfig, ShiftPreference };
