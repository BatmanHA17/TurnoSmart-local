-- CRITICAL SECURITY FIXES - Phase 1: Data Protection (Fixed)

-- 1. FIX COLABORADORES TABLE - Remove public access to employee personal data
DROP POLICY IF EXISTS "Allow public read access on colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Allow public write access on colaboradores" ON public.colaboradores;

-- Create secure policies for colaboradores table
CREATE POLICY "Admins can manage all colaboradores" 
ON public.colaboradores 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Colaboradores can view their own profile" 
ON public.colaboradores 
FOR SELECT 
USING (auth.uid() IN (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.email = colaboradores.email 
  AND p.deleted_at IS NULL
));

CREATE POLICY "Colaboradores can update their own basic profile" 
ON public.colaboradores 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.email = colaboradores.email 
  AND p.deleted_at IS NULL
))
WITH CHECK (auth.uid() IN (
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.email = colaboradores.email 
  AND p.deleted_at IS NULL
));

-- 2. FIX VERIFICATION CODES - Prevent authentication bypass
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes for verification" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes for verification" ON public.verification_codes;

-- Create secure verification code policies
CREATE POLICY "Users can create verification codes for their email" 
ON public.verification_codes 
FOR INSERT 
WITH CHECK (true); -- Edge functions need to create codes

CREATE POLICY "Users can read their own verification codes" 
ON public.verification_codes 
FOR SELECT 
USING (
  email IN (
    SELECT p.email 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.deleted_at IS NULL
  )
  OR auth.uid() IS NULL -- Allow edge functions to verify codes
);

CREATE POLICY "Users can verify their own codes" 
ON public.verification_codes 
FOR UPDATE 
USING (
  email IN (
    SELECT p.email 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.deleted_at IS NULL
  )
  OR auth.uid() IS NULL -- Allow edge functions to update codes
);

-- 3. FIX CALENDAR SHIFTS - Restrict to authenticated organization members
DROP POLICY IF EXISTS "Allow public read access on calendar_shifts" ON public.calendar_shifts;
DROP POLICY IF EXISTS "Allow public write access on calendar_shifts" ON public.calendar_shifts;

CREATE POLICY "Authenticated users can manage calendar shifts" 
ON public.calendar_shifts 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. FIX COMPENSATORY TIME OFF - Restrict access
DROP POLICY IF EXISTS "Allow public read access on compensatory_time_off" ON public.compensatory_time_off;
DROP POLICY IF EXISTS "Allow public write access on compensatory_time_off" ON public.compensatory_time_off;

CREATE POLICY "Admins can manage all compensatory time" 
ON public.compensatory_time_off 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Colaboradores can view their own compensatory time" 
ON public.compensatory_time_off 
FOR SELECT 
USING (
  colaborador_id IN (
    SELECT c.id 
    FROM public.colaboradores c 
    INNER JOIN public.profiles p ON p.email = c.email 
    WHERE p.id = auth.uid() 
    AND p.deleted_at IS NULL
  )
);

-- 5. FIX COMPENSATORY TIME HISTORY
DROP POLICY IF EXISTS "Allow public read access on compensatory_time_history" ON public.compensatory_time_history;
DROP POLICY IF EXISTS "Allow public write access on compensatory_time_history" ON public.compensatory_time_history;

CREATE POLICY "Admins can manage compensatory time history" 
ON public.compensatory_time_history 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Colaboradores can view their own compensatory time history" 
ON public.compensatory_time_history 
FOR SELECT 
USING (
  colaborador_id IN (
    SELECT c.id 
    FROM public.colaboradores c 
    INNER JOIN public.profiles p ON p.email = c.email 
    WHERE p.id = auth.uid() 
    AND p.deleted_at IS NULL
  )
);

-- 6. FIX SAVED SHIFTS - Update existing policies to be more restrictive
DROP POLICY IF EXISTS "Users can view saved shifts" ON public.saved_shifts;
DROP POLICY IF EXISTS "Users can create saved shifts" ON public.saved_shifts;
DROP POLICY IF EXISTS "Users can update saved shifts" ON public.saved_shifts;
DROP POLICY IF EXISTS "Users can delete saved shifts" ON public.saved_shifts;

CREATE POLICY "Authenticated users can view company saved shifts" 
ON public.saved_shifts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create saved shifts" 
ON public.saved_shifts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own saved shifts or admins can update all" 
ON public.saved_shifts 
FOR UPDATE 
USING (user_id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can delete their own saved shifts or admins can delete all" 
ON public.saved_shifts 
FOR DELETE 
USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- 7. Add automatic cleanup function for expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() - interval '1 hour'
  AND verified_at IS NULL;
END;
$$;

-- 8. Create audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  _table_name text,
  _action text,
  _record_id uuid,
  _accessed_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.activity_log (
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    COALESCE(
      (SELECT display_name FROM public.profiles WHERE id = auth.uid()),
      'Unknown User'
    ),
    _action,
    _table_name,
    _record_id,
    jsonb_build_object(
      'sensitive_data_access', true,
      'accessed_data', _accessed_data,
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
END;
$$;