-- Clear the job_id assignment for the colaborador that has Room Services stuck
UPDATE colaboradores 
SET job_id = NULL 
WHERE id = '6e0ecd62-2cd7-4789-9f4b-fc330131bd65';