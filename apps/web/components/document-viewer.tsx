'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FileType } from 'lucide-react';

interface DocumentViewerProps {
  filename: string;
  originalText: string | null;
  mimeType?: string | null;
}

export function DocumentViewer({ filename, originalText, mimeType }: DocumentViewerProps) {
  // Determine file type icon
  const getFileIcon = () => {
    if (mimeType?.includes('pdf')) {
      return <FileType className="h-5 w-5 text-red-500" />;
    }
    if (mimeType?.includes('word') || mimeType?.includes('docx')) {
      return <FileType className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType?.includes('excel') || mimeType?.includes('xlsx')) {
      return <FileType className="h-5 w-5 text-green-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getFileIcon()}
          <span className="truncate">{filename}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {originalText ? (
          <div className="prose prose-sm max-w-none">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                {originalText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Originele document tekst is niet beschikbaar</p>
              <p className="text-xs mt-1">
                {mimeType?.includes('pdf') && 'PDF preview wordt in een toekomstige versie toegevoegd'}
                {mimeType?.includes('docx') && 'DOCX preview wordt in een toekomstige versie toegevoegd'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
