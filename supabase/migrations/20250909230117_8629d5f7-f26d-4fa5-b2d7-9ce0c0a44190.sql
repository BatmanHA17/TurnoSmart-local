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

-- Only authenticated users with admin/manager roles can view all turnos_publicos (including drafts)
CREATE POLICY "Admin users can view all turnos_publicos" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only authenticated users with admin/manager roles can manage turnos_publicos
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

-- Add a new role 'manager' to the app_role enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'manager' role exists and add it if not
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'manager') THEN
        ALTER TYPE public.app_role ADD VALUE 'manager';
    END IF;
END $$;

-- Update policies to include manager role for better granular access
DROP POLICY IF EXISTS "Admin users can view all turnos_publicos" ON public.turnos_publicos;
DROP POLICY IF EXISTS "Admin users can manage turnos_publicos" ON public.turnos_publicos;

-- Managers and admins can view all turnos_publicos
CREATE POLICY "Managers and admins can view all turnos_publicos" 
ON public.turnos_publicos 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);

-- Managers and admins can manage turnos_publicos
CREATE POLICY "Managers and admins can manage turnos_publicos" 
ON public.turnos_publicos 
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role) OR
  public.has_role(auth.uid(), 'manager'::app_role)
);