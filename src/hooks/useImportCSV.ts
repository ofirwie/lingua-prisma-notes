import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CSVRow } from '@/lib/csv-parser';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  newTermsCount: number;
  reusedTermsCount: number;
  lessonNumber: number;
  errors?: Array<{ row: number; message: string }>;
}

export function useImportCSV() {
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const importCSV = async (rows: CSVRow[]): Promise<ImportResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setImporting(true);
    
    try {
      // Get lesson number from first row
      const lessonNumber = parseInt(rows[0].Lesson);
      
      let newTermsCount = 0;
      let reusedTermsCount = 0;
      const errors: Array<{ row: number; message: string }> = [];

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 for header row and 0-index

        try {
          // 1. Check if term exists or create new one
          let termId: string;
          
          const { data: existingTerm } = await supabase
            .from('terms')
            .select('id')
            .eq('german', row.German)
            .eq('created_by', user.id)
            .maybeSingle();

          if (existingTerm) {
            termId = existingTerm.id;
            reusedTermsCount++;
          } else {
            // Create new term
            const { data: newTerm, error: termError } = await supabase
              .from('terms')
              .insert({
                german: row.German,
                part: (row.PartOfSpeech?.toLowerCase().trim() || 'other') as any,
                gender: (row.Gender?.toLowerCase().trim() || 'none') as any,
                created_by: user.id,
              })
              .select('id')
              .single();

            if (termError || !newTerm) {
              throw new Error(`Failed to create term: ${termError?.message}`);
            }

            termId = newTerm.id;
            newTermsCount++;
          }

          // 2. Create/update translations
          const translations = [
            { lang: 'hebrew', text: row.Hebrew },
            { lang: 'english', text: row.English },
            { lang: 'italian', text: row.Italian },
          ];

          for (const trans of translations) {
            if (trans.text && trans.text.trim()) {
              const { error: transError } = await supabase
                .from('term_translations')
                .upsert(
                  {
                    term_id: termId,
                    lang: trans.lang,
                    text: trans.text.trim(),
                  },
                  {
                    onConflict: 'term_id,lang',
                  }
                );

              if (transError) {
                console.error('Translation error:', transError);
              }
            }
          }

          // 3. Ensure lesson exists
          let lessonId: string;
          
          const { data: existingLesson } = await supabase
            .from('lessons')
            .select('id')
            .eq('created_by', user.id)
            .eq('lesson_number', lessonNumber)
            .maybeSingle();

          if (existingLesson) {
            lessonId = existingLesson.id;
          } else {
            const { data: newLesson, error: lessonError } = await supabase
              .from('lessons')
              .insert({
                lesson_number: lessonNumber,
                created_by: user.id,
                lesson_name: `Lesson ${lessonNumber}`,
              })
              .select('id')
              .single();

            if (lessonError || !newLesson) {
              throw new Error(`Failed to create lesson: ${lessonError?.message}`);
            }

            lessonId = newLesson.id;
          }

          // 4. Link term to lesson
          const { error: linkError } = await supabase
            .from('lesson_terms')
            .upsert(
              {
                lesson_id: lessonId,
                term_id: termId,
                category: row.Category,
                subcategory: row.Subcategory || null,
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
          errors.push({
            row: rowNum,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setImporting(false);

      if (errors.length === 0) {
        toast({
          title: 'Import Successful',
          description: `Imported ${rows.length} terms (${newTermsCount} new, ${reusedTermsCount} reused)`,
        });
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `${rows.length - errors.length} terms imported, ${errors.length} failed`,
          variant: 'destructive',
        });
      }

      return {
        success: errors.length === 0,
        newTermsCount,
        reusedTermsCount,
        lessonNumber,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      setImporting(false);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return { importCSV, importing };
}
