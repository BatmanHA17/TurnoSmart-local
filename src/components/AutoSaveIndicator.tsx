import { useState, useEffect } from "react";
import { Save, Check, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  isAutoSaving: boolean;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  saveError?: string | null;
  changeCount?: number;
  onManualSave?: () => void;
}

export function AutoSaveIndicator({
  isAutoSaving = false,
  lastSaved = null,
  hasUnsavedChanges = false,
  saveError = null,
  changeCount = 0,
  onManualSave
}: AutoSaveIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return 'hace unos segundos';
    } else if (diffMins < 60) {
      return `hace ${diffMins}m`;
    } else {
      return `a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  // Get status info
  const getStatusInfo = () => {
    if (saveError) {
      return {
        icon: AlertCircle,
        text: 'Error al guardar',
        className: 'text-destructive',
        bgClassName: 'bg-destructive/10 border-destructive/20'
      };
    }
    
    if (isAutoSaving) {
      return {
        icon: Clock,
        text: 'Guardando...',
        className: 'text-amber-600',
        bgClassName: 'bg-amber-50 border-amber-200'
      };
    }
    
    if (hasUnsavedChanges && changeCount > 0) {
      return {
        icon: Save,
        text: `${changeCount} cambio${changeCount > 1 ? 's' : ''} pendiente${changeCount > 1 ? 's' : ''}`,
        className: 'text-blue-600',
        bgClassName: 'bg-blue-50 border-blue-200'
      };
    }
    
    return {
      icon: Check,
      text: 'Guardado',
      className: 'text-green-600',
      bgClassName: 'bg-green-50 border-green-200'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const tooltipContent = () => {
    if (saveError) {
      return `Error: ${saveError}`;
    }
    
    if (lastSaved) {
      return `Último guardado: ${getRelativeTime(lastSaved)}`;
    }
    
    if (hasUnsavedChanges) {
      return 'Hay cambios sin guardar';
    }
    
    return 'Todos los cambios están guardados';
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-200",
        statusInfo.bgClassName
      )}>
        <div className="flex items-center gap-1.5">
          <StatusIcon 
            className={cn(
              "h-3.5 w-3.5 transition-all duration-200", 
              statusInfo.className,
              isAutoSaving && "animate-spin"
            )} 
          />
          <span className={cn("font-medium", statusInfo.className)}>
            {statusInfo.text}
          </span>
        </div>

        {lastSaved && !isAutoSaving && (
          <span className="text-muted-foreground text-xs">
            {getRelativeTime(lastSaved)}
          </span>
        )}

        {onManualSave && (hasUnsavedChanges || saveError) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10"
                onClick={onManualSave}
                disabled={isAutoSaving}
              >
                <Save className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Guardar manualmente</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <span className="sr-only">Información de guardado</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>{tooltipContent()}</p>
              {changeCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Autoguardado cada 3 segundos
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}