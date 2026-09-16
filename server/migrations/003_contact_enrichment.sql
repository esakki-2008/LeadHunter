alter table public.leads add column if not exists contact_name text not null default '';
alter table public.leads add column if not exists contact_role text not null default '';
alter table public.leads add column if not exists contact_email text not null default '';
alter table public.leads add column if not exists contact_phone text not null default '';
alter table public.leads add column if not exists contact_source text not null default '';
alter table public.leads add column if not exists contact_confidence text not null default '';
alter table public.leads add column if not exists contact_page text not null default '';
