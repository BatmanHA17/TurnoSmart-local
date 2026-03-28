-- FASE 1: Arreglar políticas RLS de colaborador_roles para permitir a OWNER/ADMIN/MANAGER gestionar roles

-- Eliminar política antigua restrictiva
DROP POLICY IF EXISTS "Admins can manage colaborador roles" ON public.colaborador_roles;
DROP POLICY IF EXISTS "Authenticated users can view colaborador roles" ON public.colaborador_roles;

-- Crear función auxiliar para verificar si un usuario puede gestionar roles en una org
CREATE OR REPLACE FUNCTION public.can_manage_colaborador_roles(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.user_id = _user_id
      AND m.org_id = _org_id
      AND m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
$$;

-- Política para GESTIÓN (INSERT, UPDATE, DELETE) - Solo OWNER/ADMIN/MANAGER
CREATE POLICY "Managers can manage colaborador roles"
ON public.colaborador_roles
FOR ALL
TO authenticated
USING (
  public.can_manage_colaborador_roles(auth.uid(), org_id)
)
WITH CHECK (
  public.can_manage_colaborador_roles(auth.uid(), org_id)
);

-- Política para LECTURA - Todos los miembros de la org pueden ver roles
CREATE POLICY "Org members can view colaborador roles"
ON public.colaborador_roles
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT m.org_id
    FROM memberships m
    WHERE m.user_id = auth.uid()
  )
);