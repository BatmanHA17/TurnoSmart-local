import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface DocumentSignatureRequest {
  id: string;
  org_id: string;
  colaborador_id: string;
  title: string;
  description: string | null;
  document_url: string | null;
  status: "pending" | "signed" | "rejected" | "expired";
  requested_by: string | null;
  requested_at: string;
  signed_at: string | null;
  signature_data: string | null;
  expires_at: string | null;
  created_at: string;
  // Joined field
  colaborador?: {
    nombre: string;
    apellidos: string | null;
  } | null;
}

export interface NewSignatureRequest {
  colaborador_id: string;
  title: string;
  description?: string;
  document_url?: string;
  expires_at?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABLE = "document_signature_requests" as any;

export function useDocumentSignatures(orgId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<DocumentSignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!orgId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from(TABLE)
        .select(
          `
          *,
          colaborador:colaboradores(nombre, apellidos)
        `
        )
        .eq("org_id", orgId)
        .order("requested_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setRequests((data ?? []) as DocumentSignatureRequest[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[useDocumentSignatures] fetchRequests error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = useCallback(
    async (data: NewSignatureRequest): Promise<void> => {
      if (!orgId || !user) {
        throw new Error("No hay organización o usuario activo");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from(TABLE).insert({
        org_id: orgId,
        colaborador_id: data.colaborador_id,
        title: data.title,
        description: data.description ?? null,
        document_url: data.document_url ?? null,
        expires_at: data.expires_at ?? null,
        requested_by: user.id,
        status: "pending",
      });

      if (insertError) {
        toast({
          title: "Error al crear la solicitud",
          description: insertError.message,
          variant: "destructive",
        });
        throw insertError;
      }

      toast({
        title: "Solicitud creada",
        description: "El documento ha sido enviado para firma.",
      });

      await fetchRequests();
    },
    [orgId, user, fetchRequests, toast]
  );

  const signDocument = useCallback(
    async (id: string, signatureData?: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from(TABLE)
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_data: signatureData ?? "ACKNOWLEDGED",
        })
        .eq("id", id);

      if (updateError) {
        toast({
          title: "Error al firmar",
          description: updateError.message,
          variant: "destructive",
        });
        throw updateError;
      }

      toast({
        title: "Documento firmado",
        description: "El documento ha sido firmado correctamente.",
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "signed",
                signed_at: new Date().toISOString(),
                signature_data: signatureData ?? "ACKNOWLEDGED",
              }
            : r
        )
      );
    },
    [toast]
  );

  const rejectDocument = useCallback(
    async (id: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from(TABLE)
        .update({ status: "rejected" })
        .eq("id", id);

      if (updateError) {
        toast({
          title: "Error al rechazar",
          description: updateError.message,
          variant: "destructive",
        });
        throw updateError;
      }

      toast({
        title: "Documento rechazado",
        description: "Has rechazado la firma del documento.",
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
      );
    },
    [toast]
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return {
    requests,
    loading,
    error,
    createRequest,
    signDocument,
    rejectDocument,
    pendingCount,
    refresh: fetchRequests,
  };
}
