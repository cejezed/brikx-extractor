// Project routes - Handles PvE document upload, extraction, review, and export
import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { unlink } from 'fs/promises';
import { extractFromFile } from '@brikx/extractor-core';
import type { ExtractResult, CustomerExample } from '@brikx/extractor-core';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  updateCustomerExample,
  updateProjectStatus,
  deleteProject,
  getProjectStats,
  getBrikxExportConfig,
} from '@brikx/extractor-database';
import type { AuthRequest } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router: Router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/brikx-uploads',
    filename: (req, file, cb) => {
      // Keep original extension for parseFile to work correctly
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      cb(null, `upload-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.txt', '.docx', '.pdf', '.xlsx', '.xls'];
    const ext = extname(file.originalname).toLowerCase();

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * POST /api/projects/upload
 * Upload and process a PvE document
 */
router.post('/upload', optionalAuth, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[Upload] Processing file: ${req.file.originalname}`);

    // Create initial project record
    const project = await createProject({
      filename: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      storage_path: req.file.path,
      status: 'processing',
      created_by: req.user?.id || null,
      workspace_id: req.user?.workspace_id || null,
      customer_example: null,
      patches: null,
      original_text: null,
      confidence: null,
      warnings: null,
      manual_edits: [],
      reviewed_at: null,
      reviewed_by: null,
      exported_at: null,
      export_response: null,
    });

    // Start extraction (async, could be moved to background job)
    try {
      const result: ExtractResult = await extractFromFile(req.file.path);

      // Update project with extraction results
      await updateProject(project.id, {
        customer_example: result.customerExample as any,
        patches: result.patches as any,
        original_text: result.customerExample.wishes.join('\n'), // Simplified
        confidence: result.meta.confidence,
        warnings: result.meta.warnings,
        status: 'review',
      });

      console.log(`[Upload] Extraction complete for ${req.file.originalname}`);

      // Clean up uploaded file
      await unlink(req.file.path);

      // Return updated project
      const updatedProject = await getProject(project.id, {
        includeChunks: false,
        includeSuggestions: false,
      });

      res.json({
        success: true,
        project: updatedProject,
      });
    } catch (extractError) {
      console.error(`[Upload] Extraction failed:`, extractError);

      // Update project status to error
      await updateProject(project.id, {
        status: 'error',
        warnings: [extractError instanceof Error ? extractError.message : 'Extraction failed'],
      });

      // Clean up file
      try {
        await unlink(req.file.path);
      } catch {}

      res.status(500).json({
        error: 'Extraction failed',
        message: extractError instanceof Error ? extractError.message : 'Unknown error',
        project_id: project.id,
      });
    }
  } catch (error) {
    console.error('[Upload] Error:', error);

    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await unlink(req.file.path);
      } catch {}
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/projects
 * List all projects with optional filters
 */
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { status, search } = req.query;

    const projects = await listProjects({
      status: status ? (status as any) : undefined,
      search: search ? String(search) : undefined,
      workspace_id: req.user?.workspace_id,
      created_by: req.user?.id,
    });

    res.json({ projects });
  } catch (error) {
    console.error('[List] Error:', error);
    res.status(500).json({
      error: 'Failed to list projects',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/projects/stats
 * Get aggregated statistics for dashboard
 */
router.get('/stats', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const stats = await getProjectStats({
      workspace_id: req.user?.workspace_id,
      created_by: req.user?.id,
    });

    res.json({ stats });
  } catch (error) {
    console.error('[Stats] Error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/projects/:id
 * Get single project with relations
 */
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { includeChunks, includeSuggestions } = req.query;

    const project = await getProject(id, {
      includeChunks: includeChunks === 'true',
      includeSuggestions: includeSuggestions === 'true',
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('[Get] Error:', error);
    res.status(500).json({
      error: 'Failed to get project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/projects/:id
 * Update project (manual edits to customer_example)
 */
router.patch('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { customer_example, changed_fields } = req.body;

    if (!customer_example) {
      return res.status(400).json({ error: 'customer_example is required' });
    }

    if (!changed_fields || !Array.isArray(changed_fields)) {
      return res.status(400).json({
        error: 'changed_fields array is required',
        example: [{ fieldPath: 'coreData.budget', oldValue: 250000, newValue: 300000 }],
      });
    }

    // Update with manual edit tracking
    const updatedProject = await updateCustomerExample(
      id,
      customer_example as CustomerExample,
      req.user?.id || 'anonymous',
      changed_fields
    );

    console.log(`[Update] Project ${id} updated with ${changed_fields.length} edits`);

    res.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('[Update] Error:', error);
    res.status(500).json({
      error: 'Failed to update project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/projects/:id/export
 * Export project patches to Brikx
 */
router.post('/:id/export', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if Brikx export is enabled
    const brikxConfig = await getBrikxExportConfig();

    if (!brikxConfig) {
      return res.status(403).json({
        error: 'Brikx export is not enabled',
        message:
          'Contact administrator to enable Brikx export feature flag and configure API credentials',
      });
    }

    // Get project
    const project = await getProject(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate status
    if (project.status !== 'review' && project.status !== 'approved') {
      return res.status(400).json({
        error: 'Project must be in review or approved status to export',
        current_status: project.status,
      });
    }

    // Build ExtractResult for Brikx
    const extractResult: ExtractResult = {
      customerExample: project.customer_example!,
      patches: project.patches!,
      meta: {
        sourceFile: project.filename,
        confidence: project.confidence || 0,
        warnings: project.warnings || [],
      },
    };

    console.log(
      `[Export] Exporting project ${id} to Brikx: ${brikxConfig.apiUrl}`
    );

    // POST to Brikx API
    const response = await fetch(brikxConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brikxConfig.apiKey}`,
      },
      body: JSON.stringify(extractResult),
    });

    const responseData = (await response.json()) as any;

    if (!response.ok) {
      console.error(`[Export] Brikx API error:`, responseData);

      return res.status(response.status).json({
        error: 'Brikx export failed',
        message: responseData.message || response.statusText,
        brikx_response: responseData,
      });
    }

    // Update project status
    await updateProjectStatus(id, 'exported', {
      exported_at: new Date().toISOString(),
      export_response: responseData,
    });

    console.log(`[Export] Successfully exported project ${id} to Brikx`);

    res.json({
      success: true,
      message: 'Project exported to Brikx',
      brikx_response: responseData,
    });
  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await deleteProject(id);

    console.log(`[Delete] Project ${id} deleted`);

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('[Delete] Error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
