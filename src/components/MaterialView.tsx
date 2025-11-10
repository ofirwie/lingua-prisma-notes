import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface MaterialViewProps {
  selectedLessonId?: string | null;
}

interface Term {
  id: string;
  german: string;
  part: string;
  gender: string;
  ipa: string | null;
  category: string;
  subcategory: string | null;
  translations: {
    hebrew?: string;
    english?: string;
    italian?: string;
  };
}

const MaterialView = ({ selectedLessonId }: MaterialViewProps) => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedLessonId) {
      fetchTerms();
    } else {
      setTerms([]);
    }
  }, [selectedLessonId]);

  const fetchTerms = async () => {
    if (!selectedLessonId) return;

    setLoading(true);
    try {
      // Fetch lesson_terms with term details
      const { data: lessonTerms, error: lessonTermsError } = await supabase
        .from('lesson_terms')
        .select(`
          category,
          subcategory,
          order_index,
          term_id,
          terms (
            id,
            german,
            part,
            gender,
            ipa
          )
        `)
        .eq('lesson_id', selectedLessonId)
        .order('order_index', { ascending: true });

      if (lessonTermsError) throw lessonTermsError;

      // Fetch translations for each term
      const termsWithTranslations = await Promise.all(
        (lessonTerms || []).map(async (lt: any) => {
          const term = lt.terms;

          const { data: translations } = await supabase
            .from('term_translations')
            .select('lang, text')
            .eq('term_id', term.id);

          const translationMap: Record<string, string> = {};
          (translations || []).forEach((t: any) => {
            translationMap[t.lang] = t.text;
          });

          return {
            id: term.id,
            german: term.german,
            part: term.part,
            gender: term.gender,
            ipa: term.ipa,
            category: lt.category,
            subcategory: lt.subcategory,
            translations: {
              hebrew: translationMap['hebrew'],
              english: translationMap['english'],
              italian: translationMap['italian'],
            },
          };
        })
      );

      setTerms(termsWithTranslations);
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vocabulary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGermanWord = (term: Term) => {
    if (term.part === 'noun' && term.gender && term.gender !== 'none') {
      const genderConfig = {
        der: { emoji: '🔵', color: 'text-blue-600', bgColor: 'bg-blue-50' },
        die: { emoji: '🔴', color: 'text-red-600', bgColor: 'bg-red-50' },
        das: { emoji: '🟢', color: 'text-green-600', bgColor: 'bg-green-50' },
      };

      const config = genderConfig[term.gender as keyof typeof genderConfig];

      if (config) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <span className={`font-semibold ${config.color}`}>{term.gender}</span>
            <span className="font-medium">{term.german}</span>
          </div>
        );
      }
    }

    return <span className="font-medium">{term.german}</span>;
  };

  const groupedTerms = terms.reduce((acc, term) => {
    if (!acc[term.category]) {
      acc[term.category] = [];
    }
    acc[term.category].push(term);
    return acc;
  }, {} as Record<string, Term[]>);

  if (!selectedLessonId) {
    return (
      <div className="flex flex-col h-full bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Material View
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Select a lesson to see your study material</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Material View
          </h2>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="flex flex-col h-full bg-card border-r border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Material View
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No vocabulary found in this lesson</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Material View
          <Badge variant="secondary">{terms.length} terms</Badge>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedTerms).map(([category, categoryTerms]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-md font-semibold text-primary flex items-center gap-2">
              {category}
              <Badge variant="outline">{categoryTerms.length}</Badge>
            </h3>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">German</TableHead>
                    <TableHead className="w-[30%] text-right" dir="rtl">עברית</TableHead>
                    <TableHead className="w-[25%]">English</TableHead>
                    <TableHead className="w-[10%]">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium text-lg">
                        {renderGermanWord(term)}
                      </TableCell>
                      <TableCell className="text-right text-lg" dir="rtl">
                        {term.translations.hebrew || '-'}
                      </TableCell>
                      <TableCell className="text-base text-muted-foreground">
                        {term.translations.english || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {term.part}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>

      {/* Gender Legend */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground flex items-center gap-4">
          <span className="font-semibold">Gender:</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span>🔵</span>
              <span className="text-blue-600 font-medium">der</span>
              <span>(masculine)</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🔴</span>
              <span className="text-red-600 font-medium">die</span>
              <span>(feminine)</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🟢</span>
              <span className="text-green-600 font-medium">das</span>
              <span>(neuter)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialView;
