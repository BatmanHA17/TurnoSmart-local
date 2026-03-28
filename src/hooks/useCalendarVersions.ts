import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

  interface ShiftBlock {
    employeeId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    name: string; // Cambiar de shiftName a name para consistencia
    color: string;
    notes?: string;
    breakDuration?: string;
  }

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  [key: string]: any;
}

interface CalendarSnapshot {
  id?: string;
  org_id: string;
  version_name: string;
  created_by: string;
  created_at?: string;
  snapshot_data: {
    shiftBlocks: ShiftBlock[];
    employees: Employee[];
    weekRange: { start: Date; end: Date };
    metadata: {
      totalShifts: number;
      employeeCount: number;
      changes: string[];
    };
  };
  is_auto_save: boolean;
  version_number: number;
}

export const useCalendarVersions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useUserProfile();
  const { org: currentOrg } = useCurrentOrganization();

  const createVersion = async (
    shiftBlocks: ShiftBlock[],
    employees: Employee[],
    weekRange: { start: Date; end: Date },
    isAutoSave: boolean = true,
    customName?: string
  ): Promise<string | null> => {
    if (!currentOrg || !profile?.id) {
      setError('No se puede guardar: falta información de organización o usuario');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get org_id once at the beginning
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;
      
      // Get current version number
      const { data: lastVersion } = await supabase
        .from('calendar_versions')
        .select('version_number')
        .eq('org_id', orgId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersionNumber = (lastVersion?.version_number || 0) + 1;

      // Generate version name
      const versionName = customName || (
        isAutoSave 
          ? `Autoguardado ${new Date().toLocaleString('es-ES')}`
          : `Manual ${new Date().toLocaleString('es-ES')}`
      );

      // Prepare snapshot data
      const snapshotData = {
        shiftBlocks,
        employees,
        weekRange,
        metadata: {
          totalShifts: shiftBlocks.length,
          employeeCount: employees.length,
          changes: [`${shiftBlocks.length} turnos`, `${employees.length} empleados`]
        }
      };

      // Insert version
      const { data, error: insertError } = await supabase
        .from('calendar_versions')
        .insert({
          org_id: orgId,
          version_name: versionName,
          created_by: profile.id,
          snapshot_data: snapshotData as any,
          is_auto_save: isAutoSave,
          version_number: nextVersionNumber
        } as any)
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      // Clean up old versions (keep last 20)
      await supabase.rpc('cleanup_old_calendar_versions');

      return data.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creating calendar version:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getVersions = async (limit: number = 20) => {
    if (!currentOrg) {
      return [];
    }

    try {
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;
      const { data, error } = await supabase
        .from('calendar_versions')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando versiones';
      setError(errorMessage);
      console.error('Error getting versions:', err);
      return [];
    }
  };

  const restoreVersion = async (versionId: string): Promise<CalendarSnapshot | null> => {
    if (!currentOrg) {
      setError('No se puede restaurar: falta información de organización');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;
      const { data, error } = await supabase
        .from('calendar_versions')
        .select('*')
        .eq('id', versionId)
        .eq('org_id', orgId)
        .single();

      if (error) {
        throw error;
      }

      return data as any;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error restaurando versión';
      setError(errorMessage);
      console.error('Error restoring version:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createVersion,
    getVersions,
    restoreVersion,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};
