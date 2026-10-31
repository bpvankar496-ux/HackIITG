-- Virasat : full-text passage search used by /api/archive/search.
-- Call shape matches src/server/searchRepository.ts.

create index if not exists document_pages_fts_idx
  on public.document_pages using gin (to_tsvector('simple', extracted_text));

create or replace function public.search_archive_passages(
  search_query text,
  filter_doc_type text default 'all',
  filter_period text default 'all',
  filter_location text default 'all',
  filter_language text default 'all',
  filter_verification text default 'all',
  limit_val integer default 30,
  offset_val integer default 0,
  viewer_user_id uuid default null
)
returns table (
  passage_id uuid,
  document_id uuid,
  page_number integer,
  extracted_text text,
  snippet text,
  confidence_score numeric,
  extraction_method text,
  extraction_status text,
  document_title text,
  document_type text,
  historical_period text,
  location_name text,
  language text,
  verification_status text,
  source_name text,
  attribution text,
  storage_path text,
  relevance_rank real
)
language sql
stable
as $$
  with q as (select websearch_to_tsquery('simple', coalesce(search_query, '')) as tsq)
  select
    p.id, p.document_id, p.page_number, p.extracted_text,
    ts_headline('simple', p.extracted_text, q.tsq,
      'MaxWords=40, MinWords=15, StartSel=«, StopSel=»'),
    p.confidence_score, p.extraction_method, p.extraction_status,
    d.title, d.document_type, d.historical_period, d.location_name, d.language,
    d.verification_status, d.source_name, d.attribution, d.storage_path,
    ts_rank_cd(to_tsvector('simple', p.extracted_text), q.tsq)
  from public.document_pages p
  join public.documents d on d.id = p.document_id
  cross join q
  where p.extraction_status in ('completed', 'needs_review')
    and (coalesce(search_query, '') = '' or to_tsvector('simple', p.extracted_text) @@ q.tsq)
    and (filter_doc_type = 'all' or d.document_type = filter_doc_type)
    and (filter_period = 'all' or d.historical_period = filter_period)
    and (filter_location = 'all' or d.location_name = filter_location)
    and (filter_language = 'all' or d.language = filter_language)
    and (filter_verification = 'all' or d.verification_status = filter_verification)
    and (d.verification_status <> 'unverified' or (viewer_user_id is not null and d.created_by = viewer_user_id))
  order by 18 desc, d.title, p.page_number
  limit greatest(limit_val, 1)
  offset greatest(offset_val, 0);
$$;

grant execute on function public.search_archive_passages(text, text, text, text, text, text, integer, integer, uuid)
  to service_role;

-- Make the new RPC signature available to PostgREST immediately after migration.
notify pgrst, 'reload schema';
