-- Convierte invites pendientes -> membership al email del usuario
CREATE OR REPLACE FUNCTION public.attach_memberships_for_current_user()
RETURNS TABLE(org_id uuid, role app_role_canonical, became_primary boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_has_primary boolean;
  v_primary_set boolean;
  v_inv record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No session';
  END IF;

  -- email del usuario
  SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- ¿ya tiene org primaria?
  SELECT (primary_org_id IS NOT NULL) INTO v_has_primary
  FROM public.profiles
  WHERE id = v_user_id;

  -- Recorremos invites activas por email
  FOR v_inv IN
    SELECT *
    FROM public.invites
    WHERE lower(email) = lower(v_user_email)
      AND used_at IS NULL
      AND expires_at > now()
  LOOP
    -- Insert membership si no existe
    INSERT INTO public.memberships (org_id, user_id, role, "primary")
    VALUES (v_inv.org_id, v_user_id, v_inv.role, false)
    ON CONFLICT (org_id, user_id) DO NOTHING;

    v_primary_set := false;

    -- Si no tenía primary_org_id, ponemos ésta como primaria
    IF NOT v_has_primary THEN
      UPDATE public.profiles
      SET primary_org_id = v_inv.org_id
      WHERE id = v_user_id;

      UPDATE public.memberships
      SET "primary" = true
      WHERE org_id = v_inv.org_id AND user_id = v_user_id;

      v_has_primary := true;
      v_primary_set := true;
    END IF;

    -- Marcar invite como usada
    UPDATE public.invites
    SET used_at = now(), used_by = v_user_id
    WHERE id = v_inv.id;

    RETURN QUERY
      SELECT v_inv.org_id, v_inv.role, v_primary_set;
  END LOOP;

  -- Si no había nada que adjuntar, devolvemos vacío (0 filas)
  RETURN;
END;
$$;