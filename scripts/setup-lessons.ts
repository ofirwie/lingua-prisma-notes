import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fixed credentials from SimpleAuth
const FIXED_EMAIL = 'ofir.wienerman@gmail.com';
const FIXED_PASSWORD = 'Deutsche2024!Churro';

async function runMigration() {
  console.log('\n📦 Step 1: Running migration...');

  const migrationSQL = readFileSync(
    join(process.cwd(), 'supabase/migrations/20251110_add_topics_to_lessons.sql'),
    'utf-8'
  );

  // Note: This requires service_role key to run DDL
  // User will need to run this manually in Supabase SQL Editor
  console.log('⚠️  Migration SQL (run this in Supabase SQL Editor):');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log('\n✅ After running the migration, press Enter to continue...');

  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
}

async function login() {
  console.log('\n🔐 Step 2: Logging in...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
  });

  if (error || !data.user) {
    console.error('❌ Login failed:', error?.message);
    process.exit(1);
  }

  console.log('✅ Logged in as:', data.user.email);
  return data.user.id;
}

async function importLesson(userId: string, lessonFile: string) {
  console.log(`\n📚 Importing ${lessonFile}...`);

  const lessonPath = join(process.cwd(), 'example-lessons', lessonFile);
  const lessonData = JSON.parse(readFileSync(lessonPath, 'utf-8'));

  // Check if lesson already exists
  const { data: existing } = await supabase
    .from('lessons')
    .select('id, lesson_name')
    .eq('created_by', userId)
    .eq('lesson_number', lessonData.lesson.lesson_number)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Lesson ${lessonData.lesson.lesson_number} already exists (${existing.lesson_name}). Skipping...`);
    return;
  }

  // Create lesson
  const { data: newLesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      lesson_number: lessonData.lesson.lesson_number,
      lesson_name: lessonData.lesson.lesson_name,
      topics: lessonData.lesson.topics || [],
      created_by: userId,
    })
    .select('id')
    .single();

  if (lessonError || !newLesson) {
    console.error(`❌ Failed to create lesson:`, lessonError?.message);
    return;
  }

  const lessonId = newLesson.id;
  let newTerms = 0;
  let reusedTerms = 0;

  // Import terms
  for (let i = 0; i < lessonData.terms.length; i++) {
    const termData = lessonData.terms[i];

    // Check if term exists
    const { data: existingTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('german', termData.german)
      .eq('created_by', userId)
      .maybeSingle();

    let termId: string;

    if (existingTerm) {
      termId = existingTerm.id;
      reusedTerms++;
    } else {
      const { data: newTerm, error: termError } = await supabase
        .from('terms')
        .insert({
          german: termData.german,
          part: termData.part,
          gender: termData.gender,
          ipa: termData.ipa || null,
          created_by: userId,
        })
        .select('id')
        .single();

      if (termError || !newTerm) {
        console.error(`❌ Failed to create term "${termData.german}":`, termError?.message);
        continue;
      }

      termId = newTerm.id;
      newTerms++;
    }

    // Add translations
    const translationMap: Record<string, string> = {
      he: 'hebrew',
      en: 'english',
      it: 'italian',
    };

    for (const [shortLang, fullLang] of Object.entries(translationMap)) {
      const text = termData.translations[shortLang as keyof typeof termData.translations];
      if (text) {
        await supabase
          .from('term_translations')
          .upsert({
            term_id: termId,
            lang: fullLang,
            text: text,
          }, {
            onConflict: 'term_id,lang',
          });
      }
    }

    // Link term to lesson
    await supabase
      .from('lesson_terms')
      .insert({
        lesson_id: lessonId,
        term_id: termId,
        category: termData.category,
        subcategory: termData.subcategory || null,
        order_index: i,
      });
  }

  console.log(`✅ Imported "${lessonData.lesson.lesson_name}": ${newTerms} new terms, ${reusedTerms} reused`);
}

async function main() {
  console.log('🚀 Lingua Prisma - Lesson Setup Script');
  console.log('=====================================\n');

  await runMigration();

  const userId = await login();

  console.log('\n📚 Step 3: Importing lessons...');
  await importLesson(userId, 'lesson-1-basic-verbs.json');
  await importLesson(userId, 'lesson-2-common-nouns.json');
  await importLesson(userId, 'lesson-3-questions-greetings.json');

  console.log('\n✨ Done! All lessons imported successfully.');
  console.log('🌐 Open your app and check the lessons sidebar.');

  process.exit(0);
}

main().catch(console.error);
