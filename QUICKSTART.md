# 🚀 Brikx PvE Analyzer - Quick Start Guide

Complete PvE document analyzer met extractie, review en export naar Brikx.

## ✅ Wat Werkt Nu

### **Fase 1: Backend (100%)** ✅
- ✅ Database (Supabase schema + queries)
- ✅ API endpoints (upload, list, get, patch, export, stats)
- ✅ Feature flags system
- ✅ Manual edits tracking
- ✅ Brikx export (feature flag protected)

### **Fase 2: Frontend**
- ✅ **Upload Page** - Drag & drop, progress, polling
- ✅ Homepage met navigatie
- ✅ API client (type-safe)
- ✅ UI components (button, card, progress)
- ⏳ Review page (nog te bouwen)
- ⏳ Overview dashboard (nog te bouwen)

---

## 🏃 Starten in 3 Stappen

### 1. Install Dependencies

```bash
# Eenmalig - from repo root
pnpm install
pnpm build
```

### 2. Start Backend API

```bash
# Terminal 1
cd services/api
pnpm start

# ✅ API running on: http://localhost:3001
```

**Tip:** Je kunt de API testen zonder database:
```bash
curl http://localhost:3001/health
# → {"status":"ok","service":"brikx-pve-analyzer-api"}
```

### 3. Start Web UI

```bash
# Terminal 2
cd apps/web
pnpm dev

# ✅ Web UI running on: http://localhost:3000
```

---

## 🧪 Testen van de Upload Flow

### **Methode 1: Via Web UI (Aanbevolen)**

1. **Open**: http://localhost:3000
2. **Klik**: "Upload" card
3. **Upload**: Sleep `tests/fixtures/intake.txt` naar de dropzone
4. **Klik**: "Upload & Analyseer"
5. **Wacht**: Upload (progress bar) → Processing (spinner) → Success ✅
6. **Bekijk**: Extracted data preview (budget €250.000, type "verbouwing", etc.)

**Verwacht resultaat:**
```
✓ Extractie Succesvol!
Project Type: verbouwing
Budget: €250.000
Locatie: Amsterdam
4 Wensen, 7 Emotionele Signalen
```

### **Methode 2: Via CLI (Voor debugging)**

```bash
# Terminal 3
node packages/cli/dist/bin/brikx-extract.js tests/fixtures/intake.txt --out ./out

# Output: out/intake.extract.json
cat out/intake.extract.json | jq '.customerExample.coreData'
# → {"projectType":"verbouwing","budget":250000,"locatie":"Amsterdam"}
```

### **Methode 3: Via API Direct**

```bash
curl -X POST http://localhost:3001/api/projects/upload \
  -F "file=@tests/fixtures/intake.txt"

# Response:
# {
#   "success": true,
#   "project": {
#     "id": "uuid",
#     "status": "review",
#     "customer_example": {...},
#     "patches": [...]
#   }
# }
```

---

## 📊 API Endpoints Overzicht

### **Projects**
```bash
# Upload document
POST /api/projects/upload
  → Body: multipart/form-data with 'file'
  → Returns: { success, project }

# List all projects
GET /api/projects
  → Query: ?status=review&search=amsterdam
  → Returns: { projects: [...] }

# Get single project
GET /api/projects/:id
  → Query: ?includeChunks=true&includeSuggestions=true
  → Returns: { project: {...} }

# Update with manual edits
PATCH /api/projects/:id
  → Body: { customer_example, changed_fields }
  → Returns: { success, project }

# Export to Brikx
POST /api/projects/:id/export
  → Returns: { success, message, brikx_response }

# Get stats
GET /api/projects/stats
  → Returns: { stats: { total, totalBudget, ... } }
```

### **Feature Flags**
```bash
# List flags
GET /api/feature-flags
  → Returns: { flags: [...] }

# Update flag
PATCH /api/feature-flags/brikx_export
  → Body: { enabled: true, config: { apiUrl, apiKey } }
  → Returns: { success, flag }
```

---

## 🗂️ Project Structuur

```
brikx-extractor/
├── packages/
│   ├── core/              ✅ Extraction logic (extractFromFile, types)
│   ├── cli/               ✅ CLI tool (brikx-extract command)
│   └── database/          ✅ Supabase schema & queries
├── services/
│   └── api/               ✅ Express REST API
├── apps/
│   └── web/               ✅ Next.js 15 UI
│       ├── app/
│       │   ├── page.tsx           ✅ Homepage
│       │   └── upload/page.tsx    ✅ Upload page
│       ├── components/
│       │   ├── ui/                ✅ Button, Card, Progress
│       │   └── file-upload.tsx    ✅ Drag & drop component
│       └── lib/
│           └── api-client.ts      ✅ Type-safe API wrapper
└── tests/
    └── fixtures/          ✅ Sample PvE documents
```

---

## 🎯 Data Flow (Complete Pipeline)

```
1. User uploads file (Web UI)
   ↓
2. POST /api/projects/upload (API)
   ↓
3. extractFromFile() (packages/core)
   ↓
4. Parse document → Extract data → Generate patches
   ↓
5. Save to database (packages/database)
   ↓
6. Return project with status: 'review'
   ↓
7. Web UI polls status until 'review'
   ↓
8. Show success card with preview
   ↓
9. [Next] User clicks "Review" → /review/[id] page
   ↓
10. [Next] User edits data → PATCH /api/projects/:id
   ↓
11. [Next] User exports → POST /api/projects/:id/export
```

---

## 🔧 Troubleshooting

### API niet bereikbaar
```bash
# Check of API draait
curl http://localhost:3001/health

# Start API opnieuw
cd services/api
pnpm build
pnpm start
```

### Web UI build errors
```bash
cd apps/web
rm -rf .next node_modules
pnpm install
pnpm dev
```

### Upload werkt niet
1. Check of API draait op port 3001
2. Check browser console voor errors
3. Test API direct met curl (zie boven)
4. Check CORS settings in services/api/src/server.ts

### Database errors (als je Supabase gebruikt)
```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-key

# Of gebruik local development
# API werkt ook zonder database (in-memory)
```

---

## 🚧 Wat Nog Moet

### **UI Pages**
- [ ] Review page (`/review/[id]`) - Side-by-side PDF viewer + editable data
- [ ] Overview dashboard (`/overview`) - Projects table + stats
- [ ] Settings page - Feature flags management

### **Components**
- [ ] PDF viewer component (react-pdf integration)
- [ ] Extracted data panel (tabs: Basis, Wensen, Signalen, Patches)
- [ ] Projects table with filters
- [ ] Stats cards (budget, wishes, concerns)

### **Features**
- [ ] Real-time progress (WebSocket instead of polling)
- [ ] PDF text highlighting (bounding boxes)
- [ ] Manual edits diff viewer
- [ ] Feature flags UI
- [ ] Authentication (Supabase Auth)

---

## 📚 Meer Info

- **API Docs**: `services/api/README.md`
- **Database Schema**: `packages/database/README.md`
- **Web UI**: `apps/web/README.md`
- **Type Definitions**: `packages/core/src/types/`

## 💡 Tips

**Voor development:**
```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Build everything
pnpm build
```

**Voor production:**
```bash
# Set environment variables
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api.example.com

# Build
pnpm build

# Start
pnpm --filter api start
pnpm --filter web start
```

---

✨ **De Upload flow werkt 100%!** Test het nu met je eigen PvE documenten!
