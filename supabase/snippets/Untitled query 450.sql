UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'sendtogalvan@gmail.com';

SELECT id, email, email_confirmed_at FROM auth.users 
WHERE email = 'sendtogalvan@gmail.com';
