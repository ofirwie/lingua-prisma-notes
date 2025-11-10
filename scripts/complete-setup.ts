import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const FIXED_EMAIL = 'admin.deutsche@gmail.com';
const FIXED_PASSWORD = 'Deutsche2024!Churro';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  console.log('👤 Creating/logging in user...');

  // Try to sign up with email confirmation disabled
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
    options: {
      data: {
        name: 'Admin',
      },
      emailRedirectTo: undefined,
    }
  });

  if (signUpError && signUpError.message !== 'User already registered') {
    console.error('   Signup error:', signUpError.message);
  }

  // Always try to login (works whether user is new or existing)
  console.log('   Attempting login...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
  });

  if (signInError) {
    console.error('\n⚠️  Could not login automatically.');
    console.error('   Please login to the app once with password: Churro393$');
    console.error('   Then run this script again.\n');
    throw new Error(`Login failed: ${signInError.message}`);
  }

  console.log('✅ User ready:', signInData.user!.email);
  return signInData.user!.id;
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
    console.log(`   ⚠️  Already exists. Skipping...`);
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
    console.error(`   ❌ Failed:`, lessonError?.message);
    return;
  }

  const lessonId = newLesson.id;
  let newTerms = 0;
  let reusedTerms = 0;

  // Load terms
  for (let i = 0; i < lesson.terms.length; i++) {
    const term = lesson.terms[i];

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
        console.error(`   ❌ Term "${term.german}" failed:`, termError?.message);
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

    // Link to lesson
    await supabase.from('lesson_terms').insert({
      lesson_id: lessonId,
      term_id: termId,
      category: term.category,
      order_index: i,
    });
  }

  console.log(`   ✅ Loaded: ${newTerms} new, ${reusedTerms} reused`);
}

async function main() {
  console.log('🚀 Complete Setup - Creating User & Loading Lessons\n');

  try {
    const userId = await createUser();

    console.log('\n📚 Loading lessons...');
    await loadLesson(userId, 'lesson-1-basic-verbs.json');
    await loadLesson(userId, 'lesson-2-common-nouns.json');
    await loadLesson(userId, 'lesson-3-questions-greetings.json');

    console.log('\n✨ Done! Open your app and login with password: Churro393$');
    console.log('   You should see 3 lessons in the sidebar.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
