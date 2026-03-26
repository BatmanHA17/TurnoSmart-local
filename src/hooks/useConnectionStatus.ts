import { useState, useEffect, useCallback } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: Date | null;
  reconnectAttempts: number;
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const handleOnline = useCallback(() => {
    setStatus('online');
    setLastOnlineAt(new Date());
    setReconnectAttempts(0);
  }, []);

  const handleOffline = useCallback(() => {
    setStatus('offline');
  }, []);

  // Verificar conexión real haciendo ping al servidor
  const checkRealConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      await fetch('https://povgwdbnyqdcygedcijl.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      // Cualquier respuesta del servidor (incluso 401/403) significa conexión activa
      return true;
    } catch {
      // Error de red real (timeout, DNS, etc.)
      return false;
    }
  }, []);

  // Intentar reconectar periódicamente cuando está offline
  useEffect(() => {
    if (status !== 'offline') return;

    const attemptReconnect = async () => {
      setStatus('reconnecting');
      setReconnectAttempts(prev => prev + 1);
      
      const isConnected = await checkRealConnection();
      
      if (isConnected) {
        handleOnline();
      } else {
        setStatus('offline');
      }
    };

    // Intentar reconectar cada 5 segundos cuando está offline
    const intervalId = setInterval(attemptReconnect, 5000);

    return () => clearInterval(intervalId);
  }, [status, checkRealConnection, handleOnline]);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado real al montar
    checkRealConnection().then(isConnected => {
      if (!isConnected && navigator.onLine) {
        setStatus('offline');
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, checkRealConnection]);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline' || status === 'reconnecting',
    lastOnlineAt,
    reconnectAttempts,
  };
}
