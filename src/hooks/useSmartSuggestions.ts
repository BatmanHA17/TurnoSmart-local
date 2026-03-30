/**
 * useSmartSuggestions — Hook para sugerencias SMART+IA
 *
 * Ejecuta los detectores del módulo smartIA y gestiona las sugerencias:
 * - Detecta patrones tras cada generación
 * - Muestra sugerencias al FOM
 * - Permite aceptar/rechazar/posponer
 */

import { useState, useCallback, useMemo } from "react";
import type { GenerationResult, DayAssignmentV2 } from "@/utils/engine";
import {
  detectFrequentAdHocShifts,
  detectTransitionNeeds,
  detectVacationAlerts,
} from "@/utils/engine/smartIA";
import type { SmartSuggestion } from "@/utils/engine/smartIA";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface UseSmartSuggestionsProps {
  /** Códigos de turno ya guardados como favoritos */
  savedShiftCodes: string[];
  /** Empleados con datos de vacaciones */
  employees: Array<{
    id: string;
    name: string;
    vacationDaysUsed: number;
    vacationDaysTotal: number;
  }>;
}

interface UseSmartSuggestionsResult {
  suggestions: SmartSuggestion[];
  /** Ejecutar detección tras una generación */
  detectAfterGeneration: (generation: GenerationResult) => void;
  /** Marcar sugerencia como aceptada */
  acceptSuggestion: (id: string) => void;
  /** Descartar sugerencia */
  dismissSuggestion: (id: string) => void;
  /** Limpiar todas */
  clearAll: () => void;
  /** Número de sugerencias pendientes */
  pendingCount: number;
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export function useSmartSuggestions({
  savedShiftCodes,
  employees,
}: UseSmartSuggestionsProps): UseSmartSuggestionsResult {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);

  const detectAfterGeneration = useCallback(
    (generation: GenerationResult) => {
      const allSuggestions: SmartSuggestion[] = [];

      // Ejecutar detectores sobre la alternativa recomendada
      const best = generation.alternatives[generation.recommendedIndex];
      if (!best) return;

      const { schedules } = best.output;
      const totalDays = best.output.meta.totalDays;

      // SM-01: Turnos ad-hoc frecuentes
      allSuggestions.push(
        ...detectFrequentAdHocShifts(schedules, savedShiftCodes)
      );

      // SM-09: Alertas de vacaciones
      allSuggestions.push(
        ...detectVacationAlerts(employees)
      );

      // SM-10: Transiciones T→M que necesitan 11×19
      allSuggestions.push(
        ...detectTransitionNeeds(schedules, totalDays)
      );

      setSuggestions((prev) => {
        // No duplicar sugerencias del mismo tipo
        const existingTypes = new Set(prev.map((s) => `${s.type}-${JSON.stringify(s.data)}`));
        const newOnes = allSuggestions.filter(
          (s) => !existingTypes.has(`${s.type}-${JSON.stringify(s.data)}`)
        );
        return [...prev, ...newOnes];
      });
    },
    [savedShiftCodes, employees]
  );

  const acceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s))
    );
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s))
    );
  }, []);

  const clearAll = useCallback(() => {
    setSuggestions([]);
  }, []);

  const pendingCount = useMemo(
    () => suggestions.filter((s) => !s.dismissed).length,
    [suggestions]
  );

  return {
    suggestions,
    detectAfterGeneration,
    acceptSuggestion,
    dismissSuggestion,
    clearAll,
    pendingCount,
  };
}
