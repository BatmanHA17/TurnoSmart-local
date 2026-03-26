import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useUserRoleCanonical } from '@/hooks/useUserRoleCanonical';
import { useActivityLog } from '@/hooks/useActivityLog';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface PublishState {
  id?: string;
  status: 'draft' | 'published';
  published_at?: string;
  version?: number;
  isPublishing?: boolean;
}

interface ShiftChange {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  breakDuration?: string;
}

interface EmployeePublishData {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface PublishMetadata {
  totalShifts?: number;
  employeeCount?: number;
  weekStart?: string;
  weekEnd?: string;
  [key: string]: unknown;
}

interface CalendarNotificationPayload {
  org_id: string;
  week_start: string;
  week_end: string;
  isModification: boolean;
  shifts: ShiftChange[];
  affectedEmployeeIds?: string[];
}

interface ShiftDataPayload {
  shifts: ShiftChange[];
  employees?: EmployeePublishData[];
  metadata?: PublishMetadata;
}

// Helper para normalizar horarios (HH:MM:SS → HH:MM)
const normalizeTime = (time: string | null | undefined): string | null => {
  if (!time) return null;
  // Convertir "11:00:00" → "11:00" o mantener "11:00" → "11:00"
  return time.substring(0, 5);
};

// Función para detectar cambios entre turnos previos y actuales
const detectShiftChanges = (
  currentShifts: ShiftChange[], 
  previousShifts: ShiftChange[]
): string[] => {
  const affectedEmployeeIds = new Set<string>();
  
  // Crear mapa de turnos previos por empleado
  const prevByEmployee = new Map<string, ShiftChange[]>();
  previousShifts.forEach(shift => {
    if (!prevByEmployee.has(shift.employeeId)) {
      prevByEmployee.set(shift.employeeId, []);
    }
    prevByEmployee.get(shift.employeeId)!.push(shift);
  });
  
  // Crear mapa de turnos actuales por empleado
  const currByEmployee = new Map<string, ShiftChange[]>();
  currentShifts.forEach(shift => {
    if (!currByEmployee.has(shift.employeeId)) {
      currByEmployee.set(shift.employeeId, []);
    }
    currByEmployee.get(shift.employeeId)!.push(shift);
  });
  
  // Detectar nuevos empleados
  currByEmployee.forEach((shifts, empId) => {
    if (!prevByEmployee.has(empId)) {
      affectedEmployeeIds.add(empId);
    }
  });
  
  // Detectar modificaciones (comparar por fecha + horarios normalizados)
  currByEmployee.forEach((currShifts, empId) => {
    const prevShifts = prevByEmployee.get(empId);
    if (!prevShifts) return; // Ya detectado como nuevo
    
    // Normalizar horarios y comparar solo campos relevantes
    const currNormalized = currShifts
      .map(s => ({
        date: s.date,
        start: normalizeTime(s.startTime),
        end: normalizeTime(s.endTime),
        name: s.name
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => `${s.date}|${s.start}|${s.end}|${s.name}`)
      .join('::');
    
    const prevNormalized = prevShifts
      .map(s => ({
        date: s.date,
        start: normalizeTime(s.startTime),
        end: normalizeTime(s.endTime),
        name: s.name
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => `${s.date}|${s.start}|${s.end}|${s.name}`)
      .join('::');
    
    if (currNormalized !== prevNormalized) {
      affectedEmployeeIds.add(empId);
    }
  });
  
  // Detectar eliminaciones (empleados que tenían turnos pero ya no)
  prevByEmployee.forEach((shifts, empId) => {
    if (!currByEmployee.has(empId)) {
      affectedEmployeeIds.add(empId);
    }
  });
  
  return Array.from(affectedEmployeeIds);
};

export const useCalendarPublishState = (currentWeek: Date) => {
  const [publishState, setPublishState] = useState<PublishState>({ 
    status: 'draft',
    isPublishing: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  
  const { currentOrg } = useCurrentOrganization();
  const { isManager } = useUserRoleCanonical();
  const { logActivity } = useActivityLog();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  // Load current publish state for the week
  const loadPublishState = async () => {
    if (!currentOrg?.org_id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('turnos_publicos')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .eq('date_range_start', format(weekStart, 'yyyy-MM-dd'))
        .eq('date_range_end', format(weekEnd, 'yyyy-MM-dd'))
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading publish state:', error);
        setError(error.message);
        return;
      }

      if (data) {
        setPublishState({
          id: data.id,
          status: (data.status === 'published' || data.status === 'draft') ? data.status : 'draft',
          published_at: data.published_at,
          version: data.version,
          isPublishing: false
        });
      } else {
        setPublishState({ 
          status: 'draft',
          isPublishing: false
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error in loadPublishState:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Publish calendar
  const publishCalendar = async (shiftBlocks: ShiftChange[], employees: EmployeePublishData[]) => {
    if (!currentOrg?.org_id || !isManager) {
      setError('No tiene permisos para publicar calendarios');
      return false;
    }

    if (!shiftBlocks || shiftBlocks.length === 0) {
      setError('No hay turnos para publicar');
      return false;
    }

    setPublishState(prev => ({ ...prev, isPublishing: true }));
    setError(null);

    try {
      const weekName = `Semana ${format(weekStart, 'dd/MM/yyyy')} - ${format(weekEnd, 'dd/MM/yyyy')}`;
      const newVersion = (publishState.version || 0) + 1;

      // Obtener turnos previos si existe una versión publicada
      let affectedEmployeeIds: string[] | undefined;
      let isModification = false;
      if (publishState.id && publishState.version && publishState.version > 0) {
        try {
          const { data: previousData } = await supabase
            .from('turnos_publicos')
            .select('shift_data')
            .eq('id', publishState.id)
            .single();

          const prevShiftData = previousData?.shift_data as unknown as ShiftDataPayload | null;
          if (prevShiftData?.shifts && Array.isArray(prevShiftData.shifts)) {
            const currentShiftsNormalized = shiftBlocks.map(shift => ({
              employeeId: shift.employeeId,
              date: typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0],
              startTime: shift.startTime,
              endTime: shift.endTime,
              name: shift.name || 'Turno',
              breakDuration: shift.breakDuration
            }));

            affectedEmployeeIds = detectShiftChanges(
              currentShiftsNormalized,
              prevShiftData.shifts
            );

            isModification = affectedEmployeeIds.length > 0;
          }
        } catch (detectError) {
          console.warn('⚠️ Error detectando cambios, enviando a todos:', detectError);
          affectedEmployeeIds = undefined;
          isModification = false;
        }
      }

      const shiftData = {
        shifts: shiftBlocks.map(shift => ({
          employeeId: shift.employeeId,
          date: typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0],
          startTime: shift.startTime,
          endTime: shift.endTime,
          name: shift.name || 'Turno',
          color: shift.color,
          notes: shift.notes,
          breakDuration: shift.breakDuration
        })),
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          department: emp.department
        })),
        metadata: {
          totalShifts: shiftBlocks.length,
          employeeCount: employees.length,
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd')
        }
      };

      let result;
      if (publishState.id) {
        // Update existing record
        result = await supabase
          .from('turnos_publicos')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            version: newVersion,
            shift_data: shiftData,
            employee_count: employees.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', publishState.id)
          .select()
          .single();
      } else {
        // Create new record
        result = await supabase
          .from('turnos_publicos')
          .insert({
            name: weekName,
            date_range_start: format(weekStart, 'yyyy-MM-dd'),
            date_range_end: format(weekEnd, 'yyyy-MM-dd'),
            status: 'published',
            published_at: new Date().toISOString(),
            version: newVersion,
            shift_data: shiftData,
            employee_count: employees.length,
            org_id: currentOrg.org_id
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setPublishState({
        id: result.data.id,
        status: 'published',
        published_at: result.data.published_at,
        version: newVersion,
        isPublishing: false
      });

      // Log activity
      await logActivity({
        action: 'publicar_calendario',
        entityType: 'calendario',
        entityName: weekName,
        details: {
          version: newVersion,
          totalTurnos: shiftBlocks.length,
          empleados: employees.length,
          fechaPublicacion: new Date().toISOString()
        }
      });

      // Enviar notificaciones por email solo a empleados afectados
      try {
        const notificationPayload: CalendarNotificationPayload = {
          org_id: currentOrg.org_id,
          week_start: format(weekStart, 'yyyy-MM-dd'),
          week_end: format(weekEnd, 'yyyy-MM-dd'),
          isModification,
          shifts: shiftBlocks.map(shift => ({
            employeeId: shift.employeeId,
            date: typeof shift.date === 'string' ? shift.date : shift.date.toISOString().split('T')[0],
            startTime: shift.startTime,
            endTime: shift.endTime,
            name: shift.name || 'Turno',
            breakDuration: shift.breakDuration
          }))
        };

        // Solo incluir affectedEmployeeIds si hay cambios específicos
        if (affectedEmployeeIds && affectedEmployeeIds.length > 0) {
          notificationPayload.affectedEmployeeIds = affectedEmployeeIds;
        } else if (affectedEmployeeIds && affectedEmployeeIds.length === 0) {
        } else {
        }

        const { error: notifyError } = await supabase.functions.invoke('notify-calendar-published', {
          body: notificationPayload
        });

        if (notifyError) {
          console.error('Error sending calendar notifications:', notifyError);
          // No bloqueamos la publicación si falla el envío de emails
        }
      } catch (emailError) {
        console.error('Error invoking notification function:', emailError);
        // No bloqueamos la publicación si falla el envío de emails
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al publicar calendario';
      setError(errorMessage);
      console.error('Error publishing calendar:', err);
      return false;
    } finally {
      setPublishState(prev => ({ ...prev, isPublishing: false }));
    }
  };

  // Unpublish calendar (revert to draft)
  const unpublishCalendar = async () => {
    if (!currentOrg?.org_id || !isManager || !publishState.id) {
      setError('No tiene permisos para despublicar calendarios');
      return false;
    }

    setPublishState(prev => ({ ...prev, isPublishing: true }));
    setError(null);

    try {
      const { error } = await supabase
        .from('turnos_publicos')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', publishState.id);

      if (error) {
        throw error;
      }

      // Update local state
      setPublishState(prev => ({
        ...prev,
        status: 'draft',
        isPublishing: false
      }));

      // Log activity
      await logActivity({
        action: 'despublicar_calendario',
        entityType: 'calendario',
        entityName: `Semana ${format(weekStart, 'dd/MM/yyyy')}`,
        details: {
          version: publishState.version,
          fechaDespublicacion: new Date().toISOString()
        }
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al despublicar calendario';
      setError(errorMessage);
      console.error('Error unpublishing calendar:', err);
      return false;
    } finally {
      setPublishState(prev => ({ ...prev, isPublishing: false }));
    }
  };

  // Load state when week changes
  useEffect(() => {
    loadPublishState();
  }, [currentWeek, currentOrg?.org_id]);

  return {
    publishState,
    isLoading,
    error,
    publishCalendar,
    unpublishCalendar,
    canPublish: isManager && !publishState.isPublishing,
    isPublished: publishState.status === 'published',
    isDraft: publishState.status === 'draft',
    hasUnpublishedChanges,
    setHasUnpublishedChanges,
    clearError: () => setError(null)
  };
};