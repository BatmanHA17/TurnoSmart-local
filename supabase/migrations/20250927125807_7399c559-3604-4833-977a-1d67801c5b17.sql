-- Crear tabla para puestos predefinidos del convenio (IF NOT EXISTS)
DO $$ BEGIN
    CREATE TABLE IF NOT EXISTS public.predefined_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      job_title text NOT NULL,
      category_id uuid,
      level_id uuid,
      category_name text,
      level_name text,
      default_hours integer DEFAULT 8,
      default_rate_unit numeric DEFAULT 1.0,
      description text,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT fk_predefined_jobs_category FOREIGN KEY (category_id) REFERENCES professional_categories(id),
      CONSTRAINT fk_predefined_jobs_level FOREIGN KEY (level_id) REFERENCES professional_levels(id)
    );
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Habilitar RLS si la tabla no la tiene
DO $$ BEGIN
    ALTER TABLE public.predefined_jobs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Crear políticas RLS solo si no existen
DO $$ BEGIN
    CREATE POLICY "org_members_view_predefined_jobs" ON public.predefined_jobs
    FOR SELECT TO authenticated 
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "admins_manage_predefined_jobs" ON public.predefined_jobs
    FOR ALL TO authenticated 
    USING (is_admin_canonical(auth.uid()))
    WITH CHECK (is_admin_canonical(auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Insertar puestos predefinidos solo si la tabla está vacía
INSERT INTO public.predefined_jobs (job_title, category_name, level_name, description, default_hours, default_rate_unit)
SELECT * FROM (VALUES 
-- Nivel I - Jefes principales (8 horas)
('Contable General', 'Contable general', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Jefe/a de Administración', 'Jefe/a de administración', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Jefe/a de Cocina', 'Jefe/a de cocina', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Primer/a Jefe/a de Comedor', 'Primer/a jefe/a de comedor', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Jefe/a de Sala', 'Jefe/a de sala', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Primer/a Conserje de Día', 'Primer/a conserje de día', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Encargado/a General o Gobernante/a de Primera', 'Encargado/a general o gobernante/a de primera', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Encargado/a de Trabajos o Jefe/a de Servicios Técnicos', 'Encargado/a de trabajos o jefes/as de servicios técnicos en hoteles', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Jefe/a de Operaciones en Catering', 'Jefes/as de operaciones en catering', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),
('Jefe/a de Sala en Catering', 'Jefe/a de sala en catering', 'Nivel I', 'Categoría del Nivel I - Jefes principales', 8, 1.0),

-- Nivel II - Segundos jefes y especialistas (8 horas)
('Segundo/a Jefe/a de Cocina', 'Segundo/a jefe/a de cocina', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Segundo/a Jefe/a de Comedor', 'Segundo/a jefe/a de comedor', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Jefe/a de Partida', 'Jefe/a de partida', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Camarero/a de Banquetes', 'Camarero/a de banquetes', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Barman', 'Barman', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Sommelier', 'Sommelier', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Recepcionista de Primera', 'Recepcionista de primera', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Telefonista', 'Telefonista', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),
('Cajero/a', 'Cajero/a', 'Nivel II', 'Segundos jefes y especialistas', 8, 1.0),

-- Nivel III - Personal cualificado (8 horas, 6 horas, 4 horas)
('Cocinero/a', 'Cocinero/a', 'Nivel III', 'Personal cualificado', 8, 1.0),
('Camarero/a', 'Camarero/a', 'Nivel III', 'Personal cualificado', 8, 1.0),
('Camarero/a Media Jornada', 'Camarero/a', 'Nivel III', 'Personal cualificado - Media jornada', 6, 0.75),
('Camarero/a Tiempo Parcial', 'Camarero/a', 'Nivel III', 'Personal cualificado - Tiempo parcial', 4, 0.5),
('Recepcionista', 'Recepcionista', 'Nivel III', 'Personal cualificado', 8, 1.0),
('Conserje', 'Conserje', 'Nivel III', 'Personal cualificado', 8, 1.0),
('Camarera/o de Pisos', 'Camarera/o de pisos', 'Nivel III', 'Personal cualificado', 8, 1.0),
('Camarera/o de Pisos Media Jornada', 'Camarera/o de pisos', 'Nivel III', 'Personal cualificado - Media jornada', 6, 0.75),
('Lavandero/a-Planchador/a', 'Lavandero/a-planchador/a', 'Nivel III', 'Personal cualificado', 8, 1.0),

-- Nivel IV - Personal no cualificado (8 horas, 6 horas, 4 horas)
('Ayudante de Cocina', 'Ayudante de cocina', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Ayudante de Camarero/a', 'Ayudante de camarero/a', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Ayudante de Camarero/a Media Jornada', 'Ayudante de camarero/a', 'Nivel IV', 'Personal no cualificado - Media jornada', 6, 0.75),
('Ayudante de Camarero/a Tiempo Parcial', 'Ayudante de camarero/a', 'Nivel IV', 'Personal no cualificado - Tiempo parcial', 4, 0.5),
('Limpiador/a', 'Limpiador/a', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Limpiador/a Media Jornada', 'Limpiador/a', 'Nivel IV', 'Personal no cualificado - Media jornada', 6, 0.75),
('Pinche de Cocina', 'Pinche de cocina', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Mozo/a de Equipajes', 'Mozo/a de equipajes', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Auxiliar de Servicios', 'Auxiliar de servicios', 'Nivel IV', 'Personal no cualificado', 8, 1.0),
('Auxiliar de Servicios Media Jornada', 'Auxiliar de servicios', 'Nivel IV', 'Personal no cualificado - Media jornada', 6, 0.75)
) AS v(job_title, category_name, level_name, description, default_hours, default_rate_unit)
WHERE NOT EXISTS (SELECT 1 FROM public.predefined_jobs);

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_predefined_jobs_title ON public.predefined_jobs(job_title);
CREATE INDEX IF NOT EXISTS idx_predefined_jobs_category ON public.predefined_jobs(category_name);
CREATE INDEX IF NOT EXISTS idx_predefined_jobs_level ON public.predefined_jobs(level_name);