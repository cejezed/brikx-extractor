# Brikx PvE Analyzer - Web UI

Next.js 15 web interface voor PvE document analyse en Brikx export.

## Stack

- **Next.js 15** - App Router
- **React 19** - Latest stable
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **react-pdf** - PDF viewing

## Setup

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start development server
cd apps/web
pnpm dev
```

App runs on: http://localhost:3000

## Environment Variables

Create `.env.local`:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Pages

### `/` - Home
Landing page met navigatie naar Upload en Overview.

### `/upload` - Upload Page
- Drag & drop file upload
- Supports: PDF, DOCX, TXT
- Real-time extraction progress
- Auto-redirect to /review/[id] when done

### `/overview` - Dashboard
- Projects table with filters
- Statistics cards (budget, wishes, concerns)
- Status filtering
- Export to Brikx actions

### `/review/[id]` - Review Page
- **Left panel**: PDF viewer with text highlighting
- **Right panel**: Extracted data with inline editing
  - Tabs: Basis, Wensen, Signalen, Patches
  - Manual edits tracking
  - Auto-regenerate patches on change
- **Bottom bar**: Save and Export actions

## Architecture

### API Client (`lib/api-client.ts`)

Type-safe wrapper around API endpoints:

```typescript
import { apiClient } from '@/lib/api-client';

// Upload document
const project = await apiClient.uploadDocument(file);

// Get project
const project = await apiClient.getProject(id);

// Update with manual edits
await apiClient.updateProject(id, updatedCustomerExample, changedFields);

// Export to Brikx
await apiClient.exportToBrikx(id);
```

### Components

**Base Components** (`components/ui/`)
- button, card, input, badge, tabs, progress
- From shadcn/ui

**Feature Components** (`components/`)
- `file-upload` - Drag & drop zone
- `pdf-viewer` - PDF rendering with highlighting
- `extracted-data-panel` - Editable data display
- `projects-table` - Data table with filters
- `stats-cards` - Dashboard stats

## Data Flow

```
User uploads file
  ↓
POST /api/projects/upload
  ↓
Backend extracts data
  ↓
Status: processing → review
  ↓
GET /project/[id] - Review UI
  ↓
User makes edits
  ↓
PATCH /api/projects/:id (with manual_edits tracking)
  ↓
Patches auto-regenerated
  ↓
User approves
  ↓
POST /api/projects/:id/export
  ↓
Sent to Brikx (if feature flag enabled)
```

## Type Safety

All types come from `@brikx/extractor-core`:

```typescript
import type {
  CustomerExample,
  PatchEvent,
  ClientSignal,
  ExtractResult
} from '@brikx/extractor-core';
```

No duplicate type definitions - Single Source of Truth maintained.

## TODO

- [ ] Complete shadcn/ui component installation
- [ ] Implement PDF viewer with react-pdf
- [ ] Add real-time WebSocket for extraction progress
- [ ] Implement feature flags UI
- [ ] Add authentication (Supabase Auth)
- [ ] Error boundaries and loading states
- [ ] Responsive mobile layout
- [ ] Dark mode toggle

## Development

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Integration with Brikx

This UI is designed to be integrated into the main Brikx monorepo as `apps/pve-analyzer`.

It uses the same:
- Next.js 15
- Tailwind CSS
- shadcn/ui components
- Supabase for database

Can share authentication and workspace context with main Brikx app.
