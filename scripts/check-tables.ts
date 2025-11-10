import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY_German!
);

async function check() {
  const { data, error } = await supabase.from('lessons').select('*').limit(1);

  if (error) {
    console.log('❌ lessons table does NOT exist');
    console.log('   Error:', error.message);
  } else {
    console.log('✅ lessons table exists');
    console.log('   Data:', data);
  }
}

check();
