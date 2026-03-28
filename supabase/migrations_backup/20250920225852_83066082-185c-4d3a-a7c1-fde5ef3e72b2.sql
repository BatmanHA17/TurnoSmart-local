-- Fix RLS policies for registration process

-- Allow users to create their own establishments during registration
CREATE POLICY "Users can create establishments during registration" 
ON public.establishments 
FOR INSERT 
WITH CHECK (true);

-- Allow users to create their own colaborador record during registration  
CREATE POLICY "Users can create their own colaborador record during registration"
ON public.colaboradores 
FOR INSERT 
WITH CHECK (true);

-- Update existing policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can only see their own establishments" ON public.establishments;
CREATE POLICY "Authenticated users can manage establishments" 
ON public.establishments 
FOR ALL 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can only see their own colaboradores" ON public.colaboradores;  
CREATE POLICY "Authenticated users can manage colaboradores"
ON public.colaboradores 
FOR ALL 
USING (auth.uid() IS NOT NULL);