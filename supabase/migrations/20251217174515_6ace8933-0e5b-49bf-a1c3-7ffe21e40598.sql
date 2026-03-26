-- Drop and recreate the policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "org_members_manage_calendar_versions" ON public.calendar_versions;

CREATE POLICY "org_members_manage_calendar_versions"
ON public.calendar_versions
FOR ALL
USING (
  org_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
  )
);