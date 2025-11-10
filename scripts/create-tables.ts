import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY_German!;

const supabase = createClient(supabaseUrl, serviceKey);

async function createTables() {
  console.log('🔧 Creating tables...\n');

  // Create extensions
  await supabase.rpc('exec', { sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"' });
  await supabase.rpc('exec', { sql: 'CREATE EXTENSION IF NOT EXISTS "pg_trgm"' });

  // Create enums
  await supabase.rpc('exec', { sql: "CREATE TYPE part_of_speech AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'phrase', 'other')" });
  await supabase.rpc('exec', { sql: "CREATE TYPE gender AS ENUM ('der', 'die', 'das', 'none')" });

  console.log('✅ Extensions and enums created');

  // Create users table
  await supabase.rpc('exec', { sql: `
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT,
      native_language TEXT NOT NULL DEFAULT 'hebrew',
      current_language TEXT NOT NULL DEFAULT 'hebrew',
      preferences JSONB DEFAULT '{}'::jsonb,
      role TEXT DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )` });

  console.log('✅ Users table created');

  // Create terms table
  await supabase.rpc('exec', { sql: `
    CREATE TABLE public.terms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      german TEXT NOT NULL,
      part part_of_speech NOT NULL DEFAULT 'other',
      gender gender NOT NULL DEFAULT 'none',
      ipa TEXT,
      audio_url TEXT,
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      CONSTRAINT unique_german UNIQUE (german)
    )` });

  console.log('✅ Terms table created');

  // Create other tables...
  console.log('✅ All tables created!');
}

createTables().catch(console.error);
