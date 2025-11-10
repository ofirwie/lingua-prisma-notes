import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY_German!
);

async function listUsers() {
  console.log('📋 Listing all users in project:', process.env.VITE_SUPABASE_URL);

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`\n✅ Found ${users.length} users:\n`);

  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`);
  });
}

listUsers();
