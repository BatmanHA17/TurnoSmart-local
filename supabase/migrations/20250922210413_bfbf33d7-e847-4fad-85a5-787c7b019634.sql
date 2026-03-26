-- Resetear el estado del convenio para que se pueda procesar de nuevo
UPDATE collective_agreements 
SET status = 'uploaded' 
WHERE status = 'processing_failed';