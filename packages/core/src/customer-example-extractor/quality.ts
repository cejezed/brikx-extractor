// packages/core/src/customer-example-extractor/quality.ts
// Quality scoring and filtering

import type {
  CustomerExampleRecord,
  DirectActionableExample,
  EmotionalSignalExample,
} from '../types/customer-examples.js';

/**
 * Minimum quality threshold for examples
 */
export const QUALITY_THRESHOLD = 0.6;

/**
 * Score a Type A (DIRECT_ACTIONABLE) example
 */
export function scoreDirectActionableExample(example: DirectActionableExample): number {
  let score = 0;

  // Relevance (0-0.3): Has userInput, interpretation, and patches
  if (example.userInput && example.userInput.length > 10) score += 0.1;
  if (example.interpretation && example.interpretation.length > 10) score += 0.1;
  if (example.suggestedPatches && example.suggestedPatches.length > 0) score += 0.1;

  // Specificity (0-0.3): Patches are well-formed and relevant chapters exist
  if (example.suggestedPatches.length > 0) {
    const validPatches = example.suggestedPatches.every(
      (p) => p.chapter && p.delta && p.delta.path && p.delta.operation
    );
    if (validPatches) score += 0.15;
  }
  if (example.relevantChapters && example.relevantChapters.length > 0) score += 0.15;

  // Correctness (0-0.2): Confidence is high
  if (example.confidence >= 0.7) score += 0.2;
  else if (example.confidence >= 0.5) score += 0.1;

  // Bruikbaarheid (0-0.2): UserInput is substantial and not too generic
  if (example.userInput.length > 20 && example.userInput.length < 200) score += 0.1;
  if (example.interpretation.length > 20) score += 0.1;

  return Math.min(score, 1.0);
}

/**
 * Score a Type B (EMOTIONAL_SIGNAL) example
 */
export function scoreEmotionalSignalExample(example: EmotionalSignalExample): number {
  let score = 0;

  // Relevance (0-0.3): Has all required fields
  if (example.userInput && example.userInput.length > 10) score += 0.1;
  if (example.interpretedIntent && example.interpretedIntent.length > 10) score += 0.1;
  if (example.designImplication && example.designImplication.length > 10) score += 0.1;

  // Specificity (0-0.3): Has emotional categories and followup strategies
  if (example.emotionalCategory && example.emotionalCategory.length > 0) score += 0.15;
  if (
    example.followupStrategy &&
    example.followupStrategy.empathetic &&
    example.followupStrategy.clarifying &&
    example.followupStrategy.exploring
  ) {
    score += 0.15;
  }

  // Correctness (0-0.2): Signal type is valid
  const validSignalTypes = [
    'emotion',
    'hesitation',
    'enthusiasm',
    'concern',
    'urgency',
    'uncertainty',
  ];
  if (validSignalTypes.includes(example.signalType)) score += 0.2;

  // Bruikbaarheid (0-0.2): UserInput shows genuine emotion/signal
  if (example.userInput.length > 20 && example.userInput.length < 300) score += 0.1;
  // Check for emotional keywords
  const emotionalKeywords = [
    'bang',
    'zorgen',
    'twijfel',
    'hoop',
    'droom',
    'enthousiast',
    'onzeker',
    'belangrijk',
  ];
  if (emotionalKeywords.some((kw) => example.userInput.toLowerCase().includes(kw))) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Score any example (polymorphic)
 */
export function scoreExample(record: Omit<CustomerExampleRecord, 'quality_score'>): number {
  if (record.example_type === 'DIRECT_ACTIONABLE') {
    return scoreDirectActionableExample(record.example_data as DirectActionableExample);
  } else {
    return scoreEmotionalSignalExample(record.example_data as EmotionalSignalExample);
  }
}

/**
 * Filter examples by quality threshold
 */
export function filterByQuality(
  examples: CustomerExampleRecord[],
  threshold: number = QUALITY_THRESHOLD
): CustomerExampleRecord[] {
  return examples.filter((ex) => ex.quality_score >= threshold);
}

/**
 * Generate automatic tags for an example
 */
export function generateTags(record: CustomerExampleRecord): string[] {
  const tags: string[] = [];

  // Add example type
  tags.push(record.example_type.toLowerCase());

  if (record.example_type === 'DIRECT_ACTIONABLE') {
    const data = record.example_data as DirectActionableExample;

    // Add relevant chapters
    if (data.relevantChapters) {
      tags.push(...data.relevantChapters);
    }

    // Add confidence level
    if (data.confidence >= 0.8) tags.push('high_confidence');
    else if (data.confidence >= 0.6) tags.push('medium_confidence');
    else tags.push('low_confidence');
  } else {
    const data = record.example_data as EmotionalSignalExample;

    // Add signal type
    tags.push(data.signalType);

    // Add emotional categories
    if (data.emotionalCategory) {
      tags.push(...data.emotionalCategory);
    }
  }

  return [...new Set(tags)]; // Remove duplicates
}
