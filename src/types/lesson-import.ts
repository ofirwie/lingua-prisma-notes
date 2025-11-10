export interface LessonImportJSON {
  lesson: LessonMetadata;
  terms: TermData[];
  sentences?: SentenceData[];
  notes?: string;
}

export interface LessonMetadata {
  lesson_number: number;
  lesson_name?: string;
  description?: string;
  topics?: string[]; // e.g., ["Tenses", "Basic Questions", "Greetings"]
}

export interface TermData {
  german: string;
  part: PartOfSpeech;
  gender: Gender;
  translations: {
    he?: string;
    en?: string;
    it?: string;
    es?: string;
    fr?: string;
  };
  category: string;
  subcategory?: string;
  ipa?: string;
  audio_url?: string;
}

export interface SentenceData {
  german: string;
  he?: string;
  en?: string;
  it?: string;
  es?: string;
  fr?: string;
}

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
export type Gender = 'der' | 'die' | 'das' | 'none';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  lessonNumber?: number;
  newTermsCount?: number;
  reusedTermsCount?: number;
  errors?: Array<{ message: string }>;
}
