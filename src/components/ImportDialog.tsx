import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Download, AlertCircle, CheckCircle2, FileJson } from 'lucide-react';
import { parseCSV, validateCSVRows, downloadCSVTemplate, CSVRow } from '@/lib/csv-parser';
import { validateLessonJSON, importLessonFromJSON } from '@/lib/import-logic';
import { checkLessonConflict, formatConflictMessage } from '@/lib/conflict-resolver';
import { LessonImportJSON } from '@/types/lesson-import';
import { useImportCSV } from '@/hooks/useImportCSV';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type ImportFormat = 'csv' | 'json';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<ImportFormat>('csv');
  const [csvText, setCsvText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [parsedCSVData, setParsedCSVData] = useState<CSVRow[]>([]);
  const [parsedJSONData, setParsedJSONData] = useState<LessonImportJSON | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const { importCSV } = useImportCSV();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      if (importFormat === 'csv') {
        handleCSVText(text);
      } else {
        handleJSONText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVText = (text: string) => {
    setCsvText(text);
    setImportResult(null);

    const { data, errors: parseErrors } = parseCSV(text);

    if (parseErrors.length > 0) {
      setValidationErrors(parseErrors.map(e => `Row ${e.row}: ${e.message}`));
      setParsedCSVData([]);
      return;
    }

    const validationErrors = validateCSVRows(data);
    setValidationErrors(validationErrors.map(e => `Row ${e.row}: ${e.message}`));
    setParsedCSVData(data);
  };

  const handleJSONText = (text: string) => {
    setJsonText(text);
    setImportResult(null);
    setParsedJSONData(null);
    setValidationErrors([]);

    try {
      const data = JSON.parse(text);
      const validation = validateLessonJSON(data);

      if (!validation.valid) {
        setValidationErrors(validation.errors);
        return;
      }

      setParsedJSONData(data);
    } catch (error) {
      setValidationErrors(['Invalid JSON syntax: ' + (error instanceof Error ? error.message : 'Unknown error')]);
    }
  };

  const handleImport = async () => {
    if (importFormat === 'csv') {
      if (parsedCSVData.length === 0 || validationErrors.length > 0) return;

      setImporting(true);
      const result = await importCSV(parsedCSVData);
      setImportResult(result);
      setImporting(false);

      if (result.success) {
        setTimeout(() => {
          setOpen(false);
          resetState();
        }, 2000);
      }
    } else {
      if (!parsedJSONData || !user || validationErrors.length > 0) return;

      // Check for conflicts BEFORE importing
      const existing = await checkLessonConflict(
        supabase,
        user.id,
        parsedJSONData.lesson.lesson_number
      );

      if (existing) {
        const message = formatConflictMessage(
          parsedJSONData.lesson.lesson_number,
          existing,
          parsedJSONData.lesson.lesson_name,
          parsedJSONData.lesson.topics
        );

        const confirmed = window.confirm(message);
        if (!confirmed) {
          return; // User cancelled
        }
      }

      setImporting(true);
      try {
        const result = await importLessonFromJSON(supabase, user.id, parsedJSONData);
        setImportResult(result);

        if (result.success) {
          toast({
            title: 'Import Successful',
            description: `Imported ${parsedJSONData.terms.length} terms (${result.newTermsCount} new, ${result.reusedTermsCount} reused)`,
          });

          setTimeout(() => {
            setOpen(false);
            resetState();
            // Reload page to refresh lessons list
            window.location.reload();
          }, 1500);
        } else {
          toast({
            title: 'Import Failed',
            description: result.errors?.[0]?.message || 'Unknown error',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    }
  };

  const resetState = () => {
    setCsvText('');
    setJsonText('');
    setParsedCSVData([]);
    setParsedJSONData(null);
    setValidationErrors([]);
    setImportResult(null);
  };

  const handleFormatChange = (format: ImportFormat) => {
    setImportFormat(format);
    resetState();
  };

  const lessonNumber = importFormat === 'csv'
    ? (parsedCSVData.length > 0 ? parsedCSVData[0].Lesson : null)
    : parsedJSONData?.lesson.lesson_number;

  const termCount = importFormat === 'csv'
    ? parsedCSVData.length
    : parsedJSONData?.terms.length || 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Import Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Lesson</DialogTitle>
          <DialogDescription>
            Upload or paste your vocabulary data. Terms will be automatically de-duplicated.
          </DialogDescription>
        </DialogHeader>

        {/* Format Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={importFormat === 'csv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatChange('csv')}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            CSV Format
          </Button>
          <Button
            variant={importFormat === 'json' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFormatChange('json')}
            className="flex-1"
          >
            <FileJson className="h-4 w-4 mr-2" />
            JSON Format
          </Button>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Data</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {importFormat === 'csv' ? (
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              ) : (
                <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <input
                type="file"
                accept={importFormat === 'csv' ? '.csv' : '.json'}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Choose {importFormat.toUpperCase()} File</span>
                </Button>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder={`Paste your ${importFormat.toUpperCase()} data here...`}
              value={importFormat === 'csv' ? csvText : jsonText}
              onChange={(e) => importFormat === 'csv' ? handleCSVText(e.target.value) : handleJSONText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        {/* Format Help */}
        <div className="space-y-4">
          {importFormat === 'csv' ? (
            <Alert>
              <AlertDescription className="text-xs">
                <div className="font-semibold mb-2">📄 CSV Format:</div>
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre">
                  German,Hebrew,English,Italian,Lesson,PartOfSpeech,Gender,Category,Subcategory
                </code>
                <div className="mt-2 space-y-1">
                  <div><strong>Required:</strong> German, Lesson, Category</div>
                  <div><strong>Optional:</strong> translations, PartOfSpeech (noun/verb/adjective/adverb/phrase/other), Gender (der/die/das/none), Subcategory</div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription className="text-xs">
                <div className="font-semibold mb-2">📦 JSON Format:</div>
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre">
{`{
  "lesson": {
    "lesson_number": 1,
    "lesson_name": "Verbs"
  },
  "terms": [
    {
      "german": "sein",
      "part": "verb",
      "gender": "none",
      "translations": { "he": "להיות", "en": "to be" },
      "category": "Verbs"
    }
  ]
}`}
                </code>
              </AlertDescription>
            </Alert>
          )}

          {importFormat === 'csv' && (
            <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li>...and {validationErrors.length - 5} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {((importFormat === 'csv' && parsedCSVData.length > 0) ||
          (importFormat === 'json' && parsedJSONData)) &&
         validationErrors.length === 0 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✓ Found {termCount} terms, Lesson {lessonNumber}
                {importFormat === 'json' && parsedJSONData?.lesson.lesson_name && (
                  <span> - {parsedJSONData.lesson.lesson_name}</span>
                )}
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 font-semibold text-sm">
                Preview (first 5 terms)
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>German</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Hebrew</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importFormat === 'csv'
                    ? parsedCSVData.slice(0, 5).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.German}</TableCell>
                          <TableCell>{row.PartOfSpeech || '-'}</TableCell>
                          <TableCell>{row.Gender || '-'}</TableCell>
                          <TableCell>{row.Hebrew || '-'}</TableCell>
                          <TableCell>{row.English || '-'}</TableCell>
                          <TableCell>{row.Category}</TableCell>
                        </TableRow>
                      ))
                    : parsedJSONData?.terms.slice(0, 5).map((term, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{term.german}</TableCell>
                          <TableCell>{term.part}</TableCell>
                          <TableCell>{term.gender}</TableCell>
                          <TableCell>{term.translations.he || '-'}</TableCell>
                          <TableCell>{term.translations.en || '-'}</TableCell>
                          <TableCell>{term.category}</TableCell>
                        </TableRow>
                      ))
                  }
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <Alert variant={importResult.success ? 'default' : 'destructive'}>
            {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {importResult.success ? (
                <div>
                  <div className="font-semibold mb-2">✓ Successfully imported {termCount} terms</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>{importResult.newTermsCount} new terms created</li>
                    <li>{importResult.reusedTermsCount} existing terms reused</li>
                    <li>Linked to Lesson {importResult.lessonNumber}</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="font-semibold mb-2">Import failed</div>
                  {importResult.errors && (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {importResult.errors.map((error: any, idx: number) => (
                        <li key={idx}>{error.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              (importFormat === 'csv' && (parsedCSVData.length === 0 || validationErrors.length > 0)) ||
              (importFormat === 'json' && (!parsedJSONData || validationErrors.length > 0)) ||
              importing ||
              importResult?.success
            }
          >
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
