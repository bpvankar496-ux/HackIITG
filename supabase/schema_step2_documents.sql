-- Virasat Quest: archival document metadata and the private storage bucket.
-- Writes go through the server API with the service-role key, so no
-- insert/update policies are granted to browser clients.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 300),
  description text,
  document_type text not null check (document_type in (
    'manuscript', 'photograph', 'map', 'architectural_record',
    'historical_document', 'epigraphical_record', 'other')),
  historical_period text,
  language text default 'en',
  location_name text,
  latitude double precision check (latitude is null or (latitude between -90 and 90)),
  longitude double precision check (longitude is null or (longitude between -180 and 180)),
  source_name text,
  attribution text,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 20971520),
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded', 'processing', 'completed', 'needs_review', 'indexed', 'failed')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'under_review', 'verified', 'peer_reviewed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(location_name, '')), 'C')
  ) stored
);

create index if not exists documents_search_idx on public.documents using gin (search_vector);
create index if not exists documents_created_by_idx on public.documents (created_by);

alter table public.documents enable row level security;

drop policy if exists "Documents are readable" on public.documents;
create policy "Documents are readable" on public.documents
  for select using (verification_status <> 'unverified' or created_by = auth.uid());

-- Private bucket: files are only reachable through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('historical_archives', 'historical_archives', false)
on conflict (id) do update set public = false;
