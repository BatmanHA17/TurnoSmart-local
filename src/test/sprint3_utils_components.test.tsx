/**
 * sprint3_utils_components.test.tsx
 *
 * Tests for Sprint 3 utilities and components:
 *   1. generateICalContent  — pure function, no mocks needed
 *   2. MultiDatePicker      — UI component, bi-week date grid
 *   3. NominaCard           — payroll card with status badges and actions
 *   4. DocumentSignatureCard — document signing with confirmation dialogs
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({ user: null, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<typeof import('lucide-react')>();
  return { ...mod };
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateICalContent
// ─────────────────────────────────────────────────────────────────────────────
import { generateICalContent, type ICalShift } from '@/utils/icalExport';

/** Monday 2 June 2025 at 08:00 */
const BASE_DATE = new Date(2025, 5, 2);

function makeShift(overrides: Partial<ICalShift> = {}): ICalShift {
  return {
    id: 'shift-abc',
    employeeName: 'Ana López',
    date: BASE_DATE,
    startTime: '09:00',
    endTime: '17:00',
    shiftName: 'Mañana',
    type: 'morning',
    ...overrides,
  };
}

describe('generateICalContent — estructura del calendario', () => {
  it('empieza con BEGIN:VCALENDAR', () => {
    const result = generateICalContent([]);
    expect(result.startsWith('BEGIN:VCALENDAR')).toBe(true);
  });

  it('termina con END:VCALENDAR', () => {
    const result = generateICalContent([]);
    expect(result.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('incluye VERSION:2.0', () => {
    const result = generateICalContent([]);
    expect(result).toContain('VERSION:2.0');
  });

  it('incluye PRODID con TurnoSmart', () => {
    const result = generateICalContent([]);
    expect(result).toContain('PRODID');
    expect(result).toContain('TurnoSmart');
  });

  it('incluye X-WR-CALNAME con el nombre del calendario', () => {
    const result = generateICalContent([], 'Mi Empresa');
    expect(result).toContain('X-WR-CALNAME:Mi Empresa');
  });

  it('usa el nombre por defecto "TurnoSmart" cuando no se proporciona nombre', () => {
    const result = generateICalContent([]);
    expect(result).toContain('X-WR-CALNAME:TurnoSmart');
  });
});

describe('generateICalContent — VEVENTs', () => {
  it('genera un VEVENT por cada turno', () => {
    const shifts = [makeShift({ id: 's1' }), makeShift({ id: 's2' })];
    const result = generateICalContent(shifts);
    const beginCount = (result.match(/BEGIN:VEVENT/g) ?? []).length;
    const endCount = (result.match(/END:VEVENT/g) ?? []).length;
    expect(beginCount).toBe(2);
    expect(endCount).toBe(2);
  });

  it('no genera VEVENTs con array vacío (sólo cabeceras y footer)', () => {
    const result = generateICalContent([]);
    expect(result).not.toContain('BEGIN:VEVENT');
    expect(result).not.toContain('END:VEVENT');
  });

  it('el UID de cada VEVENT contiene el id del turno', () => {
    const result = generateICalContent([makeShift({ id: 'turno-xyz-99' })]);
    expect(result).toContain('UID:turno-xyz-99-');
  });

  it('DTSTART contiene la fecha correcta (20250602)', () => {
    const result = generateICalContent([makeShift()]);
    expect(result).toContain('DTSTART;TZID=Europe/Madrid:20250602T');
  });

  it('DTSTART contiene la hora de inicio correcta (090000)', () => {
    const result = generateICalContent([makeShift({ startTime: '09:00' })]);
    expect(result).toContain('20250602T090000');
  });

  it('DTEND contiene la hora de fin correcta (170000)', () => {
    const result = generateICalContent([makeShift({ endTime: '17:00' })]);
    expect(result).toContain('20250602T170000');
  });

  it('SUMMARY usa shiftName cuando está disponible', () => {
    const result = generateICalContent([makeShift({ shiftName: 'Tarde', type: 'afternoon' })]);
    expect(result).toContain('SUMMARY:Tarde');
  });

  it('SUMMARY cae al campo type cuando shiftName es undefined', () => {
    const result = generateICalContent([makeShift({ shiftName: undefined, type: 'night' })]);
    expect(result).toContain('SUMMARY:night');
  });

  it('SUMMARY cae a "Turno" cuando ni shiftName ni type están definidos', () => {
    const shift = makeShift({ shiftName: undefined });
    // @ts-expect-error — test edge case
    shift.type = undefined;
    const result = generateICalContent([shift]);
    expect(result).toContain('SUMMARY:Turno');
  });

  it('usa hora por defecto 08:00–16:00 cuando falta startTime/endTime', () => {
    const shift = makeShift({ startTime: undefined, endTime: undefined });
    const result = generateICalContent([shift]);
    expect(result).toContain('T080000');
    expect(result).toContain('T160000');
  });
});

describe('generateICalContent — escapes y formato', () => {
  it('escapa comas en el SUMMARY', () => {
    const result = generateICalContent([makeShift({ shiftName: 'Turno, noche' })]);
    expect(result).toContain('SUMMARY:Turno\\, noche');
  });

  it('escapa backslashes en el SUMMARY', () => {
    const result = generateICalContent([makeShift({ shiftName: 'Turno\\dia' })]);
    expect(result).toContain('SUMMARY:Turno\\\\dia');
  });

  it('escapa puntos y comas en el SUMMARY', () => {
    const result = generateICalContent([makeShift({ shiftName: 'Turno; especial' })]);
    expect(result).toContain('SUMMARY:Turno\\; especial');
  });

  it('usa CRLF (\\r\\n) como separador de líneas (RFC 5545)', () => {
    const result = generateICalContent([]);
    expect(result).toContain('\r\n');
    // Every line separator must be \r\n, not bare \n
    const lines = result.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('no contiene saltos de línea sueltos (\\n sin \\r)', () => {
    const result = generateICalContent([makeShift()]);
    // Remove all \r\n first, then check no bare \n remain
    const withoutCRLF = result.replace(/\r\n/g, '');
    expect(withoutCRLF).not.toContain('\n');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. MultiDatePicker
// ─────────────────────────────────────────────────────────────────────────────
import { MultiDatePicker } from '@/components/calendar/MultiDatePicker';

/** Generate 14 consecutive days starting from a given Monday */
function makeBiWeek(monday: Date): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Monday 2 June 2025
const MONDAY = new Date(2025, 5, 2);
const BI_WEEK = makeBiWeek(MONDAY);

describe('MultiDatePicker', () => {
  let onSelectionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelectionChange = vi.fn();
  });

  const renderPicker = (selectedDates: Date[] = []) =>
    render(
      <MultiDatePicker
        initialDate={MONDAY}
        biWeekDays={BI_WEEK}
        selectedDates={selectedDates}
        onSelectionChange={onSelectionChange}
      />
    );

  it('renderiza exactamente 14 botones de día', () => {
    renderPicker();
    // Each day is rendered as a <button> with the day number
    const dayNumbers = BI_WEEK.map((d) => String(d.getDate()));
    let count = 0;
    dayNumbers.forEach((num) => {
      const buttons = screen.getAllByRole('button', { name: (n) => n.includes(num) || n === num });
      // Filter only the tiny day-number buttons (not the control buttons)
      count += buttons.filter((b) => b.textContent === num).length;
    });
    expect(count).toBe(14);
  });

  it('muestra las etiquetas de día de la semana (L, M, X, J, V, S, D)', () => {
    renderPicker();
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('el botón "Seleccionar todo" está presente', () => {
    renderPicker();
    expect(screen.getByText('Seleccionar todo')).toBeInTheDocument();
  });

  it('el botón "Limpiar" está presente', () => {
    renderPicker();
    expect(screen.getByText('Limpiar')).toBeInTheDocument();
  });

  it('el botón "Esta semana" aparece cuando la semana 1 no está completamente seleccionada', () => {
    renderPicker();
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
  });

  it('el botón "Próxima semana" aparece cuando la semana 2 no está completamente seleccionada', () => {
    renderPicker();
    expect(screen.getByText('Próxima semana')).toBeInTheDocument();
  });

  it('clicking un día no seleccionado lo añade a la selección', () => {
    renderPicker([]);
    // Click day "2" (first day of bi-week)
    const dayBtn = screen.getAllByRole('button').find((b) => b.textContent === '2');
    expect(dayBtn).toBeDefined();
    fireEvent.click(dayBtn!);
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called.some((d) => d.getDate() === 2 && d.getMonth() === 5)).toBe(true);
  });

  it('clicking un día ya seleccionado lo quita de la selección', () => {
    renderPicker([MONDAY]); // Monday is pre-selected
    const dayBtn = screen.getAllByRole('button').find((b) => b.textContent === '2');
    expect(dayBtn).toBeDefined();
    fireEvent.click(dayBtn!);
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called.some((d) => d.getDate() === 2 && d.getMonth() === 5)).toBe(false);
  });

  it('"Seleccionar todo" llama onSelectionChange con los 14 días', () => {
    renderPicker([]);
    fireEvent.click(screen.getByText('Seleccionar todo'));
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called).toHaveLength(14);
  });

  it('"Limpiar" llama onSelectionChange con array vacío', () => {
    renderPicker(BI_WEEK);
    fireEvent.click(screen.getByText('Limpiar'));
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called).toHaveLength(0);
  });

  it('"Esta semana" selecciona los primeros 7 días', () => {
    renderPicker([]);
    fireEvent.click(screen.getByText('Esta semana'));
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called).toHaveLength(7);
    // All selected dates should fall within week 1 (days 2–8 June 2025)
    called.forEach((d) => {
      expect(d.getDate()).toBeGreaterThanOrEqual(2);
      expect(d.getDate()).toBeLessThanOrEqual(8);
    });
  });

  it('"Próxima semana" selecciona los últimos 7 días', () => {
    renderPicker([]);
    fireEvent.click(screen.getByText('Próxima semana'));
    expect(onSelectionChange).toHaveBeenCalledOnce();
    const called: Date[] = onSelectionChange.mock.calls[0][0];
    expect(called).toHaveLength(7);
    // All selected dates should fall within week 2 (days 9–15 June 2025)
    called.forEach((d) => {
      expect(d.getDate()).toBeGreaterThanOrEqual(9);
      expect(d.getDate()).toBeLessThanOrEqual(15);
    });
  });

  it('muestra el contador de fechas seleccionadas', () => {
    renderPicker([MONDAY, BI_WEEK[1]]);
    expect(screen.getByText(/2 seleccionadas/)).toBeInTheDocument();
  });

  it('cuando toda la semana 1 está seleccionada muestra "Deseleccionar"', () => {
    renderPicker(BI_WEEK.slice(0, 7));
    expect(screen.getAllByText('Deseleccionar').length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NominaCard
// ─────────────────────────────────────────────────────────────────────────────
import { NominaCard } from '@/components/nominas/NominaCard';
import type { Nomina } from '@/hooks/useNominas';

function makeNomina(overrides: Partial<Nomina> = {}): Nomina {
  return {
    id: 'nomina-001',
    org_id: 'org-1',
    colaborador_id: 'colab-1',
    periodo: '2025-06',
    year: 2025,
    month: 6,
    salario_bruto: 2000,
    salario_neto: 1650,
    deducciones: 350,
    conceptos: [],
    document_url: null,
    status: 'draft',
    sent_at: null,
    acknowledged_at: null,
    created_by: null,
    created_at: '2025-06-01T00:00:00Z',
    colaborador_nombre: 'Ana',
    colaborador_apellidos: 'López',
    ...overrides,
  };
}

describe('NominaCard — texto del periodo', () => {
  it('renderiza el texto del periodo (mes y año)', () => {
    render(<NominaCard nomina={makeNomina()} />);
    expect(screen.getByText('Junio 2025')).toBeInTheDocument();
  });
});

describe('NominaCard — badges de estado', () => {
  it('muestra badge "Borrador" cuando status=draft', () => {
    render(<NominaCard nomina={makeNomina({ status: 'draft' })} />);
    expect(screen.getByText('Borrador')).toBeInTheDocument();
  });

  it('muestra badge "Enviada" cuando status=sent', () => {
    render(<NominaCard nomina={makeNomina({ status: 'sent' })} />);
    expect(screen.getByText('Enviada')).toBeInTheDocument();
  });

  it('muestra badge "Acuse recibido" cuando status=acknowledged', () => {
    render(<NominaCard nomina={makeNomina({ status: 'acknowledged' })} />);
    expect(screen.getByText('Acuse recibido')).toBeInTheDocument();
  });
});

describe('NominaCard — cantidades', () => {
  it('renderiza el salario bruto formateado', () => {
    render(<NominaCard nomina={makeNomina({ salario_bruto: 2000 })} />);
    // Intl.NumberFormat may use a non-breaking space before the € symbol;
    // query the label and then check the sibling value element.
    const brutoLabel = screen.getByText('Bruto');
    expect(brutoLabel).toBeInTheDocument();
    // The formatted value sits right after the label in the DOM — use container text
    const container = brutoLabel.parentElement!;
    expect(container.textContent).toMatch(/2[\.,]?000/);
  });

  it('renderiza el salario neto formateado', () => {
    render(<NominaCard nomina={makeNomina({ salario_neto: 1650 })} />);
    const netoLabel = screen.getByText('Neto');
    expect(netoLabel).toBeInTheDocument();
    const container = netoLabel.parentElement!;
    expect(container.textContent).toMatch(/1[\.,]?650/);
  });

  it('renderiza las deducciones formateadas', () => {
    render(<NominaCard nomina={makeNomina({ deducciones: 350 })} />);
    expect(screen.getByText(/350/)).toBeInTheDocument();
  });

  it('muestra "-" cuando la cantidad es null', () => {
    render(
      <NominaCard
        nomina={makeNomina({ salario_bruto: null, salario_neto: null, deducciones: null })}
      />
    );
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(3);
  });
});

describe('NominaCard — botón Enviar', () => {
  it('muestra botón "Enviar" cuando status=draft e isManager=true', () => {
    const onSend = vi.fn();
    render(
      <NominaCard nomina={makeNomina({ status: 'draft' })} isManager onSend={onSend} />
    );
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('NO muestra botón "Enviar" cuando isManager=false', () => {
    render(
      <NominaCard nomina={makeNomina({ status: 'draft' })} isManager={false} onSend={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /enviar/i })).toBeNull();
  });

  it('NO muestra botón "Enviar" cuando status != draft', () => {
    render(
      <NominaCard nomina={makeNomina({ status: 'sent' })} isManager onSend={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /enviar/i })).toBeNull();
  });

  it('clicking "Enviar" llama onSend con el id de la nómina', () => {
    const onSend = vi.fn();
    render(
      <NominaCard nomina={makeNomina({ status: 'draft' })} isManager onSend={onSend} />
    );
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));
    expect(onSend).toHaveBeenCalledWith('nomina-001');
  });
});

describe('NominaCard — botón Acuse', () => {
  it('muestra botón "Acuse" cuando status=sent e isEmployee=true', () => {
    const onAck = vi.fn();
    render(
      <NominaCard
        nomina={makeNomina({ status: 'sent' })}
        isEmployee
        onAcknowledge={onAck}
      />
    );
    expect(screen.getByRole('button', { name: /acuse/i })).toBeInTheDocument();
  });

  it('NO muestra botón "Acuse" cuando isEmployee=false', () => {
    render(
      <NominaCard
        nomina={makeNomina({ status: 'sent' })}
        isEmployee={false}
        onAcknowledge={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /acuse/i })).toBeNull();
  });

  it('clicking "Acuse" llama onAcknowledge con el id de la nómina', () => {
    const onAck = vi.fn();
    render(
      <NominaCard
        nomina={makeNomina({ status: 'sent' })}
        isEmployee
        onAcknowledge={onAck}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /acuse/i }));
    expect(onAck).toHaveBeenCalledWith('nomina-001');
  });
});

describe('NominaCard — enlace de descarga', () => {
  it('muestra link de descarga cuando document_url está definida', () => {
    render(
      <NominaCard
        nomina={makeNomina({ document_url: 'https://example.com/nomina.pdf' })}
      />
    );
    // The Download button renders as an <a> tag via asChild
    const link = screen.getByTitle('Descargar PDF');
    expect(link).toBeInTheDocument();
  });

  it('NO muestra link de descarga cuando document_url es null', () => {
    render(<NominaCard nomina={makeNomina({ document_url: null })} />);
    expect(screen.queryByTitle('Descargar PDF')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DocumentSignatureCard
// ─────────────────────────────────────────────────────────────────────────────
import { DocumentSignatureCard } from '@/components/documents/DocumentSignatureCard';
import type { DocumentSignatureRequest } from '@/hooks/useDocumentSignatures';

function makeRequest(
  overrides: Partial<DocumentSignatureRequest> = {}
): DocumentSignatureRequest {
  return {
    id: 'doc-001',
    org_id: 'org-1',
    colaborador_id: 'colab-1',
    title: 'Contrato de trabajo',
    description: null,
    document_url: null,
    status: 'pending',
    requested_by: null,
    requested_at: '2025-06-01T10:00:00Z',
    signed_at: null,
    signature_data: null,
    expires_at: null,
    created_at: '2025-06-01T10:00:00Z',
    colaborador: null,
    ...overrides,
  };
}

describe('DocumentSignatureCard — título y badges de estado', () => {
  it('renderiza el título del documento', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest()}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Contrato de trabajo')).toBeInTheDocument();
  });

  it('muestra badge "Pendiente" cuando status=pending', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra badge "Firmado" cuando status=signed', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'signed' })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Firmado')).toBeInTheDocument();
  });

  it('muestra badge "Rechazado" cuando status=rejected', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'rejected' })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
  });
});

describe('DocumentSignatureCard — botones de acción', () => {
  it('muestra botones "Firmar" y "Rechazar" cuando status=pending e isOwn=true', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /firmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('NO muestra botones de acción cuando isOwn=false', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /firmar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /rechazar/i })).toBeNull();
  });

  it('NO muestra botones de acción cuando status=signed', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'signed' })}
        isOwn
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /firmar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /rechazar/i })).toBeNull();
  });

  it('NO muestra botones de acción cuando status=rejected', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'rejected' })}
        isOwn
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /firmar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /rechazar/i })).toBeNull();
  });
});

describe('DocumentSignatureCard — diálogo de firma', () => {
  it('clicking "Firmar" abre un diálogo de confirmación', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^firmar$/i }));
    // Dialog title and confirm button both contain "Confirmar firma" — use role to disambiguate
    expect(screen.getByRole('heading', { name: /confirmar firma/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar firma/i })).toBeInTheDocument();
  });

  it('confirmar la firma llama onSign con el id del documento', async () => {
    const onSign = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn
        onSign={onSign}
        onReject={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^firmar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmar firma/i }));
    await waitFor(() => expect(onSign).toHaveBeenCalledWith('doc-001'));
  });
});

describe('DocumentSignatureCard — diálogo de rechazo', () => {
  it('clicking "Rechazar" abre un diálogo destructivo', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }));
    expect(screen.getByText('Rechazar documento')).toBeInTheDocument();
    // Destructive confirm button
    expect(screen.getAllByRole('button', { name: /^rechazar$/i }).length).toBeGreaterThan(0);
  });

  it('confirmar el rechazo llama onReject con el id del documento', async () => {
    const onReject = vi.fn().mockResolvedValue(undefined);
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending' })}
        isOwn
        onSign={vi.fn()}
        onReject={onReject}
      />
    );
    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }));
    // The dialog has a destructive "Rechazar" button — get the one inside the dialog
    const rejectButtons = screen.getAllByRole('button', { name: /^rechazar$/i });
    // The last one is inside the dialog footer
    fireEvent.click(rejectButtons[rejectButtons.length - 1]);
    await waitFor(() => expect(onReject).toHaveBeenCalledWith('doc-001'));
  });
});

describe('DocumentSignatureCard — fecha de firma', () => {
  it('muestra la fecha de firma cuando status=signed y signed_at está definido', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({
          status: 'signed',
          signed_at: '2025-06-15T14:30:00Z',
        })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.getByText(/firmado el/i)).toBeInTheDocument();
  });

  it('NO muestra la fecha de firma cuando signed_at es null', () => {
    render(
      <DocumentSignatureCard
        request={makeRequest({ status: 'pending', signed_at: null })}
        isOwn={false}
        onSign={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(screen.queryByText(/firmado el/i)).toBeNull();
  });
});
