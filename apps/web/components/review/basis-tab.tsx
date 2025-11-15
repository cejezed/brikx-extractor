'use client';

import { useState } from 'react';
import type { CustomerExample } from '@brikx/extractor-core/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BasisTabProps {
  customerExample: CustomerExample;
  onChange: (updated: CustomerExample) => void;
}

export function BasisTab({ customerExample, onChange }: BasisTabProps) {
  const [coreData, setCoreData] = useState(customerExample.coreData || {});

  const handleChange = (field: string, value: any) => {
    const updated = { ...coreData, [field]: value };
    setCoreData(updated);
    onChange({
      ...customerExample,
      coreData: updated,
    });
  };

  const projectTypes = ['nieuwbouw', 'verbouwing', 'renovatie', 'uitbreiding', 'anders'];

  return (
    <div className="space-y-6">
      {/* Project Type */}
      <div className="space-y-2">
        <Label htmlFor="projectType">Project Type</Label>
        <div className="flex flex-wrap gap-2">
          {projectTypes.map((type) => (
            <Badge
              key={type}
              variant={coreData.projectType === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleChange('projectType', type)}
            >
              {type}
            </Badge>
          ))}
        </div>
        {coreData.projectType && !projectTypes.includes(coreData.projectType) && (
          <Badge variant="secondary">{coreData.projectType}</Badge>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">Budget (€)</Label>
        <Input
          id="budget"
          type="number"
          value={coreData.budget || ''}
          onChange={(e) => handleChange('budget', parseInt(e.target.value) || 0)}
          placeholder="250000"
        />
        {coreData.budget && (
          <p className="text-sm text-muted-foreground">
            €{coreData.budget.toLocaleString('nl-NL')}
          </p>
        )}
      </div>

      {/* Locatie */}
      <div className="space-y-2">
        <Label htmlFor="locatie">Locatie</Label>
        <Input
          id="locatie"
          type="text"
          value={coreData.locatie || ''}
          onChange={(e) => handleChange('locatie', e.target.value)}
          placeholder="Amsterdam"
        />
      </div>

      {/* Additional Core Data */}
      {Object.keys(coreData).filter(
        (key) => !['projectType', 'budget', 'locatie'].includes(key)
      ).length > 0 && (
        <div className="space-y-2">
          <Label>Extra velden</Label>
          <div className="bg-muted rounded-lg p-3 text-sm">
            {Object.entries(coreData)
              .filter(([key]) => !['projectType', 'budget', 'locatie'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex justify-between py-1">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
