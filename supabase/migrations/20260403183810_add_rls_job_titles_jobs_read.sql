-- Allow authenticated users to read job_titles and jobs for their own org
-- Previously only super_admin_bypass policies existed, blocking normal users

CREATE POLICY "members_read_job_titles"
  ON public.job_titles
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_read_jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );
