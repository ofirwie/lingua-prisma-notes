import Papa from 'papaparse';

export interface CSVRow {
  German: string;
  Hebrew?: string;
  English?: string;
  Italian?: string;
  Lesson: string;
  PartOfSpeech?: string;
  Gender?: string;
  Category: string;
  Subcategory?: string;
}

export interface ValidationError {
  row: number;
  message: string;
}

const VALID_PARTS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];
const VALID_GENDERS = ['der', 'die', 'das', 'none'];

export function parseCSV(text: string): { data: CSVRow[]; errors: ValidationError[] } {
  // Remove UTF-8 BOM if present
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  
  const parseResult = Papa.parse<CSVRow>(cleanText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  return {
    data: parseResult.data,
    errors: parseResult.errors.map((err, idx) => ({
      row: err.row || idx + 1,
      message: err.message,
    })),
  };
}

export function validateCSVRows(rows: CSVRow[]): ValidationError[] {
  const errors: ValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because index starts at 0 and we have header row

    // Required: German
    if (!row.German || row.German.trim() === '') {
      errors.push({ row: rowNum, message: "Missing required field 'German'" });
    }

    // Required: Lesson (must be integer)
    if (!row.Lesson || row.Lesson.trim() === '') {
      errors.push({ row: rowNum, message: "Missing required field 'Lesson'" });
    } else {
      const lessonNum = parseInt(row.Lesson);
      if (isNaN(lessonNum) || lessonNum < 1) {
        errors.push({ row: rowNum, message: "Invalid lesson number (must be a positive integer)" });
      }
    }

    // Required: Category
    if (!row.Category || row.Category.trim() === '') {
      errors.push({ row: rowNum, message: "Missing required field 'Category'" });
    }

    // Optional: PartOfSpeech validation
    if (row.PartOfSpeech && row.PartOfSpeech.trim() !== '') {
      const part = row.PartOfSpeech.toLowerCase().trim();
      if (!VALID_PARTS.includes(part)) {
        errors.push({
          row: rowNum,
          message: `Invalid PartOfSpeech '${row.PartOfSpeech}'. Must be one of: ${VALID_PARTS.join(', ')}`,
        });
      }
    }

    // Optional: Gender validation
    if (row.Gender && row.Gender.trim() !== '') {
      const gender = row.Gender.toLowerCase().trim();
      if (!VALID_GENDERS.includes(gender)) {
        errors.push({
          row: rowNum,
          message: `Invalid Gender '${row.Gender}'. Must be one of: ${VALID_GENDERS.join(', ')}`,
        });
      }
    }
  });

  return errors;
}

export function generateCSVTemplate(): string {
  const headers = ['German', 'Hebrew', 'English', 'Italian', 'Lesson', 'PartOfSpeech', 'Gender', 'Category', 'Subcategory'];
  const examples = [
    ['ich bin', 'אני', 'I am', 'io sono', '1', 'verb', 'none', 'Verbs', 'sein'],
    ['Tisch', 'שולחן', 'table', 'tavolo', '1', 'noun', 'der', 'Nouns', 'Furniture'],
    ['schön', 'יפה', 'beautiful', 'bello', '1', 'adjective', 'none', 'Adjectives', ''],
  ];

  return Papa.unparse({
    fields: headers,
    data: examples,
  });
}

export function downloadCSVTemplate() {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'deutsche-lernen-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
