'use client';

import type { PatchEvent } from '@brikx/extractor-core/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, Plus, Minus, Edit } from 'lucide-react';

interface PatchesTabProps {
  patches: PatchEvent[];
}

const chapterLabels: Record<string, string> = {
  basis: 'Basis',
  ruimtes: 'Ruimtes',
  wensen: 'Wensen',
  budget: 'Budget',
  techniek: 'Techniek',
  duurzaam: 'Duurzaamheid',
  risico: "Risico's",
};

const operationIcons: Record<string, any> = {
  set: Edit,
  append: Plus,
  remove: Minus,
};

const operationColors: Record<string, string> = {
  set: 'text-blue-600',
  append: 'text-green-600',
  remove: 'text-red-600',
};

const operationLabels: Record<string, string> = {
  set: 'Wijzig',
  append: 'Voeg toe',
  remove: 'Verwijder',
};

export function PatchesTab({ patches }: PatchesTabProps) {
  // Group patches by chapter
  const patchesByChapter = patches.reduce((acc, patch) => {
    if (!acc[patch.chapter]) {
      acc[patch.chapter] = [];
    }
    acc[patch.chapter].push(patch);
    return acc;
  }, {} as Record<string, PatchEvent[]>);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-sm">
                {patches.length} {patches.length === 1 ? 'patch' : 'patches'} gegenereerd
              </p>
              <p className="text-xs text-muted-foreground">
                Deze patches worden naar Brikx gestuurd bij export
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No patches */}
      {patches.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nog geen patches gegenereerd</p>
        </div>
      )}

      {/* Patches by Chapter */}
      {Object.entries(patchesByChapter).map(([chapter, chapterPatches]) => (
        <div key={chapter} className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{chapterLabels[chapter] || chapter}</Badge>
            <span className="text-xs text-muted-foreground">
              {chapterPatches.length} {chapterPatches.length === 1 ? 'patch' : 'patches'}
            </span>
          </div>

          {chapterPatches.map((patch, index) => {
            const Icon = operationIcons[patch.delta.operation] || Edit;
            return (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${operationColors[patch.delta.operation]}`} />
                    <CardTitle className="text-sm">
                      {operationLabels[patch.delta.operation]} - {patch.delta.path}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Operatie:</span>
                        <Badge variant="outline" className="ml-2">
                          {patch.delta.operation}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pad:</span>
                        <code className="ml-2 bg-muted px-1 py-0.5 rounded text-xs">
                          {patch.delta.path}
                        </code>
                      </div>
                    </div>

                    {patch.delta.value !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Waarde:</p>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {formatValue(patch.delta.value)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {/* Info Box */}
      <Card className="bg-muted border-muted">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Wat zijn patches?</strong> Patches zijn gestructureerde wijzigingen die naar
            Brikx worden gestuurd. Ze beschrijven exact welke data wordt toegevoegd, gewijzigd of
            verwijderd. Elke wijziging die je maakt in de tabs hierboven genereert automatisch
            nieuwe patches via de Single Source of Truth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
