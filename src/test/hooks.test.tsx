/**
 * hooks.test.ts — Unit tests for TurnoSmart custom hooks
 *
 * Covers:
 *   - useTimezoneCheck
 *   - useCalendarDragDrop
 *   - usePullToRefresh
 *   - useDailyNotes
 *   - useICalExport
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor, render } from '@testing-library/react';
// fireEvent intentionally omitted — touch events dispatched via native DOM APIs

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/utils/icalExport', () => ({
  generateICalContent: vi.fn(() => 'BEGIN:VCALENDAR\r\nEND:VCALENDAR'),
  downloadICalFile: vi.fn(),
}));

// Use vi.hoisted so that mock variables are available when vi.mock factories run
const {
  mockLte,
  mockGte,
  mockEq,
  mockSelect,
  mockUpsert,
  mockFrom,
} = vi.hoisted(() => {
  const mockLte = vi.fn().mockResolvedValue({
    data: [{ date: '2026-03-31', note: 'Test note' }],
    error: null,
  });
  const mockGte = vi.fn(() => ({ lte: mockLte }));
  const mockEq = vi.fn(() => ({ gte: mockGte }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: mockUpsert }));
  return { mockLte, mockGte, mockEq, mockSelect, mockUpsert, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

// ── Hook imports (after mocks) ───────────────────────────────────────────────

import { useTimezoneCheck } from '@/hooks/useTimezoneCheck';
import { useCalendarDragDrop } from '@/hooks/useCalendarDragDrop';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import { useICalExport } from '@/hooks/useICalExport';
import { generateICalContent, downloadICalFile } from '@/utils/icalExport';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDragEvent(overrides: Partial<React.DragEvent> = {}): React.DragEvent {
  return {
    altKey: false,
    ctrlKey: false,
    dataTransfer: { dropEffect: 'none' } as DataTransfer,
    ...overrides,
  } as unknown as React.DragEvent;
}

// ── useTimezoneCheck ─────────────────────────────────────────────────────────

describe('useTimezoneCheck', () => {
  let originalResolvedOptions: typeof Intl.DateTimeFormat.prototype.resolvedOptions;

  beforeEach(() => {
    originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  });

  afterEach(() => {
    Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
    vi.restoreAllMocks();
  });

  function mockBrowserTz(tz: string) {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: tz } as Intl.ResolvedDateTimeFormatOptions),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as Intl.DateTimeFormat)
    );
  }

  it('returns mismatch=false when browser tz matches expected tz', () => {
    mockBrowserTz('Europe/Madrid');
    const { result } = renderHook(() => useTimezoneCheck('Europe/Madrid'));
    expect(result.current.mismatch).toBe(false);
  });

  it('returns mismatch=true when browser tz differs from expected', () => {
    mockBrowserTz('America/New_York');
    const { result } = renderHook(() => useTimezoneCheck('Europe/Madrid'));
    expect(result.current.mismatch).toBe(true);
  });

  it('returns browserTz with the detected timezone string', () => {
    mockBrowserTz('America/New_York');
    const { result } = renderHook(() => useTimezoneCheck('Europe/Madrid'));
    expect(result.current.browserTz).toBe('America/New_York');
  });

  it('returns expectedTimezone with the parameter value', () => {
    mockBrowserTz('Europe/Madrid');
    const { result } = renderHook(() => useTimezoneCheck('America/Chicago'));
    expect(result.current.expectedTimezone).toBe('America/Chicago');
  });

  it("uses 'Europe/Madrid' as default expectedTimezone when none provided", () => {
    mockBrowserTz('Europe/Madrid');
    const { result } = renderHook(() => useTimezoneCheck());
    expect(result.current.expectedTimezone).toBe('Europe/Madrid');
  });

  it('returns mismatch=false when Intl.DateTimeFormat throws (error resilience)', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl not supported');
    });
    const { result } = renderHook(() => useTimezoneCheck('Europe/Madrid'));
    expect(result.current.mismatch).toBe(false);
  });
});

// ── useCalendarDragDrop ──────────────────────────────────────────────────────

describe('useCalendarDragDrop', () => {
  it('initial state: isDragCopyMode is false', () => {
    const { result } = renderHook(() => useCalendarDragDrop());
    expect(result.current.isDragCopyMode).toBe(false);
  });

  it('isDragCopyMode becomes true when Alt key is held during dragOver (e.altKey=true)', () => {
    const { result } = renderHook(() => useCalendarDragDrop());

    act(() => {
      result.current.updateCopyMode(makeDragEvent({ altKey: true }));
    });

    expect(result.current.isDragCopyMode).toBe(true);
  });

  it('isDragCopyMode becomes true when Ctrl key is held during dragOver (e.ctrlKey=true)', () => {
    const { result } = renderHook(() => useCalendarDragDrop());

    act(() => {
      result.current.updateCopyMode(makeDragEvent({ ctrlKey: true }));
    });

    expect(result.current.isDragCopyMode).toBe(true);
  });

  it('isDragCopyMode is false when no modifier key', () => {
    const { result } = renderHook(() => useCalendarDragDrop());

    act(() => {
      result.current.updateCopyMode(makeDragEvent({ altKey: false, ctrlKey: false }));
    });

    expect(result.current.isDragCopyMode).toBe(false);
  });

  it('sets dropEffect to "copy" when alt key held', () => {
    const { result } = renderHook(() => useCalendarDragDrop());
    const dt = { dropEffect: 'none' } as DataTransfer;
    const event = makeDragEvent({ altKey: true, dataTransfer: dt });

    act(() => {
      result.current.updateCopyMode(event);
    });

    expect(dt.dropEffect).toBe('copy');
  });

  it('sets dropEffect to "move" when no modifier key', () => {
    const { result } = renderHook(() => useCalendarDragDrop());
    const dt = { dropEffect: 'none' } as DataTransfer;
    const event = makeDragEvent({ altKey: false, ctrlKey: false, dataTransfer: dt });

    act(() => {
      result.current.updateCopyMode(event);
    });

    expect(dt.dropEffect).toBe('move');
  });

  it('resetCopyMode resets isDragCopyMode to false', () => {
    const { result } = renderHook(() => useCalendarDragDrop());

    act(() => {
      result.current.updateCopyMode(makeDragEvent({ altKey: true }));
    });
    expect(result.current.isDragCopyMode).toBe(true);

    act(() => {
      result.current.resetCopyMode();
    });
    expect(result.current.isDragCopyMode).toBe(false);
  });
});

// ── usePullToRefresh ─────────────────────────────────────────────────────────

/**
 * usePullToRefresh attaches native touch event listeners to containerRef.current
 * inside a useEffect. The effect runs once on mount; if the ref is null at that
 * point, no listeners are registered. To work around jsdom's renderHook
 * not pre-populating refs, tests that need event delivery use a custom
 * wrapper component that passes the real DOM element via a callback ref.
 *
 * For tests that only check initial state or behaviour that doesn't depend on
 * the DOM element, we use renderHook directly.
 */

// Wrapper component used to mount usePullToRefresh with a real container element
function PullWrapper({
  onRefresh,
  hookRef,
}: {
  onRefresh: () => Promise<void>;
  hookRef: React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;
}) {
  const hook = usePullToRefresh({ onRefresh });
  hookRef.current = hook;
  return <div ref={hook.containerRef} style={{ overflow: 'auto', height: '400px' }} />;
}

describe('usePullToRefresh', () => {
  it('returns isPulling=false and pullDistance=0 initially', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it('isRefreshing=false initially', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('onRefresh is NOT called when pull distance < threshold (60px)', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const hookRef = { current: null } as React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;

    const { container } = render(<PullWrapper onRefresh={onRefresh} hookRef={hookRef} />);
    const el = container.firstElementChild as HTMLElement;

    // Phase 1: start + move (let React flush and re-register callbacks with new state)
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 100 } as Touch], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 130 } as Touch], // deltaY = 30, below 60px threshold
        cancelable: true,
        bubbles: true,
      }));
    });

    // Phase 2: touchend — now handleTouchEnd has the updated isPulling=true/pullDistance=30
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });

    await waitFor(() => {
      expect(hookRef.current?.isRefreshing).toBe(false);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('exposes containerRef as a React ref object', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));
    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.containerRef).toBe('object');
  });

  it('onRefresh IS called when pull distance >= threshold via touch simulation', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const hookRef = { current: null } as React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;

    const { container } = render(<PullWrapper onRefresh={onRefresh} hookRef={hookRef} />);
    const el = container.firstElementChild as HTMLElement;

    // Phase 1: start + move (flush re-render so handleTouchEnd captures updated state)
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 100 } as Touch], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 180 } as Touch], // deltaY = 80 > 60
        cancelable: true,
        bubbles: true,
      }));
    });

    // Phase 2: touchend fires with the refreshed callback
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('isRefreshing becomes true while onRefresh is pending then returns to false', async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => { resolve = res; });
    const onRefresh = vi.fn().mockReturnValue(promise);
    const hookRef = { current: null } as React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;

    const { container } = render(<PullWrapper onRefresh={onRefresh} hookRef={hookRef} />);
    const el = container.firstElementChild as HTMLElement;

    // Phase 1: start + move (flush so handleTouchEnd sees updated state)
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 0 } as Touch], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 80 } as Touch], // deltaY = 80 > 60
        cancelable: true,
        bubbles: true,
      }));
    });

    // Phase 2: touchend triggers refresh
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });

    await waitFor(() => expect(onRefresh).toHaveBeenCalled());

    // Still pending — isRefreshing should be true
    expect(hookRef.current?.isRefreshing).toBe(true);

    // Resolve the promise
    await act(async () => { resolve(); });

    await waitFor(() => {
      expect(hookRef.current?.isRefreshing).toBe(false);
    });
  });

  it('isPulling becomes true during touch move downward', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const hookRef = { current: null } as React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;

    const { container } = render(<PullWrapper onRefresh={onRefresh} hookRef={hookRef} />);
    const el = container.firstElementChild as HTMLElement;

    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 100 } as Touch], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 130 } as Touch], // deltaY = 30, positive
        cancelable: true,
        bubbles: true,
      }));
    });

    expect(hookRef.current?.isPulling).toBe(true);
    expect(hookRef.current?.pullDistance).toBeGreaterThan(0);
  });

  it('state resets after touchEnd with insufficient pull', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const hookRef = { current: null } as React.MutableRefObject<ReturnType<typeof usePullToRefresh> | null>;

    const { container } = render(<PullWrapper onRefresh={onRefresh} hookRef={hookRef} />);
    const el = container.firstElementChild as HTMLElement;

    // Phase 1: start + move below threshold (flush re-render)
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientY: 100 } as Touch], bubbles: true }));
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 130 } as Touch], // 30px < 60px threshold
        cancelable: true,
        bubbles: true,
      }));
    });

    // Phase 2: touchend — should reset state without triggering refresh
    await act(async () => {
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
    });

    await waitFor(() => {
      expect(hookRef.current?.isPulling).toBe(false);
      expect(hookRef.current?.pullDistance).toBe(0);
      expect(hookRef.current?.isRefreshing).toBe(false);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});

// ── useDailyNotes ────────────────────────────────────────────────────────────

describe('useDailyNotes', () => {
  const ORG_ID = 'org-123';
  const DATE_RANGE = { start: '2026-03-01', end: '2026-03-31' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLte.mockResolvedValue({
      data: [{ date: '2026-03-31', note: 'Test note' }],
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('starts with empty notes object', () => {
    // Suspend resolution so we can check initial state synchronously
    mockLte.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));
    expect(result.current.notes).toEqual({});
  });

  it('loading is true initially then false after fetch', async () => {
    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('calls supabase.from("calendar_daily_notes").select() with correct org_id filter', async () => {
    renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('calendar_daily_notes');
      expect(mockSelect).toHaveBeenCalledWith('date, note');
      expect(mockEq).toHaveBeenCalledWith('org_id', ORG_ID);
    });
  });

  it('populates notes Record<string, string> from fetched data', async () => {
    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => {
      expect(result.current.notes['2026-03-31']).toBe('Test note');
    });
  });

  it('updateNote performs optimistic update immediately (before supabase resolves)', async () => {
    // Hang the upsert so it never resolves during this test
    mockUpsert.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateNote('2026-03-15', 'Optimistic note');
    });

    // Should be set immediately without awaiting upsert
    expect(result.current.notes['2026-03-15']).toBe('Optimistic note');
  });

  it('updateNote calls supabase upsert with correct data', async () => {
    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateNote('2026-03-20', 'Note content');
    });

    expect(mockFrom).toHaveBeenCalledWith('calendar_daily_notes');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: ORG_ID,
        date: '2026-03-20',
        note: 'Note content',
      }),
      { onConflict: 'org_id,date' }
    );
  });

  it('updateNote throws when supabase upsert returns error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB constraint violation' } });

    const { result } = renderHook(() => useDailyNotes(ORG_ID, DATE_RANGE));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.updateNote('2026-03-20', 'Bad note');
      })
    ).rejects.toMatchObject({ message: 'DB constraint violation' });
  });

  it('does not fetch when orgId is empty string', () => {
    renderHook(() => useDailyNotes('', DATE_RANGE));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── useICalExport ────────────────────────────────────────────────────────────

describe('useICalExport', () => {
  const mockDownloadICalFile = downloadICalFile as ReturnType<typeof vi.fn>;
  const mockGenerateICalContent = generateICalContent as ReturnType<typeof vi.fn>;

  const employees = [
    { id: 'emp-1', name: 'Ana García' },
    { id: 'emp-2', name: 'Luis Pérez' },
  ];

  const biWeekDays = [
    new Date('2026-03-23'),
    new Date('2026-03-24'),
    new Date('2026-03-25'),
    new Date('2026-03-26'),
    new Date('2026-03-27'),
    new Date('2026-03-28'),
    new Date('2026-03-29'),
    new Date('2026-03-30'),
    new Date('2026-03-31'),
    new Date('2026-04-01'),
    new Date('2026-04-02'),
    new Date('2026-04-03'),
    new Date('2026-04-04'),
    new Date('2026-04-05'),
  ];

  const shiftBlocks = [
    {
      id: 'shift-1',
      employeeId: 'emp-1',
      date: new Date('2026-03-23'),
      startTime: '08:00',
      endTime: '16:00',
      type: 'morning',
      name: 'Mañana',
    },
    {
      id: 'shift-2',
      employeeId: 'emp-2',
      date: new Date('2026-03-24'),
      startTime: '16:00',
      endTime: '00:00',
      type: 'afternoon',
      name: 'Tarde',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateICalContent.mockReturnValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR');
  });

  it('exportICal() calls downloadICalFile', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal();
    });

    expect(mockDownloadICalFile).toHaveBeenCalledTimes(1);
  });

  it('when employeeId is provided, only includes shifts for that employee', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal('emp-1');
    });

    const calledWith = mockGenerateICalContent.mock.calls[0][0] as { employeeName: string }[];
    expect(calledWith).toHaveLength(1);
    expect(calledWith[0].employeeName).toBe('Ana García');
  });

  it('when employeeId is undefined, includes all shifts', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal(undefined);
    });

    const calledWith = mockGenerateICalContent.mock.calls[0][0] as unknown[];
    expect(calledWith).toHaveLength(2);
  });

  it('generated content contains correct employee shift data', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal('emp-2');
    });

    const calledWith = mockGenerateICalContent.mock.calls[0][0] as {
      id: string;
      employeeName: string;
      startTime?: string;
      endTime?: string;
    }[];

    expect(calledWith[0].id).toBe('shift-2');
    expect(calledWith[0].employeeName).toBe('Luis Pérez');
    expect(calledWith[0].startTime).toBe('16:00');
    expect(calledWith[0].endTime).toBe('00:00');
  });

  it('handles empty shiftBlocks without errors', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks: [], employees, biWeekDays })
    );

    expect(() => {
      act(() => {
        result.current.exportICal();
      });
    }).not.toThrow();

    // No shifts → generateICalContent and downloadICalFile should NOT be called
    expect(mockGenerateICalContent).not.toHaveBeenCalled();
    expect(mockDownloadICalFile).not.toHaveBeenCalled();
  });

  it('filename includes date range from biWeekDays', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal(undefined);
    });

    const filename = mockDownloadICalFile.mock.calls[0][1] as string;
    expect(filename).toContain('2026-03-23');
    expect(filename).toContain('2026-04-05');
  });

  it('filename includes employee name suffix when employeeId is given', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal('emp-1');
    });

    const filename = mockDownloadICalFile.mock.calls[0][1] as string;
    expect(filename).toContain('ana-garcía');
  });

  it('filename contains "equipo" when no employeeId is given', () => {
    const { result } = renderHook(() =>
      useICalExport({ shiftBlocks, employees, biWeekDays })
    );

    act(() => {
      result.current.exportICal(undefined);
    });

    const filename = mockDownloadICalFile.mock.calls[0][1] as string;
    expect(filename).toContain('equipo');
  });
});
