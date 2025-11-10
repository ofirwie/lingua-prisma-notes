/**
 * Simple script that assumes user already logged in to the app
 * Just loads the lessons
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const FIXED_EMAIL = 'ofir.wienerman@gmail.com';
const FIXED_PASSWORD = 'Deutsche2024!Churro';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔐 Logging in...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: FIXED_EMAIL,
    password: FIXED_PASSWORD,
  });

  if (error || !data.user) {
    console.error(`\n❌ Could not login: ${error?.message}`);
    console.log('\n⚠️  You need to login to the app first!');
    console.log('   1. Open: https://lingua-prisma-notes.vercel.app');
    console.log('   2. Enter password: Churro393$');
    console.log('   3. Then run this script again\n');
    process.exit(1);
  }

  const userId = data.user.id;
  console.log(`✅ Logged in: ${data.user.email}\n`);

  console.log('📚 Loading lessons...\n');

  const lessons = [
    { file: 'lesson-1-basic-verbs.json', num: 1 },
    { file: 'lesson-2-common-nouns.json', num: 2 },
    { file: 'lesson-3-questions-greetings.json', num: 3 },
  ];

  for (const lesson of lessons) {
    const lessonPath = join(process.cwd(), 'example-lessons', lesson.file);
    const lessonData = JSON.parse(readFileSync(lessonPath, 'utf-8'));

    console.log(`   Lesson ${lesson.num}: ${lessonData.lesson.lesson_name}`);

    // Check if exists
    const { data: existing } = await supabase
      .from('lessons')
      .select('id')
      .eq('created_by', userId)
      .eq('lesson_number', lesson.num)
      .maybeSingle();

    if (existing) {
      console.log(`   ⚠️  Already exists - skipping\n`);
      continue;
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

    if (lessonError) {
      console.error(`   ❌ Error: ${lessonError.message}\n`);
      continue;
    }

    // Load terms
    let newTerms = 0;
    for (let i = 0; i < lessonData.terms.length; i++) {
      const term = lessonData.terms[i];

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
      } else {
        const { data: newTerm } = await supabase
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

        if (!newTerm) continue;
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
        lesson_id: newLesson.id,
        term_id: termId,
        category: term.category,
        subcategory: term.subcategory || null,
        order_index: i,
      });
    }

    console.log(`   ✅ Loaded ${newTerms} terms\n`);
  }

  console.log('✨ All done! Refresh your app to see the lessons.\n');
}

main().catch(console.error);
