-- =============================================================================
-- RBAC Step 2: Crear auth.users para cada colaborador del seed
-- FOM + AFOM → membership ADMIN | Night/GEX/FDA → membership USER
-- Se ejecuta después de seed.sql (los colaboradores ya existen)
-- =============================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_colab RECORD;
  v_new_uid UUID;
  v_role app_role_canonical;
BEGIN
  -- Obtener org
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'recepcion' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Org recepcion no encontrada — skip RBAC seed';
    RETURN;
  END IF;

  -- Iterar sobre colaboradores SIN user_id
  FOR v_colab IN
    SELECT id, nombre, apellidos, email
    FROM colaboradores
    WHERE org_id = v_org_id AND user_id IS NULL AND email IS NOT NULL
  LOOP
    v_new_uid := gen_random_uuid();

    -- Determinar rol: FOM y Front Desk 4 (AFOM) → ADMIN, resto → USER
    IF v_colab.nombre = 'FOM' OR (v_colab.nombre = 'Front Desk' AND v_colab.apellidos = '4') THEN
      v_role := 'ADMIN';
    ELSE
      v_role := 'USER';
    END IF;

    -- Crear auth.user
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      role, aud, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_new_uid,
      '00000000-0000-0000-0000-000000000000',
      v_colab.email,
      crypt('TurnoSmart2026!', gen_salt('bf')),
      now(),
      'authenticated', 'authenticated',
      now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', COALESCE(v_colab.nombre || ' ' || COALESCE(v_colab.apellidos, ''), v_colab.nombre)),
      false,
      '', '', '', ''
    ) ON CONFLICT DO NOTHING;

    -- Crear identidad
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
    ) VALUES (
      v_new_uid, v_new_uid,
      jsonb_build_object('sub', v_new_uid::text, 'email', v_colab.email),
      'email', v_colab.email,
      now(), now(), now()
    ) ON CONFLICT DO NOTHING;

    -- Crear profile
    INSERT INTO profiles (id, email, display_name, is_active)
    VALUES (v_new_uid, v_colab.email, COALESCE(v_colab.nombre || ' ' || COALESCE(v_colab.apellidos, ''), v_colab.nombre), true)
    ON CONFLICT (id) DO NOTHING;

    -- Crear membership
    INSERT INTO memberships (user_id, org_id, role, status)
    VALUES (v_new_uid, v_org_id, v_role, 'active')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = v_role, status = 'active';

    -- Vincular colaborador ↔ auth.user
    UPDATE colaboradores SET user_id = v_new_uid WHERE id = v_colab.id;

    RAISE NOTICE '✅ Vinculado: % % → % (%)', v_colab.nombre, COALESCE(v_colab.apellidos, ''), v_colab.email, v_role;
  END LOOP;

  RAISE NOTICE '✅ RBAC seed completado — empleados vinculados a auth.users';
END $$;
