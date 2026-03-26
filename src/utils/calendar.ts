import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica si existe al menos un turno publicado en calendar_shifts
 * para la semana especificada en la organización dada.
 * 
 * Retorna false si:
 * - No hay turnos en ese rango
 * - Hay error de RLS/permisos (count null)
 * - Cualquier otro error
 * 
 * @param weekStart - Fecha de inicio de semana (formato YYYY-MM-DD)
 * @param weekEnd - Fecha de fin de semana (formato YYYY-MM-DD)
 * @param orgId - ID de la organización
 */
export async function hasPublishedWeek(
  weekStart: string,
  weekEnd: string,
  orgId: string
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from("calendar_shifts")
      .select("id", { head: true, count: "exact" })
      .eq("org_id", orgId)
      .gte("date", weekStart)
      .lte("date", weekEnd);

    // Si hay error o count es null (RLS-safe), consideramos no publicado
    if (error || count === null) {
      return false;
    }

    return count > 0;
  } catch (err) {
    console.error("Error checking published week:", err);
    return false;
  }
}
