import { useEffect } from 'react';

interface UseBeforeUnloadProps {
  when: boolean;
  message?: string;
}

export function useBeforeUnload({
  when,
  message = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?',
}: UseBeforeUnloadProps) {
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome requiere returnValue
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [when, message]);
}
