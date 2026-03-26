import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'

// ── Sentry — Error monitoring ───────────────────────────────────────────────
// Solo activo en producción. En desarrollo, el DSN no está definido → no hace nada.
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Captura el 10% de las transacciones de performance en producción
    tracesSampleRate: 0.1,
    // Captura el 100% de los errores
    beforeSend(event) {
      // No enviamos errores de red (offline, timeout) — son esperados
      if (event.exception?.values?.[0]?.type === 'TypeError' &&
          event.exception.values[0].value?.includes('fetch')) {
        return null;
      }
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
