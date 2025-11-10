-- Run this in Supabase SQL Editor to delete the existing user
-- This will let the app create it fresh with the correct password

DELETE FROM auth.users
WHERE email = 'ofir.wienerman@gmail.com';

-- Verify it was deleted
SELECT id, email FROM auth.users WHERE email = 'ofir.wienerman@gmail.com';
