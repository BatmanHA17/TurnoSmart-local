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
  /** super_admin o fom */
  canManage: boolean;
  /** solo super_admin */
  isSuperAdmin: boolean;
  /** es empleado raso */
  isEmpleado: boolean;
  refresh: () => void;
}

export const useTurnoSmartRole = (): UseTurnoSmartRoleReturn => {
  const { user } = useAuth();
  const { org } = useCurrentOrganization();
  const [tsRole, setTsRole] = useState<TurnoSmartRole>("empleado");
  const [colaboradorId, setColaboradorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user || !org?.id) {
      setTsRole("empleado");
      setColaboradorId(null);
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
      if (!roleErr && roleData) {
        setTsRole(roleData as TurnoSmartRole);
      }

      // 2. Obtener colaborador vinculado
      const { data: colabId, error: colabErr } = await supabase.rpc(
        "get_colaborador_for_user",
        { _uid: user.id }
      );
      if (!colabErr && colabId) {
        setColaboradorId(colabId as string);
      } else {
        setColaboradorId(null);
      }
    } catch (err) {
      console.error("Error fetching TurnoSmart role:", err);
    } finally {
      setLoading(false);
    }
  }, [user, org?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    tsRole,
    colaboradorId,
    loading,
    canManage: tsRole === "super_admin" || tsRole === "fom",
    isSuperAdmin: tsRole === "super_admin",
    isEmpleado: tsRole === "empleado",
    refresh: fetchRole,
  };
};
