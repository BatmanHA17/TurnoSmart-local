-- Habilitar RLS y crear políticas para permitir acceso a niveles y categorías profesionales

-- Habilitar RLS en professional_levels si no está habilitado
ALTER TABLE public.professional_levels ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en professional_categories si no está habilitado  
ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

-- Crear políticas para professional_levels
-- Permitir lectura a usuarios autenticados para niveles generales (sin org_id específico)
CREATE POLICY "authenticated_users_can_read_general_levels" 
ON public.professional_levels 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (org_id IS NULL OR org_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
)));

-- Permitir a admins gestionar niveles
CREATE POLICY "admins_can_manage_levels" 
ON public.professional_levels 
FOR ALL 
USING (is_admin_canonical(auth.uid()));

-- Crear políticas para professional_categories  
-- Permitir lectura a usuarios autenticados para categorías generales (sin org_id específico)
CREATE POLICY "authenticated_users_can_read_general_categories" 
ON public.professional_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND (org_id IS NULL OR org_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
)));

-- Permitir a admins gestionar categorías
CREATE POLICY "admins_can_manage_categories" 
ON public.professional_categories 
FOR ALL 
USING (is_admin_canonical(auth.uid()));