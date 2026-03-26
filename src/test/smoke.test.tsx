/**
 * smoke.test.tsx — Tests básicos de humo para TurnoSmart
 *
 * Verifican que los componentes críticos renderizan sin crashear.
 * No prueban lógica de negocio — solo que la app no explota al cargar.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary, SectionErrorBoundary } from '@/components/ErrorBoundary';
import { safeQuery, isMountedRef } from '@/utils/safeQuery';

// ── Mocks globales ──────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({ user: null, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Componente auxiliar que lanza error ─────────────────────────────────────
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  it('renderiza children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Contenido OK</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('muestra pantalla de error cuando hay excepción', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText(/algo ha ido mal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('acepta fallback personalizado', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Mi error</div>}>
        <ThrowError message="Test" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});

describe('SectionErrorBoundary', () => {
  it('renderiza children cuando no hay error', () => {
    render(
      <SectionErrorBoundary label="test">
        <span data-testid="section-child">OK</span>
      </SectionErrorBoundary>
    );
    expect(screen.getByTestId('section-child')).toBeInTheDocument();
  });

  it('muestra botón reintentar cuando hay error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SectionErrorBoundary label="test-section">
        <ThrowError message="Section crash" />
      </SectionErrorBoundary>
    );

    expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});

describe('safeQuery', () => {
  it('retorna data cuando la query es exitosa', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    const result = await safeQuery(
      () => Promise.resolve({ data: mockData, error: null }),
      'test'
    );
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
  });

  it('retorna error string cuando la query falla con objeto error', async () => {
    const result = await safeQuery(
      () => Promise.resolve({ data: null, error: { message: 'DB error' } }),
      'test'
    );
    expect(result.data).toBeNull();
    expect(result.error).toBe('DB error');
  });

  it('captura excepciones inesperadas (Promise.reject)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await safeQuery(
      () => Promise.reject(new Error('Network failure')),
      'test'
    );
    expect(result.data).toBeNull();
    expect(result.error).toBe('Network failure');
    consoleSpy.mockRestore();
  });

  it('devuelve error genérico si el error no tiene message', async () => {
    const result = await safeQuery(
      () => Promise.resolve({ data: null, error: {} }),
      'test'
    );
    expect(result.error).toBe('Error desconocido');
  });
});

describe('isMountedRef', () => {
  it('crea ref con current=true', () => {
    const ref = isMountedRef();
    expect(ref.current).toBe(true);
  });

  it('permite establecer current=false para simular desmontaje', () => {
    const ref = isMountedRef();
    ref.current = false;
    expect(ref.current).toBe(false);
  });
});
