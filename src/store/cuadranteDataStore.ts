import { CuadranteMensual } from '@/types/cuadrante';

// Local storage key for full cuadrante data
const DATA_STORAGE_KEY = 'turnosmart_cuadrantes_data_v1';

type StoredCuadrantesMap = Record<string, any>;

function readMap(): StoredCuadrantesMap {
  try {
    const raw = localStorage.getItem(DATA_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: StoredCuadrantesMap) {
  localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(map));
}

// Convert from stored plain object to typed CuadranteMensual
function toCuadrante(data: any): CuadranteMensual | null {
  if (!data) return null;
  try {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as CuadranteMensual;
  } catch {
    return null;
  }
}

// Prepare CuadranteMensual for storage (dates to ISO)
function fromCuadrante(c: CuadranteMensual) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function getCuadranteData(id: string): CuadranteMensual | null {
  const map = readMap();
  return toCuadrante(map[id]);
}

export function upsertCuadranteData(c: CuadranteMensual) {
  const map = readMap();
  map[c.id] = fromCuadrante(c);
  writeMap(map);
}

export function removeCuadranteData(id: string) {
  const map = readMap();
  if (id in map) {
    delete map[id];
    writeMap(map);
  }
}
