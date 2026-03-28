-- Clean up duplicate roles for owner@turnosmart.app
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.email = 'owner@turnosmart.app' AND p.deleted_at IS NULL
) 
AND role = 'user';

-- Also clean up any orphaned roles for deleted users
DELETE FROM user_roles 
WHERE user_id NOT IN (
  SELECT id FROM profiles WHERE deleted_at IS NULL
);