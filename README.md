# Virasat Quest

> **Every place has a story. Every story deserves to live.**  
> **Problem Statement:** *Digital Revitalisation of Unstructured Cultural & Architectural Heritage Archives*  
> **Platform:** React 19, TypeScript, Vite, Tailwind CSS v4, Supabase, Google Gemini 3.8 Flash, Leaflet

---

## 1. Project Overview

**Virasat Quest** is a scholarly digital platform engineered for the revitalisation of unstructured cultural and architectural heritage archives. It transforms fragmented colonial-era survey monographs (such as Dr. James Burgess's *Architectural Surveys of Western India*), ancient Sanskrit stone epigraphs, Persian administrative charters, and unindexed archaeological field notes into a searchable, verified, and AI-grounded living knowledge platform.

### Core Architectural Pillars

1. **Interactive Heritage Knowledge Graph:** Visual, force-directed simulation network modeling multi-hop relationships across 7 heritage dimensions: Heritage Sites, Royal Patrons, Geographic Places, Historical Dynasties, Architectural Traditions, Documented Events, and Primary Source Charters.
2. **Authentic Heritage Corpus:** 38 rigorously verified monuments across 13 Indian states with official UNESCO World Heritage and Archaeological Survey of India (ASI) citations, architectural style taxonomy (Māru-Gurjara, Nagara, Dravidian, Indo-Islamic, Kalinga, Nilachal), and high-resolution photography.
3. **Archival Vault & Deep Passage Search:** Full-text search engine querying historical documents and transcribed folios, extracting exact matching sentence snippets with XSS-safe text tokenization and multi-facet filtering.
4. **Dual-Path Document Ingestion & Gemini Multi-Modal OCR:**
   - **Path A (Digital PDFs):** Fast, deterministic extraction of embedded font streams via `pdf-parse` (0.99 confidence).
   - **Path B (Scanned Manuscripts & Plates):** Visual transcription via Google Gemini (`gemini-3.8-flash`) preserving Sanskrit (Devanagari), Gujarati, Persian, and archaic English orthography with confidence scoring and empty-page detection.
5. **Grounded AI Heritage Research Assistant:** Server-side RAG pipeline querying indexed folios with strict `[Citation X]` attribution, prompt injection resistance, and an anti-hallucination policy that refuses ungrounded claims.
6. **Geospatial Heritage Map:** Interactive Leaflet cartography linking monuments to verified GPS coordinates, clustering proximate records, and displaying geolocated survey plates on OpenStreetMap tiles.
7. **Researcher Authentication:** Dedicated Sign In, Sign Up, and Password Reset screens backed by Supabase Auth with persistent session state and private record bookmarking.

---

## 2. Repository Structure

```
├── .env.example                     # Environment variables template
├── README.md                        # Documentation and architecture guide
├── index.html                       # HTML entry point with fonts & Leaflet styling
├── metadata.json                    # AI Studio applet capabilities and permissions
├── package.json                     # Dependencies and test scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite configuration with custom API backend middleware
├── data/
│   ├── documents_vault.json         # Pre-seeded authentic historical documents
│   └── document_pages_vault.json    # Transcribed page folios with provenance
├── src/
│   ├── App.tsx                      # Primary router and application state coordinator
│   ├── main.tsx                     # React 19 root entry point
│   ├── index.css                    # Tailwind CSS v4 editorial theme and custom scrollbars
│   ├── components/
│   │   ├── Header.tsx               # Responsive editorial navigation and user menu
│   │   ├── Footer.tsx               # Academic attribution footer and module links
│   │   ├── LandingPage.tsx          # Clean 9-section homepage
│   │   ├── ExploreView.tsx          # Searchable heritage monuments with state filters
│   │   ├── HeritageDetailView.tsx   # Monument dossier view with 3D status & inscriptions
│   │   ├── ArchiveExplorerView.tsx  # Deep passage search and document catalogue
│   │   ├── DocumentUploadView.tsx   # Document upload form with drag-and-drop & metadata validation
│   │   ├── DocumentDetailModal.tsx  # Page-by-page folio reader and signed URL generator
│   │   ├── ResearchAssistantView.tsx# Grounded AI research assistant with citation viewer
│   │   ├── HeritageMapView.tsx      # Geospatial Leaflet map with coordinate clustering
│   │   ├── CollectionView.tsx       # Personal research passport and saved records
│   │   ├── AdminImportView.tsx      # CSV batch ingestion and dataset audit engine
│   │   ├── ProjectDossier.tsx       # Architecture dossier and Supabase health diagnostics
│   │   ├── auth/
│   │   │   ├── LoginView.tsx        # Sign In page with show/hide password and reset flow
│   │   │   └── SignUpView.tsx       # Registration page with real-time validation
│   │   └── knowledgeGraph/          # Step 8 Knowledge Graph module
│   │       ├── KnowledgeGraphView.tsx
│   │       ├── InteractiveGraphCanvas.tsx
│   │       ├── GraphLegend.tsx
│   │       ├── GraphFilterBar.tsx
│   │       ├── GraphControls.tsx
│   │       ├── EntityDetailsPanel.tsx
│   │       ├── RelationshipDetailsPanel.tsx
│   │       ├── GraphListView.tsx
│   │       └── ArchivalExtractionModal.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx          # Supabase authentication session state provider
│   ├── data/
│   │   ├── authenticHeritageDataset.ts # Canonical 38-site verified heritage corpus
│   │   ├── seedHeritageSites.ts     # Seed heritage sites exporter
│   │   ├── seedKnowledgeGraph.ts    # Seed graph entities and relationships
│   │   └── archiveData.ts           # Archival document catalogue
│   ├── lib/
│   │   ├── supabaseClient.ts        # Browser Supabase client (Anon key only)
│   │   ├── supabaseAdmin.ts         # Server-only Supabase client (Service role)
│   │   └── knowledgeGraphExtraction.ts # Deterministic citation & relationship extractor
│   ├── server/                      # Server-side API services (mounted in Vite middleware)
│   │   ├── assistantService.ts      # Grounded RAG query processor & Gemini caller
│   │   ├── documentRepository.ts    # Supabase Storage & document database operations
│   │   ├── geminiService.ts         # Multi-modal vision OCR service
│   │   ├── searchRepository.ts      # Full-text passage search engine
│   │   └── textExtractionEngine.ts  # Dual-path extraction pipeline coordinator
│   ├── types/
│   │   ├── database.types.ts        # Document and page schema types
│   │   ├── heritage.ts              # Heritage site and import batch types
│   │   ├── knowledgeGraph.ts        # Knowledge graph entities, edges, and filter types
│   │   └── index.ts                 # Shared domain models
│   └── utils/
│       ├── archiveSearch.ts         # Passage ranking, snippet extraction, and text highlighting
│       ├── archiveSearch.test.ts    # Search logic unit tests
│       ├── graphLogic.ts            # Graph filtering, search, and neighborhood traversal
│       ├── graphLogic.test.ts       # Graph logic unit tests
│       ├── heritageDataImporter.ts  # CSV batch validation and slug normalization
│       ├── heritageDataImporter.test.ts # Data importer unit tests
│       ├── heritageLogic.ts         # Haversine coordinate math and text chunking
│       ├── heritageLogic.test.ts    # Heritage logic unit tests
│       ├── heritageMap.ts           # Coordinate validation and geographic bounding boxes
│       ├── heritageMap.test.ts      # Map logic unit tests
│       ├── ocrPipeline.ts           # Extraction route determination and text sanitization
│       ├── ocrPipeline.test.ts      # OCR pipeline unit tests
│       ├── researchAssistant.ts     # Prompt construction, injection defense, and citation extraction
│       ├── researchAssistant.test.ts# Assistant unit tests
│       ├── uploadValidation.ts      # File MIME, size, and metadata validation
│       └── uploadValidation.test.ts # Upload validation unit tests
└── supabase/
    ├── schema.sql                   # Core heritage schema and RLS policies
    ├── knowledge_graph.sql          # Step 8 Knowledge Graph tables and seed epigraphs
    ├── schema_step2_documents.sql   # Document metadata schema and private storage policies
    ├── schema_step4_document_pages.sql # Document pages schema with idempotent unique constraints
    └── schema_step5_search.sql      # PostgreSQL FTS stored procedure and GIN indexes
```

---

## 3. Environment Variables

Create a local environment configuration file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

| Variable | Required | Scope | Purpose |
| :--- | :---: | :---: | :--- |
| `GEMINI_API_KEY` | Recommended | Server | Google Gemini API key used by the multi-modal OCR pipeline and the grounded AI research assistant. |
| `APP_URL` | Optional | Server | Canonical base URL of the deployment (defaults to `http://localhost:3000`). |
| `VITE_SUPABASE_URL` | Optional | Client | Supabase project URL for database queries and user authentication. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Client | Supabase publishable anonymous key for browser authentication and public reads. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server | Supabase service-role secret key. **Never exposed to the client.** Used by the backend API for private storage uploads and signed URLs. |

> **Note on Offline Operation:** The application includes self-contained, deterministic fallback vaults in `/data/` and robust fallback synthesizers. If Supabase or Gemini keys are not configured, all public heritage browsing, Knowledge Graph exploration, document viewing, and full-text search continue to function locally without crashing.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js 18.x or 20.x
- npm 9+ or 10+ (or Bun)

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/bpvankar496-ux/HackathonIITG.git
cd HackathonIITG

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Run automated test suites
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Unit Tests

The codebase includes 52 pure-logic unit tests executing via the native `node:test` runner. All tests run in complete isolation without external network dependencies:

```bash
# Execute all test suites
npx tsx --test src/utils/*.test.ts
```

### Test Coverage Highlights
- **`graphLogic.test.ts` (7 tests):** Entity search, referential integrity filtering, 1-hop neighborhood calculation, duplicate extraction prevention, in-situ epigraph vs. AI confidence categorization, and zero orphaned edges verification.
- **`heritageDataImporter.test.ts` (7 tests):** Slug normalization, schema validation of all 38 authentic records, coordinate boundaries, and idempotent batch ingestion.
- **`heritageLogic.test.ts` (4 tests):** Haversine GPS distance math, geofencing threshold verification, multi-token text filtering, and OCR passage chunking.
- **`heritageMap.test.ts` (7 tests):** Coordinate boundaries, cardinal notation formatting, partition of mapped vs. unmapped records, co-located marker clustering, and geographic bounding boxes.
- **`ocrPipeline.test.ts` (9 tests):** MIME routing, digital PDF vs. visual scan detection, Unicode sanitization, multilingual word counts, degraded scan review flags, and page segmentation.
- **`researchAssistant.test.ts` (6 tests):** Inquiry length validation, prompt injection defense, bracket token extraction (`[Citation X]`), and grounded fallback synthesis.
- **`uploadValidation.test.ts` (7 tests):** File size limits (20MB), MIME enforcement, metadata validation, coordinate range checks, and collision-resistant path generation.

---

## 6. Database Migrations (Supabase PostgreSQL)

Database schemas and Row Level Security (RLS) policies are codified under `/supabase/`:

1. **`supabase/schema.sql`:** Base tables (`heritage_sites`, `heritage_media`, `saved_heritage`) and public read policies.
2. **`supabase/knowledge_graph.sql`:** Knowledge graph tables (`heritage_entities`, `heritage_relationships`, `heritage_evidence`) and primary inscriptional seed records.
3. **`supabase/schema_step2_documents.sql`:** Metadata table (`public.documents`), coordinate constraints, `tsvector` generated column, and private storage bucket policies for `historical_archives`.
4. **`supabase/schema_step4_document_pages.sql`:** Page-level provenance schema (`public.document_pages`) with unique constraint on `(document_id, page_number)`.
5. **`supabase/schema_step5_search.sql`:** Stored procedure `search_archive_passages` with GIN indexing, `ts_headline` generation, and `ts_rank_cd` relevance ranking.

To apply migrations on an external Supabase database:
```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/knowledge_graph.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step2_documents.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step4_document_pages.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step5_search.sql
```

---

## 7. License & Academic Attribution

- **Cultural Data & Provenance:** Published under the [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/) license.
- **Archival Citations:** Primary archaeological monographs and epigraphical records are sourced from public domain collections of the Archaeological Survey of India (ASI), Epigraphia Indica, and UNESCO World Heritage nomination dossiers.
