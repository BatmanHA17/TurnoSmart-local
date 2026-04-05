-- Holidays table for national and regional holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'national' CHECK (type IN ('national', 'regional', 'local')),
  country text DEFAULT 'ES',
  region text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, date)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Policy: users can read holidays for their org
CREATE POLICY "Users can read org holidays" ON public.holidays
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Policy: admins can manage holidays
CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

-- Seed Spain 2026 national holidays
INSERT INTO public.holidays (org_id, date, name, type, country) VALUES
  (NULL, '2026-01-01', 'Año Nuevo', 'national', 'ES'),
  (NULL, '2026-01-06', 'Día de Reyes', 'national', 'ES'),
  (NULL, '2026-04-03', 'Viernes Santo', 'national', 'ES'),
  (NULL, '2026-05-01', 'Día del Trabajo', 'national', 'ES'),
  (NULL, '2026-08-15', 'Asunción de la Virgen', 'national', 'ES'),
  (NULL, '2026-10-12', 'Fiesta Nacional', 'national', 'ES'),
  (NULL, '2026-11-02', 'Día de Todos los Santos', 'national', 'ES'),
  (NULL, '2026-12-07', 'Día de la Constitución', 'national', 'ES'),
  (NULL, '2026-12-08', 'Inmaculada Concepción', 'national', 'ES'),
  (NULL, '2026-12-25', 'Navidad', 'national', 'ES')
ON CONFLICT DO NOTHING;
