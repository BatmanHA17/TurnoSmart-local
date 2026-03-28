-- Corregir bucket y políticas para convenios colectivos
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "org_members_upload_agreements" ON storage.objects;
DROP POLICY IF EXISTS "org_members_view_agreements" ON storage.objects;
DROP POLICY IF EXISTS "org_members_delete_agreements" ON storage.objects;

-- Recrear políticas con la estructura correcta
CREATE POLICY "org_members_upload_agreements" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'collective_agreements' 
  AND auth.uid() IN (
    SELECT m.user_id 
    FROM memberships m 
    WHERE m.org_id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "org_members_view_agreements" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'collective_agreements' 
  AND auth.uid() IN (
    SELECT m.user_id 
    FROM memberships m 
    WHERE m.org_id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "org_members_delete_agreements" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'collective_agreements' 
  AND auth.uid() IN (
    SELECT m.user_id 
    FROM memberships m 
    WHERE m.org_id::text = split_part(name, '/', 1)
      AND m.role IN ('OWNER', 'ADMIN')
  )
);