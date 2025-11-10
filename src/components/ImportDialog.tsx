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
import { Upload, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCSV, validateCSVRows, downloadCSVTemplate, CSVRow } from '@/lib/csv-parser';
import { useImportCSV } from '@/hooks/useImportCSV';

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const { importCSV, importing } = useImportCSV();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleCSVText = (text: string) => {
    setCsvText(text);
    setImportResult(null);
    
    const { data, errors: parseErrors } = parseCSV(text);
    
    if (parseErrors.length > 0) {
      setValidationErrors(parseErrors);
      setParsedData([]);
      return;
    }

    const validationErrors = validateCSVRows(data);
    setValidationErrors(validationErrors);
    setParsedData(data);
  };

  const handleImport = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) return;

    const result = await importCSV(parsedData);
    setImportResult(result);
    
    if (result.success) {
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 2000);
    }
  };

  const resetState = () => {
    setCsvText('');
    setParsedData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  const lessonNumber = parsedData.length > 0 ? parsedData[0].Lesson : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          ייבא שיעור
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ייבא שיעור מקובץ CSV</DialogTitle>
          <DialogDescription>
            העלה או הדבק את נתוני אוצר המילים שלך. מילים כפולות יוסרו אוטומטית.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">העלה קובץ CSV</TabsTrigger>
            <TabsTrigger value="paste">הדבק CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span>בחר קובץ CSV</span>
                </Button>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="הדבק את נתוני ה-CSV כאן..."
              value={csvText}
              onChange={(e) => handleCSVText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-2">📄 פורמט CSV:</div>
              <code className="block bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre">
                German,Hebrew,English,Italian,Lesson,PartOfSpeech,Gender,Category,Subcategory
              </code>
              <div className="mt-2 space-y-1">
                <div><strong>חובה:</strong> German, Lesson, Category</div>
                <div><strong>אופציונלי:</strong> תרגומים, PartOfSpeech (noun/verb/adjective/adverb/phrase/other), Gender (der/die/das/none), Subcategory</div>
              </div>
            </AlertDescription>
          </Alert>

          <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
            <Download className="h-4 w-4 mr-2" />
            הורד תבנית
          </Button>
        </div>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">שגיאות אימות:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>שורה {error.row}: {error.message}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li>...ועוד {validationErrors.length - 5} שגיאות נוספות</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {parsedData.length > 0 && validationErrors.length === 0 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✓ זוהו {parsedData.length} מונחים, שיעור {lessonNumber}
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 font-semibold text-sm">
                תצוגה מקדימה (5 שורות ראשונות)
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>German</TableHead>
                    <TableHead>Hebrew</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.German}</TableCell>
                      <TableCell>{row.Hebrew || '-'}</TableCell>
                      <TableCell>{row.English || '-'}</TableCell>
                      <TableCell>{row.Lesson}</TableCell>
                      <TableCell>{row.Category}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {importResult && (
          <Alert variant={importResult.success ? 'default' : 'destructive'}>
            {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {importResult.success ? (
                <div>
                  <div className="font-semibold mb-2">✓ יובאו בהצלחה {parsedData.length} מונחים</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>{importResult.newTermsCount} מונחים חדשים נוצרו</li>
                    <li>{importResult.reusedTermsCount} מונחים קיימים שוחזרו</li>
                    <li>קושר לשיעור {importResult.lessonNumber}</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="font-semibold mb-2">הייבוא הושלם עם שגיאות:</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>יובאו בהצלחה: {parsedData.length - (importResult.errors?.length || 0)} מונחים</li>
                    <li>נכשלו: {importResult.errors?.length || 0} מונחים</li>
                  </ul>
                  {importResult.errors && (
                    <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                      {importResult.errors.slice(0, 3).map((error: any, idx: number) => (
                        <li key={idx}>שורה {error.row}: {error.message}</li>
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
            ביטול
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || validationErrors.length > 0 || importing || importResult?.success}
          >
            {importing ? 'מייבא...' : 'ייבא'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
