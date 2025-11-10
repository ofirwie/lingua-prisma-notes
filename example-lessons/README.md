# Example Lessons

This folder contains 3 ready-to-import lesson files in JSON format.

## Lessons Overview

### Lesson 1: Basic Verbs (15 terms)
**File:** `lesson-1-basic-verbs.json`
**Topics:** Present Tense, Daily Actions, Essential Verbs
**Categories:**
- Essential Verbs (sein, haben, werden)
- Modal Verbs (können, müssen)
- Communication (sagen)
- Actions (machen, geben, nehmen)
- Movement (gehen, kommen)
- Perception (sehen)
- Cognition (wissen)
- Daily Activities (essen, trinken)

### Lesson 2: Common Nouns (12 terms)
**File:** `lesson-2-common-nouns.json`
**Topics:** Articles, Gender, Daily Objects, Family
**Categories:**
- People (der Mann, die Frau, das Kind)
- Places (das Haus, die Schule, die Stadt)
- Furniture (der Tisch, der Stuhl, das Bett)
- Objects (das Buch)
- Food & Drink (das Wasser, das Brot)

**Note:** All nouns include gender articles (der/die/das) for proper learning.

### Lesson 3: Questions & Greetings (15 terms)
**File:** `lesson-3-questions-greetings.json`
**Topics:** Question Words, Greetings, Basic Phrases, Politeness
**Categories:**
- Greetings (Hallo, Guten Morgen, Guten Tag, Guten Abend)
- Farewells (Tschüss, Auf Wiedersehen)
- Question Words (wie, was, wer, wo, wann, warum)
- Politeness (Bitte, Danke, Entschuldigung)

## How to Import

1. **Login** to the app at https://your-vercel-app.vercel.app
2. Click **"Import Lesson"** button
3. Select **"JSON Format"** tab
4. **Copy** the content of one of the JSON files above
5. **Paste** into the text area
6. Click **"Import"** button

## JSON Structure

Each lesson file follows this structure:

```json
{
  "lesson": {
    "lesson_number": 1,
    "lesson_name": "Lesson Name",
    "topics": ["Topic 1", "Topic 2"]
  },
  "terms": [
    {
      "german": "word",
      "part": "noun|verb|adjective|adverb|phrase|other",
      "gender": "der|die|das|none",
      "translations": {
        "he": "Hebrew translation",
        "en": "English translation"
      },
      "category": "Category Name",
      "ipa": "pronunciation (optional)"
    }
  ]
}
```

## Features Demonstrated

✅ **Topics** - Each lesson has multiple topics for organization
✅ **Categories** - Terms grouped by category (Verbs, Nouns, etc.)
✅ **Gender Marking** - Nouns include articles (der/die/das)
✅ **IPA Pronunciation** - Optional phonetic transcription
✅ **Multi-language** - Hebrew + English translations
✅ **Part of Speech** - Proper grammatical classification

## Next Steps

After importing these lessons:
1. View them in the **Lessons Sidebar** (left)
2. See topics displayed as badges under each lesson
3. Click a lesson to view **Material View** with:
   - Color-coded gender articles (🔵 der, 🔴 die, 🟢 das)
   - Terms grouped by category
   - Side-by-side Hebrew and German comparison

Enjoy learning German! 🇩🇪
