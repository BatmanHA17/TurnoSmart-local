-- Ensure saved_shifts table exists (may have been created outside migrations)
CREATE TABLE IF NOT EXISTS public.saved_shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    start_time text,
    end_time text,
    color text DEFAULT '#86efac' NOT NULL,
    access_type text DEFAULT 'company' NOT NULL,
    selected_team text,
    selected_workplace text,
    department text,
    organization text,
    is_additional_time boolean DEFAULT false NOT NULL,
    break_type text,
    break_duration text,
    notes text,
    user_id uuid,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    org_id uuid NOT NULL,
    breaks jsonb,
    has_break boolean DEFAULT false,
    total_break_time integer DEFAULT 0
);

ALTER TABLE public.saved_shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies: org members can CRUD their org's shifts
CREATE POLICY "saved_shifts_select" ON public.saved_shifts FOR SELECT
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "saved_shifts_insert" ON public.saved_shifts FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "saved_shifts_update" ON public.saved_shifts FOR UPDATE
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "saved_shifts_delete" ON public.saved_shifts FOR DELETE
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));
