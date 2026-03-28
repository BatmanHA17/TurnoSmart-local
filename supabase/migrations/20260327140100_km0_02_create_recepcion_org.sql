-- KM 0 PHASE 1.2: Create/Ensure Recepción Master Organization
-- This is the ONLY organization in km0

-- Ensure Recepción org exists (use ON CONFLICT for slug unique constraint)
INSERT INTO organizations (id, name, slug, country, created_at)
VALUES (
  'cfb31f8f-bbe7-4065-a5b1-ec9e45822bb9',
  'Recepción',
  'recepcion',
  'ES',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  name = 'Recepción',
  country = 'ES'
WHERE organizations.slug = 'recepcion';

-- Verify it exists
SELECT id, name, slug FROM organizations WHERE slug = 'recepcion';
