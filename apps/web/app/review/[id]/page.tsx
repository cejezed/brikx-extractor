'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Check, Upload as UploadIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient, type Project } from '@/lib/api-client';
import type { CustomerExample, PatchEvent } from '@brikx/extractor-core/types';
import { BasisTab } from '@/components/review/basis-tab';
import { WensenTab } from '@/components/review/wensen-tab';
import { SignalenTab } from '@/components/review/signalen-tab';
import { PatchesTab } from '@/components/review/patches-tab';
import { DocumentViewer } from '@/components/document-viewer';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [customerExample, setCustomerExample] = useState<CustomerExample | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setIsSaving] = useState(false);
  const [exporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const { project } = await apiClient.getProject(projectId, {
        includeChunks: true,
        includeSuggestions: true,
      });
      setProject(project);
      setCustomerExample(project.customer_example || null);
      setHasChanges(false);
      setChangedFields([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project laden mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerExampleChange = (updated: CustomerExample) => {
    setCustomerExample(updated);
    setHasChanges(true);
    // Note: In a production app, we'd track specific changed fields here
    // For now, we'll just mark that changes were made
  };

  const handleSave = async () => {
    if (!project || !customerExample || !hasChanges) return;

    try {
      setIsSaving(true);
      setError(null);

      // Build changed fields list (simplified for now)
      const changedFieldsList = changedFields.map((field) => ({
        fieldPath: field,
        oldValue: null, // Would need deep comparison to track this
        newValue: null,
      }));

      await apiClient.updateProject(project.id, customerExample, changedFieldsList);

      // Reload to get updated patches
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!project) return;

    try {
      setIsExporting(true);
      await apiClient.exportToBrikx(project.id);
      await loadProject(); // Reload to get updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export mislukt');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Project laden...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{error || 'Project niet gevonden'}</p>
              <Button variant="outline" asChild>
                <Link href="/">← Terug naar home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review':
        return <Badge variant="warning">Review</Badge>;
      case 'approved':
        return <Badge variant="success">Goedgekeurd</Badge>;
      case 'exported':
        return <Badge variant="success">Geëxporteerd</Badge>;
      case 'error':
        return <Badge variant="destructive">Fout</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{project.filename}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(project.status)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </>
                )}
              </Button>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporteren...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Export naar Brikx
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Document Viewer */}
          <div className="h-[calc(100vh-16rem)]">
            <DocumentViewer
              filename={project.filename}
              originalText={project.original_text || null}
              mimeType={project.mime_type || null}
            />
          </div>

          {/* Right: Extracted Data Panel */}
          <Card className="h-[calc(100vh-16rem)] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Geëxtraheerde Data</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-5rem)]">
              <Tabs defaultValue="basis" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basis">Basis</TabsTrigger>
                  <TabsTrigger value="wensen">Wensen</TabsTrigger>
                  <TabsTrigger value="signalen">Signalen</TabsTrigger>
                  <TabsTrigger value="patches">Patches</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-2">
                  <TabsContent value="basis" className="m-0">
                    {customerExample ? (
                      <BasisTab
                        customerExample={customerExample}
                        onChange={handleCustomerExampleChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data beschikbaar</p>
                    )}
                  </TabsContent>

                  <TabsContent value="wensen" className="m-0">
                    {customerExample ? (
                      <WensenTab
                        customerExample={customerExample}
                        onChange={handleCustomerExampleChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data beschikbaar</p>
                    )}
                  </TabsContent>

                  <TabsContent value="signalen" className="m-0">
                    {customerExample ? (
                      <SignalenTab
                        customerExample={customerExample}
                        onChange={handleCustomerExampleChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen data beschikbaar</p>
                    )}
                  </TabsContent>

                  <TabsContent value="patches" className="m-0">
                    {project && project.patches ? (
                      <PatchesTab patches={project.patches as PatchEvent[]} />
                    ) : (
                      <p className="text-sm text-muted-foreground">Geen patches beschikbaar</p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
