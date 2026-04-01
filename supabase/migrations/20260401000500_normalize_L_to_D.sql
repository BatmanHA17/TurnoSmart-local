-- =============================================================================
-- Migración: Normalizar código 'L' (Libre) → 'D' (Descanso) en calendar_shifts
--
-- El motor SMART v2.0 usa 'D' como código oficial de Descanso.
-- Los datos históricos pueden contener 'L' o shift_name='Libre'.
-- Esta migración unifica ambos bajo el nuevo estándar.
-- =============================================================================

-- 1. Actualizar shift_name 'Libre' → 'Descanso' en calendar_shifts
UPDATE calendar_shifts
SET shift_name = 'Descanso'
WHERE shift_name IN ('Libre', 'L');

-- 2. Actualizar color al nuevo gris de Descanso (#94a3b8)
UPDATE calendar_shifts
SET color = '#94a3b8'
WHERE shift_name = 'Descanso'
  AND color IN ('#10b981', '#22c55e');  -- colores legacy de "Libre"

-- 3. Actualizar shift_name en saved_shifts si existieran entradas con nombre 'Libre'
UPDATE saved_shifts
SET name = 'Descanso', color = '#94a3b8'
WHERE name IN ('Libre', 'L');
