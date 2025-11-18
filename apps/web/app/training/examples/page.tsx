'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Sparkles, Filter, TrendingUp } from 'lucide-react';
import { apiClient, type TrainingExampleStats } from '@/lib/api-client';
import type { CustomerExampleRecord, ExampleType, ExampleStatus } from '@brikx/extractor-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TrainingExamplesPage() {
  const [examples, setExamples] = useState<CustomerExampleRecord[]>([]);
  const [stats, setStats] = useState<TrainingExampleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<ExampleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ExampleStatus | 'all'>('all');
  const [minQuality, setMinQuality] = useState<number>(0);

  useEffect(() => {
    loadExamples();
  }, [typeFilter, statusFilter, minQuality]);

  const loadExamples = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      if (typeFilter !== 'all') filters.example_type = typeFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (minQuality > 0) filters.min_quality = minQuality;

      const data = await apiClient.listTrainingExamples(undefined, filters);
      setExamples(data.examples);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load examples');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (exampleId: string, status: ExampleStatus) => {
    try {
      await apiClient.updateTrainingExampleStatus(exampleId, status);
      // Reload examples
      await loadExamples();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const getTypeColor = (type: ExampleType) => {
    return type === 'DIRECT_ACTIONABLE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const getStatusColor = (status: ExampleStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 font-semibold';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/overview" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar Overzicht
          </Link>

          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Training Examples voor Jules
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Review en beheer training data voor de Jules LLM
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totaal</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.byType.DIRECT_ACTIONABLE} Type A, {stats.byType.EMOTIONAL_SIGNAL} Type B
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goedgekeurd</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.byStatus.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.byStatus.approved / stats.total) * 100) : 0}% van totaal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                <Filter className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Wacht op review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gem. Kwaliteit</CardTitle>
                <Sparkles className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.averageQuality * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Gemiddelde score
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle types</SelectItem>
                    <SelectItem value="DIRECT_ACTIONABLE">Type A (Direct Actionable)</SelectItem>
                    <SelectItem value="EMOTIONAL_SIGNAL">Type B (Emotional Signal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Min. Kwaliteit</label>
                <Select value={minQuality.toString()} onValueChange={(value) => setMinQuality(parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Alle (&gt;= 0%)</SelectItem>
                    <SelectItem value="0.6">&gt;= 60%</SelectItem>
                    <SelectItem value="0.7">&gt;= 70%</SelectItem>
                    <SelectItem value="0.8">&gt;= 80%</SelectItem>
                    <SelectItem value="0.9">&gt;= 90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples Table */}
        <Card>
          <CardHeader>
            <CardTitle>Training Examples ({examples.length})</CardTitle>
            <CardDescription>
              Klik op een voorbeeld om de details te bekijken en goed te keuren
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Laden...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={loadExamples} className="mt-4">Opnieuw proberen</Button>
              </div>
            ) : examples.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Geen voorbeelden gevonden</p>
                <p className="text-sm text-gray-500 mt-2">Pas de filters aan of genereer nieuwe examples</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User Input</TableHead>
                    <TableHead className="text-center">Kwaliteit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examples.map((example) => (
                    <TableRow key={example.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Badge className={getTypeColor(example.example_type)}>
                          {example.example_type === 'DIRECT_ACTIONABLE' ? 'Type A' : 'Type B'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Link href={`/training/examples/${example.id}`} className="hover:underline">
                          <p className="truncate">
                            {(example.example_data as any).userInput || 'No input'}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getQualityColor(example.quality_score)}>
                          {(example.quality_score * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(example.status)}>
                          {example.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {example.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {example.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{example.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {example.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(example.id, 'approved');
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(example.id, 'rejected');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Link href={`/training/examples/${example.id}`}>
                            <Button size="sm" variant="ghost">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
