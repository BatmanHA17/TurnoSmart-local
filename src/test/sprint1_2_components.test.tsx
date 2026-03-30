/**
 * sprint1_2_components.test.tsx
 *
 * Tests for Sprint 1 + Sprint 2 components:
 *   - TimezoneMismatchBanner
 *   - DailyNotesRow
 *   - ShiftValidationBadge
 *   - DuplicateWeekDialog
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Global mocks ──────────────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="icon-alert" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  XCircle: () => <span data-testid="icon-xcircle" />,
  Circle: () => <span data-testid="icon-circle" />,
  X: () => <span data-testid="icon-x" />,
  Copy: () => <span data-testid="icon-copy" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { TimezoneMismatchBanner } from '@/components/TimezoneMismatchBanner';
import { DailyNotesRow } from '@/components/calendar/DailyNotesRow';
import { ShiftValidationBadge } from '@/components/calendar/ShiftValidationBadge';
import { DuplicateWeekDialog } from '@/components/calendar/DuplicateWeekDialog';

// ─────────────────────────────────────────────────────────────────────────────
// TimezoneMismatchBanner
// ─────────────────────────────────────────────────────────────────────────────

describe('TimezoneMismatchBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders nothing when timezone matches', () => {
    // Spy on Intl.DateTimeFormat to return matching timezone
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'Europe/Madrid' }),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as unknown as Intl.DateTimeFormat)
    );

    const { container } = render(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when timezone mismatches', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as unknown as Intl.DateTimeFormat)
    );

    render(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
  });

  it('shows browser timezone name and expected timezone in banner text', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as unknown as Intl.DateTimeFormat)
    );

    render(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    expect(screen.getByText(/America\/New_York/)).toBeInTheDocument();
    expect(screen.getByText(/Europe\/Madrid/)).toBeInTheDocument();
  });

  it('clicking X dismisses the banner', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as unknown as Intl.DateTimeFormat)
    );

    render(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    // Banner should be visible before click
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cerrar aviso/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('icon-alert')).not.toBeInTheDocument();
  });

  it('after dismissing, banner stays hidden (no re-render brings it back)', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
          format: () => '',
          formatToParts: () => [],
          formatRange: () => '',
          formatRangeToParts: () => [],
        } as unknown as Intl.DateTimeFormat)
    );

    const { rerender } = render(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar aviso/i }));

    // Re-render with same props — dismissed state persists inside component
    rerender(<TimezoneMismatchBanner expectedTimezone="Europe/Madrid" />);
    expect(screen.queryByTestId('icon-alert')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DailyNotesRow
// ─────────────────────────────────────────────────────────────────────────────

// Helper: generate a stable array of Date objects
function makeDays(...isoStrings: string[]): Date[] {
  return isoStrings.map((s) => new Date(s + 'T12:00:00'));
}

describe('DailyNotesRow', () => {
  const days = makeDays('2024-01-15', '2024-01-16', '2024-01-17');
  const notes: Record<string, string> = {
    '2024-01-15': 'Nota del lunes',
    '2024-01-16': '',
    // 2024-01-17 not present
  };
  const onUpdateNote = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one <td> per day provided (plus the label cell)', () => {
    const { container } = render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={false} />
        </tbody>
      </table>
    );
    // label cell + 3 day cells = 4 td elements
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(4);
  });

  it('shows existing note text in each cell', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={false} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Nota del lunes')).toBeInTheDocument();
  });

  it('shows "+" placeholder when canEdit=true and cell is empty', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    // days[1] has empty note, days[2] has no key → two "+" placeholders
    const plusSigns = screen.getAllByText('+');
    expect(plusSigns.length).toBeGreaterThanOrEqual(1);
  });

  it('shows nothing (no +) when canEdit=false and cell is empty', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={false} />
        </tbody>
      </table>
    );
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('clicking a cell with canEdit=true shows an input', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    // Click the cell for 2024-01-15
    fireEvent.click(screen.getByText('Nota del lunes'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('input shows the existing note value', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByText('Nota del lunes'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Nota del lunes');
  });

  it('pressing Escape cancels edit (input disappears, no onUpdateNote call)', async () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByText('Nota del lunes'));
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
    expect(onUpdateNote).not.toHaveBeenCalled();
  });

  it('pressing Enter triggers blur which calls onUpdateNote', async () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByText('Nota del lunes'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Nueva nota' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // Enter calls blur() imperatively; simulate blur to trigger handleBlur
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onUpdateNote).toHaveBeenCalled();
    });
  });

  it('onUpdateNote called with correct date key and new value', async () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={true} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByText('Nota del lunes'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onUpdateNote).toHaveBeenCalledWith('2024-01-15', 'Updated');
    });
  });

  it('readonly mode: clicking cell does NOT show input when canEdit=false', () => {
    render(
      <table>
        <tbody>
          <DailyNotesRow days={days} notes={notes} onUpdateNote={onUpdateNote} canEdit={false} />
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByText('Nota del lunes'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ShiftValidationBadge
// ─────────────────────────────────────────────────────────────────────────────

describe('ShiftValidationBadge', () => {
  const onStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when status="pending" and canEdit=false', () => {
    const { container } = render(
      <ShiftValidationBadge status="pending" canEdit={false} onStatusChange={onStatusChange} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows green checkmark icon when status="validated" and canEdit=false', () => {
    render(
      <ShiftValidationBadge status="validated" canEdit={false} onStatusChange={onStatusChange} />
    );
    expect(screen.getByTestId('icon-check')).toBeInTheDocument();
  });

  it('shows red X icon when status="invalidated" and canEdit=false', () => {
    render(
      <ShiftValidationBadge status="invalidated" canEdit={false} onStatusChange={onStatusChange} />
    );
    expect(screen.getByTestId('icon-xcircle')).toBeInTheDocument();
  });

  it('clicking the badge when canEdit=true opens status selector', async () => {
    render(
      <ShiftValidationBadge status="pending" canEdit={true} onStatusChange={onStatusChange} />
    );
    const trigger = screen.getByRole('button', { name: /estado de validación/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Validado')).toBeInTheDocument();
      expect(screen.getByText('Invalidado')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('selecting "validated" calls onStatusChange with "validated"', async () => {
    render(
      <ShiftValidationBadge status="pending" canEdit={true} onStatusChange={onStatusChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /estado de validación/i }));

    await waitFor(() => screen.getByText('Validado'));
    fireEvent.click(screen.getByText('Validado'));
    expect(onStatusChange).toHaveBeenCalledWith('validated');
  });

  it('selecting "invalidated" calls onStatusChange with "invalidated"', async () => {
    render(
      <ShiftValidationBadge status="pending" canEdit={true} onStatusChange={onStatusChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /estado de validación/i }));

    await waitFor(() => screen.getByText('Invalidado'));
    fireEvent.click(screen.getByText('Invalidado'));
    expect(onStatusChange).toHaveBeenCalledWith('invalidated');
  });

  it('selecting "pending" calls onStatusChange with "pending"', async () => {
    render(
      <ShiftValidationBadge status="validated" canEdit={true} onStatusChange={onStatusChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /estado de validación/i }));

    await waitFor(() => screen.getByText('Pendiente'));
    fireEvent.click(screen.getByText('Pendiente'));
    expect(onStatusChange).toHaveBeenCalledWith('pending');
  });

  it('does not show interactive button when canEdit=false', () => {
    render(
      <ShiftValidationBadge status="validated" canEdit={false} onStatusChange={onStatusChange} />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DuplicateWeekDialog
// ─────────────────────────────────────────────────────────────────────────────

describe('DuplicateWeekDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    week1Label: 'Semana del 1 al 7 ene',
    week2Label: 'Semana del 8 al 14 ene',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(<DuplicateWeekDialog {...defaultProps} open={false} />);
    // Dialog portal is not rendered when closed
    expect(screen.queryByText('Duplicar semana')).not.toBeInTheDocument();
    // container itself might be empty or just have no dialog
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog content when open=true', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    // DialogTitle renders "Duplicar semana" — use heading role to be specific
    expect(screen.getByRole('heading', { name: /duplicar semana/i })).toBeInTheDocument();
  });

  it('shows week1Label and week2Label text', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    expect(screen.getByText('Semana del 1 al 7 ene')).toBeInTheDocument();
    expect(screen.getByText('Semana del 8 al 14 ene')).toBeInTheDocument();
  });

  it('confirm button is disabled initially (no source selected)', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole('button', { name: /duplicar semana/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('clicking week 1 card selects it as source (shows "Origen" label)', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    // Click the week1 card button
    fireEvent.click(screen.getByRole('button', { name: /Semana del 1 al 7 ene/i }));
    expect(screen.getByText('Origen')).toBeInTheDocument();
  });

  it('after selecting week 1, confirm button becomes enabled', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Semana del 1 al 7 ene/i }));
    // The "Duplicar semana" button inside the footer (not the card) — get by role with name
    const confirmBtn = screen.getByRole('button', { name: /duplicar semana/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('clicking confirm after selecting week 1 calls onConfirm with ("week1", "week2")', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Semana del 1 al 7 ene/i }));
    const confirmBtn = screen.getByRole('button', { name: /duplicar semana/i });
    fireEvent.click(confirmBtn);
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('week1', 'week2');
  });

  it('clicking confirm after selecting week 2 calls onConfirm with ("week2", "week1")', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Semana del 8 al 14 ene/i }));
    const confirmBtn = screen.getByRole('button', { name: /duplicar semana/i });
    fireEvent.click(confirmBtn);
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('week2', 'week1');
  });

  it('clicking cancel calls onClose', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows warning text about replacement', () => {
    render(<DuplicateWeekDialog {...defaultProps} />);
    expect(
      screen.getByText(/Los turnos existentes en la semana destino serán reemplazados/i)
    ).toBeInTheDocument();
  });
});
