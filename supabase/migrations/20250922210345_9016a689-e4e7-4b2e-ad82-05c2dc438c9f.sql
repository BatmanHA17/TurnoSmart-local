-- Hacer el bucket collective_agreements público para que las URLs funcionen
UPDATE storage.buckets 
SET public = true 
WHERE name = 'collective_agreements';