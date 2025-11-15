// packages/core/src/types/extract-result.ts

import type { CustomerExample } from './customer-example.js';
import type { PatchEvent } from './brikx.js';

export type ExtractMeta = {
  sourceFile: string;
  confidence: number;         // 0.0 - 1.0
  warnings?: string[];
};

export type ExtractResult = {
  customerExample: CustomerExample;
  patches: PatchEvent[];
  meta: ExtractMeta;
};
