-- Cambiar "Enfermo/Accidente" por "Baja IT"
UPDATE public.saved_shifts 
SET name = 'Baja IT'
WHERE access_type = 'absence' AND name = 'Enfermo/Accidente';