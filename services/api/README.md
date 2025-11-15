# @brikx/extractor-api

REST API for PvE Analyzer - handles document upload, extraction, review, and export to Brikx.

## Architecture

This API is the bridge between:
- **Frontend UI** (apps/web) - uploads documents, displays results
- **Core extraction** (@brikx/extractor-core) - document parsing and data extraction
- **Database** (@brikx/extractor-database) - Supabase persistence
- **Brikx platform** - final destination for approved patches

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
```

### 2. Database Setup

Run migrations (from packages/database):

```bash
cd ../../packages/database
# Apply migration 001_initial_schema.sql to your Supabase project
```

### 3. Start Server

```bash
pnpm install
pnpm build
pnpm start
```

Or in development with hot reload:

```bash
pnpm build
pnpm dev
```

## API Endpoints

### Projects

#### `POST /api/projects/upload`

Upload and process a PvE document.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, DOCX, or TXT)

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "filename": "verbouwing-amsterdam.pdf",
    "status": "review",
    "customer_example": { ... },
    "patches": [ ... ],
    "confidence": 0.85,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Status Flow:**
1. `uploading` → File uploaded
2. `processing` → Extraction in progress
3. `review` → Ready for human review
4. `approved` → Reviewed and approved
5. `exported` → Sent to Brikx
6. `error` → Extraction failed

#### `GET /api/projects`

List all projects with optional filters.

**Query Params:**
- `status` - Filter by status (e.g., `?status=review`)
- `search` - Search in filename (e.g., `?search=amsterdam`)

**Response:**
```json
{
  "projects": [
    { "id": "...", "filename": "...", "status": "review", ... }
  ]
}
```

#### `GET /api/projects/stats`

Get aggregated statistics for dashboard.

**Response:**
```json
{
  "stats": {
    "total": 15,
    "byStatus": {
      "review": 5,
      "approved": 8,
      "exported": 2
    },
    "totalBudget": 3500000,
    "totalWishes": 42,
    "totalConcerns": 12,
    "totalEnthusiasm": 18
  }
}
```

#### `GET /api/projects/:id`

Get single project with optional relations.

**Query Params:**
- `includeChunks=true` - Include document chunks (for PDF highlighting)
- `includeSuggestions=true` - Include AI suggestions

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "customer_example": {
      "coreData": {
        "projectType": "verbouwing",
        "budget": 250000,
        "locatie": "Amsterdam"
      },
      "wishes": ["Open keuken", "Moderne badkamer"],
      "emotionalSignals": [
        {
          "type": "concern",
          "intensity": 0.75,
          "quote": "Ik maak me zorgen over het budget",
          "interpretedIntent": "...",
          "followupPrompt": "..."
        }
      ]
    },
    "patches": [
      {
        "chapter": "basis",
        "delta": {
          "path": "projectType",
          "operation": "set",
          "value": "verbouwing"
        }
      }
    ],
    "manual_edits": [],
    "chunks": [ ... ],    // if includeChunks=true
    "suggestions": [ ... ] // if includeSuggestions=true
  }
}
```

#### `PATCH /api/projects/:id`

Update project with manual edits.

**IMPORTANT:** This maintains the Single Source of Truth principle:
1. You send the updated `CustomerExample`
2. API tracks what changed in `manual_edits`
3. API regenerates `patches` using `customerExampleToPatches()` from core
4. No manual patch manipulation!

**Request:**
```json
{
  "customer_example": {
    "coreData": {
      "projectType": "verbouwing",
      "budget": 300000,  // Changed from 250000
      "locatie": "Amsterdam"
    },
    "wishes": ["Open keuken", "Moderne badkamer", "Vloerverwarming"],
    "emotionalSignals": [ ... ]
  },
  "changed_fields": [
    {
      "fieldPath": "coreData.budget",
      "oldValue": 250000,
      "newValue": 300000
    },
    {
      "fieldPath": "wishes[2]",
      "oldValue": null,
      "newValue": "Vloerverwarming"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "customer_example": { ... },  // Updated
    "patches": [ ... ],            // Regenerated
    "manual_edits": [              // Tracked
      {
        "fieldPath": "coreData.budget",
        "oldValue": 250000,
        "newValue": 300000,
        "editedAt": "2025-01-15T11:00:00Z",
        "editedBy": "user-id"
      }
    ]
  }
}
```

#### `POST /api/projects/:id/export`

Export project patches to Brikx.

**Preconditions:**
1. Feature flag `brikx_export` must be enabled
2. Feature flag must have `apiUrl` and `apiKey` configured
3. Project status must be `review` or `approved`

**Response (success):**
```json
{
  "success": true,
  "message": "Project exported to Brikx",
  "brikx_response": { ... }
}
```

**Response (feature disabled):**
```json
{
  "error": "Brikx export is not enabled",
  "message": "Contact administrator to enable..."
}
```

**What happens:**
1. Builds `ExtractResult` from project data
2. POSTs to Brikx API configured in feature flag
3. Updates project status to `exported`
4. Stores Brikx response

#### `DELETE /api/projects/:id`

Delete a project (cascades to chunks and suggestions).

**Response:**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

### Feature Flags

#### `GET /api/feature-flags`

List all feature flags.

**Response:**
```json
{
  "flags": [
    {
      "id": "uuid",
      "flag_name": "brikx_export",
      "enabled": false,
      "config": {
        "apiUrl": "",
        "apiKey": ""
      },
      "description": "Enable export to Brikx API"
    },
    {
      "flag_name": "ai_extraction",
      "enabled": true,
      "config": {
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  ]
}
```

#### `GET /api/feature-flags/:name`

Get single feature flag.

**Example:** `GET /api/feature-flags/brikx_export`

#### `PATCH /api/feature-flags/:name`

Update feature flag (admin only - TODO: add proper auth).

**Request:**
```json
{
  "enabled": true,
  "config": {
    "apiUrl": "https://brikx.app/api/events/intake",
    "apiKey": "brikx_key_xxx"
  }
}
```

### Legacy Endpoint

#### `POST /convert`

Legacy endpoint for backwards compatibility. Simply extracts document without saving to database.

**Request:** Same as `/api/projects/upload`

**Response:** Raw `ExtractResult`

## Type Safety & Single Source of Truth

All extraction types come from `@brikx/extractor-core`:

```typescript
import type {
  CustomerExample,
  PatchEvent,
  ExtractResult
} from '@brikx/extractor-core';
```

The API **never** defines its own extraction types. Database schemas use JSONB columns to store these types exactly as defined in core.

## Manual Edits Tracking

Every manual edit is tracked with:
- `fieldPath`: JSON path to the edited field
- `oldValue`: Previous value
- `newValue`: New value
- `editedAt`: ISO timestamp
- `editedBy`: User ID

This creates an audit trail for all human modifications to AI-extracted data.

## Security

### Current State (Development)
- Permissive auth (optional tokens)
- No RLS enforcement
- Feature flag updates are unprotected

### TODO
- [ ] Implement JWT validation with Supabase
- [ ] Enable RLS policies
- [ ] Add admin role check for feature flags
- [ ] Add workspace-based multi-tenancy
- [ ] Rate limiting
- [ ] File upload virus scanning

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Upload a document
curl -X POST http://localhost:3001/api/projects/upload \
  -F "file=@tests/fixtures/intake.txt"

# Get all projects
curl http://localhost:3001/api/projects

# Get stats
curl http://localhost:3001/api/projects/stats

# Export to Brikx (will fail if not configured)
curl -X POST http://localhost:3001/api/projects/{id}/export
```

## Error Handling

All errors return JSON:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": { ... }  // Optional
}
```

Common status codes:
- `400` - Bad request (missing params, invalid data)
- `401` - Unauthorized (when auth is enforced)
- `403` - Forbidden (feature disabled, insufficient permissions)
- `404` - Not found
- `500` - Internal server error

## Logging

All endpoints log to console with prefixes:
- `[Upload]` - File upload and extraction
- `[Get]`, `[List]`, `[Update]`, `[Delete]` - CRUD operations
- `[Export]` - Brikx export operations
- `[FeatureFlags]` - Feature flag operations
- `[Error]` - Global error handler

In production, pipe to proper logging service (e.g., Winston, Pino).
