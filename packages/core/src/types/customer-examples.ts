// packages/core/src/types/customer-examples.ts
// Training Examples for Jules LLM

import type { PatchEvent, ChapterKey } from './brikx.js';
import type { ClientSignalType } from './customer-example.js';

/**
 * Type A: Direct actionable wishes that map to specific fields/patches
 * Type B: Emotional signals showing underlying motivations
 */
export type ExampleType = 'DIRECT_ACTIONABLE' | 'EMOTIONAL_SIGNAL';

/**
 * Status workflow: pending → approved/rejected
 */
export type ExampleStatus = 'pending' | 'approved' | 'rejected';

/**
 * Type A: DIRECT_ACTIONABLE
 * Clear, concrete wishes that map to specific fields/patches
 *
 * Example:
 * userInput: "ik wil 4 slaapkamers op de eerste verdieping"
 * interpretation: "Klant heeft specifieke eis voor aantal en locatie slaapkamers"
 * suggestedPatches: [{ op: "add", path: "/ruimtes/slaapkamers", value: 4 }]
 */
export interface DirectActionableExample {
  /** Exact quote from customer */
  userInput: string;

  /** Human-readable interpretation of what the customer wants */
  interpretation: string;

  /** Patches that would fulfill this wish */
  suggestedPatches: PatchEvent[];

  /** Confidence that this interpretation is correct (0.0 - 1.0) */
  confidence: number;

  /** Which wizard chapters this relates to */
  relevantChapters: ChapterKey[];
}

/**
 * Type B: EMOTIONAL_SIGNAL
 * Underlying motivations and emotional signals
 *
 * Example:
 * userInput: "ik ben bang dat het te klein wordt"
 * signalType: "concern"
 * emotionalCategory: ["ruimteangst", "twijfel_over_ontwerp"]
 * interpretedIntent: "Klant heeft zorgen over ruimtegebruik"
 * designImplication: "Extra aandacht voor ruimtebeleving en indeling"
 * followupStrategy: { empathetic: "Wat maakt dat je...", ... }
 */
export interface EmotionalSignalExample {
  /** Exact quote from customer */
  userInput: string;

  /** Type of signal (reuses existing ClientSignalType) */
  signalType: ClientSignalType;

  /** Emotional categories for training (multiple possible) */
  emotionalCategory: string[];

  /** What the customer really means */
  interpretedIntent: string;

  /** Design/architectural implications */
  designImplication: string;

  /** How Jules should respond */
  followupStrategy: {
    /** Empathetic response */
    empathetic: string;

    /** Clarifying question */
    clarifying: string;

    /** Explorative question to dig deeper */
    exploring: string;
  };
}

/**
 * Database record wrapper for a training example
 */
export interface CustomerExampleRecord {
  /** Unique ID */
  id: string;

  /** Source project ID */
  project_id: string;

  /** Workspace for multi-tenancy (null for non-workspace projects) */
  workspace_id: string | null;

  /** Type A or Type B */
  example_type: ExampleType;

  /** The actual example data (polymorphic) */
  example_data: DirectActionableExample | EmotionalSignalExample;

  /** Approval status */
  status: ExampleStatus;

  /** AI-generated quality score (0.0 - 1.0) */
  quality_score: number;

  /** User-defined tags for filtering */
  tags: string[];

  /** Batch ID for tracking extraction runs */
  extraction_batch: string;

  /** Timestamps */
  created_at: string;
  updated_at: string;
}

/**
 * Result from LLM extraction
 */
export interface ExtractionBatchResult {
  /** Batch identifier */
  batchId: string;

  /** All extracted examples */
  examples: CustomerExampleRecord[];

  /** Statistics */
  stats: {
    total: number;
    typeA: number;
    typeB: number;
    averageQuality: number;
    belowThreshold: number;
  };

  /** Any warnings or issues during extraction */
  warnings: string[];
}
