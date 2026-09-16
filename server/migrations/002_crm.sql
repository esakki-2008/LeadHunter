alter table public.leads add column if not exists pipeline_status text not null default 'new';
alter table public.leads add column if not exists notes text not null default '';
alter table public.leads add column if not exists follow_up_date date;
alter table public.leads add column if not exists last_contacted_at timestamptz;
create index if not exists leads_pipeline_status_idx on public.leads(pipeline_status);
