/**
 * usePetitions — CRUD de peticiones de empleados
 *
 * Tipos de petición:
 * A (dura): vacaciones aprobadas, baja. Respeta al 100%.
 * B (blanda): preferencia. Intenta respetar, puede saltar.
 * C (intercambio): dos empleados acuerdan cambio.
 * D (recurrente SMART): detectada por patrón 3+ meses.
 *
 * Flujo: empleado crea → FOM valida/rechaza → se usa en generación
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { PetitionType, PetitionStatus } from "@/utils/engine";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface PetitionRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  organization_id: string;
  type: PetitionType;
  status: PetitionStatus;
  days: number[];
  requested_shift: string | null;
  avoid_shift: string | null;
  exchange_with_employee_id: string | null;
  exchange_day: number | null;
  priority: number;
  reason: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

interface UsePetitionsProps {
  organizationId: string | undefined;
  periodStart?: string;
  periodEnd?: string;
}

interface UsePetitionsResult {
  petitions: PetitionRecord[];
  isLoading: boolean;
  error: string | null;
  createPetition: (petition: Omit<PetitionRecord, "id" | "created_at" | "updated_at" | "employee_name">) => Promise<void>;
  updatePetitionStatus: (petitionId: string, status: PetitionStatus) => Promise<void>;
  deletePetition: (petitionId: string) => Promise<void>;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function usePetitions({
  organizationId,
  periodStart,
  periodEnd,
}: UsePetitionsProps): UsePetitionsResult {
  const [petitions, setPetitions] = useState<PetitionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPetitions = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("schedule_petitions" as any)
        .select("*, colaboradores!employee_id(nombre, apellidos)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (periodStart) query = query.gte("period_start", periodStart);
      if (periodEnd) query = query.lte("period_end", periodEnd);

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;
      // Map joined colaboradores data → employee_name
      const mapped = ((data as any[]) ?? []).map((row: any) => {
        const colab = row.colaboradores;
        const nombre = colab?.nombre ?? '';
        const apellidos = colab?.apellidos ?? '';
        const fullName = nombre ? `${nombre}${apellidos ? ' ' + apellidos : ''}` : null;
        return {
          ...row,
          employee_name: fullName || `Empleado ${(row.employee_id || '').slice(0, 8)}`,
          colaboradores: undefined, // clean up joined field
        };
      });
      setPetitions(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error cargando peticiones";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, periodStart, periodEnd]);

  useEffect(() => {
    fetchPetitions();
  }, [fetchPetitions]);

  const createPetition = useCallback(
    async (petition: Omit<PetitionRecord, "id" | "created_at" | "updated_at" | "employee_name">) => {
      try {
        const { error: dbError } = await supabase
          .from("schedule_petitions" as any)
          .insert(petition as any);
        if (dbError) throw dbError;
        toast({ title: "Petición creada" });
        fetchPetitions();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error creando petición";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [fetchPetitions, toast]
  );

  const updatePetitionStatus = useCallback(
    async (petitionId: string, status: PetitionStatus) => {
      try {
        const { error: dbError } = await supabase
          .from("schedule_petitions" as any)
          .update({ status, updated_at: new Date().toISOString() } as any)
          .eq("id", petitionId);
        if (dbError) throw dbError;
        toast({ title: `Petición ${status === "approved" ? "aprobada" : "rechazada"}` });
        fetchPetitions();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error actualizando petición";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [fetchPetitions, toast]
  );

  const deletePetition = useCallback(
    async (petitionId: string) => {
      try {
        const { error: dbError } = await supabase
          .from("schedule_petitions" as any)
          .delete()
          .eq("id", petitionId);
        if (dbError) throw dbError;
        toast({ title: "Petición eliminada" });
        fetchPetitions();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error eliminando petición";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [fetchPetitions, toast]
  );

  return {
    petitions,
    isLoading,
    error,
    createPetition,
    updatePetitionStatus,
    deletePetition,
    refresh: fetchPetitions,
  };
}
