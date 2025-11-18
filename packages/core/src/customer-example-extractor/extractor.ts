// packages/core/src/customer-example-extractor/extractor.ts
// LLM-powered extraction of training examples

import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import type {
  CustomerExampleRecord,
  ExampleType,
  ExtractionBatchResult,
} from '../types/customer-examples.js';
import { EXTRACTION_SYSTEM_PROMPT } from './prompts.js';
import { scoreExample, filterByQuality, generateTags, QUALITY_THRESHOLD } from './quality.js';

/**
 * Extract training examples from PvE text using OpenAI
 */
export async function extractCustomerExamplesFromText(
  text: string,
  projectId: string,
  workspaceId: string = 'default'
): Promise<ExtractionBatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey });
  const batchId = `batch_${Date.now()}_${randomUUID().substring(0, 8)}`;

  console.log('[CustomerExampleExtractor] Starting extraction...');
  console.log(`[CustomerExampleExtractor] Text length: ${text.length} characters`);
  console.log(`[CustomerExampleExtractor] Project ID: ${projectId}`);
  console.log(`[CustomerExampleExtractor] Batch ID: ${batchId}`);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extraheer trainingsvoorbeelden uit dit PvE document:\n\n${text}`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('[CustomerExampleExtractor] Parsing response...');
    const parsed = JSON.parse(responseText);

    if (!parsed.examples || !Array.isArray(parsed.examples)) {
      throw new Error('Invalid response format: missing examples array');
    }

    console.log(`[CustomerExampleExtractor] Extracted ${parsed.examples.length} raw examples`);

    // Transform to CustomerExampleRecord format
    const now = new Date().toISOString();
    let records: CustomerExampleRecord[] = parsed.examples.map((ex: any) => {
      const baseRecord = {
        id: randomUUID(),
        project_id: projectId,
        workspace_id: workspaceId,
        example_type: ex.example_type as ExampleType,
        example_data: ex.example_data,
        status: 'pending' as const,
        tags: ex.tags || [],
        extraction_batch: batchId,
        created_at: now,
        updated_at: now,
      };

      // Calculate quality score
      const quality_score = scoreExample(baseRecord);

      // Create complete record
      const completeRecord: CustomerExampleRecord = {
        ...baseRecord,
        quality_score,
      };

      // Generate automatic tags
      const autoTags = generateTags(completeRecord);
      const allTags = [...new Set([...baseRecord.tags, ...autoTags])];

      return {
        ...completeRecord,
        tags: allTags,
      };
    });

    console.log('[CustomerExampleExtractor] Quality scoring complete');

    // Filter by quality threshold
    const beforeFilter = records.length;
    records = filterByQuality(records, QUALITY_THRESHOLD);
    const afterFilter = records.length;
    const belowThreshold = beforeFilter - afterFilter;

    if (belowThreshold > 0) {
      console.log(
        `[CustomerExampleExtractor] Filtered out ${belowThreshold} examples below quality threshold (${QUALITY_THRESHOLD})`
      );
    }

    // Calculate statistics
    const typeA = records.filter((r) => r.example_type === 'DIRECT_ACTIONABLE').length;
    const typeB = records.filter((r) => r.example_type === 'EMOTIONAL_SIGNAL').length;
    const averageQuality =
      records.length > 0
        ? records.reduce((sum, r) => sum + r.quality_score, 0) / records.length
        : 0;

    const warnings: string[] = [];
    if (records.length === 0) {
      warnings.push('No examples extracted - text may be too short or lack clear wishes/signals');
    }
    if (records.length < 5) {
      warnings.push('Very few examples extracted - consider providing more detailed text');
    }
    if (averageQuality < 0.7) {
      warnings.push('Average quality is low - extracted examples may need manual review');
    }

    console.log('[CustomerExampleExtractor] Extraction complete');
    console.log(`[CustomerExampleExtractor] Type A (DIRECT_ACTIONABLE): ${typeA}`);
    console.log(`[CustomerExampleExtractor] Type B (EMOTIONAL_SIGNAL): ${typeB}`);
    console.log(
      `[CustomerExampleExtractor] Average quality: ${(averageQuality * 100).toFixed(1)}%`
    );

    return {
      batchId,
      examples: records,
      stats: {
        total: records.length,
        typeA,
        typeB,
        averageQuality,
        belowThreshold,
      },
      warnings,
    };
  } catch (error) {
    console.error('[CustomerExampleExtractor] Extraction failed:', error);
    throw error;
  }
}

/**
 * Check if customer example extraction is available
 */
export function isCustomerExampleExtractionAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
