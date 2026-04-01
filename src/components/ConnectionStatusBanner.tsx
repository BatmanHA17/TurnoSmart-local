import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ConnectionStatus } from '@/hooks/useConnectionStatus';
import type { SaveStatus } from '@/hooks/useInstantSave';

interface ConnectionStatusBannerProps {
  connectionStatus: ConnectionStatus;
  saveStatus: SaveStatus;
  pendingCount: number;
  isSyncing: boolean;
  onManualSync?: () => void;
  lastSavedAt: Date | null;
  className?: string;
}

export function ConnectionStatusBanner({
  connectionStatus,
  saveStatus,
  pendingCount,
  isSyncing,
  onManualSync,
  lastSavedAt,
  className,
}: ConnectionStatusBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastShownSaveTime, setLastShownSaveTime] = useState<number | null>(null);

  // Mostrar banner cuando hay problemas o cambios recientes
  useEffect(() => {
    if (connectionStatus === 'offline' || connectionStatus === 'reconnecting') {
      setIsVisible(true);
    } else if (saveStatus === 'error') {
      setIsVisible(true);
    } else if (pendingCount > 0) {
      setIsVisible(true);
    } else if (saveStatus === 'saved' && lastSavedAt) {
      const saveTime = lastSavedAt.getTime();
      // Solo mostrar si han pasado >5s desde el último banner mostrado (evitar re-trigger por auto-save)
      if (!lastShownSaveTime || saveTime - lastShownSaveTime > 5000) {
        setLastShownSaveTime(saveTime);
        setIsVisible(true);
        // Auto-ocultar después de 2 segundos
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else if (connectionStatus === 'online' && pendingCount === 0 && saveStatus === 'idle') {
      setIsVisible(false);
    }
  }, [connectionStatus, saveStatus, pendingCount, lastSavedAt, lastShownSaveTime]);

  // Formatear tiempo relativo
  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'ahora mismo';
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    return `hace ${Math.floor(minutes / 60)}h`;
  };

  // No mostrar si no hay nada relevante
  if (!isVisible) return null;

  // Determinar contenido del banner
  const getBannerContent = () => {
    // Offline
    if (connectionStatus === 'offline') {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Sin conexión',
        description: pendingCount > 0 
          ? `${pendingCount} cambios guardados localmente` 
          : 'Los cambios se guardarán al reconectar',
        variant: 'warning' as const,
      };
    }

    // Reconectando
    if (connectionStatus === 'reconnecting') {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        title: 'Reconectando...',
        description: 'Intentando restablecer conexión',
        variant: 'warning' as const,
      };
    }

    // Sincronizando
    if (isSyncing) {
      return {
        icon: <Cloud className="h-4 w-4 animate-pulse" />,
        title: 'Sincronizando',
        description: `Subiendo ${pendingCount} cambios pendientes...`,
        variant: 'info' as const,
      };
    }

    // Error de guardado
    if (saveStatus === 'error') {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Error al guardar',
        description: 'No se pudo guardar. Se reintentará automáticamente.',
        variant: 'error' as const,
      };
    }

    // Cambios pendientes
    if (pendingCount > 0) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        title: 'Cambios pendientes',
        description: `${pendingCount} cambios esperando sincronización`,
        variant: 'warning' as const,
      };
    }

    // Guardado exitoso
    if (saveStatus === 'saved') {
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: 'Guardado',
        description: lastSavedAt ? getRelativeTime(lastSavedAt) : 'Todos los cambios guardados',
        variant: 'success' as const,
      };
    }

    // Estado normal - online
    return {
      icon: <Wifi className="h-4 w-4" />,
      title: 'Conectado',
      description: 'Todos los cambios sincronizados',
      variant: 'success' as const,
    };
  };

  const content = getBannerContent();

  const variantStyles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-lg border shadow-lg transition-all duration-300',
        variantStyles[content.variant],
        className
      )}
    >
      {content.icon}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{content.title}</span>
        <span className="text-xs opacity-80">{content.description}</span>
      </div>
      {pendingCount > 0 && connectionStatus === 'online' && onManualSync && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSync}
          className="ml-2 h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sincronizar
        </Button>
      )}
    </div>
  );
}
