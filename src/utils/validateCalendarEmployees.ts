import { toast } from "@/hooks/use-toast";

interface CalendarEmployee {
  id: string;
  name?: string;
  nombre?: string;
  apellidos?: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellidos: string;
  fecha_inicio_contrato?: string;
  tiempo_trabajo_semanal?: number;
  tipo_contrato?: string;
  status: string;
}

export interface ColaboradorValidationResult {
  id: string;
  nombre: string;
  missingFields: string[];
  isValid: boolean;
  notFound: boolean;
}

/**
 * Validates calendar employees against the colaboradores database.
 *
 * SMART behavior:
 * - Colaboradores NOT found in DB (deleted) → removed from localStorage (stale reference)
 * - Colaboradores with incomplete data → kept in calendar, marked as "incomplete"
 * - No destructive toasts for incomplete data (just a soft info once per session)
 */
export const validateAndCleanCalendarEmployees = (colaboradores: Colaborador[]) => {
  const calendarEmployees: CalendarEmployee[] = JSON.parse(
    localStorage.getItem('calendar-employees') || '[]'
  );

  if (calendarEmployees.length === 0) {
    return { validEmployees: [], incompleteEmployees: [], removedCount: 0 };
  }

  const validEmployees: CalendarEmployee[] = [];
  const incompleteEmployees: ColaboradorValidationResult[] = [];
  const removedNotFound: string[] = [];

  calendarEmployees.forEach(calendarEmp => {
    const colaborador = colaboradores.find(c => c.id === calendarEmp.id);

    // Genuinely not found (deleted from DB) → remove from localStorage
    if (!colaborador) {
      removedNotFound.push(calendarEmp.name || calendarEmp.nombre || calendarEmp.id);
      return;
    }

    // Always keep the employee in the calendar view
    validEmployees.push(calendarEmp);

    // Check for missing fields (informational only, does NOT remove)
    const missingFields: string[] = [];
    if (!colaborador.fecha_inicio_contrato) missingFields.push("fecha inicio");
    if (!colaborador.tiempo_trabajo_semanal) missingFields.push("horas semanales");
    if (!colaborador.tipo_contrato || colaborador.tipo_contrato === "Sin especificar")
      missingFields.push("tipo contrato");
    if (colaborador.status !== 'activo') missingFields.push("estado activo");

    incompleteEmployees.push({
      id: colaborador.id,
      nombre: `${colaborador.nombre} ${colaborador.apellidos}`.trim(),
      missingFields,
      isValid: missingFields.length === 0,
      notFound: false,
    });
  });

  // Only update localStorage to remove stale (deleted) employees
  if (removedNotFound.length > 0) {
    localStorage.setItem('calendar-employees', JSON.stringify(validEmployees));
  }

  const incomplete = incompleteEmployees.filter(e => !e.isValid);

  // Soft informational toast (only if there are incomplete profiles)
  if (incomplete.length > 0) {
    const sessionKey = `calendar-incomplete-warned-${new Date().toDateString()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      toast({
        title: `${incomplete.length} perfil${incomplete.length > 1 ? 'es' : ''} incompleto${incomplete.length > 1 ? 's' : ''}`,
        description: "Algunos colaboradores tienen datos pendientes. Puedes asignarles turnos, pero completa sus perfiles para un mejor seguimiento.",
        variant: "default",
      });
    }
  }

  return {
    validEmployees,
    incompleteEmployees,
    removedCount: removedNotFound.length,
  };
};
