// Customer Examples routes - Training data extraction for Jules LLM
import { Router } from 'express';
import {
  generateCustomerExamplesForProject,
  isCustomerExampleExtractionAvailable,
} from '@brikx/extractor-core';
import type { ExampleType, ExampleStatus } from '@brikx/extractor-core';
import {
  createTrainingExamples,
  getTrainingExample,
  listTrainingExamples,
  updateTrainingExampleStatus,
  getTrainingExampleStats,
  getProject,
  getFeatureFlag,
} from '@brikx/extractor-database';
import type { AuthRequest } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router: Router = Router();

// Filters interface (defined locally to avoid subpath import)
interface CustomerExampleFilters {
  project_id?: string;
  workspace_id?: string;
  example_type?: ExampleType;
  status?: ExampleStatus | ExampleStatus[];
  min_quality?: number;
  tags?: string[];
  extraction_batch?: string;
}

/**
 * POST /api/projects/:id/examples/generate
 * Generate training examples from a project's text
 */
router.post('/:id/examples/generate', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id: projectId } = req.params;

    // Check feature flag
    const featureFlag = await getFeatureFlag('customer_examples_enabled');
    if (!featureFlag?.enabled) {
      return res.status(403).json({
        error: 'Customer example extraction is disabled',
        message: 'Enable the customer_examples_enabled feature flag to use this feature',
      });
    }

    // Check if OpenAI is configured
    if (!isCustomerExampleExtractionAvailable()) {
      return res.status(503).json({
        error: 'OpenAI not configured',
        message: 'OPENAI_API_KEY must be set in environment to use customer example extraction',
      });
    }

    // Get the project
    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Ensure we have original text
    if (!project.original_text || project.original_text.trim().length === 0) {
      return res.status(400).json({
        error: 'No text available',
        message: 'Project must have original_text to extract examples from',
      });
    }

    console.log(`[API] Generating customer examples for project ${projectId}`);

    // Generate examples using LLM
    const result = await generateCustomerExamplesForProject(
      projectId,
      project.original_text,
      project.workspace_id || null
    );

    // Save to database
    const insertData = result.examples.map((ex) => ({
      project_id: ex.project_id,
      workspace_id: ex.workspace_id,
      example_type: ex.example_type,
      example_data: ex.example_data,
      status: ex.status,
      quality_score: ex.quality_score,
      tags: ex.tags,
      extraction_batch: ex.extraction_batch,
    }));

    const savedExamples = await createTrainingExamples(insertData);

    console.log(`[API] Saved ${savedExamples.length} examples to database`);

    return res.json({
      success: true,
      batchId: result.batchId,
      stats: result.stats,
      warnings: result.warnings,
      examples: savedExamples,
    });
  } catch (error: any) {
    console.error('[API] Failed to generate customer examples:', error);
    return res.status(500).json({
      error: 'Failed to generate examples',
      message: error.message,
    });
  }
});

/**
 * GET /api/examples (all examples across all projects)
 * List all training examples with optional filters
 */
router.get('/examples', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      example_type,
      status,
      min_quality,
      extraction_batch,
      tags,
    } = req.query;

    // Build filters (no project_id, so get all)
    const filters: CustomerExampleFilters = {};

    if (example_type) {
      filters.example_type = example_type as ExampleType;
    }

    if (status) {
      // Support multiple statuses separated by comma
      if (typeof status === 'string' && status.includes(',')) {
        filters.status = status.split(',') as ExampleStatus[];
      } else {
        filters.status = status as ExampleStatus;
      }
    }

    if (min_quality && typeof min_quality === 'string') {
      filters.min_quality = parseFloat(min_quality);
    }

    if (extraction_batch) {
      filters.extraction_batch = extraction_batch as string;
    }

    if (tags && typeof tags === 'string') {
      // Support multiple tags separated by comma
      filters.tags = tags.split(',');
    }

    const examples = await listTrainingExamples(filters);

    // Calculate global stats from the results
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

    return res.json({
      examples,
      stats,
      filters: filters,
    });
  } catch (error: any) {
    console.error('[API] Failed to list all customer examples:', error);
    return res.status(500).json({
      error: 'Failed to list examples',
      message: error.message,
    });
  }
});

/**
 * GET /api/projects/:id/examples
 * List training examples for a project with optional filters
 */
router.get('/:id/examples', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id: projectId } = req.params;
    const {
      example_type,
      status,
      min_quality,
      extraction_batch,
      tags,
    } = req.query;

    // Build filters
    const filters: CustomerExampleFilters = {
      project_id: projectId,
    };

    if (example_type) {
      filters.example_type = example_type as ExampleType;
    }

    if (status) {
      // Support multiple statuses separated by comma
      if (typeof status === 'string' && status.includes(',')) {
        filters.status = status.split(',') as ExampleStatus[];
      } else {
        filters.status = status as ExampleStatus;
      }
    }

    if (min_quality && typeof min_quality === 'string') {
      filters.min_quality = parseFloat(min_quality);
    }

    if (extraction_batch) {
      filters.extraction_batch = extraction_batch as string;
    }

    if (tags && typeof tags === 'string') {
      // Support multiple tags separated by comma
      filters.tags = tags.split(',');
    }

    const examples = await listTrainingExamples(filters);

    // Get statistics
    const stats = await getTrainingExampleStats(projectId);

    return res.json({
      examples,
      stats,
      filters: filters,
    });
  } catch (error: any) {
    console.error('[API] Failed to list customer examples:', error);
    return res.status(500).json({
      error: 'Failed to list examples',
      message: error.message,
    });
  }
});

/**
 * GET /api/projects/:projectId/examples/stats
 * Get statistics for a project's training examples
 */
router.get('/:id/examples/stats', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id: projectId } = req.params;

    const stats = await getTrainingExampleStats(projectId);

    return res.json(stats);
  } catch (error: any) {
    console.error('[API] Failed to get example stats:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * GET /api/examples/:exampleId
 * Get a single training example by ID
 */
router.get('/examples/:exampleId', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { exampleId } = req.params;

    const example = await getTrainingExample(exampleId);

    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    return res.json(example);
  } catch (error: any) {
    console.error('[API] Failed to get customer example:', error);
    return res.status(500).json({
      error: 'Failed to get example',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/examples/:exampleId
 * Update a training example (status, tags, etc.)
 */
router.patch('/examples/:exampleId', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { exampleId } = req.params;
    const { status, tags, review_notes } = req.body;

    // Validate status if provided
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, approved, rejected',
      });
    }

    // Get current example
    const example = await getTrainingExample(exampleId);
    if (!example) {
      return res.status(404).json({ error: 'Example not found' });
    }

    // Update status if provided
    if (status) {
      const updated = await updateTrainingExampleStatus(
        exampleId,
        status as ExampleStatus,
        req.user?.id || undefined,
        review_notes
      );
      return res.json(updated);
    }

    // For other updates (like tags), we'd need a more general update function
    // For now, just return error
    return res.status(400).json({
      error: 'Only status updates supported',
      message: 'Use the status field to approve/reject examples',
    });
  } catch (error: any) {
    console.error('[API] Failed to update customer example:', error);
    return res.status(500).json({
      error: 'Failed to update example',
      message: error.message,
    });
  }
});

export default router;
