/**
 * Automated Setup Script
 * This script creates a user and loads all example lessons
 */

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

async function ensureUserExists() {
  console.log('👤 Step 1: Ensuring user exists...\n');

  // First, try to signup (this creates the user if they don't exist)
  console.log(`   Trying to create user: ${FIXED_EMAIL}`);
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
  });

  if (signupError) {
    console.log(`   Signup info: ${signupError.message}`);
  } else if (signupData.user) {
    console.log(`   ✅ User created/exists: ${signupData.user.id}`);
  }

  // Now try to login
  console.log(`\n   Logging in...`);
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
  });

  if (loginError || !loginData.user) {
    console.error(`\n❌ Could not login: ${loginError?.message}\n`);
    console.log('📝 MANUAL STEP REQUIRED:');
    console.log('   1. Open https://lingua-prisma-notes.vercel.app');
    console.log('   2. Enter password: Churro393$');
    console.log('   3. Run this script again\n');
    process.exit(1);
  }

  console.log(`   ✅ Logged in successfully!`);
  return loginData.user.id;
}

async function loadLesson(userId: string, filename: string, lessonNum: number) {
  const lessonPath = join(process.cwd(), 'example-lessons', filename);
  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'));

  // Check if exists
  const { data: existing } = await supabase
    .from('lessons')
    .select('id')
    .eq('created_by', userId)
    .eq('lesson_number', lessonNum)
    .maybeSingle();

  if (existing) {
    console.log(`   Lesson ${lessonNum} already exists - skipping`);
    return { skipped: true, new: 0, reused: 0 };
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
    throw new Error(`Failed to create lesson: ${lessonError?.message}`);
  }

  let newTerms = 0;
  let reusedTerms = 0;

  // Load each term
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
      const { data: newTerm, error } = await supabase
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

      if (error || !newTerm) continue;

      termId = newTerm.id;
      newTerms++;
    }

    // Add translations
    const translations = [
      { lang: 'hebrew', text: term.translations.he },
      { lang: 'english', text: term.translations.en },
      { lang: 'italian', text: term.translations.it },
    ];

    for (const trans of translations) {
      if (trans.text) {
        await supabase.from('term_translations').upsert({
          term_id: termId,
          lang: trans.lang,
          text: trans.text,
        }, { onConflict: 'term_id,lang' });
      }
    }

    // Link to lesson
    await supabase.from('lesson_terms').insert({
      lesson_id: newLesson.id,
      term_id: termId,
      category: term.category,
      subcategory: term.subcategory || null,
      order_index: i,
    });
  }

  return { skipped: false, new: newTerms, reused: reusedTerms };
}

async function main() {
  console.log('\n🚀 Automated Setup - Lingua Prisma Notes');
  console.log('=========================================\n');

  try {
    const userId = await ensureUserExists();

    console.log('\n📚 Step 2: Loading example lessons...\n');

    const lessons = [
      { file: 'lesson-1-basic-verbs.json', num: 1, name: 'Basic Verbs' },
      { file: 'lesson-2-common-nouns.json', num: 2, name: 'Common Nouns' },
      { file: 'lesson-3-questions-greetings.json', num: 3, name: 'Questions & Greetings' },
    ];

    for (const lesson of lessons) {
      console.log(`   Loading: ${lesson.name}...`);
      const result = await loadLesson(userId, lesson.file, lesson.num);

      if (result.skipped) {
        console.log(`   ⚠️  Skipped (already exists)\n`);
      } else {
        console.log(`   ✅ Loaded: ${result.new} new terms, ${result.reused} reused\n`);
      }
    }

    console.log('✨ Setup Complete!\n');
    console.log('🌐 Next steps:');
    console.log('   1. Open: https://lingua-prisma-notes.vercel.app');
    console.log('   2. Login with password: Churro393$');
    console.log('   3. You should see 3 lessons in the sidebar!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\nIf the error is about "topics" column, run this SQL in Supabase:');
    console.error('ALTER TABLE lessons ADD COLUMN topics TEXT[] DEFAULT \'{}\';');
    process.exit(1);
  }
}

main();
