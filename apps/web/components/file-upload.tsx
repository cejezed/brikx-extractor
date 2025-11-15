'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
  },
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={cn(
          'cursor-pointer border-2 border-dashed transition-colors p-12',
          {
            'border-primary bg-primary/5': isDragActive,
            'border-muted-foreground/25 hover:border-primary/50': !isDragActive && !disabled,
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={cn('h-12 w-12 mb-4', {
              'text-primary': isDragActive,
              'text-muted-foreground': !isDragActive,
            })}
          />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop het bestand hier...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Sleep PvE document hierheen of klik om te selecteren
              </p>
              <p className="text-sm text-muted-foreground">
                Ondersteund: PDF, DOCX, TXT (max {formatFileSize(maxSize)})
              </p>
            </>
          )}
        </div>
      </Card>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm font-medium text-destructive">Bestand niet geaccepteerd:</p>
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-2">
              <p className="text-sm text-destructive/80">{file.name}</p>
              <ul className="list-disc list-inside text-xs text-destructive/70">
                {errors.map((e) => (
                  <li key={e.code}>{e.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Selected file */}
      {selectedFile && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleUpload} disabled={disabled}>
                Upload & Analyseer
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClear} disabled={disabled}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
