import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-800">
              Algo ha ido mal
            </h1>
            <p className="text-gray-500 text-sm">
              Ha ocurrido un error inesperado. Si el problema persiste,
              contacta con soporte.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-gray-100 rounded p-3 text-red-600 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center px-4 py-2 bg-[#696fc3] text-white text-sm rounded-lg hover:bg-[#5a60b0] transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SectionErrorBoundary — boundary ligero para secciones internas.
 * No redirige a home, permite reintentar sin recargar la página entera.
 */
interface SectionProps {
  children: ReactNode;
  label?: string;
}

interface SectionState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<SectionProps, SectionState> {
  constructor(props: SectionProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[SectionErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info.componentStack);
    }
    Sentry.captureException(error, {
      tags: { section: this.props.label ?? 'unknown' },
      extra: { componentStack: info.componentStack },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
          <p className="text-sm">Error al cargar esta sección.</p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
