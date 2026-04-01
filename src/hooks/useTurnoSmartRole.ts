import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

/**
 * Roles específicos de TurnoSmart:
 * - super_admin: Todo (goturnosmart@gmail.com o super_admins table)
 * - fom: FOM/AFOM — genera, edita, publica cuadrantes, gestiona peticiones
 * - empleado: Solo su horario, enviar peticiones, ver cuadrante publicado
 */
export type TurnoSmartRole = "super_admin" | "fom" | "empleado";

interface UseTurnoSmartRoleReturn {
  tsRole: TurnoSmartRole;
  colaboradorId: string | null;
  loading: boolean;
  /** super_admin o fom (o empleado con delegación activa) */
  canManage: boolean;
  /** solo super_admin */
  isSuperAdmin: boolean;
  /** es empleado raso (sin delegación) */
  isEmpleado: boolean;
  /** true si el permiso viene de delegación FOM→AFOM */
  isDelegated: boolean;
  refresh: () => void;
}

export const useTurnoSmartRole = (): UseTurnoSmartRoleReturn => {
  const { user } = useAuth();
  const { org, loading: orgLoading } = useCurrentOrganization();
  const [tsRole, setTsRole] = useState<TurnoSmartRole>("empleado");
  const [colaboradorId, setColaboradorId] = useState<string | null>(null);
  const [isDelegated, setIsDelegated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    // Wait for org to finish loading before deciding role
    if (orgLoading) {
      setLoading(true);
      return;
    }

    if (!user || !org?.id) {
      setTsRole("empleado");
      setColaboradorId(null);
      setIsDelegated(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener rol TurnoSmart via RPC
      const { data: roleData, error: roleErr } = await supabase.rpc(
        "get_turnosmart_role",
        { _uid: user.id, _org_id: org.id }
      );
      let role: TurnoSmartRole = "empleado";
      if (!roleErr && roleData) {
        role = roleData as TurnoSmartRole;
      }
      setTsRole(role);

      // 2. Obtener colaborador vinculado
      const { data: colabId, error: colabErr } = await supabase.rpc(
        "get_colaborador_for_user",
        { _uid: user.id }
      );
      if (!colabErr && colabId) {
        setColaboradorId(colabId as string);

        // 3. C1: Verificar delegación activa si es empleado
        if (role === "empleado" && colabId) {
          const today = new Date().toISOString().split("T")[0];
          const { data: colabData } = await supabase
            .from("colaboradores" as any)
            .select("delegation_active, delegation_start, delegation_end")
            .eq("id", colabId)
            .single();

          if (colabData) {
            const d = colabData as any;
            const active = d.delegation_active === true;
            const inRange =
              (!d.delegation_start || d.delegation_start <= today) &&
              (!d.delegation_end || d.delegation_end >= today);
            if (active && inRange) {
              setIsDelegated(true);
            } else {
              setIsDelegated(false);
            }
          }
        } else {
          setIsDelegated(false);
        }
      } else {
        setColaboradorId(null);
        setIsDelegated(false);
      }
    } catch (err) {
      console.error("Error fetching TurnoSmart role:", err);
    } finally {
      setLoading(false);
    }
  }, [user, org?.id, orgLoading]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const effectiveCanManage = tsRole === "super_admin" || tsRole === "fom" || isDelegated;

  return {
    tsRole,
    colaboradorId,
    loading,
    canManage: effectiveCanManage,
    isSuperAdmin: tsRole === "super_admin",
    isEmpleado: tsRole === "empleado" && !isDelegated,
    isDelegated,
    refresh: fetchRole,
  };
};
