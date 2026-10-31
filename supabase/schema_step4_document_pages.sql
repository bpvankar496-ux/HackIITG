-- Virasat : page-level OCR / text extraction with provenance.

create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  extracted_text text not null default '',
  extraction_method text not null
    check (extraction_method in ('pdf_text_layer', 'gemini_multimodal_ocr', 'empty_page_marker')),
  extraction_status text not null
    check (extraction_status in ('completed', 'empty_page', 'failed', 'needs_review')),
  confidence_score numeric(4, 3) check (confidence_score is null or (confidence_score between 0 and 1)),
  word_count integer not null default 0,
  detected_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_pages_unique_page unique (document_id, page_number)
);

create index if not exists document_pages_doc_idx on public.document_pages (document_id);

alter table public.document_pages enable row level security;

drop policy if exists "Pages follow document visibility" on public.document_pages;
create policy "Pages follow document visibility" on public.document_pages
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and (d.verification_status <> 'unverified' or d.created_by = auth.uid())
    )
  );
