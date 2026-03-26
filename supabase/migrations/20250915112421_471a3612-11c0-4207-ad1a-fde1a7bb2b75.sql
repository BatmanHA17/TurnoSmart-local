-- Configurar REPLICA IDENTITY FULL para capturar todos los cambios en colaboradores
ALTER TABLE public.colaboradores REPLICA IDENTITY FULL;