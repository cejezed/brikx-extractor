// Brikx PvE Analyzer API
// Main server file

// Load environment variables FIRST
import { config } from 'dotenv';
config(); // This loads .env file

import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';
import featureFlagsRouter from './routes/feature-flags.js';
import customerExamplesRouter from './routes/customer-examples.js';
import { isUsingInMemory } from '@brikx/extractor-database';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'brikx-pve-analyzer-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/projects', customerExamplesRouter); // Customer examples under /api/projects/:id/examples/*
app.use('/api', customerExamplesRouter); // Also mount at /api for /api/examples/:id
app.use('/api/feature-flags', featureFlagsRouter);

// Legacy /convert endpoint (backwards compatibility with original design)
import { Router } from 'express';
import multer from 'multer';
import { extractFromFile } from '@brikx/extractor-core';
import { unlink } from 'fs/promises';

const legacyRouter = Router();
const upload = multer({ dest: '/tmp/brikx-uploads' });

legacyRouter.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[Legacy] Processing file: ${req.file.originalname}`);

    const result = await extractFromFile(req.file.path);
    await unlink(req.file.path);

    res.json(result);
  } catch (error) {
    console.error('[Legacy] Conversion error:', error);

    if (req.file?.path) {
      try {
        await unlink(req.file.path);
      } catch {}
    }

    res.status(500).json({
      error: 'Conversion failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.use('/', legacyRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 50MB',
      });
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Brikx PvE Analyzer API running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health                              - Health check`);
  console.log(`   POST /api/projects/upload                 - Upload PvE document`);
  console.log(`   GET  /api/projects                        - List all projects`);
  console.log(`   GET  /api/projects/stats                  - Get statistics`);
  console.log(`   GET  /api/projects/:id                    - Get project details`);
  console.log(`   PATCH /api/projects/:id                   - Update project (manual edits)`);
  console.log(`   POST /api/projects/:id/export             - Export to Brikx`);
  console.log(`   DELETE /api/projects/:id                  - Delete project`);
  console.log(`   POST /api/projects/:id/examples/generate  - Generate training examples`);
  console.log(`   GET  /api/projects/:id/examples           - List training examples`);
  console.log(`   GET  /api/projects/:id/examples/stats     - Get example statistics`);
  console.log(`   GET  /api/examples/:exampleId             - Get single example`);
  console.log(`   PATCH /api/examples/:exampleId            - Update example status`);
  console.log(`   GET  /api/feature-flags                   - List feature flags`);
  console.log(`   GET  /api/feature-flags/:name             - Get feature flag`);
  console.log(`   PATCH /api/feature-flags/:name            - Update feature flag`);
  console.log(`   POST /convert                             - Legacy convert endpoint\n`);

  // Database status
  if (isUsingInMemory()) {
    console.log(`💾 Database: IN-MEMORY (data lost on restart)`);
    console.log(`   ⚠️  Set SUPABASE_URL and SUPABASE_ANON_KEY in .env for persistent storage\n`);
  } else {
    const dbUrl = process.env.SUPABASE_URL || '';
    const dbHost = dbUrl.replace('https://', '').replace('http://', '').split('/')[0];
    console.log(`💾 Database: ✅ Supabase (${dbHost})`);
    console.log(`🔑 Auth: ${process.env.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Not configured'}\n`);
  }
});
