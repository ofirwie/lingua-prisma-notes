import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY_German!;
const FIXED_EMAIL = 'ofir.wienerman@gmail.com';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log('🔍 Finding user...\n');

  // Get user by email using admin API
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email === FIXED_EMAIL);

  if (!user) {
    console.error('❌ User not found. Please login to the app first.');
    process.exit(1);
  }

  const userId = user.id;
  console.log(`✅ Found user: ${user.email} (${userId})\n`);

  console.log('📚 Loading 3 lessons...\n');

  const lessons = [
    'lesson-1-basic-verbs.json',
    'lesson-2-common-nouns.json',
    'lesson-3-questions-greetings.json'
  ];

  for (let i = 0; i < lessons.length; i++) {
    const filename = lessons[i];
    const lessonPath = join(process.cwd(), 'example-lessons', filename);
    const lessonData = JSON.parse(readFileSync(lessonPath, 'utf-8'));

    console.log(`   ${i + 1}. ${lessonData.lesson.lesson_name}`);

    // Check if exists
    const { data: existing } = await supabase
      .from('lessons')
      .select('id')
      .eq('created_by', userId)
      .eq('lesson_number', lessonData.lesson.lesson_number)
      .maybeSingle();

    if (existing) {
      console.log('      ⚠️  Already exists - skipping\n');
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

    if (lessonError || !newLesson) {
      console.error('      ❌ Failed:', lessonError);
      continue;
    }

    // Load terms
    let newTerms = 0;
    let reusedTerms = 0;

    for (let j = 0; j < lessonData.terms.length; j++) {
      const term = lessonData.terms[j];

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
        order_index: j,
      });
    }

    console.log(`      ✅ ${newTerms} new, ${reusedTerms} reused\n`);
  }

  console.log('✨ Done! Refresh https://lingua-prisma-notes.vercel.app');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
