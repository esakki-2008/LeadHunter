-- LeadHunter AI: Supabase/PostgreSQL schema
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id text primary key,
  business_name text not null,
  category text,
  location text,
  website text,
  phone text,
  email text,
  website_status text default 'unknown',
  https boolean default false,
  page_load_ms integer,
  mobile_friendly_signal boolean default false,
  website_title text,
  score integer not null default 0 check (score between 0 and 100),
  score_label text,
  score_reasons jsonb not null default '[]'::jsonb,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_location_idx on public.leads(location);
create index if not exists leads_category_idx on public.leads(category);
create index if not exists leads_score_idx on public.leads(score desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

-- For an MVP using the server as the trusted API boundary.
-- If Supabase client-side access is enabled later, add explicit RLS policies first.
alter table public.leads enable row level security;
