-- Virasat Quest: base heritage tables and per-user saved records.
-- Run first. Safe to re-run.

create table if not exists public.heritage_sites (
  id text primary key,
  slug text not null unique,
  name text not null,
  alternate_names text[] not null default '{}',
  state text not null,
  district text,
  locality text,
  lat double precision check (lat is null or (lat between -90 and 90)),
  lng double precision check (lng is null or (lng between -180 and 180)),
  category text not null,
  period text,
  architectural_style text,
  unesco_status text not null default 'None',
  designation_year integer,
  protection_category text,
  description text not null,
  significance text,
  story text,
  source text not null,
  source_url text,
  source_organization text,
  date_verified date,
  verification text not null default 'unverified'
    check (verification in ('verified', 'unverified', 'community')),
  is_demo boolean not null default false,
  model_url text,
  status text not null default 'pending'
    check (status in ('approved', 'pending', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.heritage_media (
  id text primary key,
  site_id text not null references public.heritage_sites (id) on delete cascade,
  url text not null,
  alt text not null,
  photographer text,
  license text,
  source_url text,
  is_hero boolean not null default false
);

create index if not exists heritage_media_site_idx on public.heritage_media (site_id);

-- Saved heritage records: one row per (user, site)
create table if not exists public.saved_heritage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  site_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, site_slug)
);

create index if not exists saved_heritage_user_idx on public.saved_heritage (user_id);

alter table public.heritage_sites enable row level security;
alter table public.heritage_media enable row level security;
alter table public.saved_heritage enable row level security;

drop policy if exists "Approved sites are public" on public.heritage_sites;
create policy "Approved sites are public" on public.heritage_sites
  for select using (status = 'approved');

drop policy if exists "Media of approved sites is public" on public.heritage_media;
create policy "Media of approved sites is public" on public.heritage_media
  for select using (
    exists (select 1 from public.heritage_sites s where s.id = site_id and s.status = 'approved')
  );

drop policy if exists "Users read own saved records" on public.saved_heritage;
create policy "Users read own saved records" on public.saved_heritage
  for select using (auth.uid() = user_id);

drop policy if exists "Users add own saved records" on public.saved_heritage;
create policy "Users add own saved records" on public.saved_heritage
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users remove own saved records" on public.saved_heritage;
create policy "Users remove own saved records" on public.saved_heritage
  for delete using (auth.uid() = user_id);
