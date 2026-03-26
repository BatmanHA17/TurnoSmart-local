-- Actualizar todos los colaboradores existentes para que tengan "Contrato indefinido" como tipo de contrato
UPDATE public.colaboradores 
SET tipo_contrato = 'Contrato indefinido'
WHERE tipo_contrato IS NULL OR tipo_contrato = '' OR tipo_contrato = 'Sin especificar';