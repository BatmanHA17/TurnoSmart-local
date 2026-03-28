-- Limpiar completamente el usuario sendtogalvan@gmail.com de todas las tablas

-- 1. Buscar el UUID del usuario en profiles si existe
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar el UUID del usuario por email
    SELECT id INTO user_uuid FROM public.profiles WHERE email = 'sendtogalvan@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Eliminar de user_roles
        DELETE FROM public.user_roles WHERE user_id = user_uuid;
        RAISE NOTICE 'Deleted user_roles for user: %', user_uuid;
        
        -- Eliminar de profiles
        DELETE FROM public.profiles WHERE id = user_uuid;
        RAISE NOTICE 'Deleted profile for user: %', user_uuid;
    END IF;
    
    -- Eliminar códigos de verificación por email
    DELETE FROM public.verification_codes WHERE email = 'sendtogalvan@gmail.com';
    RAISE NOTICE 'Deleted verification codes for email: sendtogalvan@gmail.com';
    
    -- Intentar eliminar del auth.users usando admin
    -- Nota: Esto puede requerir privilegios especiales
    BEGIN
        DELETE FROM auth.users WHERE email = 'sendtogalvan@gmail.com';
        RAISE NOTICE 'Deleted auth user for email: sendtogalvan@gmail.com';
    EXCEPTION 
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'Cannot delete from auth.users (insufficient privileges) - will need manual cleanup';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from auth.users: %', SQLERRM;
    END;
    
END $$;