'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { apiClient, type Project } from '@/lib/api-client';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const handleUpload = async (file: File) => {
    try {
      setStatus('uploading');
      setError(null);
      setProgress(0);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload file
      const response = await apiClient.uploadDocument(file);

      clearInterval(uploadInterval);
      setProgress(100);

      if (response.project.status === 'error') {
        setStatus('error');
        setError('Extractie mislukt. Probeer het opnieuw.');
        return;
      }

      // If processing, poll for completion
      if (response.project.status === 'processing') {
        setStatus('processing');
        await pollProjectStatus(response.project.id);
      } else if (response.project.status === 'review') {
        setProject(response.project);
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload mislukt');
    }
  };

  const pollProjectStatus = async (projectId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setStatus('error');
        setError('Extractie duurt te lang. Bekijk het project in het overzicht.');
        return;
      }

      attempts++;

      try {
        const { project } = await apiClient.getProject(projectId);

        if (project.status === 'review' || project.status === 'approved') {
          setProject(project);
          setStatus('success');
        } else if (project.status === 'error') {
          setStatus('error');
          setError('Extractie mislukt');
        } else {
          // Still processing, poll again
          setTimeout(poll, 1000);
        }
      } catch (err) {
        setStatus('error');
        setError('Status check mislukt');
      }
    };

    await poll();
  };

  const handleGoToReview = () => {
    if (project) {
      router.push(`/review/${project.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">PvE Upload</h1>
          <p className="text-lg text-gray-600 mt-2">
            Upload een Programma van Eisen document voor automatische extractie
          </p>
        </div>

        {/* Upload Area */}
        <div className="space-y-6">
          <FileUpload
            onUpload={handleUpload}
            disabled={status === 'uploading' || status === 'processing'}
          />

          {/* Status Cards */}
          {status === 'uploading' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </CardTitle>
                <CardDescription>Bestand wordt geüpload naar de server</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
              </CardContent>
            </Card>
          )}

          {status === 'processing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Bezig met extractie...
                </CardTitle>
                <CardDescription>
                  Document wordt geanalyseerd en data wordt geëxtraheerd
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-pulse">⚡</div>
                  <span>Parsing document, extracting budget, wishes, signals...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {status === 'success' && project && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Extractie Succesvol!
                </CardTitle>
                <CardDescription>
                  Document is geanalyseerd en klaar voor review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Project Type:</span>
                    <p className="font-medium">{project.customer_example?.coreData?.projectType || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <p className="font-medium">
                      {project.customer_example?.coreData?.budget
                        ? `€${project.customer_example.coreData.budget.toLocaleString('nl-NL')}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Locatie:</span>
                    <p className="font-medium">{project.customer_example?.coreData?.locatie || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <p className="font-medium">{((project.confidence || 0) * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {project.customer_example?.wishes?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Wensen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {project.customer_example?.emotionalSignals?.filter((s) => s.type === 'concern')
                        .length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Zorgen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {project.customer_example?.emotionalSignals?.filter(
                        (s) => s.type === 'enthusiasm'
                      ).length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Enthousiasme</p>
                  </div>
                </div>

                <Button onClick={handleGoToReview} className="w-full" size="lg">
                  Ga naar Review →
                </Button>
              </CardContent>
            </Card>
          )}

          {status === 'error' && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Upload Mislukt
                </CardTitle>
                <CardDescription>{error || 'Er is iets misgegaan'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setStatus('idle')}>
                  Probeer opnieuw
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        {status === 'idle' && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Hoe werkt het?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </span>
                <p>Upload een PvE document (PDF, DOCX, TXT, XLSX of XLS)</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </span>
                <p>Automatische extractie van project data, wensen en emotionele signalen</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </span>
                <p>Review en bewerk de geëxtraheerde data</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </span>
                <p>Export naar Brikx als Brikx-compatible patches</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
