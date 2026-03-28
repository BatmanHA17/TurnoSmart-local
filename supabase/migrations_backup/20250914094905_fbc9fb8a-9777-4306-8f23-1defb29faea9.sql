-- Add missing fields to colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN fecha_fin_contrato date,
ADD COLUMN tiempo_trabajo_semanal integer,
ADD COLUMN establecimiento_por_defecto text,
ADD COLUMN responsable_directo text;