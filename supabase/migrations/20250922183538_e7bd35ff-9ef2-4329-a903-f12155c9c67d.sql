-- Crear bucket para convenios colectivos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collective_agreements', 'collective_agreements', false);

-- Políticas para el bucket collective_agreements
CREATE POLICY "org_members_upload_agreements" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'collective_agreements' 
  AND (storage.foldername(name))[1] IN (
    SELECT m.org_id::text 
    FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "org_members_view_agreements" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'collective_agreements' 
  AND (storage.foldername(name))[1] IN (
    SELECT m.org_id::text 
    FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "org_members_delete_agreements" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'collective_agreements' 
  AND (storage.foldername(name))[1] IN (
    SELECT m.org_id::text 
    FROM memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.role IN ('OWNER', 'ADMIN')
  )
);