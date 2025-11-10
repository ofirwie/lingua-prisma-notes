import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY_German!;

async function runSQL(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🔧 Setting up database...\n');

  const mainSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20251109192021_2a2bb6ce-8df2-4774-b336-2e96b9de379f.sql'),
    'utf-8'
  );

  const topicsSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20251110_add_topics_to_lessons.sql'),
    'utf-8'
  );

  console.log('📦 Running main migration...');
  try {
    await runSQL(mainSQL);
    console.log('✅ Tables created\n');
  } catch (e: any) {
    console.error('❌ Main migration failed:', e.message);
  }

  console.log('📦 Adding topics column...');
  try {
    await runSQL(topicsSQL);
    console.log('✅ Topics added\n');
  } catch (e: any) {
    console.error('❌ Topics migration failed:', e.message);
  }

  console.log('✨ Database ready!');
}

main().catch(console.error);
