-- Table for document signature requests
CREATE TABLE IF NOT EXISTS document_signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected', 'expired')),
  requested_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  signature_data TEXT, -- base64 or simple text acknowledgement
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_sig_org ON document_signature_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_doc_sig_colaborador ON document_signature_requests(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_doc_sig_status ON document_signature_requests(org_id, status);

ALTER TABLE document_signature_requests ENABLE ROW LEVEL SECURITY;

-- Members can see requests for their org
-- NOTE: colaboradores doesn't have user_id yet — link implemented in user-levels feature
CREATE POLICY "members_read_own_doc_requests" ON document_signature_requests
  FOR SELECT USING (
    is_super_admin() OR
    org_id IN (
      SELECT m.org_id FROM memberships m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- Managers/Admins can create requests
CREATE POLICY "managers_manage_doc_requests" ON document_signature_requests
  FOR ALL USING (
    is_super_admin() OR
    org_id IN (
      SELECT m.org_id FROM memberships m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
        AND m.role IN ('OWNER','ADMIN')
    )
  );

-- Employee can sign docs for their org (refined when user-levels feature is implemented)
CREATE POLICY "employee_sign_own_docs" ON document_signature_requests
  FOR UPDATE USING (
    is_super_admin() OR
    org_id IN (
      SELECT m.org_id FROM memberships m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );
