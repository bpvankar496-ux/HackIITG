# Virasat

> **Every place has a story. Every story deserves to live.**

<p align="center">
  <a href="https://hackiitg.onrender.com/">
    <img src="https://img.shields.io/badge/Live%20Demo-Explore%20Virasat-2ea44f?style=for-the-badge" alt="Live Demo">
  </a>
  <a href="https://github.com/bpvankar496-ux/HackIITG">
    <img src="https://img.shields.io/badge/GitHub-Source%20Code-181717?style=for-the-badge&logo=github" alt="GitHub Repository">
  </a>
</p>

<p align="center">
  <b>Live Website:</b> https://hackiitg.onrender.com/
  <br/>
  <b>Source Code:</b> https://github.com/bpvankar496-ux/HackIITG
</p>

---

## Problem Statement

**Digital Revitalisation of Unstructured Cultural & Architectural Heritage Archives**

## Technology Stack

| Category            | Technologies                 |
| ------------------- | ---------------------------- |
| Frontend            | React 19, TypeScript         |
| Build Tool          | Vite                         |
| Styling             | Tailwind CSS v4              |
| Backend             | Node.js, Vite API Middleware |
| Database            | Supabase PostgreSQL          |
| Authentication      | Supabase Auth                |
| AI & OCR            | Google Gemini                |
| Maps                | Leaflet, OpenStreetMap       |
| Document Processing | pdf-parse                    |
| Testing             | Node.js Test Runner, tsx     |
| Deployment          | Render                       |

---

## 1. Project Overview

**Virasat** is an AI-powered digital heritage research platform designed to preserve, explore, and revitalise India's cultural and architectural heritage.

It transforms fragmented historical documents, colonial-era survey monographs, ancient Sanskrit inscriptions, Persian administrative charters, and archaeological field notes into a searchable, verified, and interconnected digital knowledge platform.

Through AI-powered document understanding, interactive heritage mapping, archival search, and a historical knowledge graph, Virasat makes cultural heritage more accessible to researchers, historians, students, institutions, and heritage enthusiasts.

### Core Architectural Pillars

**1. Interactive Heritage Knowledge Graph**

A visual, force-directed network that models multi-hop relationships across seven heritage dimensions:

- Heritage Sites
- Royal Patrons
- Geographic Places
- Historical Dynasties
- Architectural Traditions
- Documented Events
- Primary Source Charters

**2. Authentic Heritage Corpus**

- 42 monuments across 14 Indian states.
- UNESCO World Heritage and Archaeological Survey of India (ASI) references.
- Architectural style taxonomy including Māru-Gurjara, Nagara, Dravidian, Indo-Islamic, Kalinga, and Nilachal.
- Site-specific Wikimedia Commons photography with attribution.

**3. Archival Vault & Deep Passage Search**

- Full-text search across historical documents and transcribed folios.
- Exact matching sentence snippets.
- Text highlighting and relevance-based ranking.
- Multi-facet filtering.
- XSS-safe text tokenization.

**4. Dual-Path Document Ingestion & Multimodal OCR**

Two document processing paths:

- **Path A – Digital PDFs:** Extraction of embedded text using pdf-parse.
- **Path B – Scanned Manuscripts:** AI-powered visual transcription using Google Gemini.

Supports historical content in:

- Sanskrit (Devanagari)
- Gujarati
- Persian
- Archaic English

Includes confidence scoring, page segmentation, and empty-page detection.

**5. Grounded AI Heritage Research Assistant**

- Retrieval-Augmented Generation (RAG).
- Indexed archival document retrieval.
- Citation-based responses using `[Citation X]` references.
- Prompt injection resistance.
- Anti-hallucination safeguards.
- Responses grounded in available archival evidence.

**6. Geospatial Heritage Map**

- Interactive Leaflet mapping.
- Verified heritage site coordinates.
- OpenStreetMap integration.
- Geographic clustering.
- Geolocated historical survey records.

**7. Researcher Authentication**

- Sign In and Sign Up.
- Password reset functionality.
- Supabase authentication.
- Persistent session management.
- Personal research collections and saved records.
- Google OAuth sign-in support when configured.

---

## 2. Heritage Image Reliability

Virasat uses a central image catalog to maintain consistent and reliable heritage photography.

Key capabilities:

- A canonical site-slug-based image catalog.
- Verified monument photographs.
- Descriptive alternative text.
- Photographer and licence attribution.
- Wikimedia Commons source references.
- Wikimedia `Special:FilePath` image delivery.
- Category-aware fallback images when remote images fail.

The shared image component is used across homepage, Explore, heritage details, collections, legacy modal, and game views.

See `src/data/heritageImages.ts` for the image catalog and attribution details.

---

## 3. Performance & Route Handling

- Main application sections are lazy-loaded.
- Loading fallbacks improve navigation experience.
- Optional 3D viewer functionality is loaded separately.
- Hash-based detail routes are maintained in React state.
- Back navigation reliably returns from `#/heritage/:slug` to `#explore`.
- Leaflet popup values are HTML-escaped before rendering.

---

## 4. Repository Structure

```text
HackIITG/
│
├── .env.example
├── README.md
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
│
├── data/
│   ├── documents_vault.json
│   └── document_pages_vault.json
│
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── LandingPage.tsx
│   │   ├── ExploreView.tsx
│   │   ├── HeritageDetailView.tsx
│   │   ├── HeritageImage.tsx
│   │   ├── KnowledgeGraphRoute.tsx
│   │   ├── ArchiveExplorerView.tsx
│   │   ├── DocumentUploadView.tsx
│   │   ├── DocumentDetailModal.tsx
│   │   ├── ResearchAssistantView.tsx
│   │   ├── HeritageMapView.tsx
│   │   ├── CollectionView.tsx
│   │   ├── AdminImportView.tsx
│   │   ├── ProjectDossier.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginView.tsx
│   │   │   └── SignUpView.tsx
│   │   │
│   │   └── knowledgeGraph/
│   │       ├── KnowledgeGraphView.tsx
│   │       ├── InteractiveGraphCanvas.tsx
│   │       ├── GraphLegend.tsx
│   │       ├── GraphFilterBar.tsx
│   │       ├── GraphControls.tsx
│   │       ├── EntityDetailsPanel.tsx
│   │       ├── RelationshipDetailsPanel.tsx
│   │       ├── GraphListView.tsx
│   │       └── ArchivalExtractionModal.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx
│   │
│   ├── data/
│   │   ├── authenticHeritageDataset.ts
│   │   ├── heritageImages.ts
│   │   ├── seedHeritageSites.ts
│   │   ├── seedKnowledgeGraph.ts
│   │   └── archiveData.ts
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   ├── supabaseAdmin.ts
│   │   └── knowledgeGraphExtraction.ts
│   │
│   ├── server/
│   │   ├── assistantService.ts
│   │   ├── documentRepository.ts
│   │   ├── geminiService.ts
│   │   ├── searchRepository.ts
│   │   └── textExtractionEngine.ts
│   │
│   ├── types/
│   │   ├── database.types.ts
│   │   ├── heritage.ts
│   │   ├── knowledgeGraph.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── archiveSearch.ts
│       ├── archiveSearch.test.ts
│       ├── graphLogic.ts
│       ├── graphLogic.test.ts
│       ├── heritageDataImporter.ts
│       ├── heritageDataImporter.test.ts
│       ├── heritageLogic.ts
│       ├── heritageLogic.test.ts
│       ├── heritageMap.ts
│       ├── heritageMap.test.ts
│       ├── ocrPipeline.ts
│       ├── ocrPipeline.test.ts
│       ├── researchAssistant.ts
│       ├── researchAssistant.test.ts
│       ├── uploadValidation.ts
│       └── uploadValidation.test.ts
│
└── supabase/
    ├── schema.sql
    ├── knowledge_graph.sql
    ├── schema_step2_documents.sql
    ├── schema_step4_document_pages.sql
    └── schema_step5_search.sql
```

---

## 5. Getting Started – Local Installation

Follow these steps to download, configure, and run Virasat on your local machine.

### Prerequisites

Make sure you have the following installed:

| Requirement | Version               |
| ----------- | --------------------- |
| Node.js     | 20.19+ or 22.12+      |
| npm         | 9+                    |
| Git         | Latest stable version |
| Code Editor | VS Code recommended   |

You can verify your installations using:

```bash
node -v
npm -v
git --version
```

### Step 1 – Clone the Repository

Open your terminal and execute:

```bash
git clone https://github.com/bpvankar496-ux/HackIITG.git
```

Navigate into the project directory:

```bash
cd HackIITG
```

### Step 2 – Install Dependencies

Install all required packages:

```bash
npm install
```

This installs the dependencies defined in `package.json` and generates the required `node_modules` directory.

### Step 3 – Configure Environment Variables

Create your local environment configuration file:

```bash
cp .env.example .env.local
```

Open `.env.local` and configure the required API credentials.

### Step 4 – Configure Supabase and Gemini

Add the appropriate credentials to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key

APP_URL=http://localhost:3000

VITE_SUPABASE_URL=your_supabase_project_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GEMINI_MODEL=gemini-3.8-flash

GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite

ALLOW_ANONYMOUS_API=false
```

Replace the example values with your actual credentials.

**Important:**

- Never commit `.env.local` to GitHub.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Only use public Supabase credentials in browser-side code.
- Keep your Gemini API key on the server.
- Do not share private API credentials.

### Step 5 – Run Automated Tests

Before starting the application, run the test suites:

```bash
npm test
```

Alternatively, execute the test files directly:

```bash
npx tsx --test src/utils/*.test.ts
```

### Step 6 – Start the Development Server

Run:

```bash
npm run dev
```

The application will start on:

```text
http://localhost:3000
```

Open the URL in your browser to explore Virasat locally.

---

## 6. Environment Variables

| Variable                    | Required    | Scope  | Purpose                                       |
| --------------------------- | ----------- | ------ | --------------------------------------------- |
| `GEMINI_API_KEY`            | Recommended | Server | Gemini API access for OCR and AI research     |
| `APP_URL`                   | Optional    | Server | Application base URL                          |
| `VITE_SUPABASE_URL`         | Optional    | Client | Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY`    | Optional    | Client | Supabase public authentication key            |
| `GEMINI_MODEL`              | Optional    | Server | Primary Gemini model                          |
| `GEMINI_FALLBACK_MODEL`     | Optional    | Server | Fallback Gemini model                         |
| `ALLOW_ANONYMOUS_API`       | Optional    | Server | Controls anonymous API access where supported |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional    | Server | Private database and storage operations       |

### Offline & Fallback Operation

Virasat includes local fallback data and deterministic processing paths.

When external credentials are unavailable:

- Public heritage browsing can continue.
- Knowledge Graph exploration can use available seed data.
- Local archival data can remain accessible.
- Local search functionality can use the available fallback dataset.

However, features that depend on external services, such as Gemini OCR, authenticated uploads, private storage, and AI research requests, require their respective configurations.

---

## 7. Production Build & Deployment

### Create a Production Build

Run:

```bash
npm run build
```

The production frontend is generated in:

```text
dist/
```

### Run the Production Server

If the configured production server script is available:

```bash
npm start
```

The production server must serve the frontend and support the backend `/api` routes.

### Deployment on Render

Virasat is deployed here:

**Live Application:** https://hackiitg.onrender.com/

**GitHub Repository:** https://github.com/bpvankar496-ux/HackIITG

The application requires a Node.js-compatible hosting environment for server-side functionality.

Recommended deployment configuration:

| Setting          | Value                                      |
| ---------------- | ------------------------------------------ |
| Hosting Platform | Render                                     |
| Runtime          | Node.js                                    |
| Build Command    | `npm install && npm run build`             |
| Start Command    | `npm start`                                |
| Environment      | Configure production environment variables |

Make sure all required environment variables are configured in your Render service settings.

**Deployment Note:** A static-only hosting platform can serve the frontend, but cannot independently execute the Node.js API routes required for OCR, document uploads, signed URLs, and the AI research assistant.

---

## 8. Automated Unit Testing

The project includes pure-logic unit tests using the native Node.js test runner.

Tests execute independently without requiring external network connections.

### Test Coverage

| Test File                      | Coverage                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `graphLogic.test.ts`           | Entity search, relationships, neighborhood traversal, duplicate prevention       |
| `heritageDataImporter.test.ts` | Slug normalization, dataset validation, image attribution, coordinate validation |
| `heritageLogic.test.ts`        | Haversine distance, geofencing, text filtering, OCR chunking                     |
| `heritageMap.test.ts`          | Coordinate validation, clustering, geographic bounding boxes                     |
| `ocrPipeline.test.ts`          | PDF routing, scan detection, Unicode sanitization, page segmentation             |
| `researchAssistant.test.ts`    | Prompt injection defense, citation extraction, grounded responses                |
| `uploadValidation.test.ts`     | File size, MIME validation, metadata validation, coordinate checks               |

### Verification Commands

Run the following commands:

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

You can also run the test suites directly:

```bash
npx tsx --test src/utils/*.test.ts
```

---

## 9. Database Architecture & Supabase Migrations

Virasat uses Supabase PostgreSQL for structured heritage records, document metadata, archival pages, and researcher collections.

Database schemas and Row Level Security (RLS) policies are maintained in the `supabase/` directory.

### Database Migration Files

| Migration                         | Description                                                              |
| --------------------------------- | ------------------------------------------------------------------------ |
| `schema.sql`                      | Base heritage tables, media, saved records, and public read policies     |
| `knowledge_graph.sql`             | Heritage entities, relationships, and evidence tables                    |
| `schema_step2_documents.sql`      | Document metadata, coordinates, full-text indexing, and storage policies |
| `schema_step4_document_pages.sql` | Page-level provenance and unique document-page constraints               |
| `schema_step5_search.sql`         | PostgreSQL full-text search, GIN indexes, and passage ranking            |

### Applying Database Migrations

Configure your Supabase PostgreSQL connection and apply the migrations in the following order:

```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema.sql
```

```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/knowledge_graph.sql
```

```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step2_documents.sql
```

```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step4_document_pages.sql
```

```bash
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema_step5_search.sql
```

Replace `<SUPABASE_HOST>` with your actual database hostname.

Alternatively, execute the SQL migration files through the Supabase SQL Editor in the same order.

---

## 10. Authentication & Google Sign-In

Virasat supports researcher authentication through Supabase Auth.

### Available Authentication Features

- Sign In
- Sign Up
- Password Reset
- Google OAuth
- Persistent authentication sessions
- Private researcher collections

### Supabase Configuration

1. Create a Supabase project.
2. Navigate to Project Settings and obtain your project URL and public key.
3. Add the credentials to `.env.local`.
4. Apply the database migrations.
5. Configure the authentication providers.

### Google OAuth Setup

**Step 1 – Google Cloud Console**

Open Google Cloud Console:

https://console.cloud.google.com/

Navigate to:

APIs & Services → Credentials → Create Credentials → OAuth Client ID.

Choose Web Application.

Add the following authorized redirect URI:

```text
https://<your-project>.supabase.co/auth/v1/callback
```

**Step 2 – Supabase Authentication**

Open your Supabase project.

Navigate to:

Authentication → Providers → Google.

Enable Google authentication and enter your Google OAuth Client ID and Client Secret.

**Step 3 – Configure Redirect URLs**

Navigate to:

Authentication → URL Configuration.

Set the Site URL:

```text
https://hackiitg.onrender.com
```

Add the following Redirect URLs:

```text
https://hackiitg.onrender.com/**
```

```text
http://localhost:3000/**
```

Save the configuration.

### Access Model

The application supports public heritage exploration and researcher authentication.

Private operations, including document uploads, OCR processing, signed URLs, and authenticated research requests, require appropriate authentication and server-side credentials.

If Supabase is not configured, authentication-dependent functionality may be disabled.

---

## 11. AI & Document Processing Architecture

Virasat integrates Google Gemini for multimodal document understanding and archival research.

### Document Processing Pipeline

```text
             Document Upload
                    |
                    v
           File Type Detection
                    |
          +---------+---------+
          |                   |
          v                   v
      Digital PDF        Scanned Document
          |                   |
          v                   v
      pdf-parse          Google Gemini
          |                Vision OCR
          |                   |
          +---------+---------+
                    |
                    v
            Extracted Text
                    |
                    v
          Text Sanitization
                    |
                    v
           Page Segmentation
                    |
                    v
          Archival Indexing
                    |
                    v
          Full-Text Search
                    |
                    v
         AI Research Assistant
                    |
                    v
         Citation-Based Results
```

### AI Research Assistant

The research assistant follows a retrieval-grounded approach:

1. Accept a research question.
2. Retrieve relevant archival passages.
3. Construct a context-grounded prompt.
4. Generate a response using Gemini.
5. Extract citation references.
6. Return evidence-supported results.

The system includes safeguards against prompt injection and unsupported historical claims.

---

## 12. Future Scope

Potential future enhancements include:

- Expanded heritage datasets covering more Indian states.
- Advanced 3D reconstruction of historical monuments.
- More multilingual archival transcription.
- Additional manuscript digitisation workflows.
- Improved historical relationship discovery.
- More institutional archival integrations.
- Advanced heritage discovery and educational experiences.

---

## 13. License & Academic Attribution

### Cultural Data & Provenance

Cultural data and associated project materials are attributed to their respective sources.

The project documentation identifies Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) as the applicable licence for the covered material.

https://creativecommons.org/licenses/by-sa/4.0/

### Archival Sources

Historical and archaeological references include publicly available resources from:

- Archaeological Survey of India (ASI)
- UNESCO World Heritage documentation
- Epigraphia Indica
- Public-domain historical monographs and archival collections
- Wikimedia Commons

Photographs and third-party materials retain their respective source attribution and licensing requirements.

---

## 14. Project Links

<p align="center">
  <a href="https://hackiitg.onrender.com/">
    <b>🌐 Explore Live Website</b>
  </a>
  &nbsp; | &nbsp;
  <a href="https://github.com/bpvankar496-ux/HackIITG">
    <b>💻 View Source Code</b>
  </a>
</p>

---

<p align="center">
  <b>Virasat – Preserving the Past, Connecting the Present, Inspiring the Future.</b>
  <br/>
  Made with the vision of making India's cultural heritage accessible to everyone.
</p>
