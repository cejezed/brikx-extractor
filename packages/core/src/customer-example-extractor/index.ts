// packages/core/src/customer-example-extractor/index.ts
// Main API for customer example extraction

export * from './extractor.js';
export * from './quality.js';
export * from './prompts.js';

import type { ExtractionBatchResult } from '../types/customer-examples.js';
import { extractCustomerExamplesFromText } from './extractor.js';

/**
 * Generate customer examples for a project
 *
 * This is the main entry point for the customer example extraction pipeline.
 * It takes a project's original text and extracts training examples for Jules.
 *
 * @param projectId - The project ID
 * @param originalText - The original PvE text
 * @param workspaceId - Optional workspace ID (defaults to 'default')
 * @returns ExtractionBatchResult with all examples and statistics
 *
 * @example
 * ```typescript
 * const result = await generateCustomerExamplesForProject(
 *   'project-123',
 *   pveText,
 *   'workspace-456'
 * );
 *
 * console.log(`Extracted ${result.stats.total} examples`);
 * console.log(`Type A: ${result.stats.typeA}, Type B: ${result.stats.typeB}`);
 *
 * // Filter for high-quality examples
 * const approved = result.examples.filter(ex => ex.quality_score >= 0.8);
 * ```
 */
export async function generateCustomerExamplesForProject(
  projectId: string,
  originalText: string,
  workspaceId: string = 'default'
): Promise<ExtractionBatchResult> {
  if (!originalText || originalText.trim().length === 0) {
    throw new Error('Original text is empty');
  }

  if (originalText.length < 100) {
    console.warn(
      '[generateCustomerExamplesForProject] Text is very short - may not produce good examples'
    );
  }

  console.log(`[generateCustomerExamplesForProject] Starting extraction for project ${projectId}`);

  const result = await extractCustomerExamplesFromText(originalText, projectId, workspaceId);

  console.log(
    `[generateCustomerExamplesForProject] Complete: ${result.stats.total} examples extracted`
  );

  return result;
}
