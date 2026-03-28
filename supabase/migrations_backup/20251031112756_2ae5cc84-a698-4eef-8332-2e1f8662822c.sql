-- Función helper para verificar si un usuario puede gestionar calendarios
CREATE OR REPLACE FUNCTION public.can_manage_calendars(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role_canonical IN ('OWNER', 'ADMIN', 'DIRECTOR', 'MANAGER')
  )
$$;

-- Eliminar políticas antiguas restrictivas
DROP POLICY IF EXISTS "admin_manage_schedules" ON public.turnos_publicos;
DROP POLICY IF EXISTS "admin_view_all_schedules" ON public.turnos_publicos;

-- Crear nueva política de lectura para managers+
CREATE POLICY "managers_can_view_all_schedules" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (public.can_manage_calendars(auth.uid()));

-- Crear nueva política de escritura para managers+
CREATE POLICY "managers_can_manage_schedules" 
ON public.turnos_publicos 
FOR ALL
TO authenticated
USING (public.can_manage_calendars(auth.uid()))
WITH CHECK (public.can_manage_calendars(auth.uid()));