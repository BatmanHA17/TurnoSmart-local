-- Paso 1: Expandir el enum app_role con los nuevos roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'empleado';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'administrador';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'propietario';