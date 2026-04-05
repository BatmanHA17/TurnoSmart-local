/**
 * SectorConfigPage — Configuración de turnos y roles por sector
 *
 * Permite al FOM ver/cambiar el template de sector de su organización,
 * personalizar horarios de turnos y roles del motor SMART.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Hotel, UtensilsCrossed, ShoppingBag, HeartPulse, Factory,
  Headphones, Building2, Clock, Users, Check, Settings2,
} from "lucide-react";
import { SECTOR_ENGINE_TEMPLATES, getSectorTemplate } from "@/data/sectorEngineTemplates";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import type { SectorTemplate, ShiftTimeConfig } from "@/utils/engine/types";

// Icon mapping for sector templates
const SECTOR_ICONS: Record<string, React.ElementType> = {
  Hotel, UtensilsCrossed, ShoppingBag, HeartPulse, Factory,
  Headphones, Building2,
};

function ShiftCard({ shift, onChange }: {
  shift: ShiftTimeConfig;
  onChange?: (updated: ShiftTimeConfig) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">{shift.code}</Badge>
          <span className="text-sm font-medium">{shift.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Input
            value={shift.startTime}
            onChange={(e) => onChange?.({ ...shift, startTime: e.target.value })}
            className="h-7 w-20 text-xs font-mono"
            disabled={!onChange}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            value={shift.endTime}
            onChange={(e) => onChange?.({ ...shift, endTime: e.target.value })}
            className="h-7 w-20 text-xs font-mono"
            disabled={!onChange}
          />
          <Badge variant="secondary" className="text-xs">{shift.hours}h</Badge>
        </div>
      </div>
    </div>
  );
}

function SectorSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const sectors = Object.values(SECTOR_ENGINE_TEMPLATES);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sectors.map((sector) => {
        const Icon = SECTOR_ICONS[sector.icon] ?? Building2;
        const isSelected = sector.id === selectedId;
        return (
          <button
            key={sector.id}
            onClick={() => onSelect(sector.id)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors hover:bg-accent ${
              isSelected ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
            }`}
          >
            <Icon className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">{sector.name}</span>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export default function SectorConfigPage() {
  const { organization } = useCurrentOrganization();
  const [selectedSector, setSelectedSector] = useState("hospitality");
  const template = useMemo(() => getSectorTemplate(selectedSector), [selectedSector]);

  // Local state for shift customization (future: persist to DB)
  const [customShifts, setCustomShifts] = useState<Record<string, ShiftTimeConfig> | null>(null);
  const activeShifts = customShifts ?? template.shifts;

  const handleShiftChange = (code: string, updated: ShiftTimeConfig) => {
    setCustomShifts(prev => ({
      ...(prev ?? template.shifts),
      [code]: updated,
    }));
  };

  const handleSectorChange = (id: string) => {
    setSelectedSector(id);
    setCustomShifts(null); // Reset custom shifts when changing sector
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de Sector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona el sector de tu organización para precargar turnos, roles y cobertura optimizados.
        </p>
      </div>

      {/* Sector Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sector
          </CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <SectorSelector selectedId={selectedSector} onSelect={handleSectorChange} />
        </CardContent>
      </Card>

      {/* Shift Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Turno
          </CardTitle>
          <CardDescription>
            Horarios precargados del sector {template.name}. Puedes personalizarlos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(activeShifts).map((shift) => (
              <ShiftCard
                key={shift.code}
                shift={shift}
                onChange={(updated) => handleShiftChange(shift.code, updated)}
              />
            ))}
          </div>
          {customShifts && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Personalizado
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCustomShifts(null)}
              >
                Restaurar valores del sector
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Configuration (read-only for now) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Roles del Motor
          </CardTitle>
          <CardDescription>
            Roles y tipos de rotación para el sector {template.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {template.roles.map((role) => (
              <div key={role.role} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">{role.role}</Badge>
                  <span className="text-sm">{role.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{role.rotationType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {role.allowedShifts.filter(s => !["D", "V", "E", "DB", "DG"].includes(s)).join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coverage Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Cobertura por Defecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {Object.entries(template.defaultCoverage).map(([shift, count]) => (
              <div key={shift} className="flex items-center gap-2">
                <Label className="text-sm font-mono w-6">{shift}:</Label>
                <Badge variant={count > 0 ? "default" : "secondary"}>
                  {count} {count === 1 ? "persona" : "personas"}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Horas semanales: {template.defaultWeeklyHours}h | Convenio: {template.laborLawPreset}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
