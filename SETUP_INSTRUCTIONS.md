# Setup Instructions - טעינת השיעורים

## שלב 1: הרצת Migration ב-Supabase ⚠️ חובה!

1. לך ל-[Supabase SQL Editor](https://supabase.com/dashboard/project/ilotcwtcnlihoprxcdzp/sql/new)
2. העתק והדבק את הקוד הזה:

```sql
-- Add topics array to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Add index for searching topics
CREATE INDEX IF NOT EXISTS idx_lessons_topics ON public.lessons USING gin(topics);

-- Add comment
COMMENT ON COLUMN public.lessons.topics IS 'Array of topic names for the lesson (e.g., ["Tenses", "Questions"])';
```

3. לחץ **Run** (או Ctrl+Enter)
4. ✅ אישור: אמור להופיע "Success. No rows returned"

---

## שלב 2: יצירת המשתמש הראשון

1. המתן שה-deployment ב-Vercel יסתיים (מקבל עדכון מ-GitHub)
2. פתח את [האפליקציה](https://lingua-prisma-notes.vercel.app)
3. הזן סיסמה: `Churro393$`
4. לחץ Login
5. ✅ אישור: אמור להיכנס ל-dashboard

זה יוצר אוטומטית משתמש עם:
- Email: `admin@deutsche-lernen.com`
- Password: `Deutsche2024!Churro`

---

## שלב 3: טעינת 3 השיעורים

חזור לטרמינל והרץ:

```bash
cd F:\Git\lingua-prisma-notes
npx tsx scripts/load-lessons-direct.ts
```

הסקריפט יטען:
- ✅ Lesson 1: Basic Verbs (15 terms)
- ✅ Lesson 2: Common Nouns (12 terms)
- ✅ Lesson 3: Questions & Greetings (15 terms)

---

## אם משהו לא עובד:

### בעיה: "Invalid login credentials"
**פתרון:** המשתמש עדיין לא נוצר. חזור לשלב 2 - היכנס לאפליקציה פעם אחת.

### בעיה: "column topics does not exist"
**פתרון:** לא הרצת את ה-migration. חזור לשלב 1.

### בעיה: "Lesson X already exists"
**פתרון:** השיעורים כבר נטענו! רענן את האפליקציה ותראה אותם.

---

## בדיקה אחרונה

אחרי טעינת השיעורים:
1. רענן את האפליקציה
2. בסיידבר השמאלי תראה "My Lessons (3)"
3. תחת כל שיעור יופיעו topics כ-badges
4. לחץ על שיעור כדי לראות את החומר

---

## מה נוצר:

### Lesson 1: Basic Verbs
**Topics:** Present Tense, Daily Actions, Essential Verbs
- sein (to be)
- haben (to have)
- gehen (to go)
- +12 more verbs

### Lesson 2: Common Nouns
**Topics:** Articles, Gender, Daily Objects, Family
- der Mann (the man)
- die Frau (the woman)
- das Kind (the child)
- +9 more nouns

### Lesson 3: Questions & Greetings
**Topics:** Question Words, Greetings, Basic Phrases, Politeness
- Hallo, Guten Morgen
- wie, was, wer, wo (question words)
- Bitte, Danke
- +10 more phrases

---

**זהו! אם עשית את 3 השלבים, הכל אמור לעבוד.**
