'use client';

import { useState } from 'react';
import type { CustomerExample, ClientSignal, ClientSignalType } from '@brikx/extractor-core/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle, Sparkles, HelpCircle, Pause, Zap } from 'lucide-react';

interface SignalenTabProps {
  customerExample: CustomerExample;
  onChange: (updated: CustomerExample) => void;
}

const signalIcons: Record<ClientSignalType, any> = {
  emotion: Sparkles,
  concern: AlertCircle,
  enthusiasm: Sparkles,
  uncertainty: HelpCircle,
  hesitation: Pause,
  urgency: Zap,
};

const signalColors: Record<ClientSignalType, string> = {
  emotion: 'text-purple-600',
  concern: 'text-amber-600',
  enthusiasm: 'text-green-600',
  uncertainty: 'text-blue-600',
  hesitation: 'text-gray-600',
  urgency: 'text-red-600',
};

const signalLabels: Record<ClientSignalType, string> = {
  emotion: 'Emotie',
  concern: 'Zorg',
  enthusiasm: 'Enthousiasme',
  uncertainty: 'Onzekerheid',
  hesitation: 'Aarzeling',
  urgency: 'Urgentie',
};

export function SignalenTab({ customerExample, onChange }: SignalenTabProps) {
  const signals = customerExample.emotionalSignals || [];

  const handleDelete = (index: number) => {
    const updated = signals.filter((_, i) => i !== index);
    onChange({
      ...customerExample,
      emotionalSignals: updated,
    });
  };

  const getIntensityLabel = (intensity: number): string => {
    if (intensity >= 0.75) return 'Hoog';
    if (intensity >= 0.5) return 'Gemiddeld';
    if (intensity >= 0.25) return 'Laag';
    return 'Zeer laag';
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.75) return 'bg-red-500';
    if (intensity >= 0.5) return 'bg-amber-500';
    if (intensity >= 0.25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // Group signals by type
  const signalsByType = signals.reduce((acc, signal) => {
    if (!acc[signal.type]) {
      acc[signal.type] = [];
    }
    acc[signal.type].push(signal);
    return acc;
  }, {} as Record<ClientSignalType, ClientSignal[]>);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{signals.length}</p>
              <p className="text-sm text-muted-foreground">Totaal signalen</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">
                {signals.filter((s) => s.type === 'concern').length}
              </p>
              <p className="text-sm text-muted-foreground">Zorgen</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals List */}
      {signals.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nog geen emotionele signalen gedetecteerd</p>
        </div>
      )}

      {signals.map((signal, index) => {
        const Icon = signalIcons[signal.type];
        return (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${signalColors[signal.type]}`} />
                  <CardTitle className="text-base">{signalLabels[signal.type]}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {getIntensityLabel(signal.intensity)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quote */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Citaat:</p>
                <p className="text-sm italic border-l-2 border-muted pl-3">"{signal.quote}"</p>
              </div>

              {/* Intensity Bar */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Intensiteit:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getIntensityColor(signal.intensity)}`}
                      style={{ width: `${signal.intensity * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(signal.intensity * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Interpreted Intent */}
              {signal.interpretedIntent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interpretatie:</p>
                  <p className="text-sm">{signal.interpretedIntent}</p>
                </div>
              )}

              {/* Followup Prompt */}
              {signal.followupPrompt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Aanbevolen reactie:
                  </p>
                  <p className="text-sm bg-blue-50 p-2 rounded">{signal.followupPrompt}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Signals by Type Summary */}
      {Object.keys(signalsByType).length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Verdeling per type:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(signalsByType).map(([type, typeSignals]) => {
              const Icon = signalIcons[type as ClientSignalType];
              return (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {signalLabels[type as ClientSignalType]}: {typeSignals.length}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
