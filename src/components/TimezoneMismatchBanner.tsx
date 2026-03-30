import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTimezoneCheck } from "@/hooks/useTimezoneCheck";

interface TimezoneMismatchBannerProps {
  /** Timezone esperada. Por defecto Europe/Madrid */
  expectedTimezone?: string;
}

/**
 * Muestra un banner de aviso cuando la zona horaria del navegador
 * no coincide con la zona configurada en la aplicación.
 * El usuario puede cerrarlo para la sesión actual.
 */
export function TimezoneMismatchBanner({ expectedTimezone }: TimezoneMismatchBannerProps) {
  const { browserTz, mismatch } = useTimezoneCheck(expectedTimezone);
  const [dismissed, setDismissed] = useState(false);

  if (!mismatch || dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
      <span className="flex-1">
        Tu zona horaria ({browserTz}) no coincide con la configurada en TurnoSmart ({expectedTimezone ?? "Europe/Madrid"}).
        Los horarios pueden mostrarse de forma incorrecta.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:text-amber-600 transition-colors"
        aria-label="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
