-- Add topics array to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add index for searching topics
CREATE INDEX IF NOT EXISTS idx_lessons_topics ON public.lessons USING gin(topics);

-- Add comment
COMMENT ON COLUMN public.lessons.topics IS 'Array of topic names for the lesson (e.g., ["Tenses", "Questions"])';
