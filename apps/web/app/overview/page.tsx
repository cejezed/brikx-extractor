'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { apiClient, type Project } from '@/lib/api-client';
import { StatsCards } from '@/components/overview/stats-cards';
import { ProjectsTable } from '@/components/overview/projects-table';

interface Stats {
  totalProjects: number;
  totalBudget: number;
  totalWishes: number;
  totalConcerns: number;
  projectsByStatus: Record<string, number>;
}

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load projects and stats in parallel
      const [projectsResponse, statsResponse] = await Promise.all([
        apiClient.getProjects(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/stats`)
          .then((res) => res.json()),
      ]);

      setProjects(projectsResponse.projects);
      setStats(statsResponse.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Projecten laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Opnieuw proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">PvE Analyzer</h1>
              <p className="text-muted-foreground mt-1">
                Overzicht van alle geanalyseerde documenten
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/training/examples">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Training Examples
                </Link>
              </Button>
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ververs
              </Button>
              <Button asChild>
                <Link href="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          {stats && <StatsCards stats={stats} />}

          {/* Projects Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Projecten</h2>
            <ProjectsTable projects={projects} />
          </div>
        </div>
      </div>
    </div>
  );
}
