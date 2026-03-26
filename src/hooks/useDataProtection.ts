import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface OperationBackup {
  id: string;
  org_id: string;
  user_id: string;
  operation_type: string;
  operation_description?: string;
  backup_data: any;
  affected_records: number;
  created_at: string;
  expires_at: string;
  restored_at?: string;
  restored_by?: string;
}

export function useDataProtection() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentOrg } = useCurrentOrganization();
  const { user } = useAuth();

  /**
   * Crea un backup antes de una operación crítica
   * @param operationType Tipo de operación (bulk_delete, clear_calendar, migration, etc.)
   * @param backupData Datos a respaldar en formato JSONB
   * @param description Descripción opcional de la operación
   * @param affectedRecords Número de registros afectados
   * @returns ID del backup creado o null si falla
   */
  const createBackupBeforeOperation = async (
    operationType: string,
    backupData: any,
    description?: string,
    affectedRecords: number = 0
  ): Promise<string | null> => {
    if (!currentOrg || !user) {
      setError('No se puede crear backup: usuario o organización no disponibles');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;

      const { data, error: insertError } = await supabase
        .from('operation_backups')
        .insert({
          org_id: orgId,
          user_id: user.id,
          operation_type: operationType,
          operation_description: description,
          backup_data: backupData,
          affected_records: affectedRecords,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      return data.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creando backup:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Obtiene todos los backups de la organización actual
   * @param limit Número máximo de backups a retornar
   * @returns Lista de backups
   */
  const getBackups = async (limit: number = 50): Promise<OperationBackup[]> => {
    if (!currentOrg) {
      return [];
    }

    try {
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;

      const { data, error } = await supabase
        .from('operation_backups')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando backups';
      setError(errorMessage);
      console.error('Error obteniendo backups:', err);
      return [];
    }
  };

  /**
   * Restaura datos desde un backup específico
   * @param backupId ID del backup a restaurar
   * @returns Datos del backup o null si falla
   */
  const rollbackOperation = async (backupId: string): Promise<any | null> => {
    if (!currentOrg || !user) {
      setError('No se puede restaurar: usuario o organización no disponibles');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orgId = typeof currentOrg === 'string' ? currentOrg : currentOrg?.org_id;

      // Obtener el backup
      const { data: backup, error: fetchError } = await supabase
        .from('operation_backups')
        .select('*')
        .eq('id', backupId)
        .eq('org_id', orgId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!backup) {
        throw new Error('Backup no encontrado');
      }

      // Marcar el backup como restaurado
      const { error: updateError } = await supabase
        .from('operation_backups')
        .update({
          restored_at: new Date().toISOString(),
          restored_by: user.id,
        })
        .eq('id', backupId);

      if (updateError) {
        console.warn('No se pudo actualizar el estado del backup:', updateError);
        // No es crítico, continuamos
      }

      toast({
        title: "Backup restaurado",
        description: `Operación "${backup.operation_type}" restaurada correctamente`,
      });

      return backup.backup_data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error restaurando backup';
      setError(errorMessage);
      console.error('Error en rollback:', err);
      toast({
        title: "Error al restaurar",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Elimina backups expirados (ejecutar periódicamente)
   */
  const cleanupExpiredBackups = async (): Promise<void> => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_backups');

      if (error) {
        throw error;
      }

    } catch (err) {
      console.error('Error limpiando backups expirados:', err);
    }
  };

  return {
    createBackupBeforeOperation,
    getBackups,
    rollbackOperation,
    cleanupExpiredBackups,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
