import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY_German!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY_German in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetPassword() {
  console.log('🔐 Resetting password for ofir.wienerman@gmail.com...');

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    '47af86e4-bbbc-4cd5-98a1-f670d2726dca',
    { password: 'Deutsche2024!Churro' }
  );

  if (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Password reset successfully!');
  console.log('   Now you can run: npm run load:lessons');
}

resetPassword();
