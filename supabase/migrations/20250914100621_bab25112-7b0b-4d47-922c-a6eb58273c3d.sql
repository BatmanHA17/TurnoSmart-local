-- Add foreign worker field to colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN es_extranjero boolean DEFAULT false;