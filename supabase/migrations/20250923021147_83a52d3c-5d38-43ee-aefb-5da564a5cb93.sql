-- 1. Agregar foreign keys para conectar jobs con departamentos y categorías
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS department_id UUID,
ADD COLUMN IF NOT EXISTS category_id UUID;

-- 2. Crear las foreign key constraints por separado
DO $$
BEGIN
  -- Foreign key para department_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_jobs_department' 
    AND table_name = 'jobs'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT fk_jobs_department 
    FOREIGN KEY (department_id) REFERENCES public.job_departments(id);
  END IF;

  -- Foreign key para category_id  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_jobs_category' 
    AND table_name = 'jobs'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT fk_jobs_category 
    FOREIGN KEY (category_id) REFERENCES public.professional_categories(id);
  END IF;

  -- Foreign key de colaboradores a jobs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_colaboradores_job' 
    AND table_name = 'colaboradores'
  ) THEN
    ALTER TABLE public.colaboradores 
    ADD CONSTRAINT fk_colaboradores_job 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id);
  END IF;
END $$;

-- 3. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_jobs_department_id ON public.jobs(department_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON public.jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_job_id ON public.colaboradores(job_id);