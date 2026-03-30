import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DocumentSignatureRequest } from "@/hooks/useDocumentSignatures";

interface DocumentSignatureCardProps {
  request: DocumentSignatureRequest;
  isOwn: boolean; // True when the current user is the colaborador being asked to sign
  onSign: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    variant: "outline" as const,
    className: "border-amber-400 text-amber-600 bg-amber-50",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  signed: {
    label: "Firmado",
    variant: "outline" as const,
    className: "border-green-500 text-green-700 bg-green-50",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rechazado",
    variant: "outline" as const,
    className: "border-red-400 text-red-600 bg-red-50",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Expirado",
    variant: "outline" as const,
    className: "border-gray-400 text-gray-500 bg-gray-50",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
} as const;

export function DocumentSignatureCard({
  request,
  isOwn,
  onSign,
  onReject,
}: DocumentSignatureCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const statusConfig = STATUS_CONFIG[request.status];

  const handleSign = async () => {
    try {
      setSigning(true);
      await onSign(request.id);
      setConfirmOpen(false);
    } catch {
      // Error already toasted in hook
    } finally {
      setSigning(false);
    }
  };

  const handleReject = async () => {
    try {
      setRejecting(true);
      await onReject(request.id);
      setRejectOpen(false);
    } catch {
      // Error already toasted in hook
    } finally {
      setRejecting(false);
    }
  };

  const colaboradorName = request.colaborador
    ? `${request.colaborador.nombre}${request.colaborador.apellidos ? " " + request.colaborador.apellidos : ""}`
    : null;

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-base font-medium truncate">{request.title}</CardTitle>
            </div>
            <Badge
              variant={statusConfig.variant}
              className={`flex items-center gap-1 shrink-0 text-xs ${statusConfig.className}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
          {colaboradorName && (
            <p className="text-xs text-muted-foreground mt-1">Empleado: {colaboradorName}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {request.description && (
            <p className="text-sm text-muted-foreground">{request.description}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Solicitado:{" "}
              {format(new Date(request.requested_at), "dd MMM yyyy", { locale: es })}
            </span>
            {request.expires_at && (
              <span>
                Expira:{" "}
                {format(new Date(request.expires_at), "dd MMM yyyy", { locale: es })}
              </span>
            )}
            {request.signed_at && (
              <span className="text-green-600 font-medium">
                <CheckCircle2 className="h-3 w-3 inline mr-0.5" />
                Firmado el{" "}
                {format(new Date(request.signed_at), "dd MMM yyyy HH:mm", { locale: es })}
              </span>
            )}
          </div>

          {request.document_url && (
            <a
              href={request.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver documento
            </a>
          )}

          {isOwn && request.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => setConfirmOpen(true)}>
                Firmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setRejectOpen(true)}
              >
                Rechazar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar firma</DialogTitle>
            <DialogDescription>
              Confirmo haber leído y acepto el documento:{" "}
              <strong>{request.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={signing}>
              Cancelar
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing ? "Firmando..." : "Confirmar firma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject confirmation dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar documento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres rechazar la firma del documento{" "}
              <strong>{request.title}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={rejecting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
            >
              {rejecting ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
