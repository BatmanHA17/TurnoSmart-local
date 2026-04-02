import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) {
        // Silenced — profile may not exist for users without full onboarding
        setError(error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      // Silenced — expected in some auth states
      setError(err.message);
      setProfile(null);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getDisplayName = useCallback(() => {
    if (!profile) return null;
    
    // Prioridad: display_name > first_name + last_name > email
    if (profile.display_name) {
      return profile.display_name;
    }
    
    const fullName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
      
    if (fullName) {
      return fullName;
    }
    
    return profile.email;
  }, [profile]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    displayName: getDisplayName(),
  };
};