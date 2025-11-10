import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY_German!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigrations() {
  console.log('🔧 Running migrations...\n');

  // Main migration
  console.log('📦 Creating tables...');
  const mainMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20251109192021_2a2bb6ce-8df2-4774-b336-2e96b9de379f.sql'),
    'utf-8'
  );

  const { error: mainError } = await supabase.rpc('exec_sql', { sql: mainMigration });
  if (mainError) {
    console.error('❌ Main migration failed:', mainError.message);
  } else {
    console.log('✅ Tables created\n');
  }

  // Topics migration
  console.log('📦 Adding topics column...');
  const topicsMigration = readFileSync(
    join(process.cwd(), 'supabase/migrations/20251110_add_topics_to_lessons.sql'),
    'utf-8'
  );

  const { error: topicsError } = await supabase.rpc('exec_sql', { sql: topicsMigration });
  if (topicsError) {
    console.error('❌ Topics migration failed:', topicsError.message);
  } else {
    console.log('✅ Topics column added\n');
  }

  console.log('✨ Migrations complete!');
}

runMigrations().catch(console.error);
