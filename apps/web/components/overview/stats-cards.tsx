'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Euro, Heart, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalProjects: number;
    totalBudget: number;
    totalWishes: number;
    totalConcerns: number;
    projectsByStatus: Record<string, number>;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totaal Projecten</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            {stats.projectsByStatus?.review || 0} in review
          </p>
        </CardContent>
      </Card>

      {/* Total Budget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totaal Budget</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
          <p className="text-xs text-muted-foreground">
            Gemiddeld {formatCurrency(stats.totalProjects > 0 ? stats.totalBudget / stats.totalProjects : 0)} per project
          </p>
        </CardContent>
      </Card>

      {/* Total Wishes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totaal Wensen</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWishes}</div>
          <p className="text-xs text-muted-foreground">
            Gemiddeld {(stats.totalProjects > 0 ? stats.totalWishes / stats.totalProjects : 0).toFixed(1)} per project
          </p>
        </CardContent>
      </Card>

      {/* Total Concerns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totaal Zorgen</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.totalConcerns}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalProjects > 0 ? ((stats.totalConcerns / stats.totalProjects) * 100).toFixed(0) : 0}% van projecten
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
