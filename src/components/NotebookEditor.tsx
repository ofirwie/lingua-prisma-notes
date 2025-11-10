import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Palette,
  NotebookPen,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  lesson_number: number;
  lesson_name: string | null;
}

const NotebookEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: '<p>התחל לרשום הערות כאן...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getHTML());
    },
  });

  // Fetch lessons
  useEffect(() => {
    if (!user) return;

    const fetchLessons = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id, lesson_number, lesson_name')
        .eq('created_by', user.id)
        .order('lesson_number');

      if (data) {
        setLessons(data);
      }
    };

    fetchLessons();
  }, [user]);

  // Load notebook content
  const loadNotebook = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notebooks')
      .select('id, content')
      .eq('user_id', user.id)
      .eq('lesson_id', selectedLessonId)
      .maybeSingle();

    if (data) {
      setNotebookId(data.id);
      editor?.commands.setContent(data.content || '<p>התחל לרשום הערות כאן...</p>');
    } else {
      setNotebookId(null);
      editor?.commands.setContent('<p>התחל לרשום הערות כאן...</p>');
    }
  }, [user, selectedLessonId, editor]);

  useEffect(() => {
    loadNotebook();
  }, [loadNotebook]);

  // Save notebook
  const saveNotebook = async (content: string) => {
    if (!user) return;

    try {
      if (notebookId) {
        // Update existing
        await supabase
          .from('notebooks')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', notebookId);
      } else {
        // Create new
        const { data } = await supabase
          .from('notebooks')
          .insert({
            user_id: user.id,
            lesson_id: selectedLessonId,
            content,
          })
          .select('id')
          .single();

        if (data) {
          setNotebookId(data.id);
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      toast({
        title: 'שמירה נכשלה',
        description: 'לא ניתן לשמור את ההערות שלך. אנא נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  // Debounced auto-save
  const handleContentChange = (content: string) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveNotebook(content);
    }, 1000);

    setSaveTimeout(timeout);
  };

  // Keyboard shortcut: Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editor) {
          saveNotebook(editor.getHTML());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, notebookId]);

  const getTimeSinceLastSave = () => {
    if (!lastSaved) return null;

    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return `לפני ${seconds} שניות`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `לפני ${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    return `לפני ${hours} שעות`;
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <NotebookPen className="h-5 w-5 text-primary" />
          המחברת שלי
        </h2>

        {/* Lesson Selector */}
        <Select
          value={selectedLessonId || 'general'}
          onValueChange={(value) => setSelectedLessonId(value === 'general' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר שיעור" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="general">רשימות כלליות</SelectItem>
            {lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                שיעור {lesson.lesson_number}
                {lesson.lesson_name ? ` - ${lesson.lesson_name}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-accent' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            className={editor.isActive('highlight') ? 'bg-accent' : ''}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setColor('#ef4444').run()}
          >
            <Palette className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
          >
            <Palette className="h-4 w-4 text-blue-500" />
          </Button>
        </div>

        {/* Last Saved */}
        {lastSaved && (
          <p className="text-xs text-muted-foreground">
            נשמר לאחרונה: {getTimeSinceLastSave()}
          </p>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default NotebookEditor;
