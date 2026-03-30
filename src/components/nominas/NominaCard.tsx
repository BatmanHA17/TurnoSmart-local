import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotionCard } from '@/components/ui/notion-components';
import { Download, Send, CheckCircle, Trash2 } from 'lucide-react';
import type { Nomina } from '@/hooks/useNominas';

const MONTHS_ES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function statusBadge(status: Nomina['status']) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Borrador</Badge>;
    case 'sent':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Enviada</Badge>;
    case 'acknowledged':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Acuse recibido</Badge>;
    default:
      return null;
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '-';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

interface NominaCardProps {
  nomina: Nomina;
  /** Show employee name (org view) vs period only (employee view) */
  showEmployee?: boolean;
  /** Whether current user is manager/admin (controls management actions) */
  isManager?: boolean;
  /** Whether current user is the employee (controls acknowledge action) */
  isEmployee?: boolean;
  onSend?: (id: string) => void;
  onAcknowledge?: (id: string) => void;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export function NominaCard({
  nomina,
  showEmployee = false,
  isManager = false,
  isEmployee = false,
  onSend,
  onAcknowledge,
  onDelete,
  disabled = false,
}: NominaCardProps) {
  const periodoLabel = `${MONTHS_ES[nomina.month]} ${nomina.year}`;
  const employeeName = nomina.colaborador_nombre && nomina.colaborador_apellidos
    ? `${nomina.colaborador_nombre} ${nomina.colaborador_apellidos}`
    : null;

  return (
    <NotionCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="space-y-1 min-w-0">
          {showEmployee && employeeName && (
            <p className="font-semibold text-foreground truncate">{employeeName}</p>
          )}
          <p className="text-sm text-muted-foreground">{periodoLabel}</p>
          <div className="flex flex-wrap gap-4 mt-2">
            <div>
              <span className="text-xs text-muted-foreground block">Bruto</span>
              <span className="text-sm font-medium">{formatCurrency(nomina.salario_bruto)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Deducciones</span>
              <span className="text-sm font-medium">{formatCurrency(nomina.deducciones)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Neto</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(nomina.salario_neto)}</span>
            </div>
          </div>
        </div>

        {/* Right: status + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {statusBadge(nomina.status)}

          <div className="flex items-center gap-1 mt-1">
            {/* Download PDF */}
            {nomina.document_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                disabled={disabled}
                title="Descargar PDF"
              >
                <a href={nomina.document_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}

            {/* Manager: Send (draft → sent) */}
            {isManager && nomina.status === 'draft' && onSend && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSend(nomina.id)}
                disabled={disabled}
                title="Enviar al empleado"
              >
                <Send className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            )}

            {/* Employee: Acknowledge (sent → acknowledged) */}
            {isEmployee && nomina.status === 'sent' && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(nomina.id)}
                disabled={disabled}
                className="border-green-600 text-green-700 hover:bg-green-50"
                title="Confirmar recepción"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Acuse
              </Button>
            )}

            {/* Manager: Delete (only draft) */}
            {isManager && nomina.status === 'draft' && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(nomina.id)}
                disabled={disabled}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Eliminar borrador"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </NotionCard>
  );
}
