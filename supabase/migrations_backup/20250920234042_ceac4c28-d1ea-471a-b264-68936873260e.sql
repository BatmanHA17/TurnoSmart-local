-- Limpiar sesiones problemáticas que pueden estar causando rate limiting
-- Eliminar refresh tokens expirados o problemáticos

DELETE FROM auth.refresh_tokens 
WHERE revoked = true 
OR updated_at < NOW() - INTERVAL '7 days';

-- Verificar configuración de autenticación
SELECT 
  name, 
  value 
FROM auth.config 
WHERE name IN ('ENABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'EMAIL_CONFIRM_URL');