import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "super_admin" | "admin" | "user" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("get_user_role", { _user_id: user.id });
    if (error) {
      // Legacy RPC — silenced (get_user_role doesn't exist in cloud, use useTurnoSmartRole instead)
      setError(error.message);
      setRole(null);
    } else {
      setRole((data as AppRole) ?? "user");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin" || role === "super_admin",
    loading,
    error,
    refresh: fetchRole,
  };
};
