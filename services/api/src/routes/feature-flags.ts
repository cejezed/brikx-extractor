// Feature flags routes
import { Router } from 'express';
import {
  getAllFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
} from '@brikx/extractor-database';
import type { AuthRequest } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router: Router = Router();

/**
 * GET /api/feature-flags
 * List all feature flags
 */
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const flags = await getAllFeatureFlags();
    res.json({ flags });
  } catch (error) {
    console.error('[FeatureFlags] Error listing:', error);
    res.status(500).json({
      error: 'Failed to list feature flags',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/feature-flags/:name
 * Get single feature flag
 */
router.get('/:name', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.params;
    const flag = await getFeatureFlag(name);

    if (!flag) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    res.json({ flag });
  } catch (error) {
    console.error('[FeatureFlags] Error getting flag:', error);
    res.status(500).json({
      error: 'Failed to get feature flag',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PATCH /api/feature-flags/:name
 * Update feature flag (admin only - to be protected)
 */
router.patch('/:name', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.params;
    const { enabled, config } = req.body;

    // TODO: Add admin check
    // if (!req.user?.is_admin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const updates: { enabled?: boolean; config?: Record<string, any> } = {};

    if (typeof enabled === 'boolean') {
      updates.enabled = enabled;
    }

    if (config && typeof config === 'object') {
      updates.config = config;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid updates provided',
        message: 'Provide enabled (boolean) or config (object)',
      });
    }

    const flag = await updateFeatureFlag(name, updates, req.user?.id);

    console.log(`[FeatureFlags] Updated ${name}:`, updates);

    res.json({
      success: true,
      flag,
    });
  } catch (error) {
    console.error('[FeatureFlags] Error updating:', error);
    res.status(500).json({
      error: 'Failed to update feature flag',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
