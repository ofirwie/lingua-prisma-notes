import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fixed credentials
const FIXED_EMAIL = 'ofir.wienerman@gmail.com';
const FIXED_PASSWORD = 'Deutsche2024!Churro';

async function login() {
  console.log('🔐 Logging in...');

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

async function loadLesson(userId: string, filename: string) {
  console.log(`\n📚 Loading ${filename}...`);

  const lessonPath = join(process.cwd(), 'example-lessons', filename);
  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));

  // Check if lesson exists
  const { data: existing } = await supabase
    .from('lessons')
    .select('id, lesson_name')
    .eq('created_by', userId)
    .eq('lesson_number', lesson.lesson.lesson_number)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Lesson ${lesson.lesson.lesson_number} already exists. Skipping...`);
    return;
  }

  // Create lesson
  const { data: newLesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      lesson_number: lesson.lesson.lesson_number,
      lesson_name: lesson.lesson.lesson_name,
      topics: lesson.lesson.topics || [],
      created_by: userId,
    })
    .select('id')
    .single();

  if (lessonError || !newLesson) {
    console.error('❌ Failed to create lesson:', lessonError?.message);
    return;
  }

  const lessonId = newLesson.id;
  let newTerms = 0;
  let reusedTerms = 0;

  // Load terms
  for (let i = 0; i < lesson.terms.length; i++) {
    const term = lesson.terms[i];

    // Check if term exists
    const { data: existingTerm } = await supabase
      .from('terms')
      .select('id')
      .eq('german', term.german)
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
          german: term.german,
          part: term.part,
          gender: term.gender,
          ipa: term.ipa || null,
          created_by: userId,
        })
        .select('id')
        .single();

      if (termError || !newTerm) {
        console.error(`❌ Failed to create term "${term.german}":`, termError?.message);
        continue;
      }

      termId = newTerm.id;
      newTerms++;
    }

    // Add translations
    if (term.translations.he) {
      await supabase.from('term_translations').upsert({
        term_id: termId,
        lang: 'hebrew',
        text: term.translations.he,
      }, { onConflict: 'term_id,lang' });
    }

    if (term.translations.en) {
      await supabase.from('term_translations').upsert({
        term_id: termId,
        lang: 'english',
        text: term.translations.en,
      }, { onConflict: 'term_id,lang' });
    }

    if (term.translations.it) {
      await supabase.from('term_translations').upsert({
        term_id: termId,
        lang: 'italian',
        text: term.translations.it,
      }, { onConflict: 'term_id,lang' });
    }

    // Link term to lesson
    await supabase.from('lesson_terms').insert({
      lesson_id: lessonId,
      term_id: termId,
      category: term.category,
      subcategory: term.subcategory || null,
      order_index: i,
    });
  }

  console.log(`✅ "${lesson.lesson.lesson_name}": ${newTerms} new, ${reusedTerms} reused`);
}

async function main() {
  console.log('🚀 Loading Example Lessons\n');

  const userId = await login();

  await loadLesson(userId, 'lesson-1-basic-verbs.json');
  await loadLesson(userId, 'lesson-2-common-nouns.json');
  await loadLesson(userId, 'lesson-3-questions-greetings.json');

  console.log('\n✨ Done! Refresh your app to see the lessons.');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
