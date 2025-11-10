import { SupabaseClient } from '@supabase/supabase-js';
import {
  LessonImportJSON,
  TermData,
  ValidationResult,
  ImportResult,
  PartOfSpeech,
  Gender,
} from '@/types/lesson-import';

const VALID_PARTS: PartOfSpeech[] = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];
const VALID_GENDERS: Gender[] = ['der', 'die', 'das', 'none'];

/**
 * Validates the structure and content of a JSON lesson import
 */
export function validateLessonJSON(data: any): ValidationResult {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON: must be an object'] };
  }

  // Check required top-level fields
  if (!data.lesson) {
    errors.push('Missing required field: lesson');
  } else {
    // Validate lesson metadata
    if (typeof data.lesson !== 'object') {
      errors.push('Field "lesson" must be an object');
    } else {
      if (!data.lesson.lesson_number || typeof data.lesson.lesson_number !== 'number') {
        errors.push('lesson.lesson_number is required and must be a number');
      } else if (data.lesson.lesson_number < 1) {
        errors.push('lesson.lesson_number must be a positive integer');
      }
    }
  }

  if (!data.terms || !Array.isArray(data.terms)) {
    errors.push('Missing required field: terms (must be an array)');
  } else {
    // Validate each term
    data.terms.forEach((term: any, index: number) => {
      const termPrefix = `terms[${index}]`;

      if (!term.german || typeof term.german !== 'string' || term.german.trim() === '') {
        errors.push(`${termPrefix}: german is required and must be a non-empty string`);
      }

      if (!term.part || typeof term.part !== 'string') {
        errors.push(`${termPrefix}: part is required and must be a string`);
      } else if (!VALID_PARTS.includes(term.part as PartOfSpeech)) {
        errors.push(
          `${termPrefix}: part must be one of: ${VALID_PARTS.join(', ')} (got "${term.part}")`
        );
      }

      if (!term.gender || typeof term.gender !== 'string') {
        errors.push(`${termPrefix}: gender is required and must be a string`);
      } else if (!VALID_GENDERS.includes(term.gender as Gender)) {
        errors.push(
          `${termPrefix}: gender must be one of: ${VALID_GENDERS.join(', ')} (got "${term.gender}")`
        );
      }

      if (!term.category || typeof term.category !== 'string' || term.category.trim() === '') {
        errors.push(`${termPrefix}: category is required and must be a non-empty string`);
      }

      if (!term.translations || typeof term.translations !== 'object') {
        errors.push(`${termPrefix}: translations is required and must be an object`);
      } else {
        // Validate at least one translation exists
        const hasTranslation = Object.values(term.translations).some(
          (val) => val && typeof val === 'string' && val.trim() !== ''
        );
        if (!hasTranslation) {
          errors.push(`${termPrefix}: at least one translation is required`);
        }
      }
    });
  }

  // Validate sentences if provided
  if (data.sentences && !Array.isArray(data.sentences)) {
    errors.push('Field "sentences" must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Imports a lesson from JSON format
 */
export async function importLessonFromJSON(
  supabase: SupabaseClient,
  userId: string,
  data: LessonImportJSON
): Promise<ImportResult> {
  try {
    const lessonNumber = data.lesson.lesson_number;
    let newTermsCount = 0;
    let reusedTermsCount = 0;

    // 1. Create or get lesson
    let lessonId: string;

    const { data: existingLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('created_by', userId)
      .eq('lesson_number', lessonNumber)
      .maybeSingle();

    if (existingLesson) {
      lessonId = existingLesson.id;

      // Update lesson name/description/topics if provided
      if (data.lesson.lesson_name || data.lesson.topics) {
        await supabase
          .from('lessons')
          .update({
            lesson_name: data.lesson.lesson_name,
            topics: data.lesson.topics || [],
          })
          .eq('id', lessonId);
      }
    } else {
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          lesson_number: lessonNumber,
          lesson_name: data.lesson.lesson_name || `Lesson ${lessonNumber}`,
          topics: data.lesson.topics || [],
          created_by: userId,
        })
        .select('id')
        .single();

      if (lessonError || !newLesson) {
        throw new Error(`Failed to create lesson: ${lessonError?.message}`);
      }

      lessonId = newLesson.id;
    }

    // 2. Process each term
    for (let i = 0; i < data.terms.length; i++) {
      const termData = data.terms[i];

      try {
        // Check if term exists (de-duplication)
        let termId: string;

        const { data: existingTerm } = await supabase
          .from('terms')
          .select('id')
          .eq('german', termData.german.trim())
          .eq('created_by', userId)
          .maybeSingle();

        if (existingTerm) {
          // Reuse existing term
          termId = existingTerm.id;
          reusedTermsCount++;
        } else {
          // Create new term
          const { data: newTerm, error: termError } = await supabase
            .from('terms')
            .insert({
              german: termData.german.trim(),
              part: termData.part,
              gender: termData.gender,
              ipa: termData.ipa || null,
              audio_url: termData.audio_url || null,
              created_by: userId,
            })
            .select('id')
            .single();

          if (termError || !newTerm) {
            throw new Error(`Failed to create term "${termData.german}": ${termError?.message}`);
          }

          termId = newTerm.id;
          newTermsCount++;
        }

        // 3. Create/update translations
        const translationMap: Record<string, string> = {
          he: 'hebrew',
          en: 'english',
          it: 'italian',
          es: 'spanish',
          fr: 'french',
        };

        for (const [shortLang, fullLang] of Object.entries(translationMap)) {
          const translationText = termData.translations[shortLang as keyof typeof termData.translations];

          if (translationText && translationText.trim()) {
            const { error: transError } = await supabase
              .from('term_translations')
              .upsert(
                {
                  term_id: termId,
                  lang: fullLang,
                  text: translationText.trim(),
                },
                {
                  onConflict: 'term_id,lang',
                }
              );

            if (transError) {
              console.error(`Translation error for ${termData.german} (${fullLang}):`, transError);
            }
          }
        }

        // 4. Link term to lesson
        const { error: linkError } = await supabase
          .from('lesson_terms')
          .upsert(
            {
              lesson_id: lessonId,
              term_id: termId,
              category: termData.category,
              subcategory: termData.subcategory || null,
              order_index: i,
            },
            {
              onConflict: 'lesson_id,term_id',
            }
          );

        if (linkError) {
          throw new Error(`Failed to link term to lesson: ${linkError.message}`);
        }
      } catch (error) {
        console.error(`Error processing term "${termData.german}":`, error);
        throw error;
      }
    }

    return {
      success: true,
      lessonNumber,
      newTermsCount,
      reusedTermsCount,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ],
    };
  }
}
