import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserOrganization {
  org_id: string;
  org_name: string;
  user_role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'EMPLOYEE';
  is_primary: boolean;
  member_since: string;
}

export const useCurrentOrganization = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<UserOrganization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_user_organizations');

      if (error) {
        console.error("Error fetching organizations:", error);
        setError(error.message);
        setOrganizations([]);
        setCurrentOrg(null);
      } else {
        const orgs = data as UserOrganization[];
        setOrganizations(orgs);
        
        // Buscar la organización primaria
        const primaryOrg = orgs.find(org => org.is_primary);
        setCurrentOrg(primaryOrg || orgs[0] || null);
      }
    } catch (err: any) {
      console.error("Unexpected error fetching organizations:", err);
      setError(err.message);
      setOrganizations([]);
      setCurrentOrg(null);
    }

    setLoading(false);
  }, [user]);

  const switchOrganization = useCallback(async (orgId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('set_primary_organization', {
        _org_id: orgId
      });

      if (error) {
        console.error("Error switching organization:", error);
        setError(error.message);
        return false;
      }

      // Refrescar la lista de organizaciones para actualizar la primaria
      await fetchOrganizations();
      return true;
    } catch (err: any) {
      console.error("Unexpected error switching organization:", err);
      setError(err.message);
      return false;
    }
  }, [user, fetchOrganizations]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    currentOrg,
    loading,
    error,
    switchOrganization,
    refresh: fetchOrganizations,
  };
};