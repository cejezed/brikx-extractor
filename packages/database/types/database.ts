// Database types - Generated from Supabase schema
// All extraction-related types are imported from @brikx/extractor-core (Single Source of Truth)

import type {
  CustomerExample,
  ClientSignal,
  PatchEvent,
  ExtractMeta,
} from '@brikx/extractor-core';

// Project status lifecycle
export type ProjectStatus = 'uploading' | 'processing' | 'review' | 'approved' | 'exported' | 'error';

// Manual edit tracking (structured as per requirement)
export type ManualEdit = {
  fieldPath: string;      // e.g., 'coreData.budget', 'wishes[0]'
  oldValue: any;
  newValue: any;
  editedAt: string;       // ISO timestamp
  editedBy: string;       // User ID
};

// Database row types
export type Project = {
  id: string;

  // File metadata
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;

  // Status
  status: ProjectStatus;

  // Extraction results (using @brikx/extractor-core types)
  customer_example: CustomerExample | null;
  patches: PatchEvent[] | null;
  original_text: string | null;

  // Metadata
  confidence: number | null;
  warnings: string[] | null;

  // Review
  reviewed_at: string | null;
  reviewed_by: string | null;

  // Manual edits
  manual_edits: ManualEdit[];

  // Export
  exported_at: string | null;
  export_response: any | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Multi-tenant
  workspace_id: string | null;
  created_by: string | null;
};

export type DocumentChunk = {
  id: string;
  project_id: string;

  page_number: number;
  chunk_index: number;

  text_content: string;
  bbox: BoundingBox | null;

  extracted_field: string | null;
  field_type: string | null;

  confidence: number | null;
  created_at: string;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
};

export type AISuggestion = {
  id: string;
  project_id: string;

  suggestion_type: string;
  content: AISuggestionContent;

  status: 'pending' | 'accepted' | 'rejected' | 'auto_applied';

  resolved_at: string | null;
  resolved_by: string | null;

  created_at: string;

  model_name: string | null;
  model_version: string | null;
};

export type AISuggestionContent = {
  field: string;
  suggestedValue: any;
  reason: string;
  sourceQuote?: string;
  confidence?: number;
};

export type FeatureFlag = {
  id: string;
  flag_name: string;
  enabled: boolean;
  config: Record<string, any>;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};

// Insert/Update types (for mutations)
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ProjectUpdate = Partial<Omit<Project, 'id' | 'created_at'>>;

export type DocumentChunkInsert = Omit<DocumentChunk, 'id' | 'created_at'> & {
  id?: string;
};

export type AISuggestionInsert = Omit<AISuggestion, 'id' | 'created_at'> & {
  id?: string;
};

// Response types for API
export type ProjectWithRelations = Project & {
  chunks?: DocumentChunk[];
  suggestions?: AISuggestion[];
};

// Query filters
export type ProjectFilters = {
  status?: ProjectStatus | ProjectStatus[];
  workspace_id?: string;
  created_by?: string;
  search?: string;  // Search in filename
};
