import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  // Already installed as standalone PWA
  const isStandalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setPromptEvent(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!promptEvent || dismissed || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <Smartphone className="h-5 w-5 shrink-0 text-slate-300" />
      <p className="flex-1 text-sm">
        Instala TurnoSmart en tu dispositivo para acceder más rápido
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0 bg-white text-slate-900 hover:bg-slate-100"
        onClick={handleInstall}
      >
        Instalar
      </Button>
      <button
        aria-label="Cerrar"
        className="shrink-0 text-slate-400 hover:text-white transition-colors"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
