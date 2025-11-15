# Brikx Extractor

Een TypeScript/Node.js monorepo voor het extraheren van gestructureerde klantdata uit documenten (docx, pdf, txt) voor het Brikx platform.

## Structuur

```
brikx-extractor/
├── packages/
│   ├── core/          # Kernfunctionaliteit voor extractie
│   └── cli/           # Command-line interface
├── services/
│   └── api/           # REST API service
└── tests/             # Tests en fixtures
```

## Features

- **Document Parsing**: Ondersteunt .txt, .docx en .pdf bestanden
- **Data Extractie**: Haalt automatisch projecttype, budget, locatie en wensen uit tekst
- **Emotionele Signalen**: Detecteert twijfel, enthousiasme, zorgen en andere emoties
- **Brikx Compatible**: Genereert `PatchEvent[]` compatible met Brikx v3.0 data architectuur
- **CLI Tool**: `brikx-extract` command voor directe conversie
- **API Service**: REST endpoint voor documentverwerking

## Installatie

```bash
# Clone repository
git clone <repo-url>
cd brikx-extractor

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Gebruik

### CLI

```bash
# Basic usage
pnpm --filter cli brikx-extract ./intake.txt

# Specify output directory
pnpm --filter cli brikx-extract ./intake.docx --out ./output

# Emit to Brikx endpoint
pnpm --filter cli brikx-extract ./intake.pdf --emit http://localhost:3000/api/events/intake
```

### API Service

```bash
# Start API server
pnpm --filter api start

# POST /convert - Upload document
curl -X POST http://localhost:3001/convert \
  -F "file=@intake.txt"

# GET /health - Health check
curl http://localhost:3001/health
```

### Programmatic

```typescript
import { extractFromFile } from '@brikx/extractor-core';

const result = await extractFromFile('./intake.txt');

console.log(result.customerExample);
console.log(result.patches);
console.log(result.meta);
```

## Type Definities

### PatchEvent (Brikx v3.0 compatible)

```typescript
type ChapterKey = 'basis' | 'ruimtes' | 'wensen' | 'budget' | 'techniek' | 'duurzaam' | 'risico';

type PatchDelta = {
  path: string;
  operation: 'set' | 'append' | 'remove';
  value?: any;
};

type PatchEvent = {
  chapter: ChapterKey;
  delta: PatchDelta;
};
```

### CustomerExample

```typescript
type CustomerExample = {
  coreData: {
    projectType?: string;
    budget?: number;
    locatie?: string;
  };
  wishes: string[];
  emotionalSignals: ClientSignal[];
};
```

## Development

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Type check
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Tests

De test suite bevat:

- Unit tests voor extractie modules (normalize, signals, toPatches)
- Integratietests voor de volledige extractie pipeline
- Test fixtures met realistische intake documenten

```bash
pnpm test
```

## Architectuur

### Extractie Pipeline

1. **Parsers** - Document naar tekst (docx/pdf/txt)
2. **Normalize** - Core data extractie (budget, type, locatie)
3. **Extract Wishes** - Wensen uit tekst halen
4. **Extract Signals** - Emotionele signalen detecteren
5. **To Patches** - Conversie naar Brikx PatchEvent[]

### Modules

- `packages/core` - Kernlogica, geen dependencies op andere packages
- `packages/cli` - CLI tool, gebruikt `@brikx/extractor-core`
- `services/api` - Express API, gebruikt `@brikx/extractor-core`

## Roadmap

- [ ] LLM-powered extractie voor betere nauwkeurigheid
- [ ] Ondersteuning voor meer documentformaten
- [ ] Confidence scoring verbetering
- [ ] Batch processing
- [ ] Web UI voor documentupload

## Licentie

Proprietary - Brikx
