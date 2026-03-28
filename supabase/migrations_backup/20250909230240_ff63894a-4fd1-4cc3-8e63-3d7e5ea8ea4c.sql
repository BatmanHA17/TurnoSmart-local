-- Check current policies and complete the security fix
-- Drop any remaining problematic policies and recreate them properly

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access on turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Allow public write access on turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Authenticated users can view published turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Admin users can view all turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Admin users can manage turnos_publicos" ON public.turnos_publicos;

-- Create secure RLS policies with unique names
-- Policy 1: Regular authenticated users can only view published schedules
CREATE POLICY "view_published_schedules_only" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (status IN ('published', 'revision'));

-- Policy 2: Admins can view all schedules including drafts
CREATE POLICY "admin_view_all_schedules" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Policy 3: Only admins can create, update, and delete schedules
CREATE POLICY "admin_manage_schedules" 
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