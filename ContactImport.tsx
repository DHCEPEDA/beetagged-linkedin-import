import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';

interface ContactImportProps {
  onImportSuccess?: (count: number) => void;
}

export function ContactImport({ onImportSuccess }: ContactImportProps) {
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      const result = await apiService.importLinkedInCSV(selectedFile);
      
      if (result.success) {
        toast({
          title: "Import successful!",
          description: `${result.count} contacts imported from LinkedIn`,
        });
        
        // Reset form
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify parent component
        onImportSuccess?.(result.count);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import LinkedIn Contacts
        </CardTitle>
        <CardDescription>
          Upload your LinkedIn connections CSV file to import contacts
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="cursor-pointer"
          />
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground truncate">
              {selectedFile.name}
            </span>
            <span className="text-xs text-muted-foreground">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={triggerFileSelect}
            variant="outline"
            disabled={importing}
            className="flex-1"
          >
            {selectedFile ? 'Change File' : 'Select File'}
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className="flex-1"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Export your LinkedIn connections as CSV</p>
          <p>• File should contain name, email, company, position</p>
          <p>• Maximum file size: 10MB</p>
        </div>
      </CardContent>
    </Card>
  );
}