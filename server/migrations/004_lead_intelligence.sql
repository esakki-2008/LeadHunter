alter table public.leads add column if not exists recommended_service text not null default '';
alter table public.leads add column if not exists sales_angle text not null default '';
alter table public.leads add column if not exists pain_points jsonb not null default '[]'::jsonb;
alter table public.leads add column if not exists outreach_message text not null default '';
alter table public.leads add column if not exists intelligence_generated_at timestamptz;
