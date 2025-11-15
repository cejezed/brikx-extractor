import express from 'express';
import multer from 'multer';
import { extractFromFile } from '@brikx/extractor-core';
import { unlink } from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/brikx-uploads',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.txt', '.docx', '.pdf'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'brikx-extractor-api' });
});

// Main conversion endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // Extract data from the uploaded file
    const result = await extractFromFile(req.file.path);

    // Clean up temporary file
    await unlink(req.file.path);

    // Return result
    res.json(result);
  } catch (error) {
    console.error('Conversion error:', error);

    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await unlink(req.file.path);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Conversion failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Brikx Extractor API running on http://localhost:${PORT}`);
  console.log(`  POST /convert - Upload and convert documents`);
  console.log(`  GET /health - Health check`);
});
