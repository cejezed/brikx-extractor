# @brikx/extractor-database

Database layer for PvE Analyzer, built on Supabase.

## Architecture Principles

### Single Source of Truth

All extraction-related types (`CustomerExample`, `PatchEvent`, `ClientSignal`, etc.) are imported from `@brikx/extractor-core`. The database package **never** defines its own extraction types.

```typescript
// ✅ CORRECT
import { CustomerExample, PatchEvent } from '@brikx/extractor-core';

// ❌ WRONG - Never redefine core types
type CustomerExample = { ... }
```

### Type Safety

- Database schema defined in SQL migrations
- TypeScript types generated from Supabase (or manually maintained)
- All queries are fully typed

## Setup

### 1. Environment Variables

Create `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Run Migrations

```bash
# Using Supabase CLI
supabase db reset

# Or manually execute
psql -h localhost -U postgres -d postgres -f packages/database/migrations/001_initial_schema.sql
```

### 3. Generate Types (Optional)

```bash
supabase gen types typescript --local > packages/database/types/supabase.ts
```

## Usage

### Creating a Project

```typescript
import { createProject } from '@brikx/extractor-database';

const project = await createProject({
  filename: 'verbouwing-amsterdam.pdf',
  status: 'processing',
  created_by: userId,
});
```

### Updating with Manual Edits

```typescript
import { updateCustomerExample } from '@brikx/extractor-database';

// User edits budget from €250.000 to €300.000
await updateCustomerExample(
  projectId,
  updatedCustomerExample,  // Full CustomerExample object
  userId,
  [
    {
      fieldPath: 'coreData.budget',
      oldValue: 250000,
      newValue: 300000,
    }
  ]
);

// This automatically:
// 1. Saves the edit to manual_edits array
// 2. Regenerates patches using customerExampleToPatches()
// 3. Updates the project
```

### Feature Flags

```typescript
import { isFeatureEnabled, getBrikxExportConfig } from '@brikx/extractor-database';

// Check if Brikx export is enabled
if (await isFeatureEnabled('brikx_export')) {
  const config = await getBrikxExportConfig();
  // { enabled: true, apiUrl: "...", apiKey: "..." }
}
```

## Database Schema

### Projects Table

Stores PvE documents and extraction results.

Key columns:
- `customer_example` (JSONB): `CustomerExample` from core
- `patches` (JSONB): `PatchEvent[]` - only `set | append | remove`
- `manual_edits` (JSONB): Array of `ManualEdit` objects

### Document Chunks Table

Stores text chunks with bounding boxes for PDF highlighting.

### AI Suggestions Table

Stores AI-generated suggestions for review.

### Feature Flags Table

Controls features like Brikx export.

Default flags:
- `brikx_export`: Enable export to Brikx API
- `ai_extraction`: Enable AI-powered extraction
- `pdf_highlighting`: Enable PDF highlighting
- `multi_tenant`: Enable multi-workspace support

## Security

### Row Level Security (RLS)

RLS is enabled on all tables. Currently using permissive development policies.

TODO: Implement proper RLS policies based on:
- `auth.uid()` for user-level access
- `workspace_id` for multi-tenant isolation

### Multi-Tenant Preparation

Schema includes `workspace_id` and `created_by` columns for future multi-tenant support.

## Migration Strategy

Migrations are versioned SQL files in `migrations/`:

- `001_initial_schema.sql` - Initial tables, indexes, RLS
- `002_...sql` - Future migrations

Apply migrations in order using Supabase CLI or psql.
