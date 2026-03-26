// Hook reactivo para ejecutar auditorías de turnos
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AuditResult, 
  AuditViolation, 
  CoveragePolicy, 
  EmployeeRestriction,
  ViolationsByEmployeeDate 
} from '@/types/audit';
import { 
  runFullAudit, 
  organizeViolationsByEmployeeDate,
  ShiftForAudit 
} from '@/utils/shiftAudit';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface UseShiftAuditOptions {
  shifts: ShiftForAudit[];
  periodStart: Date;
  periodEnd: Date;
  orgId?: string;
  enabled?: boolean;
  // Configuración de auditoría
  minRestHours?: number;
  minFreeDaysFullTime?: number;
  requireConsecutiveFreeDays?: boolean;
  freeDaysAroundVacation?: number;
}

interface UseShiftAuditResult {
  // Resultados
  auditResult: AuditResult | null;
  violations: AuditViolation[];
  violationsByEmployeeDate: ViolationsByEmployeeDate;
  
  // Estado
  isAuditing: boolean;
  lastAuditTimestamp: string | null;
  
  // Acciones
  runAudit: () => void;
  clearViolations: () => void;
  
  // Helpers para UI
  getViolationsForCell: (employeeId: string, date: string) => AuditViolation[];
  getViolationsForEmployee: (employeeId: string) => AuditViolation[];
  getViolationsForDate: (date: string) => AuditViolation[];
  hasViolation: (employeeId: string, date: string) => boolean;
  getMaxSeverityForCell: (employeeId: string, date: string) => 'error' | 'warning' | 'info' | null;
}

// Políticas de cobertura por defecto
const DEFAULT_COVERAGE_POLICIES: CoveragePolicy[] = [
  {
    id: 'default-apertura',
    orgId: '',
    name: 'Apertura',
    startTime: '07:00',
    endTime: '12:00',
    minEmployees: 1,
    isEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-tarde',
    orgId: '',
    name: 'Tarde',
    startTime: '15:00',
    endTime: '20:00',
    minEmployees: 1,
    isEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-noche',
    orgId: '',
    name: 'Noche',
    startTime: '23:00',
    endTime: '07:00',
    minEmployees: 1,
    isEnabled: true,
    createdAt: new Date().toISOString()
  }
];

export function useShiftAudit(options: UseShiftAuditOptions): UseShiftAuditResult {
  const {
    shifts,
    periodStart,
    periodEnd,
    orgId,
    enabled = true,
    minRestHours = 12,
    minFreeDaysFullTime = 2,
    requireConsecutiveFreeDays = true,
    freeDaysAroundVacation = 2
  } = options;

  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [coveragePolicies, setCoveragePolicies] = useState<CoveragePolicy[]>(DEFAULT_COVERAGE_POLICIES);
  const [employeeRestrictions, setEmployeeRestrictions] = useState<EmployeeRestriction[]>([]);

  // Cargar políticas de cobertura y restricciones desde Supabase
  useEffect(() => {
    if (!orgId) return;

    const loadPolicies = async () => {
      try {
        // Cargar políticas de cobertura desde Supabase
        const { data: coverageData, error: coverageError } = await supabase
          .from('coverage_policies')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_enabled', true);
        
        if (coverageError) {
          console.error('Error loading coverage policies:', coverageError);
        } else if (coverageData && coverageData.length > 0) {
          setCoveragePolicies(coverageData.map(p => ({
            id: p.id,
            orgId: p.org_id,
            name: p.name,
            startTime: p.start_time,
            endTime: p.end_time,
            minEmployees: p.min_employees,
            isEnabled: p.is_enabled,
            appliesToDays: p.applies_to_days as string[] | undefined,
            createdAt: p.created_at
          })));
        } else {
          // Sin políticas configuradas → no aplicar políticas por defecto
          setCoveragePolicies([]);
        }

        // Cargar restricciones de empleados desde Supabase
        const { data: restrictionsData, error: restrictionsError } = await supabase
          .from('employee_restrictions')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true);
        
        if (restrictionsError) {
          console.error('Error loading employee restrictions:', restrictionsError);
        } else if (restrictionsData) {
          setEmployeeRestrictions(restrictionsData.map(r => ({
            id: r.id,
            colaboradorId: r.colaborador_id,
            orgId: r.org_id,
            restrictionType: r.restriction_type as 'NO_DAY' | 'MAX_HOURS_DAY' | 'NO_TIME_RANGE',
            config: r.config as Record<string, any>,
            reason: r.reason || undefined,
            isActive: r.is_active,
            validUntil: r.valid_until || undefined,
            createdAt: r.created_at
          })));
        }
      } catch (error) {
        console.error('Error loading audit policies:', error);
      }
    };

    loadPolicies();
  }, [orgId]);

  // Ejecutar auditoría
  const runAudit = useCallback(() => {
    if (!enabled || shifts.length === 0) {
      setAuditResult(null);
      return;
    }

    setIsAuditing(true);

    // Usar setTimeout para no bloquear la UI
    setTimeout(() => {
      try {
        const result = runFullAudit(shifts, {
          periodStart,
          periodEnd,
          coveragePolicies,
          employeeRestrictions,
          minRestHours,
          minFreeDaysFullTime,
          requireConsecutiveFreeDays,
          freeDaysAroundVacation
        });

        setAuditResult(result);
      } catch (error) {
        console.error('Error running audit:', error);
        setAuditResult(null);
      } finally {
        setIsAuditing(false);
      }
    }, 0);
  }, [
    enabled,
    shifts,
    periodStart,
    periodEnd,
    coveragePolicies,
    employeeRestrictions,
    minRestHours,
    minFreeDaysFullTime,
    requireConsecutiveFreeDays,
    freeDaysAroundVacation
  ]);

  // Ejecutar auditoría cuando cambien los turnos
  useEffect(() => {
    runAudit();
  }, [runAudit]);

  // Limpiar violaciones
  const clearViolations = useCallback(() => {
    setAuditResult(null);
  }, []);

  // Organizar violaciones por empleado y fecha
  const violationsByEmployeeDate = useMemo(() => {
    if (!auditResult) return {};
    return organizeViolationsByEmployeeDate(auditResult.violations);
  }, [auditResult]);

  // Helper: obtener violaciones para una celda específica
  const getViolationsForCell = useCallback((employeeId: string, date: string): AuditViolation[] => {
    return violationsByEmployeeDate[employeeId]?.[date] || [];
  }, [violationsByEmployeeDate]);

  // Helper: obtener violaciones para un empleado
  const getViolationsForEmployee = useCallback((employeeId: string): AuditViolation[] => {
    if (!auditResult) return [];
    return auditResult.violations.filter(v => v.employeeId === employeeId);
  }, [auditResult]);

  // Helper: obtener violaciones para una fecha
  const getViolationsForDate = useCallback((date: string): AuditViolation[] => {
    if (!auditResult) return [];
    return auditResult.violations.filter(v => v.date === date || (v.endDate && date >= v.date && date <= v.endDate));
  }, [auditResult]);

  // Helper: verificar si hay violación
  const hasViolation = useCallback((employeeId: string, date: string): boolean => {
    return getViolationsForCell(employeeId, date).length > 0;
  }, [getViolationsForCell]);

  // Helper: obtener la severidad máxima para una celda
  const getMaxSeverityForCell = useCallback((employeeId: string, date: string): 'error' | 'warning' | 'info' | null => {
    const cellViolations = getViolationsForCell(employeeId, date);
    if (cellViolations.length === 0) return null;
    
    if (cellViolations.some(v => v.severity === 'error')) return 'error';
    if (cellViolations.some(v => v.severity === 'warning')) return 'warning';
    return 'info';
  }, [getViolationsForCell]);

  return {
    auditResult,
    violations: auditResult?.violations || [],
    violationsByEmployeeDate,
    isAuditing,
    lastAuditTimestamp: auditResult?.timestamp || null,
    runAudit,
    clearViolations,
    getViolationsForCell,
    getViolationsForEmployee,
    getViolationsForDate,
    hasViolation,
    getMaxSeverityForCell
  };
}

// Hook simplificado para vista de día
export function useDayAudit(shifts: ShiftForAudit[], date: Date, orgId?: string) {
  return useShiftAudit({
    shifts,
    periodStart: date,
    periodEnd: date,
    orgId
  });
}

// Hook para vista de semana
export function useWeekAudit(shifts: ShiftForAudit[], weekStart: Date, orgId?: string) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  return useShiftAudit({
    shifts,
    periodStart: start,
    periodEnd: end,
    orgId
  });
}

// Hook para vista de 2 semanas
export function useBiWeekAudit(shifts: ShiftForAudit[], startDate: Date, orgId?: string) {
  const end = addDays(startDate, 13);
  
  return useShiftAudit({
    shifts,
    periodStart: startDate,
    periodEnd: end,
    orgId
  });
}

// Hook para vista de mes
export function useMonthAudit(shifts: ShiftForAudit[], monthDate: Date, orgId?: string) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  
  return useShiftAudit({
    shifts,
    periodStart: start,
    periodEnd: end,
    orgId
  });
}
