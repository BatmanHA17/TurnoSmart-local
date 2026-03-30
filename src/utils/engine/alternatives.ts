/**
 * TurnoSmart® — SMART Engine v2.0 — Alternatives
 *
 * Genera 2-3 versiones del cuadrante con distintos weight profiles.
 * Cada versión prioriza un aspecto diferente (equidad, peticiones, cobertura).
 */

import type {
  EngineInput,
  GenerationResult,
  ScheduleAlternative,
} from "./types";
import { WEIGHT_PROFILES } from "./constants";
import { runPipeline } from "./pipeline";

/**
 * Genera 3 alternativas del cuadrante, cada una con un weight profile distinto.
 * Devuelve las 3 ordenadas por score overall descendente.
 */
export function generateAlternatives(baseInput: Omit<EngineInput, "weights">): GenerationResult {
  const alternatives: ScheduleAlternative[] = [];

  for (const profile of WEIGHT_PROFILES) {
    const input: EngineInput = {
      ...baseInput,
      weights: profile,
    };

    const output = runPipeline(input);

    alternatives.push({
      id: `alt-${profile.name}-${Date.now()}`,
      label: profile.label,
      weights: profile,
      output,
    });
  }

  // Ordenar por score overall descendente
  alternatives.sort((a, b) => b.output.score.overall - a.output.score.overall);

  // La recomendada es la de mayor score
  const recommendedIndex = 0;

  return {
    alternatives,
    recommendedIndex,
    generationId: `gen-${Date.now()}`,
    generatedAt: new Date().toISOString(),
  };
}
