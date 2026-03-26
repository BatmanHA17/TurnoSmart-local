-- SECURITY FIX: Remove public access to turnos_publicos and implement proper RLS policies

-- First, drop the existing public access policies
DROP POLICY IF EXISTS "Allow public read access on turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Allow public write access on turnos_publicos" ON public.turnos_publicos;

-- Create secure RLS policies that require authentication
-- Only authenticated users can view published turnos_publicos
CREATE POLICY "Authenticated users can view published turnos_publicos" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (status = 'published' OR status = 'revision');

-- Only authenticated users with admin roles can view all turnos_publicos (including drafts)
CREATE POLICY "Admin users can view all turnos_publicos" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only authenticated users with admin roles can manage turnos_publicos
CREATE POLICY "Admin users can manage turnos_publicos" 
ON public.turnos_publicos 
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);