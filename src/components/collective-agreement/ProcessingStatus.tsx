import { useState, useEffect } from 'react';
import { Clock, Loader2, CheckCircle, AlertCircle, Bot, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ProcessingStatusProps {
  status: 'uploaded' | 'processing' | 'pending_review' | 'approved' | 'active' | 'rejected' | 'processing_failed' | 'processing_cancelled';
  processingTime?: number;
  confidence?: number;
  extractedGroups?: number;
  extractedLevels?: number;
}

export function ProcessingStatus({ 
  status, 
  processingTime, 
  confidence, 
  extractedGroups = 0, 
  extractedLevels = 0 
}: ProcessingStatusProps) {
  const [progress, setProgress] = useState(0);

  // Simular progreso durante el procesamiento
  useEffect(() => {
    if (status === 'processing') {
      const timer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (status === 'pending_review' || status === 'approved') {
      setProgress(100);
    }
  }, [status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'pending_review':
      case 'approved':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'processing_failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'processing_cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
      case 'processing_failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing_cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploaded':
        return 'Archivo subido';
      case 'processing':
        return 'Procesando con IA';
      case 'pending_review':
        return 'Pendiente de revisión';
      case 'approved':
        return 'Aprobado';
      case 'active':
        return 'Activo';
      case 'rejected':
        return 'Rechazado';
      case 'processing_failed':
        return 'Error en procesamiento';
      case 'processing_cancelled':
        return 'Procesamiento cancelado';
      default:
        return 'Estado desconocido';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={`${getStatusColor()} border`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </Badge>
      </div>

      {/* Progreso durante procesamiento */}
      {status === 'processing' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>IA analizando documento...</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Extrayendo grupos profesionales y niveles salariales
          </p>
        </div>
      )}

      {/* Estadísticas de extracción */}
      {(status === 'pending_review' || status === 'approved' || status === 'active') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-accent rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{extractedGroups}</div>
            <div className="text-xs text-muted-foreground">Grupos extraídos</div>
          </div>
          
          <div className="bg-accent rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{extractedLevels}</div>
            <div className="text-xs text-muted-foreground">Niveles extraídos</div>
          </div>
          
          {confidence && (
            <div className="bg-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(confidence * 100)}%</div>
              <div className="text-xs text-muted-foreground">Confianza</div>
            </div>
          )}
          
          {processingTime && (
            <div className="bg-accent rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(processingTime / 1000)}s</div>
              <div className="text-xs text-muted-foreground">Tiempo procesado</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}