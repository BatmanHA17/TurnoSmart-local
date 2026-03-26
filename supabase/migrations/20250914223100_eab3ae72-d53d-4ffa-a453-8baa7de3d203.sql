-- Habilitar realtime para la tabla colaboradores
ALTER PUBLICATION supabase_realtime ADD TABLE colaboradores;

-- Asegurar que la tabla tiene REPLICA IDENTITY FULL para capturar todos los cambios
ALTER TABLE colaboradores REPLICA IDENTITY FULL;