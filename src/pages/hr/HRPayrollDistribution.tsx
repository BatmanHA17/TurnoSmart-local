import { useEffect } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useNominas, type NewNomina } from "@/hooks/useNominas";
import { useColaboradorFull } from "@/hooks/useColaboradorFull";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { NominaCard } from "@/components/nominas/NominaCard";
import { NotionCard } from "@/components/ui/notion-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, UserX } from "lucide-react";
import { useState, useMemo } from "react";

const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function HRPayrollDistribution() {
  const { org } = useCurrentOrganization();
  const { isManager } = useUserRoleCanonical();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [bulkSending, setBulkSending] = useState(false);

  const orgId = org?.id ?? null;

  const { colaboradores, loading: loadingColabs } = useColaboradorFull(orgId ?? undefined);
  const { nominas, loading: loadingNominas, createNomina, sendNomina, deleteNomina } =
    useNominas(orgId, { year: selectedYear, month: selectedMonth });

  useEffect(() => {
    document.title = "Distribución de nóminas – TurnoSmart";
  }, []);

  const nominaByColabId = useMemo(() => {
    const map = new Map<string, (typeof nominas)[0]>();
    nominas.forEach((n) => map.set(n.colaborador_id, n));
    return map;
  }, [nominas]);

  const activeColabs = useMemo(
    () => colaboradores.filter((c) => c.status !== "inactivo"),
    [colaboradores]
  );

  const filteredColabs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeColabs;
    return activeColabs.filter((c) =>
      `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q)
    );
  }, [activeColabs, search]);

  const handleCreateNomina = async (colaboradorId: string) => {
    if (!orgId) return;
    const data: NewNomina = {
      org_id: orgId,
      colaborador_id: colaboradorId,
      year: selectedYear,
      month: selectedMonth,
    };
    await createNomina(data);
  };

  const handleBulkSend = async () => {
    const draftNominas = nominas.filter((n) => n.status === "draft");
    if (draftNominas.length === 0) return;
    setBulkSending(true);
    try {
      await Promise.all(draftNominas.map((n) => sendNomina(n.id)));
    } finally {
      setBulkSending(false);
    }
  };

  const draftCount = nominas.filter((n) => n.status === "draft").length;

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Distribución de nóminas</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestiona y distribuye las nóminas mensuales de tu equipo
                </p>
              </div>
              {isManager && draftCount > 0 && (
                <Button onClick={handleBulkSend} disabled={bulkSending} className="shrink-0">
                  <Send className="h-4 w-4 mr-2" />
                  {bulkSending
                    ? "Enviando..."
                    : `Enviar todas las pendientes (${draftCount})`}
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>{MONTHS_ES[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Buscar empleado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
            </div>

            {/* Content */}
            {loadingColabs || loadingNominas ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Cargando...</div>
            ) : filteredColabs.length === 0 ? (
              <NotionCard className="p-8 text-center text-muted-foreground">
                <UserX className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No se encontraron colaboradores activos</p>
              </NotionCard>
            ) : (
              <div className="space-y-3">
                {filteredColabs.map((colab) => {
                  const nomina = nominaByColabId.get(colab.id);

                  if (!nomina) {
                    return (
                      <NotionCard key={colab.id} className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {colab.nombre} {colab.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {MONTHS_ES[selectedMonth]} {selectedYear} — Sin nómina
                            </p>
                          </div>
                          {isManager && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateNomina(colab.id)}
                            >
                              + Crear nómina
                            </Button>
                          )}
                        </div>
                      </NotionCard>
                    );
                  }

                  return (
                    <NominaCard
                      key={nomina.id}
                      nomina={{
                        ...nomina,
                        colaborador_nombre: colab.nombre,
                        colaborador_apellidos: colab.apellidos,
                      }}
                      showEmployee
                      isManager={isManager}
                      onSend={sendNomina}
                      onDelete={deleteNomina}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
