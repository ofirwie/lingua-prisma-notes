UPDATE auth.users SET encrypted_password = crypt('Deutsche2024\!Churro', gen_salt('bf')) WHERE email = 'ofir.wienerman@gmail.com';
