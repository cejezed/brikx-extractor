// Type-safe API client for PvE Analyzer backend
import type {
  CustomerExample,
  PatchEvent,
  ExtractResult,
} from '@brikx/extractor-core';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Project type from database (simplified client-side version)
export type Project = {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'review' | 'approved' | 'exported' | 'error';
  customer_example: CustomerExample | null;
  patches: PatchEvent[] | null;
  confidence: number | null;
  warnings: string[] | null;
  original_text: string | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectStats = {
  total: number;
  byStatus: Record<string, number>;
  totalBudget: number;
  totalWishes: number;
  totalConcerns: number;
  totalEnthusiasm: number;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a document for processing
   */
  async uploadDocument(file: File): Promise<{ success: boolean; project: Project }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/projects/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Upload text for processing
   */
  async uploadText(text: string): Promise<{ success: boolean; project: Project }> {
    const response = await fetch(`${this.baseUrl}/api/projects/upload-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Get all projects
   */
  async getProjects(filters?: { status?: string; search?: string }): Promise<{ projects: Project[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const url = `${this.baseUrl}/api/projects${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  }

  /**
   * Get project statistics
   */
  async getStats(): Promise<{ stats: ProjectStats }> {
    const response = await fetch(`${this.baseUrl}/api/projects/stats`);

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return response.json();
  }

  /**
   * Get single project
   */
  async getProject(
    id: string,
    options?: { includeChunks?: boolean; includeSuggestions?: boolean }
  ): Promise<{ project: Project }> {
    const params = new URLSearchParams();
    if (options?.includeChunks) params.append('includeChunks', 'true');
    if (options?.includeSuggestions) params.append('includeSuggestions', 'true');

    const url = `${this.baseUrl}/api/projects/${id}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  }

  /**
   * Update project with manual edits
   */
  async updateProject(
    id: string,
    customerExample: CustomerExample,
    changedFields: Array<{ fieldPath: string; oldValue: any; newValue: any }>
  ): Promise<{ success: boolean; project: Project }> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_example: customerExample,
        changed_fields: changedFields,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    return response.json();
  }

  /**
   * Export project to Brikx
   */
  async exportToBrikx(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}/export`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }

    return response.json();
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return response.json();
  }
}

// Singleton instance
export const apiClient = new ApiClient();
