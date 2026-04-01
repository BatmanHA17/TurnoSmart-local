-- Add sector/industry field to organizations for template tracking
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT 'generic';

COMMENT ON COLUMN public.organizations.sector IS
  'Industry template used during onboarding: hospitality, restaurant, retail, healthcare, services, manufacturing, generic';
