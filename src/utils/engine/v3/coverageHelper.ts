/**
 * TurnoSmart® — SMART Engine v3.0 — Coverage Helper
 *
 * Counts coverage per shift category, mapping related shifts:
 *   M  ← M, 9x17, 11x19
 *   T  ← T, 12x20
 *   N  ← N
 */

const COVERAGE_MAP: Record<string, "M" | "T" | "N"> = {
  M: "M",
  "9x17": "M",
  "11x19": "M",
  T: "T",
  "12x20": "T",
  N: "N",
};

/**
 * Counts how many employees contribute to coverage for a given shift category on a day.
 */
export function countCoverageOnDay(
  grid: Record<string, Record<number, { code: string }>>,
  day: number,
  shiftCategory: "M" | "T" | "N",
): number {
  let count = 0;
  for (const empId of Object.keys(grid)) {
    const code = grid[empId][day]?.code;
    if (code && COVERAGE_MAP[code] === shiftCategory) count++;
  }
  return count;
}

/**
 * Maps a shift code to its coverage category (M, T, N) or null if non-working.
 */
export function shiftToCoverageCategory(code: string): "M" | "T" | "N" | null {
  return COVERAGE_MAP[code] ?? null;
}
