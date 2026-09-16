alter table public.leads add column if not exists outreach_status text not null default 'not_started';
alter table public.leads add column if not exists outreach_channel text not null default '';
alter table public.leads add column if not exists outreach_sent_at timestamptz;
alter table public.leads add column if not exists outreach_last_message text not null default '';
alter table public.leads add column if not exists outreach_template text not null default '';
alter table public.leads add column if not exists outreach_reply_at timestamptz;
create index if not exists leads_outreach_status_idx on public.leads(outreach_status);