import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that loads the current user's primary organization from the database.
 * This replaces hardcoded DEFAULT_ORGANIZATION.
 * Returns org data and loading state.
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  country?: string;
  created_at?: string;
}

export function useCurrentOrganization() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrg(null);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's primary organization
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
          const org = memberships[0].organizations as any;
          setOrg(org);
        } else {
          setError('No organization found for user');
          setOrg(null);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setOrg(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [user?.id]);

  return { org, loading, error };
}
