// Project queries - Type-safe database operations
// All extraction data adheres to @brikx/extractor-core types

import { getSupabaseClient, isUsingInMemory } from '../client.js';
import { inMemoryStore } from '../in-memory-store.js';
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectFilters,
  ProjectWithRelations,
  ManualEdit,
} from '../types/database.js';
import type { CustomerExample, PatchEvent } from '@brikx/extractor-core';
import { customerExampleToPatches } from '@brikx/extractor-core';

/**
 * Create a new project
 */
export async function createProject(data: ProjectInsert): Promise<Project> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    return await inMemoryStore.createProject(data);
  }

  const supabase = getSupabaseClient();
  const { data: project, error} = await supabase!
    .from('projects')
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return project as Project;
}

/**
 * Get project by ID with optional relations
 */
export async function getProject(
  id: string,
  options?: { includeChunks?: boolean; includeSuggestions?: boolean }
): Promise<ProjectWithRelations | null> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    return await inMemoryStore.getProject(id);
  }

  const supabase = getSupabaseClient();
  let query = supabase!.from('projects').select('*').eq('id', id).single();

  const { data: project, error } = await query;

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  const result: ProjectWithRelations = project;

  // Load relations if requested
  if (options?.includeChunks) {
    const { data: chunks } = await supabase!
      .from('document_chunks')
      .select('*')
      .eq('project_id', id)
      .order('page_number', { ascending: true })
      .order('chunk_index', { ascending: true });

    result.chunks = chunks || [];
  }

  if (options?.includeSuggestions) {
    const { data: suggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    result.suggestions = suggestions || [];
  }

  return result;
}

/**
 * List projects with filters
 */
export async function listProjects(filters?: ProjectFilters): Promise<Project[]> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    return await inMemoryStore.listProjects(filters);
  }

  const supabase = getSupabaseClient();
  let query = supabase!.from('projects').select('*').order('created_at', { ascending: false });

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    query = query.in('status', statuses);
  }

  if (filters?.workspace_id) {
    query = query.eq('workspace_id', filters.workspace_id);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  if (filters?.search) {
    query = query.ilike('filename', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Update project
 */
export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  // In-memory fallback
  if (isUsingInMemory() || !getSupabaseClient()) {
    return await inMemoryStore.updateProject(id, updates);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase!
    .from('projects')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

/**
 * Update customer example with manual edit tracking
 * This is the key function that maintains Single Source of Truth
 */
export async function updateCustomerExample(
  projectId: string,
  customerExample: CustomerExample,
  editedBy: string,
  changedFields: { fieldPath: string; oldValue: any; newValue: any }[]
): Promise<Project> {
  const supabase = getSupabaseClient();

  // Get current project to access existing manual_edits
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  // Build manual edit records
  const newEdits: ManualEdit[] = changedFields.map((change) => ({
    fieldPath: change.fieldPath,
    oldValue: change.oldValue,
    newValue: change.newValue,
    editedAt: new Date().toISOString(),
    editedBy,
  }));

  // Append to existing manual_edits
  const updatedManualEdits = [...(project.manual_edits || []), ...newEdits];

  // Regenerate patches from updated CustomerExample
  const updatedPatches = customerExampleToPatches(customerExample);

  // Update project with new data
  const { data, error } = await supabase
    .from('projects')
    .update({
      customer_example: customerExample as any,
      patches: updatedPatches as any,
      manual_edits: updatedManualEdits as any,
      status: 'review', // Move to review after manual edits
    } as any)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  id: string,
  status: Project['status'],
  metadata?: { reviewed_by?: string; exported_at?: string; export_response?: any }
): Promise<Project> {
  const supabase = getSupabaseClient();

  const updates: ProjectUpdate = { status };

  if (metadata?.reviewed_by) {
    updates.reviewed_by = metadata.reviewed_by;
    updates.reviewed_at = new Date().toISOString();
  }

  if (metadata?.exported_at) {
    updates.exported_at = metadata.exported_at;
  }

  if (metadata?.export_response) {
    updates.export_response = metadata.export_response;
  }

  const { data, error} = await supabase.from('projects').update(updates as any).eq('id', id).select().single();

  if (error) throw error;
  return data as Project;
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Get project statistics for dashboard
 */
export async function getProjectStats(filters?: ProjectFilters) {
  // Use in-memory or Supabase based on connection
  if (isUsingInMemory() || !getSupabaseClient()) {
    return await inMemoryStore.getProjectStats();
  }

  const projects = await listProjects(filters);

  const stats = {
    totalProjects: projects.length,
    projectsByStatus: {} as Record<Project['status'], number>,
    totalBudget: 0,
    totalWishes: 0,
    totalConcerns: 0,
    totalEnthusiasm: 0,
  };

  projects.forEach((project) => {
    // Count by status
    stats.projectsByStatus[project.status] = (stats.projectsByStatus[project.status] || 0) + 1;

    // Sum budget
    if (project.customer_example?.coreData?.budget) {
      stats.totalBudget += project.customer_example.coreData.budget;
    }

    // Count wishes
    if (project.customer_example?.wishes) {
      stats.totalWishes += project.customer_example.wishes.length;
    }

    // Count emotional signals
    if (project.customer_example?.emotionalSignals) {
      project.customer_example.emotionalSignals.forEach((signal) => {
        if (signal.type === 'concern') stats.totalConcerns++;
        if (signal.type === 'enthusiasm') stats.totalEnthusiasm++;
      });
    }
  });

  return stats;
}
