-- Actualizar el campo apellidos_uso (nombre a mostrar) para todos los colaboradores existentes
-- que no tengan este campo completado, usando nombre + apellidos

UPDATE public.colaboradores 
SET apellidos_uso = TRIM(nombre || ' ' || apellidos)
WHERE apellidos_uso IS NULL 
   OR apellidos_uso = '' 
   OR LENGTH(TRIM(apellidos_uso)) = 0;