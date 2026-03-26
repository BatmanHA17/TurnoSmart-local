export type CuadranteSummary = {
  id: string;
  name: string;
  month: string; // Nombre del mes (Enero, Febrero, ...)
  year: number;
  type: 'manual' | 'auto';
  status: 'draft' | 'published' | 'archived';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  employeeCount: number;
  description?: string;
};

const STORAGE_KEY = 'turnosmart_cuadrantes_v1';

function read(): CuadranteSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as CuadranteSummary[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: CuadranteSummary[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getCuadrantes(): (Omit<CuadranteSummary, 'createdAt'|'updatedAt'> & { createdAt: Date; updatedAt: Date; })[] {
  return read().map(c => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }));
}

export function upsertCuadrante(c: Omit<CuadranteSummary, 'createdAt'|'updatedAt'> & { createdAt: Date; updatedAt: Date; }) {
  const list = read();
  const idx = list.findIndex(x => x.id === c.id);
  const prepared: CuadranteSummary = { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
  if (idx >= 0) list[idx] = prepared; else list.push(prepared);
  write(list);
}

export function removeCuadrante(id: string) {
  const list = read().filter(c => c.id !== id);
  write(list);
}

export function duplicateCuadrante(id: string) {
  const list = read();
  const original = list.find(c => c.id === id);
  if (!original) return null;
  const dup: CuadranteSummary = {
    ...original,
    id: `dup-${Date.now()}`,
    name: `${original.name} (Copia)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(dup);
  write(list);
  return { ...dup, createdAt: new Date(dup.createdAt), updatedAt: new Date(dup.updatedAt) };
}

export function seedIfEmpty(seeds: (Omit<CuadranteSummary, 'createdAt'|'updatedAt'> & { createdAt: Date; updatedAt: Date; })[]) {
  const existing = read();
  if (existing.length > 0) return;
  const prepared = seeds.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }));
  write(prepared);
}
