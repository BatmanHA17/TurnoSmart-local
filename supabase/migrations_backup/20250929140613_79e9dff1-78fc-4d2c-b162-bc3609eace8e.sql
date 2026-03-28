-- Crear tabla para versiones del calendario
CREATE TABLE public.calendar_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  version_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  snapshot_data JSONB NOT NULL,
  is_auto_save BOOLEAN NOT NULL DEFAULT false,
  version_number INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.calendar_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "org_members_manage_calendar_versions" 
ON public.calendar_versions 
FOR ALL 
USING (org_id IN (
  SELECT m.org_id 
  FROM memberships m 
  WHERE m.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_calendar_versions_org_id ON public.calendar_versions(org_id);
CREATE INDEX idx_calendar_versions_created_at ON public.calendar_versions(created_at DESC);
CREATE INDEX idx_calendar_versions_auto_save ON public.calendar_versions(is_auto_save);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_versions_updated_at
BEFORE UPDATE ON public.calendar_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up old versions (keep last 20 per org)
CREATE OR REPLACE FUNCTION public.cleanup_old_calendar_versions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete versions older than the last 20 per organization
  DELETE FROM public.calendar_versions
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at DESC) as rn
      FROM public.calendar_versions
    ) ranked
    WHERE rn > 20
  );
END;
$$;