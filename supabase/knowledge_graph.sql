-- Virasat Quest: knowledge graph tables.
-- The app ships its seed graph in src/data/seedKnowledgeGraph.ts, so these
-- tables start empty and are meant for community and AI-proposed additions.

create table if not exists public.heritage_entities (
  id text primary key,
  slug text not null unique,
  name text not null,
  entity_type text not null check (entity_type in (
    'heritage_site', 'person', 'place', 'historical_period', 'event',
    'architectural_style', 'document')),
  description text not null default '',
  aliases text[] not null default '{}',
  supporting_site_slug text,
  verification_status text not null default 'pending'
    check (verification_status in ('verified', 'pending', 'community', 'disputed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.heritage_relationships (
  id text primary key,
  source_entity_id text not null references public.heritage_entities (id) on delete cascade,
  target_entity_id text not null references public.heritage_entities (id) on delete cascade,
  relationship_type text not null,
  supporting_doc_title text not null,
  supporting_doc_url text,
  supporting_passage text not null,
  page_number text,
  evidence_classification text not null,
  verification_status text not null default 'pending'
    check (verification_status in ('verified', 'pending', 'community', 'disputed')),
  confidence_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.heritage_evidence (
  id text primary key,
  relationship_id text not null references public.heritage_relationships (id) on delete cascade,
  document_title text not null,
  citation_reference text not null,
  excerpt text not null,
  page_or_plate text,
  archive_repository text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists heritage_rel_source_idx on public.heritage_relationships (source_entity_id);
create index if not exists heritage_rel_target_idx on public.heritage_relationships (target_entity_id);
create index if not exists heritage_evidence_rel_idx on public.heritage_evidence (relationship_id);

alter table public.heritage_entities enable row level security;
alter table public.heritage_relationships enable row level security;
alter table public.heritage_evidence enable row level security;

drop policy if exists "Verified entities are public" on public.heritage_entities;
create policy "Verified entities are public" on public.heritage_entities
  for select using (verification_status in ('verified', 'community'));

drop policy if exists "Verified relationships are public" on public.heritage_relationships;
create policy "Verified relationships are public" on public.heritage_relationships
  for select using (verification_status in ('verified', 'community'));

drop policy if exists "Verified evidence is public" on public.heritage_evidence;
create policy "Verified evidence is public" on public.heritage_evidence
  for select using (is_verified);
