-- Hacer que tanto agreement_id como org_id sean nullable para permitir categorías generales

-- Limpiar datos existentes
DELETE FROM public.professional_categories;
DELETE FROM public.professional_levels;

-- Hacer que ambas columnas sean nullable
ALTER TABLE public.professional_categories ALTER COLUMN agreement_id DROP NOT NULL;
ALTER TABLE public.professional_categories ALTER COLUMN org_id DROP NOT NULL;

-- Insertar los niveles profesionales
INSERT INTO public.professional_levels (level_name, level_code, description, org_id, created_by) VALUES
('NIVEL I', 'NIV_I', 'Jefes principales y titulados superiores', NULL, NULL),
('NIVEL II', 'NIV_II', 'Segundos jefes y supervisores', NULL, NULL),
('NIVEL III', 'NIV_III', 'Encargados y oficiales especializados', NULL, NULL),
('NIVEL IV', 'NIV_IV', 'Empleados especializados y técnicos', NULL, NULL),
('NIVEL IV BIS', 'NIV_IV_BIS', 'Categoría especial', NULL, NULL),
('NIVEL V', 'NIV_V', 'Empleados de apoyo y servicios generales', NULL, NULL);

-- Test de inserción de una categoría
INSERT INTO public.professional_categories (category_name, level_id, description, agreement_id, org_id, created_by, category_type)
VALUES 
    ('Jefe/a de recepción', 
     (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_I' LIMIT 1),
     'Categoría del Nivel I - Jefes principales',
     NULL, NULL, NULL, 'categoria');