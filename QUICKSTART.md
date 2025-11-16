# 🚀 Brikx PvE Analyzer - Quick Start Guide

Complete PvE document analyzer met extractie, review en export naar Brikx.

## ✅ Wat Werkt Nu

### **Fase 1: Backend (100%)** ✅
- ✅ Database (Supabase schema + queries)
- ✅ API endpoints (upload, list, get, patch, export, stats)
- ✅ Feature flags system
- ✅ Manual edits tracking
- ✅ Brikx export (feature flag protected)

### **Fase 2: Frontend (100%)** ✅
- ✅ **Upload Page** - Drag & drop, progress, polling, Excel support
- ✅ **Review Page** - Side-by-side editor met 4 tabs (Basis, Wensen, Signalen, Patches)
- ✅ **Overview Dashboard** - Projects table + stats cards
- ✅ Homepage met navigatie
- ✅ API client (type-safe)
- ✅ UI components (button, card, progress, tabs, table, input, badge, etc.)

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

## 🧪 Testen van de Complete Flow

### **Methode 1: Via Web UI - Complete Flow (Aanbevolen)**

#### 1. **Home** → http://localhost:3000
- 3 cards: Upload, Overview, Settings

#### 2. **Upload Page** → http://localhost:3000/upload
1. Sleep `tests/fixtures/intake.xlsx` (of .txt, .pdf, .docx) naar de dropzone
2. Klik "Upload & Analyseer"
3. Wacht: Upload → Processing → Success ✅
4. Klik "Ga naar Review →"

**Ondersteunde formaten:** PDF, DOCX, TXT, XLSX, XLS (max 50MB)

#### 3. **Review Page** → http://localhost:3000/review/[id]
- **Links:** Document viewer (placeholder)
- **Rechts:** 4 tabs met geëxtraheerde data

**Tab 1 - Basis:**
- Edit projectType (badges: nieuwbouw, verbouwing, etc.)
- Edit budget (€ formatting)
- Edit locatie

**Tab 2 - Wensen:**
- View wishes list
- Add nieuwe wens
- Edit/delete bestaande wensen
- Count: X wensen

**Tab 3 - Signalen:**
- Emotionele signalen met:
  - Type icons (concern, enthusiasm, urgency, etc.)
  - Intensity bars (0-100%)
  - Quote + interpretatie + followup prompt
- Stats: totaal signalen, zorgen count

**Tab 4 - Patches:**
- Read-only view van Brikx patches
- Gegroepeerd per chapter (basis, wensen, budget, etc.)
- Per patch: operation (set/append/remove), path, value

**Acties:**
- Klik "Opslaan" → PATCH API → Patches worden geregenereerd
- Klik "Export naar Brikx" → POST export (als feature flag enabled)

#### 4. **Overview Dashboard** → http://localhost:3000/overview
**Stats Cards (bovenaan):**
- Totaal Projecten (met count in review)
- Totaal Budget (met gemiddelde)
- Totaal Wensen (met gemiddelde)
- Totaal Zorgen (met percentage)

**Projects Table:**
- Search op bestandsnaam
- Filter op status (All, review, approved, etc.)
- Kolommen: Bestand, Type, Budget, Wensen, Status, Datum, Acties
- Klik op row → ga naar Review page
- "X van Y projecten" summary

**Verwacht resultaat na complete flow:**
```
✓ Document geüpload en geanalyseerd
✓ Data bekeken en bewerkt in Review page
✓ Patches automatisch gegenereerd
✓ Wijzigingen opgeslagen
✓ Project zichtbaar in Overview table met stats
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
│       │   ├── page.tsx              ✅ Homepage
│       │   ├── upload/page.tsx       ✅ Upload page
│       │   ├── review/[id]/page.tsx  ✅ Review page
│       │   └── overview/page.tsx     ✅ Overview dashboard
│       ├── components/
│       │   ├── ui/                   ✅ Tabs, Table, Input, Badge, etc.
│       │   ├── review/               ✅ Basis, Wensen, Signalen, Patches tabs
│       │   ├── overview/             ✅ Stats cards, Projects table
│       │   └── file-upload.tsx       ✅ Drag & drop component
│       └── lib/
│           └── api-client.ts         ✅ Type-safe API wrapper
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

## 🚧 Mogelijke Uitbreidingen

### **Review Page Improvements**
- [ ] PDF viewer component (react-pdf integration i.p.v. placeholder)
- [ ] PDF text highlighting met bounding boxes
- [ ] AI suggestions panel (gebruik ai_suggestions table)
- [ ] Manual edits diff viewer (show old vs new values)
- [ ] Field-level change tracking (nu simplified)

### **Overview Dashboard Improvements**
- [ ] Advanced filters (date range, budget range, etc.)
- [ ] Sortable columns
- [ ] Export to CSV/Excel
- [ ] Bulk actions (delete, export multiple)
- [ ] Charts/graphs (budget distribution, project types, etc.)

### **New Pages**
- [ ] Settings page - Feature flags management UI
- [ ] Project details page - Full project history + audit log

### **Advanced Features**
- [ ] Real-time progress (WebSocket instead of polling)
- [ ] Batch upload (multiple files at once)
- [ ] Template management (save/reuse extraction templates)
- [ ] Collaboration (comments, approvals, workflows)
- [ ] Authentication (Supabase Auth + RLS)
- [ ] Multi-tenancy (workspace support)
- [ ] Notifications (email/slack bij nieuwe uploads)

### **Performance & DevOps**
- [ ] Redis caching voor stats
- [ ] Background job queue (Bull/BullMQ)
- [ ] Docker compose setup
- [ ] CI/CD pipeline
- [ ] Monitoring & logging (Sentry, DataDog)

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

✨ **Het PvE Analyzer systeem is volledig functioneel!**

Complete flow werkt van Upload → Review → Export:
- ✅ Upload documenten (PDF, DOCX, TXT, XLSX, XLS)
- ✅ Review en bewerk geëxtraheerde data
- ✅ View en edit wensen, signalen, core data
- ✅ Automatic patch generation (Brikx compatible)
- ✅ Overview dashboard met stats en projecten table
- ✅ Export naar Brikx (feature flag protected)

**Start de servers en test met je eigen PvE documenten!**
