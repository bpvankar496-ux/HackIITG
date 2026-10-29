# Virasat Quest (विरासत क्वेस्ट)
*Every Place Has a Story. Every Story Deserves to Live.*

Virasat Quest is a digital platform dedicated to the digital revitalisation of unstructured cultural and architectural heritage archives. It transforms dispersed photographs, field notes, epigraphic inscriptions, and colonial-era surveys into a searchable, mapped, and interconnected living archive.

---

## Step 8 — Heritage Knowledge Graph

Step 8 introduces a dedicated, evidence-based **Heritage Knowledge Graph** that connects archival entities across 7 structured heritage dimensions:
1. **Heritage Sites:** Stepwells, forts, temples, palaces, and archaeological complexes (e.g. Rani ki Vav, Adalaj Stepwell, Modhera Sun Temple, Champaner-Pavagadh, Sidi Saiyyed Mosque, Lothal).
2. **People & Patrons:** Historical rulers, queen consorts, architects, and masters (e.g. Queen Udayamati, King Bhima I, Queen Rudabai, Sultan Mahmud Begada, Shaikh Sidi Saiyyed).
3. **Places:** Historic cities, regions, and riverine settlements (Patan, Ahmedabad, Kutch, Gandhinagar).
4. **Historical Periods:** Chaulukya (Solanki) Dynasty, Gujarat Sultanate, Indus Valley (Harappan) Civilisation.
5. **Documented Events:** UNESCO Inscription Sessions, foundation dates, and epigraph consecrations.
6. **Architectural Styles:** Māru-Gurjara stepped pavilion art, Indo-Islamic syncretic tracery, Tree of Life stone lattice screens.
7. **Archival Documents:** Primary source chronicles (Merutunga’s *Prabandha-Chintamani* 1304 CE, *Mirat-i-Ahmadi*), ASI Surveys (Vols. IX, XII, Memoir 78), and UNESCO dossiers.

### Core Step 8 Features
- **Interactive Force Canvas:** Real-time physics layout with pan, pinch/wheel zoom, node dragging, and connection highlighting.
- **Search & Highlighting:** Real-time search across entity names, aliases, and descriptions with pulsing aura markers.
- **Granular Filter Bar:** Multi-select by entity category, relationship type dropdown, and verification status toggle (Verified vs Pending Review).
- **Dual Entity & Relationship Details Panels:** Inspect verbatim archival quotations, page references, and confidence classifications.
- **Archival Extraction & Verification Engine:** Test custom archival texts or sample primary dossiers (ASI reports, epigraphs, chronicles) to propose candidate entities and explicit relationships with page provenance.
- **Accessible Archive Catalogue:** Full keyboard and screen-reader accessible tabular catalogue alternative.
- **Export Capabilities:** Export archival network datasets as standardized JSON.

---

## Database Schema & Migrations

The database models and migrations are located under `/supabase/`:
- `supabase/schema.sql`: Core heritage sites, media, community contributions, and RLS policies.
- `supabase/knowledge_graph.sql`: Step 8 knowledge graph migration:
  - `heritage_entities`: Entity taxonomy, aliases, verification status.
  - `heritage_relationships`: Directed connections, verbatim evidence passages, document references, and evidence classifications.
  - `heritage_evidence`: Folio/page-level citations and archive repository records.
- `supabase/seed.sql` & `supabase/seed_more.sql`: Verified baseline heritage records.
- `supabase/quest_seed.sql`: "The Lost Stories of Gujarat" quest questions and clues.

### Applying Migrations on Supabase
```bash
# Apply schema and knowledge graph tables
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/schema.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/knowledge_graph.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/seed.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/seed_more.sql
psql -h <SUPABASE_HOST> -U postgres -d postgres -f supabase/quest_seed.sql
```

---

## Environment Variables

Copy `.env.example` to `.env`:
```ini
# Optional Gemini AI API Key for Archival Text Extraction
GEMINI_API_KEY="your-gemini-api-key"

# Optional Supabase Configuration (App runs in self-contained offline mode if omitted)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run pure logic unit tests:**
   ```bash
   npx --yes tsx --test src/utils/graphLogic.test.ts
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build production bundle:**
   ```bash
   npm run build
   ```
