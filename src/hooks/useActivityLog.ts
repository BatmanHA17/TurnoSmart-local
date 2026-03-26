import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  establishment?: string;
  details?: Record<string, any>;
}

export const useActivityLog = () => {
  const { profile } = useUserProfile();

  const logActivity = async ({
    action,
    entityType,
    entityId,
    entityName,
    establishment = 'GOTHAM',
    details
  }: LogActivityParams) => {
    try {
      const userName = profile?.display_name || 'Usuario desconocido';
      
      const { error } = await supabase.rpc('log_activity', {
        _user_name: userName,
        _action: action,
        _entity_type: entityType,
        _entity_id: entityId || null,
        _entity_name: entityName || null,
        _establishment: establishment,
        _details: details ? JSON.stringify(details) : null
      });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  };

  return { logActivity };
};