-- Daily notes per day in calendar
CREATE TABLE IF NOT EXISTS calendar_daily_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(org_id, date)
);

ALTER TABLE calendar_daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_can_read_daily_notes" ON calendar_daily_notes
  FOR SELECT USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.org_id = calendar_daily_notes.org_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "admins_can_write_daily_notes" ON calendar_daily_notes
  FOR ALL USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.org_id = calendar_daily_notes.org_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('OWNER', 'ADMIN')
    )
  );
