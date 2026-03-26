import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { isMountedRef } from "@/utils/safeQuery";

export interface Permission {
  permission_name: string;
  is_enabled: boolean;
  category: string;
  description: string;
  is_configurable: boolean;
}

export const useUserPermissions = (colaboradorId?: string) => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (mounted?: { current: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      // SIEMPRE usar permisos del colaborador si se proporciona colaboradorId
      if (colaboradorId) {
        const { data: colaboradorRole, error: roleError } = await supabase
          .from('colaborador_roles')
          .select('role')
          .eq('colaborador_id', colaboradorId)
          .eq('activo', true)
          .order('asignado_en', { ascending: false })
          .single();

        if (roleError || !colaboradorRole) {
          if (import.meta.env.DEV) console.error('[useUserPermissions] Error fetching colaborador role:', roleError);
          if (!mounted || mounted.current) setPermissions([]);
          return;
        }

        const { data: rolePermissions, error: permError } = await supabase
          .from('role_permissions')
          .select(`
            permission_name,
            is_enabled,
            is_configurable,
            permissions(
              category,
              description
            )
          `)
          .eq('role', colaboradorRole.role);

        if (permError) {
          if (import.meta.env.DEV) console.error('[useUserPermissions] Error fetching role permissions:', permError);
          if (!mounted || mounted.current) setError(permError.message);
          return;
        }

        const transformedPermissions = (rolePermissions || []).map((rp: any) => ({
          permission_name: rp.permission_name,
          is_enabled: rp.is_enabled,
          category: rp.permissions?.category || 'unknown',
          description: rp.permissions?.description || '',
          is_configurable: rp.is_configurable
        }));

        if (!mounted || mounted.current) setPermissions(transformedPermissions);
        return;
      }

      // Si no hay colaboradorId pero hay usuario, usar permisos del usuario
      if (!user) {
        if (!mounted || mounted.current) { setPermissions([]); setLoading(false); }
        return;
      }

      // Usar función RPC solo para usuarios sin colaboradorId específico
      const { data, error } = await supabase.rpc('get_user_permissions', {
        _user_id: user.id,
        _colaborador_id: null
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[useUserPermissions] Error fetching permissions:', error);
        if (!mounted || mounted.current) setError(error.message);
        return;
      }

      if (!mounted || mounted.current) setPermissions(data || []);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[useUserPermissions] Unexpected:', err);
      if (!mounted || mounted.current) setError(err.message);
    } finally {
      if (!mounted || mounted.current) setLoading(false);
    }
  }, [user, colaboradorId]);

  const updatePermission = useCallback(async (
    targetUserId: string,
    permissionName: string,
    isEnabled: boolean
  ) => {
    if (!user) return false;

    try {

      // Get user details for logging
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', targetUserId)
        .single();

      // Update permission directly using database queries
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: targetUserId,
          colaborador_id: colaboradorId,
          permission_name: permissionName,
          is_enabled: isEnabled,
          granted_by: user.id
        }, {
          onConflict: 'user_id,permission_name'
        });

      if (error) {
        if (import.meta.env.DEV) console.error('[useUserPermissions] Error updating permission:', error);
        return false;
      }
      
      // Log detailed activity
      await logActivity({
        action: `ha ${isEnabled ? 'otorgado' : 'revocado'} el permiso "${permissionName}" ${isEnabled ? 'a' : 'de'} ${targetProfile?.display_name || targetProfile?.email || 'usuario'}`,
        entityType: 'permission',
        entityId: targetUserId,
        entityName: targetProfile?.display_name || targetProfile?.email || 'Unknown User',
        details: {
          permission_name: permissionName,
          previous_state: !isEnabled,
          new_state: isEnabled,
          action_type: 'permission_update',
          target_user_email: targetProfile?.email
        }
      });
      
      // Refresh permissions after update
      await fetchPermissions();
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[useUserPermissions] Error in updatePermission:', err);
      return false;
    }
  }, [user, colaboradorId, fetchPermissions, logActivity]);

  const assignRole = useCallback(async (targetUserId: string, role: string) => {
    if (!user) return false;

    try {

      // Get current role and user details for logging
      const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();

      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', targetUserId)
        .single();

      const previousRole = currentUserRole?.role || 'sin rol';

      // Remove existing roles for the user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', targetUserId);

      // Assign new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          role: role as any
        } as any);

      if (error) {
        if (import.meta.env.DEV) console.error('[useUserPermissions] Error assigning role:', error);
        return false;
      }
      
      // Log detailed role change activity
      const roleLabels: Record<string, string> = {
        'super_admin': 'Super Administrador',
        'admin': 'Administrador', 
        'user': 'Usuario',
        'sin rol': 'Sin rol'
      };

      await logActivity({
        action: `ha cambiado el rol de ${targetProfile?.display_name || targetProfile?.email || 'usuario'} de "${roleLabels[previousRole] || previousRole}" a "${roleLabels[role] || role}"`,
        entityType: 'user_role',
        entityId: targetUserId,
        entityName: targetProfile?.display_name || targetProfile?.email || 'Unknown User',
        details: {
          previous_role: previousRole,
          new_role: role,
          action_type: 'role_assignment',
          target_user_email: targetProfile?.email,
          role_change_summary: `${roleLabels[previousRole] || previousRole} → ${roleLabels[role] || role}`
        }
      });
      
      // Refresh permissions after role change
      await fetchPermissions();
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[useUserPermissions] Error in assignRole:', err);
      return false;
    }
  }, [user, fetchPermissions, logActivity]);

  useEffect(() => {
    const mounted = isMountedRef();
    fetchPermissions(mounted);
    return () => { mounted.current = false; };
  }, [fetchPermissions]);

  const getPermissionsByCategory = useCallback((category: string) => {
    return permissions.filter(p => p.category === category);
  }, [permissions]);

  const hasPermission = useCallback((permissionName: string) => {
    const permission = permissions.find(p => p.permission_name === permissionName);
    return permission?.is_enabled || false;
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    updatePermission,
    assignRole,
    refetch: fetchPermissions,
    getPermissionsByCategory,
    hasPermission
  };
};