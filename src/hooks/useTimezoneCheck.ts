import { useMemo } from "react";

/**
 * Detecta si la zona horaria del navegador difiere de la zona esperada.
 * Por defecto usa Europe/Madrid (España). Si la organización tiene
 * configurada su propia timezone en el futuro, pasarla como argumento.
 */
export function useTimezoneCheck(expectedTimezone = "Europe/Madrid") {
  const result = useMemo(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const mismatch = browserTz !== expectedTimezone;
      return { browserTz, expectedTimezone, mismatch };
    } catch {
      return { browserTz: "desconocida", expectedTimezone, mismatch: false };
    }
  }, [expectedTimezone]);

  return result;
}
