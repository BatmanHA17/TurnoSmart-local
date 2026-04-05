import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Consolidated hook for current user's organization.
 * Returns org data, organizations list, loading state, and switch/refresh functions.
 *
 * API:
 *   org / currentOrg  — the active organization (same object, backwards compat)
 *   organizations      — array of UserOrganization for OrganizationSwitcher compat
 *   loading, error
 *   switchOrganization(orgId) — calls RPC set_primary_organization
 *   refresh()                 — re-fetches from DB
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country?: string;
  created_at?: string;
  // Backwards compat aliases
  org_id?: string;
  org_name?: string;
}

export interface UserOrganization {
  org_id: string;
  org_name: string;
  org_slug?: string;
  user_role: string;
  is_primary: boolean;
  member_since?: string;
}

export function useCurrentOrganization() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = useCallback(async () => {
    if (!user) {
      setOrg(null);
      setOrganizations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's primary organization via direct query
      const { data: memberships, error: fetchError } = await supabase
        .from('memberships')
        .select('org_id, organizations(id, name, slug, country)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('primary', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (memberships && memberships.length > 0) {
        const orgData = memberships[0].organizations as any;
        // Include org_id and org_name for backwards compat
        const enrichedOrg: Organization = {
          ...orgData,
          org_id: orgData.id,
          org_name: orgData.name,
        };
        setOrg(enrichedOrg);

        // Build organizations array for OrganizationSwitcher compat
        setOrganizations([
          {
            org_id: orgData.id,
            org_name: orgData.name,
            org_slug: orgData.slug,
            user_role: 'OWNER',
            is_primary: true,
          },
        ]);
      } else {
        setError('No organization found for user');
        setOrg(null);
        setOrganizations([]);
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOrg(null);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const switchOrganization = useCallback(
    async (orgId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error: rpcError } = await supabase.rpc('set_primary_organization', {
          _org_id: orgId,
        });

        if (rpcError) {
          console.error('Error switching organization:', rpcError);
          setError(rpcError.message);
          return false;
        }

        // Refresh to pick up the new primary org
        await fetchOrg();
        return true;
      } catch (err) {
        console.error('Unexpected error switching organization:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    [user, fetchOrg],
  );

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  return {
    org,
    currentOrg: org,
    organizations,
    loading,
    error,
    switchOrganization,
    refresh: fetchOrg,
  };
}
