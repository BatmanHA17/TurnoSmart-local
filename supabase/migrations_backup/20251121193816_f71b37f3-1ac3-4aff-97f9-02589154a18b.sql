-- Fix the last Security Definer View: user_roles_canonical
-- This view maps legacy roles to canonical roles

DROP VIEW IF EXISTS public.user_roles_canonical CASCADE;

CREATE VIEW public.user_roles_canonical
WITH (security_invoker = true) AS
SELECT 
  user_id,
  CASE LOWER(role::text)
    WHEN 'super_admin' THEN 'OWNER'
    WHEN 'propietario' THEN 'OWNER'
    WHEN 'administrador' THEN 'ADMIN'
    WHEN 'admin' THEN 'ADMIN'
    WHEN 'jefe_departamento' THEN 'MANAGER'
    WHEN 'manager' THEN 'MANAGER'
    WHEN 'director' THEN 'DIRECTOR'
    WHEN 'empleado' THEN 'EMPLOYEE'
    WHEN 'user' THEN 'EMPLOYEE'
    ELSE 'EMPLOYEE'
  END AS role
FROM user_roles ur;