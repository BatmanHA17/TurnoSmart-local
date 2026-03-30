import { useEffect, useState, useCallback } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileSignature, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import {
  useDocumentSignatures,
  type NewSignatureRequest,
} from "@/hooks/useDocumentSignatures";
import { DocumentSignatureCard } from "@/components/documents/DocumentSignatureCard";

interface ColaboradorOption {
  id: string;
  nombre: string;
  apellidos: string | null;
}

interface NewRequestForm {
  colaborador_id: string;
  title: string;
  description: string;
  document_url: string;
  expires_at: string;
}

const EMPTY_FORM: NewRequestForm = {
  colaborador_id: "",
  title: "",
  description: "",
  document_url: "",
  expires_at: "",
};

export default function HRDocumentSigning() {
  const { user } = useAuth();
  const { org } = useCurrentOrganization();
  const { isManager } = useUserRoleCanonical();

  const orgId = org?.id;

  const {
    requests,
    loading,
    error,
    createRequest,
    signDocument,
    rejectDocument,
    pendingCount,
  } = useDocumentSignatures(orgId);

  // Own colaborador id — to detect which docs belong to current user
  const [ownColaboradorId, setOwnColaboradorId] = useState<string | null>(null);

  // Colaboradores list for manager create form
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [colaboradoresLoading, setColaboradoresLoading] = useState(false);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<NewRequestForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Firma de Documentos – TurnoSmart";
  }, []);

  // Fetch own colaborador id
  useEffect(() => {
    if (!user || !orgId) return;

    const fetchOwnColaborador = async () => {
      const { data } = await supabase
        .from("colaboradores")
        .select("id")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .limit(1)
        .maybeSingle();

      if (data) {
        setOwnColaboradorId(data.id);
      }
    };

    fetchOwnColaborador();
  }, [user, orgId]);

  // Fetch colaboradores for manager dropdown
  const fetchColaboradores = useCallback(async () => {
    if (!orgId) return;
    setColaboradoresLoading(true);
    const { data } = await supabase
      .from("colaboradores")
      .select("id, nombre, apellidos")
      .eq("org_id", orgId)
      .order("nombre");

    setColaboradores((data ?? []) as ColaboradorOption[]);
    setColaboradoresLoading(false);
  }, [orgId]);

  useEffect(() => {
    if (isManager) {
      fetchColaboradores();
    }
  }, [isManager, fetchColaboradores]);

  // Partition requests
  const ownPendingRequests = requests.filter(
    (r) => r.colaborador_id === ownColaboradorId && r.status === "pending"
  );
  const ownOtherRequests = requests.filter(
    (r) => r.colaborador_id === ownColaboradorId && r.status !== "pending"
  );

  const handleFormChange = (
    field: keyof NewRequestForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.colaborador_id || !form.title.trim()) return;

    try {
      setSubmitting(true);
      const payload: NewSignatureRequest = {
        colaborador_id: form.colaborador_id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        document_url: form.document_url.trim() || undefined,
        expires_at: form.expires_at || undefined,
      };
      await createRequest(payload);
      setForm(EMPTY_FORM);
      setCreateOpen(false);
    } catch {
      // Error handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <FileSignature className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Firma de documentos
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestiona y firma documentos laborales de tu organización
                </p>
              </div>

              {isManager && (
                <Button onClick={() => setCreateOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva solicitud
                </Button>
              )}
            </div>

            {/* Loading / Error */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && error && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-destructive">
                  Error al cargar los documentos: {error}
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <Tabs defaultValue="pendientes">
                <TabsList className="mb-4">
                  <TabsTrigger value="pendientes" className="relative">
                    Pendientes de firma
                    {pendingCount > 0 && (
                      <Badge className="ml-2 h-5 px-1.5 text-xs" variant="destructive">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {isManager && (
                    <TabsTrigger value="gestion">Gestión</TabsTrigger>
                  )}
                </TabsList>

                {/* Tab: Pendientes de firma — employee's own docs */}
                <TabsContent value="pendientes">
                  <div className="space-y-3">
                    {ownPendingRequests.length === 0 && ownOtherRequests.length === 0
                      ? renderEmptyState("No tienes documentos pendientes de firma")
                      : null}

                    {ownPendingRequests.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Requieren tu firma
                        </p>
                        {ownPendingRequests.map((r) => (
                          <DocumentSignatureCard
                            key={r.id}
                            request={r}
                            isOwn={true}
                            onSign={signDocument}
                            onReject={rejectDocument}
                          />
                        ))}
                      </>
                    )}

                    {ownOtherRequests.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-6 mb-2">
                          Historial
                        </p>
                        {ownOtherRequests.map((r) => (
                          <DocumentSignatureCard
                            key={r.id}
                            request={r}
                            isOwn={false}
                            onSign={signDocument}
                            onReject={rejectDocument}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Gestión — all org docs for managers */}
                {isManager && (
                  <TabsContent value="gestion">
                    <div className="space-y-3">
                      {requests.length === 0
                        ? renderEmptyState(
                            "No hay solicitudes de firma en la organización"
                          )
                        : requests.map((r) => (
                            <DocumentSignatureCard
                              key={r.id}
                              request={r}
                              isOwn={r.colaborador_id === ownColaboradorId}
                              onSign={signDocument}
                              onReject={rejectDocument}
                            />
                          ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Create request dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva solicitud de firma</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Colaborador */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Empleado</label>
              <Select
                value={form.colaborador_id}
                onValueChange={(v) => handleFormChange("colaborador_id", v)}
                disabled={colaboradoresLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      colaboradoresLoading ? "Cargando empleados..." : "Selecciona un empleado"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                      {c.apellidos ? ` ${c.apellidos}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Título del documento <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Ej: Contrato de trabajo 2026"
                value={form.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descripción (opcional)</label>
              <Textarea
                placeholder="Información adicional sobre el documento..."
                value={form.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Document URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL del documento (opcional)</label>
              <Input
                type="url"
                placeholder="https://..."
                value={form.document_url}
                onChange={(e) => handleFormChange("document_url", e.target.value)}
              />
            </div>

            {/* Expiry date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fecha de expiración (opcional)</label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => handleFormChange("expires_at", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setForm(EMPTY_FORM);
                setCreateOpen(false);
              }}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !form.colaborador_id || !form.title.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear solicitud"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
