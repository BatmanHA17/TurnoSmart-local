-- Habilitar RLS en la tabla organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Política para que los miembros de la organización puedan ver la organización
CREATE POLICY "org_members_view_organization" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT org_id 
    FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

-- Política para que owners y admins puedan actualizar la organización
CREATE POLICY "org_admins_update_organization" 
ON public.organizations 
FOR UPDATE 
USING (
  id IN (
    SELECT m.org_id 
    FROM public.memberships m
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  id IN (
    SELECT m.org_id 
    FROM public.memberships m
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN')
  )
);

-- Política para crear organizaciones (durante onboarding)
CREATE POLICY "users_can_create_organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Habilitar RLS en establishments si no está habilitado
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- Política para ver establecimientos (todos los usuarios autenticados)
CREATE POLICY "authenticated_users_view_establishments" 
ON public.establishments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para que admins puedan gestionar establecimientos
CREATE POLICY "admins_manage_establishments" 
ON public.establishments 
FOR ALL 
USING (is_admin_canonical(auth.uid()))
WITH CHECK (is_admin_canonical(auth.uid()));