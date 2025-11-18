'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X, Sparkles, Tag, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type {
  CustomerExampleRecord,
  DirectActionableExample,
  EmotionalSignalExample,
  PatchEvent,
} from '@brikx/extractor-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function ExampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [example, setExample] = useState<CustomerExampleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    params.then((p) => setExampleId(p.id));
  }, [params]);

  useEffect(() => {
    if (exampleId) {
      loadExample();
    }
  }, [exampleId]);

  const loadExample = async () => {
    if (!exampleId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getTrainingExample(exampleId);
      setExample(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load example');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!example) return;

    try {
      setUpdating(true);
      await apiClient.updateTrainingExampleStatus(example.id, status, reviewNotes || undefined);
      // Reload example
      await loadExample();
      setReviewNotes('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !example) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error || 'Example not found'}</p>
                <Link href="/training/examples">
                  <Button className="mt-4">Terug naar overzicht</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isDirectActionable = example.example_type === 'DIRECT_ACTIONABLE';
  const exampleData = example.example_data as DirectActionableExample | EmotionalSignalExample;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/training/examples"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Training Examples
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isDirectActionable ? 'Type A: Direct Actionable' : 'Type B: Emotional Signal'}
                </h1>
                <p className="text-gray-600 mt-1">Training Example Detail</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={example.status === 'approved' ? 'bg-green-100 text-green-800' : example.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                {example.status}
              </Badge>
              <Badge className={isDirectActionable ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                {isDirectActionable ? 'Type A' : 'Type B'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Kwaliteitsscore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-purple-600">
                {(example.quality_score * 100).toFixed(0)}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      example.quality_score >= 0.8
                        ? 'bg-green-500'
                        : example.quality_score >= 0.6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${example.quality_score * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {example.quality_score >= 0.8
                    ? 'Uitstekende kwaliteit'
                    : example.quality_score >= 0.6
                    ? 'Goede kwaliteit'
                    : 'Lage kwaliteit - review aanbevolen'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Input</CardTitle>
            <CardDescription>Originele tekst uit PvE document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{exampleData.userInput}</p>
            </div>
          </CardContent>
        </Card>

        {/* Type A Specific Fields */}
        {isDirectActionable && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Interpretatie</CardTitle>
                <CardDescription>Wat bedoelt de klant?</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{(exampleData as DirectActionableExample).interpretation}</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Suggested Patches</CardTitle>
                <CardDescription>Patches die deze wens vervullen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(exampleData as DirectActionableExample).suggestedPatches.map((patch: PatchEvent, i: number) => (
                    <div key={i} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-blue-600 text-white">{patch.chapter}</Badge>
                        <div className="flex-1">
                          <p className="text-sm font-mono text-gray-700">
                            <span className="text-blue-600">{patch.delta.operation}</span>{' '}
                            <span className="font-semibold">{patch.delta.path}</span>
                          </p>
                          {patch.delta.value !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">
                              Value: <span className="font-mono">{JSON.stringify(patch.delta.value)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Relevante Hoofdstukken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(exampleData as DirectActionableExample).relevantChapters.map((chapter) => (
                    <Badge key={chapter} variant="outline">
                      {chapter}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {((exampleData as DirectActionableExample).confidence * 100).toFixed(0)}%
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${(exampleData as DirectActionableExample).confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Type B Specific Fields */}
        {!isDirectActionable && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Signal Type & Emotional Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-purple-600 text-white text-lg px-4 py-2">
                    {(exampleData as EmotionalSignalExample).signalType}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(exampleData as EmotionalSignalExample).emotionalCategory.map((category) => (
                    <Badge key={category} variant="outline" className="text-purple-700">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Interpreted Intent</CardTitle>
                <CardDescription>Wat bedoelt de klant echt?</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{(exampleData as EmotionalSignalExample).interpretedIntent}</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Design Implication</CardTitle>
                <CardDescription>Wat betekent dit voor het ontwerp?</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{(exampleData as EmotionalSignalExample).designImplication}</p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Followup Strategy</CardTitle>
                <CardDescription>Hoe moet Jules reageren?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Empathetic Response</h4>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-gray-900">{(exampleData as EmotionalSignalExample).followupStrategy.empathetic}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Clarifying Question</h4>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-gray-900">{(exampleData as EmotionalSignalExample).followupStrategy.clarifying}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-purple-700 mb-2">Exploring Question</h4>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-gray-900">{(exampleData as EmotionalSignalExample).followupStrategy.exploring}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tags */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {example.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {example.tags.length === 0 && (
                <p className="text-gray-500 text-sm">Geen tags</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Actions */}
        {example.status === 'pending' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review & Approve</CardTitle>
              <CardDescription>
                Keur dit voorbeeld goed of af voor training van Jules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (optioneel)
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Notities over dit voorbeeld..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {updating ? 'Bezig...' : 'Goedkeuren'}
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {updating ? 'Bezig...' : 'Afkeuren'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Already reviewed */}
        {example.status !== 'pending' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Review Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                example.status === 'approved'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {example.status === 'approved' ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      example.status === 'approved' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {example.status === 'approved' ? 'Goedgekeurd' : 'Afgekeurd'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dit voorbeeld is al gereviewd
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Example ID</p>
                <p className="font-mono text-xs">{example.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Project ID</p>
                <p className="font-mono text-xs">{example.project_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Extraction Batch</p>
                <p className="font-mono text-xs">{example.extraction_batch}</p>
              </div>
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="text-xs">{new Date(example.created_at).toLocaleString('nl-NL')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
