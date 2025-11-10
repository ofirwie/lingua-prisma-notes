import { SupabaseClient } from '@supabase/supabase-js';

export interface ExistingLesson {
  id: string;
  lesson_name: string | null;
  topics: string[] | null;
}

/**
 * Check if a lesson with the given number already exists
 */
export async function checkLessonConflict(
  supabase: SupabaseClient,
  userId: string,
  lessonNumber: number
): Promise<ExistingLesson | null> {
  const { data: existing } = await supabase
    .from('lessons')
    .select('id, lesson_name, topics')
    .eq('created_by', userId)
    .eq('lesson_number', lessonNumber)
    .maybeSingle();

  return existing;
}

/**
 * Format conflict message for confirmation dialog
 */
export function formatConflictMessage(
  lessonNumber: number,
  existing: ExistingLesson,
  newLessonName?: string,
  newTopics?: string[]
): string {
  const existingTopics = existing.topics?.join(', ') || 'None';
  const newTopicsStr = newTopics?.join(', ') || 'None';

  return `Lesson ${lessonNumber} already exists!\n\n` +
    `EXISTING LESSON:\n` +
    `Name: ${existing.lesson_name || `Lesson ${lessonNumber}`}\n` +
    `Topics: ${existingTopics}\n\n` +
    `NEW IMPORT:\n` +
    `Name: ${newLessonName || `Lesson ${lessonNumber}`}\n` +
    `Topics: ${newTopicsStr}\n\n` +
    `Click OK to MERGE (add new terms to existing lesson)\n` +
    `Click Cancel to STOP the import`;
}
