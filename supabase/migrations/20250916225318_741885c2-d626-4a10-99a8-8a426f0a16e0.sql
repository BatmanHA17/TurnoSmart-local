-- Actualizar el email en la tabla profiles para que coincida con colaboradores
-- Esto permitirá que la navegación funcione correctamente
UPDATE profiles 
SET email = 'calltobatmanuk@gmail.com'
WHERE email = 'calltobatman@gmail.com';

-- Verificar que la sincronización sea correcta
-- (esto es solo un comentario para verificar después)