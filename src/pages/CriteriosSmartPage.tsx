/**
 * CriteriosSmartPage — Configuración de los 92 criterios SMART
 *
 * 4 tabs: Obligatorios (18) | Opcionales (39) | Checks (25) | SMART+IA (10)
 * Cada criterio: toggle ON/OFF + boost slider (1-5) + config expandible.
 * Los obligatorios están siempre ON (toggle disabled).
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Settings2, CheckCircle2, Brain, Search,
  ChevronDown, ChevronRight, Loader2, RefreshCw
} from "lucide-react";
import { useCriteria, type CriteriaRecord } from "@/hooks/useCriteria";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import {
  OBLIGATORIOS, OPCIONALES, CHECKS, SMART_IA,
  ALL_CRITERIA, CRITERIA_BY_KEY,
  type CriteriaDefault, type CriteriaSeverity,
} from "@/data/criteriaDefaults";

const BOOST_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Moderado",
  3: "Enfatizado",
  4: "Alto",
  5: "Máximo",
};

const SEVERITY_COLORS: Record<CriteriaSeverity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  blocker: "bg-red-200 text-red-900",
};

const TAB_CONFIG = [
  { id: "mandatory", label: "Obligatorios", icon: Shield, defaults: OBLIGATORIOS, count: 18 },
  { id: "optional", label: "Opcionales", icon: Settings2, defaults: OPCIONALES, count: 39 },
  { id: "check", label: "Checks", icon: CheckCircle2, defaults: CHECKS, count: 25 },
  { id: "smart_ia", label: "SMART+IA", icon: Brain, defaults: SMART_IA, count: 10 },
] as const;

function CriteriaRow({
  def,
  record,
  onToggle,
  onBoostChange,
}: {
  def: CriteriaDefault;
  record: CriteriaRecord | undefined;
  onToggle: (key: string, enabled: boolean) => void;
  onBoostChange: (key: string, boost: number) => void;
}) {
  const enabled = record?.enabled ?? def.defaultEnabled;
  const boost = record?.boost ?? def.defaultBoost;
  const isMandatory = def.category === "mandatory";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-4 transition-colors ${enabled ? "bg-white" : "bg-gray-50 opacity-75"}`}>
      <div className="flex items-start gap-3">
        {/* Toggle */}
        <div className="pt-0.5">
          <Switch
            checked={enabled}
            onCheckedChange={(val) => onToggle(def.key, val)}
            disabled={isMandatory}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
              {def.code}
            </Badge>
            <span className="font-medium text-sm text-gray-900 truncate">{def.name}</span>
            <Badge className={`text-[10px] ${SEVERITY_COLORS[def.severity]}`}>
              {def.severity}
            </Badge>
            {def.subcategory && (
              <Badge variant="secondary" className="text-[10px]">
                {def.subcategory}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{def.description}</p>

          {/* Boost slider */}
          {enabled && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[11px] text-gray-400 w-10 shrink-0">Boost</span>
              <Slider
                value={[boost]}
                min={1}
                max={5}
                step={1}
                onValueChange={([v]) => onBoostChange(def.key, v)}
                className="flex-1 max-w-[180px]"
                disabled={isMandatory}
              />
              <span className="text-[11px] font-medium text-gray-600 w-16">
                {boost}/5 {BOOST_LABELS[boost]}
              </span>
            </div>
          )}

          {/* Expandable config */}
          {def.configJson && Object.keys(def.configJson).length > 0 && enabled && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
              >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Configuración avanzada
              </button>
              {expanded && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-[11px] font-mono text-gray-600">
                  {Object.entries(def.configJson).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-400">{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boost note */}
        {record?.boost_note && (
          <div className="text-[10px] text-gray-400 max-w-[120px] truncate" title={record.boost_note}>
            {record.boost_note}
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriosSmartPage() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const { criteria, isLoading, fetchCriteria, upsertCriteria, seedDefaults } = useCriteria({ organizationId: orgId });
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  // Map criteria records by key for fast lookup
  const recordMap = useMemo(() => {
    const m = new Map<string, CriteriaRecord>();
    for (const c of criteria) m.set(c.criteria_key, c);
    return m;
  }, [criteria]);

  const handleToggle = useCallback(
    (key: string, enabled: boolean) => {
      const rec = recordMap.get(key);
      upsertCriteria(key, enabled, rec?.boost ?? CRITERIA_BY_KEY.get(key)?.defaultBoost ?? 1);
    },
    [recordMap, upsertCriteria]
  );

  const handleBoostChange = useCallback(
    (key: string, boost: number) => {
      const rec = recordMap.get(key);
      upsertCriteria(key, rec?.enabled ?? true, boost);
    },
    [recordMap, upsertCriteria]
  );

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    await seedDefaults();
    setSeeding(false);
  }, [seedDefaults]);

  // Auto-seed if no criteria exist
  useEffect(() => {
    if (orgId && !isLoading && criteria.length === 0) {
      handleSeed();
    }
  }, [orgId, isLoading, criteria.length, handleSeed]);

  const filterDefaults = (defaults: CriteriaDefault[]) => {
    if (!search) return defaults;
    const q = search.toLowerCase();
    return defaults.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.subcategory?.toLowerCase().includes(q))
    );
  };

  const implementedCount = criteria.filter((c) => c.enabled).length;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Criterios SMART</h1>
        <p className="text-sm text-gray-500 mt-1">
          92 criterios que gobiernan la generación inteligente de turnos.
          Los obligatorios no se pueden desactivar.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Badge variant="outline" className="text-xs">
            {implementedCount} / {ALL_CRITERIA.length} activos
          </Badge>
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Reinicializar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar criterio por nombre, código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Cargando criterios...</span>
        </div>
      ) : (
        <Tabs defaultValue="mandatory">
          <TabsList className="grid grid-cols-4 mb-4">
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs gap-1">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                <Badge variant="secondary" className="text-[10px] ml-1">{tab.count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_CONFIG.map((tab) => {
            const filtered = filterDefaults(tab.defaults);
            return (
              <TabsContent key={tab.id} value={tab.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tab.id === "mandatory" && "Criterios legales y operacionales que siempre se aplican. No se pueden desactivar."}
                      {tab.id === "optional" && "Criterios personalizables: activa/desactiva y ajusta el peso (boost) según tu operativa."}
                      {tab.id === "check" && "Validaciones pre/post-generación. Controlan qué se verifica antes de publicar un cuadrante."}
                      {tab.id === "smart_ia" && "Funciones de inteligencia proactiva: la herramienta piensa por delante del usuario."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filtered.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">
                        No se encontraron criterios con "{search}"
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filtered.map((def) => (
                          <CriteriaRow
                            key={def.code}
                            def={def}
                            record={recordMap.get(def.key)}
                            onToggle={handleToggle}
                            onBoostChange={handleBoostChange}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

export default CriteriosSmartPage;
