INSERT INTO public.memberships (
  user_id,
  org_id,
  role,
  status,
  created_at
)
VALUES (
  'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid,
  'cfb31f8f-bbe7-4065-a5b1-ec9e45822bb9'::uuid,
  'OWNER'::app_role_canonical,
  'active',
  now()
);

SELECT user_id, org_id, role FROM public.memberships WHERE user_id = 'bf07b4de-e09e-47fe-b619-66a26a9aee36'::uuid;
