-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE part_of_speech AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'phrase', 'other');
CREATE TYPE gender AS ENUM ('der', 'die', 'das', 'none');

-- Users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  native_language TEXT NOT NULL DEFAULT 'hebrew',
  current_language TEXT NOT NULL DEFAULT 'hebrew',
  preferences JSONB DEFAULT '{}'::jsonb,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Terms (German vocabulary - unique)
CREATE TABLE public.terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  german TEXT NOT NULL,
  part part_of_speech NOT NULL DEFAULT 'other',
  gender gender NOT NULL DEFAULT 'none',
  ipa TEXT,
  audio_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_german UNIQUE (german)
);

-- Term translations
CREATE TABLE public.term_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_term_lang UNIQUE (term_id, lang)
);

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_number INTEGER NOT NULL,
  lesson_name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_lesson UNIQUE (created_by, lesson_number)
);

-- Lesson-Term mapping (M2M)
CREATE TABLE public.lesson_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  category TEXT,
  subcategory TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_lesson_term UNIQUE (lesson_id, term_id)
);

-- Notebooks
CREATE TABLE public.notebooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_terms_german_trgm ON public.terms USING gin (german gin_trgm_ops);
CREATE INDEX idx_terms_created_by ON public.terms(created_by);
CREATE INDEX idx_term_translations_term ON public.term_translations(term_id);
CREATE INDEX idx_term_translations_lang ON public.term_translations(lang);
CREATE INDEX idx_lessons_created_by ON public.lessons(created_by);
CREATE INDEX idx_lesson_terms_lesson ON public.lesson_terms(lesson_id);
CREATE INDEX idx_lesson_terms_term ON public.lesson_terms(term_id);
CREATE INDEX idx_lesson_terms_category ON public.lesson_terms(category);
CREATE INDEX idx_notebooks_user ON public.notebooks(user_id);
CREATE INDEX idx_notebooks_lesson ON public.notebooks(lesson_id);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Terms policies
CREATE POLICY "Users can view own terms" ON public.terms FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create terms" ON public.terms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own terms" ON public.terms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own terms" ON public.terms FOR DELETE USING (auth.uid() = created_by);

-- Term translations policies
CREATE POLICY "Users can view own term translations" ON public.term_translations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.terms WHERE terms.id = term_translations.term_id AND terms.created_by = auth.uid())
);
CREATE POLICY "Users can create term translations" ON public.term_translations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.terms WHERE terms.id = term_translations.term_id AND terms.created_by = auth.uid())
);
CREATE POLICY "Users can update own term translations" ON public.term_translations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.terms WHERE terms.id = term_translations.term_id AND terms.created_by = auth.uid())
);
CREATE POLICY "Users can delete own term translations" ON public.term_translations FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.terms WHERE terms.id = term_translations.term_id AND terms.created_by = auth.uid())
);

-- Lessons policies
CREATE POLICY "Users can view own lessons" ON public.lessons FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create lessons" ON public.lessons FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own lessons" ON public.lessons FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own lessons" ON public.lessons FOR DELETE USING (auth.uid() = created_by);

-- Lesson terms policies
CREATE POLICY "Users can view own lesson_terms" ON public.lesson_terms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = lesson_terms.lesson_id AND lessons.created_by = auth.uid())
);
CREATE POLICY "Users can create lesson_terms" ON public.lesson_terms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = lesson_terms.lesson_id AND lessons.created_by = auth.uid())
);
CREATE POLICY "Users can update own lesson_terms" ON public.lesson_terms FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = lesson_terms.lesson_id AND lessons.created_by = auth.uid())
);
CREATE POLICY "Users can delete own lesson_terms" ON public.lesson_terms FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.lessons WHERE lessons.id = lesson_terms.lesson_id AND lessons.created_by = auth.uid())
);

-- Notebooks policies
CREATE POLICY "Users can view own notebooks" ON public.notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notebooks" ON public.notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notebooks" ON public.notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notebooks" ON public.notebooks FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON public.notebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, native_language, current_language)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'name',
    COALESCE(new.raw_user_meta_data->>'native_language', 'hebrew'),
    COALESCE(new.raw_user_meta_data->>'native_language', 'hebrew')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();