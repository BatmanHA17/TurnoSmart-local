-- Agregar campo job_id a la tabla colaboradores para vincular con puestos de trabajo
ALTER TABLE public.colaboradores 
ADD COLUMN job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Crear índice para mejorar rendimiento en consultas de jobs
CREATE INDEX idx_colaboradores_job_id ON public.colaboradores(job_id);

-- Comentario para documentar el cambio
COMMENT ON COLUMN public.colaboradores.job_id IS 'Referencia al puesto de trabajo asignado al colaborador';