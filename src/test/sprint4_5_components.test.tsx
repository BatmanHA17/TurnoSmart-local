/**
 * sprint4_5_components.test.tsx
 * Tests for Sprint 4 & 5 components:
 *   - WikiArticleCard
 *   - MetricCard
 *   - PWAInstallBanner
 *   - MobileBottomNav
 *   - NotificationBell
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { Users } from 'lucide-react';

// ── Global mocks ─────────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// useAuth — default: authenticated user. Tests that need no-user override locally.
const mockUseAuth = vi.fn(() => ({
  user: { id: 'user-1', email: 'test@test.com' },
  loading: false,
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// useNotifications — controlled via mockNotificationsReturn below
const mockMarkAsRead = vi.fn().mockResolvedValue(undefined);
const mockMarkAllAsRead = vi.fn().mockResolvedValue(undefined);
const mockDeleteNotification = vi.fn().mockResolvedValue(undefined);

interface MockNotificationsReturn {
  notifications: import('@/hooks/useNotifications').Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: typeof mockMarkAsRead;
  markAllAsRead: typeof mockMarkAllAsRead;
  deleteNotification: typeof mockDeleteNotification;
}

let mockNotificationsReturn: MockNotificationsReturn = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  deleteNotification: mockDeleteNotification,
};

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => mockNotificationsReturn,
}));

// useUserRoleCanonical
const mockUseUserRoleCanonical = vi.fn(() => ({
  role: 'MANAGER',
  isAdmin: true,
  isManager: true,
  isOwner: false,
  loading: false,
}));
vi.mock('@/hooks/useUserRoleCanonical', () => ({
  useUserRoleCanonical: () => mockUseUserRoleCanonical(),
}));

// react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/turnosmart/mensajes' }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

// ── Shared test data ──────────────────────────────────────────────────────────

const makeArticle = (overrides: Partial<import('@/hooks/useWiki').WikiArticle> = {}): import('@/hooks/useWiki').WikiArticle => ({
  id: 'article-1',
  org_id: 'org-1',
  title: 'Guía de Bienvenida',
  slug: 'guia-de-bienvenida',
  content: '# Bienvenido\nEste es el contenido.',
  category: 'Onboarding',
  tags: ['inicio', 'rrhh'],
  published: true,
  pinned: false,
  author_id: 'user-1',
  view_count: 42,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-03-01T12:00:00Z',
  ...overrides,
});

const makeNotification = (
  overrides: Partial<import('@/hooks/useNotifications').Notification> = {}
): import('@/hooks/useNotifications').Notification => ({
  id: 'notif-1',
  user_id: 'user-1',
  org_id: 'org-1',
  type: 'shift_published',
  title: 'Turno publicado',
  body: 'Tu turno del lunes ha sido publicado.',
  data: {},
  read: false,
  read_at: null,
  action_url: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. WikiArticleCard
// ─────────────────────────────────────────────────────────────────────────────

import { WikiArticleCard } from '@/components/wiki/WikiArticleCard';

describe('WikiArticleCard', () => {
  const onSelect = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onEdit.mockClear();
  });

  it('renders article title', () => {
    render(
      <WikiArticleCard
        article={makeArticle()}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Guía de Bienvenida')).toBeInTheDocument();
  });

  it('renders category badge when category is provided', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ category: 'Onboarding' })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('does NOT render category badge when no category', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ category: null })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.queryByText('Onboarding')).not.toBeInTheDocument();
  });

  it('shows pinned indicator when pinned=true', () => {
    const { container } = render(
      <WikiArticleCard
        article={makeArticle({ pinned: true })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    // Pin icon renders inside a span with title "Artículo fijado"
    const pinnedSpan = container.querySelector('[title="Artículo fijado"]');
    expect(pinnedSpan).toBeInTheDocument();
  });

  it('does NOT show pinned indicator when pinned=false', () => {
    const { container } = render(
      <WikiArticleCard
        article={makeArticle({ pinned: false })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(container.querySelector('[title="Artículo fijado"]')).not.toBeInTheDocument();
  });

  it('shows view count', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ view_count: 42 })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows Publicado badge when published=true', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ published: true })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.queryByText('Borrador')).not.toBeInTheDocument();
  });

  it('shows Borrador badge when published=false', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ published: false })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.queryByText('Publicado')).not.toBeInTheDocument();
  });

  it('shows edit button when isManager=true (canEdit)', () => {
    render(
      <WikiArticleCard
        article={makeArticle()}
        isManager={true}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByTitle('Editar artículo')).toBeInTheDocument();
  });

  it('does NOT show edit button when isManager=false', () => {
    render(
      <WikiArticleCard
        article={makeArticle()}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.queryByTitle('Editar artículo')).not.toBeInTheDocument();
  });

  it('clicking title calls onSelect with the article', async () => {
    const article = makeArticle();
    render(
      <WikiArticleCard
        article={article}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByText('Guía de Bienvenida'));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(article);
  });

  it('clicking edit button calls onEdit with the article', async () => {
    const article = makeArticle();
    render(
      <WikiArticleCard
        article={article}
        isManager={true}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    fireEvent.click(screen.getByTitle('Editar artículo'));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(article);
  });

  it('renders tags when provided', () => {
    render(
      <WikiArticleCard
        article={makeArticle({ tags: ['inicio', 'rrhh'] })}
        isManager={false}
        onSelect={onSelect}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('inicio')).toBeInTheDocument();
    expect(screen.getByText('rrhh')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MetricCard
// ─────────────────────────────────────────────────────────────────────────────

import { MetricCard } from '@/components/productivity/MetricCard';

describe('MetricCard', () => {
  it('renders the title text', () => {
    render(<MetricCard title="Turnos publicados" value={12} icon={Users} />);
    expect(screen.getByText('Turnos publicados')).toBeInTheDocument();
  });

  it('renders the value as number', () => {
    render(<MetricCard title="Total" value={99} icon={Users} />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('renders the value as string', () => {
    render(<MetricCard title="Promedio" value="8.5h" icon={Users} />);
    expect(screen.getByText('8.5h')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    const { container } = render(<MetricCard title="Test" value={1} icon={Users} />);
    // LucideIcon renders an SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows subtitle when provided', () => {
    render(
      <MetricCard title="Horas" value={40} icon={Users} subtitle="esta semana" />
    );
    expect(screen.getByText('esta semana')).toBeInTheDocument();
  });

  it('does NOT show subtitle section when subtitle is undefined', () => {
    render(<MetricCard title="Horas" value={40} icon={Users} />);
    expect(screen.queryByText('esta semana')).not.toBeInTheDocument();
  });

  it('shows upward trend indicator when trend.positive=true', () => {
    const { container } = render(
      <MetricCard title="Test" value={10} icon={Users} trend={{ value: 5.5, positive: true }} />
    );
    // TrendingUp SVG is rendered; also check the percentage text
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    // The trend container should have emerald color class
    const trendDiv = container.querySelector('.text-emerald-600');
    expect(trendDiv).toBeInTheDocument();
  });

  it('shows downward trend indicator when trend.positive=false', () => {
    const { container } = render(
      <MetricCard title="Test" value={10} icon={Users} trend={{ value: -3.2, positive: false }} />
    );
    expect(screen.getByText('3.2%')).toBeInTheDocument();
    const trendDiv = container.querySelector('.text-red-500');
    expect(trendDiv).toBeInTheDocument();
  });

  it('trend percentage is displayed correctly using Math.abs', () => {
    render(
      <MetricCard title="Test" value={10} icon={Users} trend={{ value: -7.8, positive: false }} />
    );
    // Math.abs(-7.8).toFixed(1) = "7.8"
    expect(screen.getByText('7.8%')).toBeInTheDocument();
  });

  it('does NOT show trend section when trend is undefined', () => {
    const { container } = render(<MetricCard title="Test" value={10} icon={Users} />);
    expect(container.querySelector('.text-emerald-600')).not.toBeInTheDocument();
    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PWAInstallBanner
// ─────────────────────────────────────────────────────────────────────────────

import { PWAInstallBanner } from '@/components/PWAInstallBanner';

const DISMISSED_KEY = 'pwa-install-banner-dismissed';

function makeBeforeInstallPromptEvent(overrides: Partial<{
  promptFn: () => Promise<void>;
  outcome: 'accepted' | 'dismissed';
}> = {}) {
  const promptFn = overrides.promptFn ?? vi.fn().mockResolvedValue(undefined);
  const outcome = overrides.outcome ?? 'accepted';

  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  event.prompt = promptFn;
  (event as any).userChoice = Promise.resolve({ outcome });
  return { event, promptFn };
}

describe('PWAInstallBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    // Default: non-standalone display mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false, // not standalone
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders nothing initially (no beforeinstallprompt event yet)', () => {
    const { container } = render(<PWAInstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when display mode is standalone (already installed)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<PWAInstallBanner />);
    // Even if we fire the event, banner won't show because isStandalone=true
    act(() => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });
    expect(container.firstChild).toBeNull();
  });

  it('shows banner text when beforeinstallprompt fires', async () => {
    render(<PWAInstallBanner />);

    await act(async () => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    expect(
      screen.getByText(/Instala TurnoSmart en tu dispositivo/i)
    ).toBeInTheDocument();
  });

  it('shows "Instalar" button in banner', async () => {
    render(<PWAInstallBanner />);

    await act(async () => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    expect(screen.getByRole('button', { name: /Instalar/i })).toBeInTheDocument();
  });

  it('clicking "Instalar" calls promptEvent.prompt()', async () => {
    render(<PWAInstallBanner />);
    const { event, promptFn } = makeBeforeInstallPromptEvent({ outcome: 'accepted' });

    await act(async () => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Instalar/i }));
    });

    expect(promptFn).toHaveBeenCalledOnce();
  });

  it('clicking X (dismiss) hides the banner', async () => {
    render(<PWAInstallBanner />);

    await act(async () => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/Instala TurnoSmart/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
    });

    expect(screen.queryByText(/Instala TurnoSmart/i)).not.toBeInTheDocument();
  });

  it('after dismissal, banner does not reappear (localStorage check)', async () => {
    render(<PWAInstallBanner />);

    await act(async () => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
    });

    expect(localStorage.getItem(DISMISSED_KEY)).toBe('true');
  });

  it('renders nothing when already dismissed (localStorage has dismiss key)', async () => {
    localStorage.setItem(DISMISSED_KEY, 'true');

    const { container } = render(<PWAInstallBanner />);

    await act(async () => {
      const { event } = makeBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    expect(container.firstChild).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. MobileBottomNav
// ─────────────────────────────────────────────────────────────────────────────

import { MobileBottomNav } from '@/components/MobileBottomNav';

describe('MobileBottomNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Default: authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@test.com' },
      loading: false,
    });
    mockNotificationsReturn = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
    };
    mockUseUserRoleCanonical.mockReturnValue({
      role: 'MANAGER',
      isAdmin: true,
      isManager: true,
      isOwner: false,
      loading: false,
    });
  });

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 5 navigation tabs when authenticated', () => {
    render(<MobileBottomNav />);
    // Each tab renders a button with aria-label
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('active tab (Mensajes) has text-primary class based on current path /turnosmart/mensajes', () => {
    render(<MobileBottomNav />);
    const mensajesButton = screen.getByRole('button', { name: /Mensajes/i });
    expect(mensajesButton).toHaveClass('text-primary');
  });

  it('inactive tabs do NOT have text-primary class', () => {
    render(<MobileBottomNav />);
    const inicioButton = screen.getByRole('button', { name: /Inicio/i });
    expect(inicioButton).not.toHaveClass('text-primary');
  });

  it('shows badge on Mensajes tab when unreadCount > 0', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 3 };
    render(<MobileBottomNav />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does NOT show badge when unreadCount is 0', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 0 };
    render(<MobileBottomNav />);
    // No single-digit number badge should appear
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('shows "9+" badge when unreadCount > 9', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 15 };
    render(<MobileBottomNav />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renders Calendario label for MANAGER role', () => {
    mockUseUserRoleCanonical.mockReturnValue({ role: 'MANAGER', isAdmin: true, isManager: true, isOwner: false, loading: false });
    render(<MobileBottomNav />);
    expect(screen.getByText('Calendario')).toBeInTheDocument();
  });

  it('renders "Mis Turnos" label for non-manager role (EMPLOYEE)', () => {
    mockUseUserRoleCanonical.mockReturnValue({ role: 'EMPLOYEE', isAdmin: false, isManager: false, isOwner: false, loading: false });
    render(<MobileBottomNav />);
    expect(screen.getByText('Mis Turnos')).toBeInTheDocument();
  });

  it('clicking a tab calls navigate with the correct path', async () => {
    render(<MobileBottomNav />);
    fireEvent.click(screen.getByRole('button', { name: /Perfil/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. NotificationBell
// ─────────────────────────────────────────────────────────────────────────────

import { NotificationBell } from '@/components/notifications/NotificationBell';

describe('NotificationBell', () => {
  beforeEach(() => {
    mockMarkAsRead.mockClear();
    mockMarkAllAsRead.mockClear();
    mockNotificationsReturn = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteNotification: mockDeleteNotification,
    };
  });

  it('renders a Bell icon button', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: /Notificaciones/i })).toBeInTheDocument();
  });

  it('does NOT show unread badge when unreadCount=0', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 0 };
    render(<NotificationBell />);
    // Badge text would be a number; ensure nothing like "1","2" etc. appears
    const button = screen.getByRole('button', { name: /Notificaciones/i });
    // The badge span has font-bold text-white — check it's absent
    expect(button.querySelector('span')).not.toBeInTheDocument();
  });

  it('shows unread badge with correct count when unreadCount > 0', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 4 };
    render(<NotificationBell />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows "9+" when unreadCount > 9', () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, unreadCount: 12 };
    render(<NotificationBell />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('clicking bell opens the notifications popover', async () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('popover shows "No tienes notificaciones" when notifications array is empty', async () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, notifications: [] };
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText('No tienes notificaciones')).toBeInTheDocument();
  });

  it('popover shows notification items when notifications exist', async () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makeNotification({ title: 'Turno publicado' })],
    };
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText('Turno publicado')).toBeInTheDocument();
  });

  it('notification item shows title and body', async () => {
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [
        makeNotification({
          title: 'Ausencia aprobada',
          body: 'Tu solicitud del lunes fue aprobada.',
        }),
      ],
    };
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText('Ausencia aprobada')).toBeInTheDocument();
    expect(screen.getByText('Tu solicitud del lunes fue aprobada.')).toBeInTheDocument();
  });

  it('clicking a notification item calls markAsRead with its id', async () => {
    const notif = makeNotification({ id: 'notif-xyz', read: false });
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [notif],
      markAsRead: mockMarkAsRead,
    };
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    const notifButton = screen.getByText('Turno publicado').closest('button')!;
    fireEvent.click(notifButton);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-xyz');
    });
  });

  it('"Marcar todo como leído" button calls markAllAsRead', async () => {
    // The button only renders when some notifications are unread
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      notifications: [makeNotification({ read: false })],
      markAllAsRead: mockMarkAllAsRead,
    };
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    const markAllBtn = screen.getByText('Marcar todo como leído');
    fireEvent.click(markAllBtn);

    expect(mockMarkAllAsRead).toHaveBeenCalledOnce();
  });
});
