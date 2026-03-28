-- Eliminar registros duplicados de job_departments
-- Mantener solo el registro más antiguo de cada duplicado

-- Eliminar el duplicado más reciente de "Bar"
DELETE FROM job_departments 
WHERE id = '8058f57c-c53f-4d51-b553-8dd7378774b9';

-- Eliminar el duplicado más reciente de "Housekeeping"  
DELETE FROM job_departments 
WHERE id = '2dacc133-ac2a-4f23-bcf2-cea9a091d362';

-- Añadir constraint único para prevenir futuros duplicados por org_id y value
ALTER TABLE job_departments 
ADD CONSTRAINT unique_org_department 
UNIQUE (org_id, value);