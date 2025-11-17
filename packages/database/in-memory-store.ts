// In-memory storage fallback for development/testing without Supabase
import { randomUUID } from 'crypto';
import type { Project } from './types/database.js';

class InMemoryStore {
  private projects: Map<string, Project> = new Map();
  private featureFlags: Map<string, any> = new Map();

  constructor() {
    // Initialize default feature flags
    this.featureFlags.set('brikx_export', {
      id: randomUUID(),
      flag_key: 'brikx_export',
      enabled: false,
      config: { apiUrl: '', apiKey: '' },
      description: 'Enable Brikx export functionality',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Projects
  async createProject(data: Partial<Project>): Promise<Project> {
    const project: Project = {
      id: randomUUID(),
      filename: data.filename || 'untitled',
      file_size: data.file_size || null,
      mime_type: data.mime_type || null,
      storage_path: data.storage_path || null,
      status: data.status || 'uploading',
      customer_example: data.customer_example || null,
      patches: data.patches || null,
      original_text: data.original_text || null,
      confidence: data.confidence || null,
      warnings: data.warnings || null,
      reviewed_at: data.reviewed_at || null,
      reviewed_by: data.reviewed_by || null,
      manual_edits: data.manual_edits || [],
      exported_at: data.exported_at || null,
      export_response: data.export_response || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: data.created_by || null,
      workspace_id: data.workspace_id || null,
    };

    this.projects.set(project.id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async listProjects(filters?: any): Promise<Project[]> {
    let projects = Array.from(this.projects.values());

    if (filters?.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      projects = projects.filter((p) => statuses.includes(p.status));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      projects = projects.filter((p) => p.filename.toLowerCase().includes(search));
    }

    return projects.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const updated = {
      ...project,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getProjectStats(): Promise<any> {
    const projects = Array.from(this.projects.values());

    const stats = {
      totalProjects: projects.length,
      totalBudget: 0,
      totalWishes: 0,
      totalConcerns: 0,
      projectsByStatus: {} as Record<string, number>,
    };

    projects.forEach((p) => {
      // Budget
      if (p.customer_example?.coreData?.budget) {
        stats.totalBudget += p.customer_example.coreData.budget;
      }

      // Wishes
      if (p.customer_example?.wishes) {
        stats.totalWishes += p.customer_example.wishes.length;
      }

      // Concerns
      if (p.customer_example?.emotionalSignals) {
        const concerns = p.customer_example.emotionalSignals.filter(
          (s: any) => s.type === 'concern'
        );
        stats.totalConcerns += concerns.length;
      }

      // Status
      stats.projectsByStatus[p.status] = (stats.projectsByStatus[p.status] || 0) + 1;
    });

    return stats;
  }

  // Feature Flags
  async getFeatureFlag(key: string): Promise<any> {
    return this.featureFlags.get(key) || null;
  }

  async listFeatureFlags(): Promise<any[]> {
    return Array.from(this.featureFlags.values());
  }

  async updateFeatureFlag(key: string, updates: any): Promise<any> {
    const flag = this.featureFlags.get(key);
    if (!flag) {
      throw new Error(`Feature flag ${key} not found`);
    }

    const updated = {
      ...flag,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.featureFlags.set(key, updated);
    return updated;
  }

  // Utility
  clear() {
    this.projects.clear();
    this.featureFlags.clear();
  }

  size() {
    return {
      projects: this.projects.size,
      featureFlags: this.featureFlags.size,
    };
  }
}

// Singleton instance
export const inMemoryStore = new InMemoryStore();

console.log('⚠️  Using IN-MEMORY storage - data will be lost on restart!');
