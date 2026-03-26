import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CanonicalRole = "OWNER" | "ADMIN" | "MANAGER" | "DIRECTOR" | "EMPLOYEE" | null;

export const useUserRoleCanonical = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<CanonicalRole>(null);
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
    const { data, error } = await supabase.rpc("get_user_role_canonical", { _user_id: user.id });
    if (error) {
      console.error("Error fetching user role:", error);
      setError(error.message);
      setRole(null);
    } else {
      setRole((data as CanonicalRole) ?? "EMPLOYEE");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const getDefaultDashboard = useCallback(() => {
    // FASE 3: Todos los roles ahora usan /dashboard canónico
    return "/dashboard";
  }, [role]);

  return {
    role,
    isOwner: role === "OWNER",
    isAdmin: role === "ADMIN" || role === "OWNER",
    isManager: role === "MANAGER" || role === "ADMIN" || role === "OWNER",
    loading,
    error,
    refresh: fetchRole,
    getDefaultDashboard,
  };
};