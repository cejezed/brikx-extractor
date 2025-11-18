// Customer Example queries - Type-safe database operations for training data
// Aligned with @brikx/extractor-core customer example types

import { getSupabaseClient, isUsingInMemory } from '../client.js';
import type {
  CustomerExampleRecord,
  ExampleType,
  ExampleStatus,
} from '@brikx/extractor-core';

/**
 * Database row type (matches table schema)
 */
export interface CustomerExampleRow {
  id: string;
  project_id: string;
  workspace_id: string | null;
  example_type: ExampleType;
  example_data: any;
  status: ExampleStatus;
  quality_score: number;
  tags: string[];
  extraction_batch: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type (subset for creation)
 */
export type CustomerExampleInsert = Omit<
  CustomerExampleRow,
  'id' | 'reviewed_at' | 'reviewed_by' | 'review_notes' | 'created_at' | 'updated_at'
>;

/**
 * Update type (fields that can be updated)
 */
export interface CustomerExampleUpdate {
  status?: ExampleStatus;
  tags?: string[];
  review_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

/**
 * Filters for listing examples
 */
export interface CustomerExampleFilters {
  project_id?: string;
  workspace_id?: string;
  example_type?: ExampleType;
  status?: ExampleStatus | ExampleStatus[];
  min_quality?: number;
  tags?: string[];
  extraction_batch?: string;
}

/**
 * Convert database row to CustomerExampleRecord
 */
function rowToRecord(row: CustomerExampleRow): CustomerExampleRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    workspace_id: row.workspace_id,
    example_type: row.example_type,
    example_data: row.example_data,
    status: row.status,
    quality_score: row.quality_score,
    tags: row.tags,
    extraction_batch: row.extraction_batch,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Create a new training example
 */
export async function createTrainingExample(
  data: CustomerExampleInsert
): Promise<CustomerExampleRecord> {
  // In-memory fallback (basic implementation)
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    throw new Error('Customer examples require database connection');
  }

  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase!
    .from('customer_examples')
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return rowToRecord(row as CustomerExampleRow);
}

/**
 * Bulk create training examples (for batch extraction)
 */
export async function createTrainingExamples(
  examples: CustomerExampleInsert[]
): Promise<CustomerExampleRecord[]> {
  if (examples.length === 0) return [];

  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    throw new Error('Customer examples require database connection');
  }

  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase!
    .from('customer_examples')
    .insert(examples as any[])
    .select();

  if (error) throw error;
  return (rows as CustomerExampleRow[]).map(rowToRecord);
}

/**
 * Get a single training example by ID
 */
export async function getTrainingExample(id: string): Promise<CustomerExampleRecord | null> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    return null;
  }

  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase!
    .from('customer_examples')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return rowToRecord(row as CustomerExampleRow);
}

/**
 * List training examples with filters
 */
export async function listTrainingExamples(
  filters?: CustomerExampleFilters
): Promise<CustomerExampleRecord[]> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    return [];
  }

  const supabase = getSupabaseClient();
  let query = supabase!.from('customer_examples').select('*');

  // Apply filters
  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  if (filters?.workspace_id) {
    query = query.eq('workspace_id', filters.workspace_id);
  }

  if (filters?.example_type) {
    query = query.eq('example_type', filters.example_type);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.min_quality !== undefined) {
    query = query.gte('quality_score', filters.min_quality);
  }

  if (filters?.extraction_batch) {
    query = query.eq('extraction_batch', filters.extraction_batch);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  // Order by quality score descending, then created_at descending
  query = query.order('quality_score', { ascending: false });
  query = query.order('created_at', { ascending: false });

  const { data: rows, error } = await query;

  if (error) throw error;
  return (rows as CustomerExampleRow[]).map(rowToRecord);
}

/**
 * Update a training example
 */
export async function updateTrainingExample(
  id: string,
  updates: CustomerExampleUpdate
): Promise<CustomerExampleRecord> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    throw new Error('Customer examples require database connection');
  }

  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase!
    .from('customer_examples')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToRecord(row as CustomerExampleRow);
}

/**
 * Update training example status (approve/reject)
 */
export async function updateTrainingExampleStatus(
  id: string,
  status: ExampleStatus,
  reviewedBy?: string,
  reviewNotes?: string
): Promise<CustomerExampleRecord> {
  const updates: CustomerExampleUpdate = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewedBy,
    review_notes: reviewNotes,
  };

  return await updateTrainingExample(id, updates);
}

/**
 * Delete a training example
 */
export async function deleteTrainingExample(id: string): Promise<void> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    console.warn('[customer-examples] In-memory storage not fully implemented for examples');
    throw new Error('Customer examples require database connection');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase!.from('customer_examples').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Get statistics for a project's training examples
 */
export async function getTrainingExampleStats(projectId: string): Promise<{
  total: number;
  byType: { DIRECT_ACTIONABLE: number; EMOTIONAL_SIGNAL: number };
  byStatus: { pending: number; approved: number; rejected: number };
  averageQuality: number;
}> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    return {
      total: 0,
      byType: { DIRECT_ACTIONABLE: 0, EMOTIONAL_SIGNAL: 0 },
      byStatus: { pending: 0, approved: 0, rejected: 0 },
      averageQuality: 0,
    };
  }

  const examples = await listTrainingExamples({ project_id: projectId });

  const stats = {
    total: examples.length,
    byType: {
      DIRECT_ACTIONABLE: examples.filter((e) => e.example_type === 'DIRECT_ACTIONABLE').length,
      EMOTIONAL_SIGNAL: examples.filter((e) => e.example_type === 'EMOTIONAL_SIGNAL').length,
    },
    byStatus: {
      pending: examples.filter((e) => e.status === 'pending').length,
      approved: examples.filter((e) => e.status === 'approved').length,
      rejected: examples.filter((e) => e.status === 'rejected').length,
    },
    averageQuality:
      examples.length > 0
        ? examples.reduce((sum, e) => sum + e.quality_score, 0) / examples.length
        : 0,
  };

  return stats;
}
