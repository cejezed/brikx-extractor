// Main API for @brikx/extractor-core
import { parseFile } from './parsers/index.js';
import { extractCoreData } from './normalize/normalize-core.js';
import { extractWishes } from './normalize/extract-wishes.js';
import { extractSignals } from './signals/extract-signals.js';
import { customerExampleToPatches } from './toPatches/toPatches.js';
import { extractWithOpenAI, isOpenAIConfigured } from './ai/openai-extractor.js';
import type { ExtractResult } from './types/extract-result.js';
import type { CustomerExample } from './types/customer-example.js';

/**
 * Main extraction function - processes a file and returns structured customer data
 *
 * @param inputPath - Path to the input file (.txt, .docx, or .pdf)
 * @returns ExtractResult containing customer example, patches, and metadata
 */
export async function extractFromFile(inputPath: string): Promise<ExtractResult> {
  // 1. Parse the file
  const raw = await parseFile(inputPath);

  // 2. Try AI extraction first if configured
  let example: CustomerExample;

  if (isOpenAIConfigured()) {
    try {
      console.log('[Extractor] Using AI-powered extraction (OpenAI)');
      example = await extractWithOpenAI(raw.text);
    } catch (error) {
      console.warn('[Extractor] AI extraction failed, falling back to rule-based:', error);
      example = extractWithRules(raw);
    }
  } else {
    console.log('[Extractor] Using rule-based extraction (no AI configured)');
    example = extractWithRules(raw);
  }

  // 6. Convert to patches
  const patches = customerExampleToPatches(example);

  // 7. Calculate confidence
  const confidence = calculateConfidence(example);

  // 8. Generate warnings
  const warnings = generateWarnings(example);

  return {
    customerExample: example,
    patches,
    meta: {
      sourceFile: raw.sourceFile,
      confidence,
      warnings,
    },
  };
}

/**
 * Extract from raw text (no file parsing needed)
 *
 * @param text - Raw text content
 * @param sourceLabel - Optional label for the source (e.g., "Pasted Text")
 * @returns ExtractResult containing customer example, patches, and metadata
 */
export async function extractFromText(text: string, sourceLabel: string = 'Pasted Text'): Promise<ExtractResult> {
  // Try AI extraction first if configured
  let example: CustomerExample;

  if (isOpenAIConfigured()) {
    try {
      console.log('[Extractor] Using AI-powered extraction (OpenAI)');
      example = await extractWithOpenAI(text);
    } catch (error) {
      console.warn('[Extractor] AI extraction failed, falling back to rule-based:', error);
      const raw = { sourceFile: sourceLabel, text };
      example = extractWithRules(raw);
    }
  } else {
    console.log('[Extractor] Using rule-based extraction (no AI configured)');
    const raw = { sourceFile: sourceLabel, text };
    example = extractWithRules(raw);
  }

  // Convert to patches
  const patches = customerExampleToPatches(example);

  // Calculate confidence
  const confidence = calculateConfidence(example);

  // Generate warnings
  const warnings = generateWarnings(example);

  return {
    customerExample: example,
    patches,
    meta: {
      sourceFile: sourceLabel,
      confidence,
      warnings,
    },
  };
}

/**
 * Rule-based extraction (fallback when AI is not available)
 */
function extractWithRules(raw: { sourceFile: string; text: string }): CustomerExample {
  const coreData = extractCoreData(raw);
  const wishes = extractWishes(raw);
  const emotionalSignals = extractSignals(raw);

  return {
    coreData,
    wishes,
    emotionalSignals,
  };
}

/**
 * Calculate confidence score based on extracted data
 */
function calculateConfidence(example: CustomerExample): number {
  let score = 0.5; // Base score

  // Increase confidence if we found core data
  if (example.coreData.projectType) score += 0.15;
  if (example.coreData.budget) score += 0.15;
  if (example.coreData.locatie) score += 0.1;

  // Increase confidence if we found wishes
  if (example.wishes.length > 0) score += 0.1;

  // Cap at 1.0
  return Math.min(1.0, score);
}

/**
 * Generate warnings for missing or uncertain data
 */
function generateWarnings(example: CustomerExample): string[] {
  const warnings: string[] = [];

  if (!example.coreData.projectType) {
    warnings.push('Project type niet gevonden in document');
  }

  if (!example.coreData.budget) {
    warnings.push('Budget niet gevonden in document');
  }

  if (!example.coreData.locatie) {
    warnings.push('Locatie niet gevonden in document');
  }

  if (example.wishes.length === 0) {
    warnings.push('Geen wensen/verlangens gevonden in document');
  }

  if (example.emotionalSignals.length === 0) {
    warnings.push('Geen emotionele signalen gedetecteerd');
  }

  return warnings;
}

// Re-export all types
export * from './types/index.js';

// Re-export converter function (needed by database package for manual edits)
export { customerExampleToPatches } from './toPatches/toPatches.js';
