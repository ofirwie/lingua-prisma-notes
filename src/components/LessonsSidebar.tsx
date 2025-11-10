import { useState, useEffect } from 'react';
import { Pencil, Trash2, GripVertical, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Lesson {
  id: string;
  lesson_number: number;
  lesson_name: string | null;
  term_count: number;
}

interface LessonsSidebarProps {
  onLessonSelect?: (lessonId: string) => void;
  selectedLessonId?: string | null;
}

export function LessonsSidebar({ onLessonSelect, selectedLessonId }: LessonsSidebarProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const { toast } = useToast();

  const fetchLessons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch lessons with term counts
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, lesson_number, lesson_name')
        .eq('created_by', user.id)
        .order('lesson_number', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Get term counts for each lesson
      const lessonsWithCounts = await Promise.all(
        (lessonsData || []).map(async (lesson) => {
          const { count } = await supabase
            .from('lesson_terms')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lesson.id);

          return {
            ...lesson,
            term_count: count || 0,
          };
        })
      );

      setLessons(lessonsWithCounts);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lessons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleRename = async (lessonId: string) => {
    if (!editName.trim()) {
      toast({
        title: 'Error',
        description: 'Lesson name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .update({ lesson_name: editName.trim() })
        .eq('id', lessonId);

      if (error) throw error;

      setLessons(lessons.map(l => 
        l.id === lessonId ? { ...l, lesson_name: editName.trim() } : l
      ));
      setEditingId(null);
      setEditName('');
      
      toast({
        title: 'Success',
        description: 'Lesson renamed successfully',
      });
    } catch (error) {
      console.error('Error renaming lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename lesson',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;

    try {
      // Delete lesson (cascade will handle lesson_terms)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonToDelete.id);

      if (error) throw error;

      setLessons(lessons.filter(l => l.id !== lessonToDelete.id));
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
      
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditName(lesson.lesson_name || `Lesson ${lesson.lesson_number}`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const confirmDelete = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Sidebar className="w-64 border-r border-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Loading...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <>
      <Sidebar className="w-64 border-r border-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-2">
              <span>My Lessons</span>
              <Badge variant="secondary">{lessons.length}</Badge>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {lessons.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No lessons yet. Import your first lesson to get started!
                </div>
              ) : (
                <SidebarMenu>
                  {lessons.map((lesson) => (
                    <SidebarMenuItem key={lesson.id}>
                      {editingId === lesson.id ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(lesson.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRename(lesson.id)}
                            className="h-8 w-8 p-0"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className="h-8 w-8 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="group flex items-center gap-1 w-full">
                          <SidebarMenuButton
                            onClick={() => onLessonSelect?.(lesson.id)}
                            isActive={selectedLessonId === lesson.id}
                            className="flex-1"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">
                              {lesson.lesson_name || `Lesson ${lesson.lesson_number}`}
                            </span>
                            <Badge variant="secondary" className="ml-auto">
                              {lesson.term_count}
                            </Badge>
                          </SidebarMenuButton>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 pr-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(lesson)}
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => confirmDelete(lesson)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonToDelete?.lesson_name || `Lesson ${lessonToDelete?.lesson_number}`}"? 
              This will remove {lessonToDelete?.term_count} term{lessonToDelete?.term_count !== 1 ? 's' : ''} from this lesson.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
