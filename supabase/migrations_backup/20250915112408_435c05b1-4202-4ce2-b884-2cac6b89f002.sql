-- Habilitar Realtime para la tabla colaboradores
ALTER TABLE public.colaboradores REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.colaboradores;