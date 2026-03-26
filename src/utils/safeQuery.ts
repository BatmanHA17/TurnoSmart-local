/**
 * safeQuery — Wrapper para llamadas a Supabase con error handling consistente.
 *
 * Evita duplicar try-catch en cada hook y garantiza que:
 * 1. Los errores se loggean con contexto
 * 2. Nunca lanzamos excepciones no manejadas al componente
 * 3. Siempre retornamos { data, error } con tipos correctos
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[safeQuery${context ? ':' + context : ''}]`, error?.message ?? error);
      }
      return { data: null, error: error?.message ?? 'Error desconocido' };
    }
    return { data, error: null };
  } catch (e: any) {
    if (import.meta.env.DEV) {
      console.error(`[safeQuery${context ? ':' + context : ''}] Unexpected:`, e?.message ?? e);
    }
    return { data: null, error: e?.message ?? 'Error inesperado' };
  }
}

/**
 * isMountedRef — Crea una ref que indica si el componente sigue montado.
 * Usar en useEffect para evitar setState en componentes desmontados.
 *
 * Uso:
 *   const mounted = isMountedRef();
 *   useEffect(() => {
 *     fetchData().then(data => {
 *       if (mounted.current) setState(data);
 *     });
 *     return () => { mounted.current = false; };
 *   }, []);
 */
export function isMountedRef() {
  const ref = { current: true };
  return ref;
}
