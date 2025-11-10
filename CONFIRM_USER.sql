-- Run this in Supabase SQL Editor to confirm the user
-- This allows login without email confirmation

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'ofir.wienerman@gmail.com';

-- Verify it worked
SELECT id, email, email_confirmed_at, confirmed_at
FROM auth.users
WHERE email = 'ofir.wienerman@gmail.com';
