'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import type { Project } from '@/lib/api-client';

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      case 'processing':
        return <Badge variant="secondary">Verwerken...</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get unique statuses for filter
  const statuses = Array.from(new Set(projects.map((p) => p.status)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op bestandsnaam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Alle ({projects.length})
          </Button>
          {statuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status} ({projects.filter((p) => p.status === status).length})
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bestand</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Wensen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Geen projecten gevonden met deze filters'
                    : 'Nog geen projecten. Upload je eerste PvE document!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/review/${project.id}`)}
                >
                  <TableCell className="font-medium">{project.filename}</TableCell>
                  <TableCell>
                    {project.customer_example?.coreData?.projectType ? (
                      <Badge variant="outline">
                        {project.customer_example.coreData.projectType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(project.customer_example?.coreData?.budget)}
                  </TableCell>
                  <TableCell>{project.customer_example?.wishes?.length || 0}</TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{formatDate(project.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/review/${project.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredProjects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filteredProjects.length} van {projects.length} projecten
        </p>
      )}
    </div>
  );
}
