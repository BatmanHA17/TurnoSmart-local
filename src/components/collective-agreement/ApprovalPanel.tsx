import { useState } from 'react';
import { CheckCircle, XCircle, Edit3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ApprovalPanelProps {
  status: 'pending_review' | 'approved' | 'rejected';
  extractedData: {
    groups: number;
    levels: number;
    confidence: number;
  };
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export function ApprovalPanel({
  status,
  extractedData,
  onApprove,
  onReject,
  onEdit,
  isLoading = false
}: ApprovalPanelProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Media';
    return 'Baja';
  };

  if (status === 'approved') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">Convenio Aprobado</h3>
            <p className="text-sm text-green-600">
              El convenio ha sido revisado y aprobado correctamente
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Convenio Rechazado</h3>
            <p className="text-sm text-red-600">
              El convenio necesita correcciones antes de ser aprobado
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de extracción */}
      <div className="bg-accent rounded-lg p-4">
        <h3 className="font-medium mb-3">Resumen de Extracción</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{extractedData.groups}</div>
            <div className="text-xs text-muted-foreground">Grupos Profesionales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{extractedData.levels}</div>
            <div className="text-xs text-muted-foreground">Niveles Salariales</div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className={getConfidenceColor(extractedData.confidence)}>
              {getConfidenceText(extractedData.confidence)} ({Math.round(extractedData.confidence * 100)}%)
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">Confianza IA</div>
          </div>
        </div>
      </div>

      {/* Advertencia si la confianza es baja */}
      {extractedData.confidence < 0.7 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            La confianza de la extracción es baja. Se recomienda revisar y editar manualmente 
            los datos antes de aprobar el convenio.
          </AlertDescription>
        </Alert>
      )}

      {/* Panel de acciones */}
      <div className="space-y-3">
        <h4 className="font-medium">Acciones de Revisión</h4>
        
        {!showRejectForm ? (
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={onApprove} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Aprobar Convenio
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onEdit}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Editar Manualmente
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowRejectForm(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Describe por qué rechazas este convenio y qué correcciones son necesarias..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={!rejectReason.trim() || isLoading}
              >
                Confirmar Rechazo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRejectForm(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="text-xs text-muted-foreground bg-accent/50 rounded p-3">
        <p><strong>Tip:</strong> Una vez aprobado, este convenio estará disponible para aplicar a todos los empleados de la organización. Puedes activarlo como convenio principal desde la sección "Convenio Activo".</p>
      </div>
    </div>
  );
}