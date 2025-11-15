// @brikx/extractor-database
// Database layer for PvE Analyzer
// All extraction types come from @brikx/extractor-core (Single Source of Truth)

export * from './client.js';
export * from './types/database.js';

// Query functions
export * from './queries/projects.js';
export * from './queries/feature-flags.js';

// Re-export core types for convenience (but they originate from @brikx/extractor-core)
export type {
  CustomerExample,
  ClientSignal,
  ClientSignalType,
  CustomerCoreData,
  PatchEvent,
  PatchDelta,
  ChapterKey,
  ExtractResult,
  ExtractMeta,
} from '@brikx/extractor-core';
