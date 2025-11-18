import type { ExtractResult } from '../types/extract-result.js';

/**
 * Extraction Report - voor debugging en quality control
 * Toont originele tekst + alle extracties met metadata
 */
export interface ExtractionReport {
  // Originele input
  originalText: string;
  sourceFile: string;
  textLength: number;

  // Extractie resultaten
  extraction: {
    coreData: {
      projectType?: string;
      budget?: number;
      locatie?: string;
      [key: string]: any;
    };

    wishes: Array<{
      index: number;
      text: string;
      length: number;
    }>;

    emotionalSignals: Array<{
      index: number;
      type: string;
      intensity: number;
      quote: string;
      interpretedIntent?: string;
      followupPrompt?: string;
    }>;
  };

  // Metadata
  meta: {
    confidence: number;
    warnings: string[];
    extractionMethod: 'ai' | 'rules';
    timestamp: string;
  };

  // Statistieken
  stats: {
    totalWishes: number;
    totalSignals: number;
    signalsByType: Record<string, number>;
    textCoverage: {
      // Percentage van originele tekst dat in quotes voorkomt
      quotedTextPercentage: number;
      quotedCharacters: number;
      totalCharacters: number;
    };
  };
}

/**
 * Genereer een extraction report voor quality control
 */
export function generateExtractionReport(
  text: string,
  result: ExtractResult,
  extractionMethod: 'ai' | 'rules' = 'rules'
): ExtractionReport {
  // Calculate quoted text coverage
  const allQuotes = (result.customerExample.emotionalSignals || [])
    .map(s => s.quote)
    .filter((q): q is string => !!q && q.length > 0);

  const quotedCharacters = allQuotes.reduce((sum, quote) => sum + quote.length, 0);
  const totalCharacters = text.length;
  const quotedTextPercentage = totalCharacters > 0
    ? (quotedCharacters / totalCharacters) * 100
    : 0;

  // Count signals by type
  const signalsByType: Record<string, number> = {};
  (result.customerExample.emotionalSignals || []).forEach(signal => {
    signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1;
  });

  const wishes = result.customerExample.wishes || [];
  const emotionalSignals = result.customerExample.emotionalSignals || [];
  const warnings = result.meta.warnings || [];

  return {
    originalText: text,
    sourceFile: result.meta.sourceFile,
    textLength: text.length,

    extraction: {
      coreData: result.customerExample.coreData || {},

      wishes: wishes.map((wish, index) => ({
        index,
        text: wish,
        length: wish.length,
      })),

      emotionalSignals: emotionalSignals.map((signal, index) => ({
        index,
        type: signal.type,
        intensity: signal.intensity,
        quote: signal.quote,
        interpretedIntent: signal.interpretedIntent,
        followupPrompt: signal.followupPrompt,
      })),
    },

    meta: {
      confidence: result.meta.confidence,
      warnings,
      extractionMethod,
      timestamp: new Date().toISOString(),
    },

    stats: {
      totalWishes: wishes.length,
      totalSignals: emotionalSignals.length,
      signalsByType,
      textCoverage: {
        quotedTextPercentage: Math.round(quotedTextPercentage * 100) / 100,
        quotedCharacters,
        totalCharacters,
      },
    },
  };
}

/**
 * Export report als formatted JSON
 */
export function exportReportAsJSON(report: ExtractionReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Genereer een menselijk leesbaar rapport
 */
export function exportReportAsText(report: ExtractionReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('EXTRACTION REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  // Source info
  lines.push(`Source: ${report.sourceFile}`);
  lines.push(`Date: ${report.meta.timestamp}`);
  lines.push(`Method: ${report.meta.extractionMethod.toUpperCase()}`);
  lines.push(`Text length: ${report.textLength.toLocaleString()} characters`);
  lines.push('');

  // Stats
  lines.push('-'.repeat(80));
  lines.push('STATISTICS');
  lines.push('-'.repeat(80));
  lines.push(`Wishes: ${report.stats.totalWishes}`);
  lines.push(`Emotional Signals: ${report.stats.totalSignals}`);
  lines.push(`Confidence: ${(report.meta.confidence * 100).toFixed(0)}%`);
  lines.push(`Text Coverage: ${report.stats.textCoverage.quotedTextPercentage.toFixed(1)}%`);
  lines.push('');

  if (report.stats.totalSignals > 0) {
    lines.push('Signals by type:');
    Object.entries(report.stats.signalsByType).forEach(([type, count]) => {
      lines.push(`  - ${type}: ${count}`);
    });
    lines.push('');
  }

  // Core Data
  lines.push('-'.repeat(80));
  lines.push('CORE DATA');
  lines.push('-'.repeat(80));
  Object.entries(report.extraction.coreData).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });
  lines.push('');

  // Wishes
  lines.push('-'.repeat(80));
  lines.push(`WISHES (${report.stats.totalWishes})`);
  lines.push('-'.repeat(80));
  if (report.extraction.wishes.length === 0) {
    lines.push('(geen wensen geëxtraheerd)');
  } else {
    report.extraction.wishes.forEach(wish => {
      lines.push(`[${wish.index + 1}] ${wish.text}`);
      lines.push('');
    });
  }

  // Signals
  lines.push('-'.repeat(80));
  lines.push(`EMOTIONAL SIGNALS (${report.stats.totalSignals})`);
  lines.push('-'.repeat(80));
  if (report.extraction.emotionalSignals.length === 0) {
    lines.push('(geen signalen gedetecteerd)');
  } else {
    report.extraction.emotionalSignals.forEach(signal => {
      lines.push(`[${signal.index + 1}] ${signal.type.toUpperCase()} (intensity: ${signal.intensity})`);
      lines.push(`Quote: "${signal.quote}"`);
      if (signal.interpretedIntent) {
        lines.push(`Intent: ${signal.interpretedIntent}`);
      }
      if (signal.followupPrompt) {
        lines.push(`Followup: ${signal.followupPrompt}`);
      }
      lines.push('');
    });
  }

  // Warnings
  if (report.meta.warnings.length > 0) {
    lines.push('-'.repeat(80));
    lines.push('WARNINGS');
    lines.push('-'.repeat(80));
    report.meta.warnings.forEach(warning => {
      lines.push(`⚠️  ${warning}`);
    });
    lines.push('');
  }

  // Original text (sample)
  lines.push('-'.repeat(80));
  lines.push('ORIGINAL TEXT (first 500 chars)');
  lines.push('-'.repeat(80));
  lines.push(report.originalText.substring(0, 500));
  if (report.originalText.length > 500) {
    lines.push('...');
    lines.push(`(${report.originalText.length - 500} more characters)`);
  }
  lines.push('');

  lines.push('='.repeat(80));

  return lines.join('\n');
}
